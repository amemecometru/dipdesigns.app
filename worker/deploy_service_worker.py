#!/usr/bin/env python3
"""Deploy LogiclemonAI worker as a single service worker (no ES modules)."""
import json, os, io, uuid, sys, urllib.request, ssl

ACCOUNT_ID = "8a460817bc554362e040644c8e003fb9"
API_TOKEN = os.environ.get("CLOUDFLARE_API_TOKEN", "")
SCRIPT_NAME = "jump-studio"
ZONE_ID = "349934a4962bacc0bee1362c1e438bed"
KV_ID = "5b35c96a0bdd418685bfb6ce68884acd"

def api(method, path, body=None, headers=None, binary=False):
    url = f"https://api.cloudflare.com/client/v4{path}"
    h = {"Authorization": f"Bearer {API_TOKEN}"}
    if headers:
        h.update(headers)
    data = body.encode() if isinstance(body, str) else body if body is not None else None
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=60) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"[ERROR] {method} {path} -> {e.code}: {err[:500]}", file=sys.stderr)
        return {"success": False, "errors": [{"code": e.code, "message": err[:500]}]}

def build_multipart(parts, boundary=None):
    boundary = boundary or uuid.uuid4().hex
    body = io.BytesIO()
    for field_name, filename, content, content_type in parts:
        body.write(f"--{boundary}\r\n".encode())
        if filename:
            body.write(f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode())
        else:
            body.write(f'Content-Disposition: form-data; name="{field_name}"\r\n'.encode())
        body.write(f"Content-Type: {content_type}\r\n\r\n".encode())
        if isinstance(content, str):
            body.write(content.encode())
        else:
            body.write(content)
        body.write(b"\r\n")
    body.write(f"--{boundary}--\r\n".encode())
    return body.getvalue(), f"multipart/form-data; boundary={boundary}"

def bundle_service_worker():
    """Read index.js, inline credit-ledger.js, convert to service worker format."""
    # Read credit-ledger.js
    with open("credit-ledger.js", "r") as f:
        ledger = f.read()

    # Read index.js
    with open("index.js", "r") as f:
        main = f.read()

    # Remove import/export statements from index.js
    main_lines = main.split("\n")
    cleaned_lines = []
    for line in main_lines:
        stripped = line.strip()
        if stripped.startswith("import { CreditLedger } from './credit-ledger.js'"):
            continue
        if stripped.startswith("export { CreditLedger }"):
            continue
        cleaned_lines.append(line)
    cleaned_main = "\n".join(cleaned_lines)

    # Combine: ledger first, then main (with exports removed)
    # Remove the class name export from main - the SessionHub is already exported as a class
    # We just need to remove the module-level export and make it global for service worker
    # Actually, for service worker format, we keep the class definitions but remove 'export' keyword
    
    # Convert export class to just class
    ledger_fixed = ledger.replace("export class CreditLedger", "class CreditLedger")
    main_fixed = cleaned_main.replace("export class SessionHub", "class SessionHub")
    main_fixed = main_fixed.replace("export default {", "addEventListener('fetch', (event) => {\n  event.respondWith(")
    
    # Find the closing of the default export and add the closing for event.respondWith
    # The default export is: export default { async fetch(request, env, ctx) { ... } }
    # We need to wrap it in a function call
    
    # Instead of complex regex, let's just manually construct the service worker wrapper
    # Extract the fetch handler body and wrap it
    
    # Actually, the cleanest approach is to just replace the export default wrapper
    # with a direct fetch handler assignment
    
    # Find the export default { ... } block and replace with a const handler = { ... }
    # Then call handler.fetch in the event listener
    
    # Simpler approach: just keep the exports but use a different pattern
    # Cloudflare service workers can handle module-like code if we structure it right
    
    # Actually, let me just use the module approach but with the correct multipart format
    # The issue was the field name mismatch. Let me try with a different approach.
    
    return ledger_fixed + "\n\n" + main_fixed

def upload_service_worker():
    """Use the service worker format (body_part)."""
    # Read the already-bundled file from deploy_bundled.py
    with open("index_bundled.js", "r") as f:
        script = f.read()

    # Convert ES module syntax to service worker format
    # Remove all import/export statements
    lines = script.split("\n")
    cleaned = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("import ") and "from" in stripped:
            continue
        if stripped.startswith("export { CreditLedger }"):
            continue
        if stripped.startswith("export default {"):
            # Replace with a handler assignment
            cleaned.append("const handler = {")
            continue
        if stripped.startswith("export class "):
            cleaned.append(line.replace("export class ", "class "))
            continue
        cleaned.append(line)
    
    # Add the service worker event listener at the end
    cleaned.append("")
    cleaned.append("addEventListener('fetch', event => {")
    cleaned.append("  event.respondWith(handler.fetch(event.request, event.env, event.context));")
    cleaned.append("});")
    
    service_worker = "\n".join(cleaned)
    
    with open("index_service_worker.js", "w") as f:
        f.write(service_worker)
    
    metadata = {
        "body_part": "script",
        "bindings": [
            {"type": "kv_namespace", "name": "WEBHOOKS_KV", "namespace_id": KV_ID},
            {"type": "durable_object_namespace", "name": "SESSION_HUB", "class_name": "SessionHub"},
            {"type": "durable_object_namespace", "name": "CREDIT_LEDGER", "class_name": "CreditLedger"},
        ],
        "compatibility_date": "2026-06-11",
    }

    parts = [
        ("metadata", None, json.dumps(metadata), "application/json"),
        ("script", "index.js", service_worker, "application/javascript"),
    ]

    body, ct = build_multipart(parts)
    result = api("PUT", f"/accounts/{ACCOUNT_ID}/workers/scripts/{SCRIPT_NAME}", body, headers={"Content-Type": ct}, binary=True)
    print(f"[UPLOAD] {json.dumps(result, indent=2)[:1200]}")
    return result.get("success", False)

def deploy_subdomain():
    result = api("POST", f"/accounts/{ACCOUNT_ID}/workers/scripts/{SCRIPT_NAME}/subdomain", body=json.dumps({"enabled": True}))
    print(f"[SUBDOMAIN] {json.dumps(result, indent=2)[:800]}")
    return result

def set_secret(name, value):
    if not value:
        print(f"[SKIP {name}] empty")
        return {"success": True}
    result = api("PUT", f"/accounts/{ACCOUNT_ID}/workers/scripts/{SCRIPT_NAME}/secrets", body=json.dumps({"name": name, "text": value}))
    print(f"[SECRET {name}] {json.dumps(result, indent=2)[:400]}")
    return result

if __name__ == "__main__":
    print("=== Deploying LogiclemonAI Worker (Service Worker) ===")
    print(f"Script: {SCRIPT_NAME}")
    print(f"Account: {ACCOUNT_ID}")

    print("\n--- Bundling worker ---")
    bundle_service_worker()
    print("Bundled into index_service_worker.js")

    print("\n--- Uploading worker script ---")
    ok = upload_service_worker()
    if not ok:
        print("Upload failed. Stopping.")
        sys.exit(1)

    print("\n--- Enabling workers.dev subdomain ---")
    deploy_subdomain()

    print("\n--- Setting secrets ---")
    env = {}
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k] = v

    secrets_to_set = {
        "OPENROUTER_API_KEY": env.get("OPENROUTER_API_KEY", ""),
    }

    for name, value in secrets_to_set.items():
        set_secret(name, value)

    print("\n--- Done ---")

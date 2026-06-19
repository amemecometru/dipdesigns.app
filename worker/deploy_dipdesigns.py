#!/usr/bin/env python3
import json, http.client, base64, os, io

TOKEN = os.environ.get("CF_API_TOKEN", "")
ACCOUNT_ID = "8a460817bc554362e040644c8e003fb9"
SCRIPT_NAME = "dipdesigns"
KV_ID = "5b35c96a0bdd418685bfb6ce68884acd"

def read_file(path):
    with open(path, "r") as f:
        return f.read()

def build_multipart(parts):
    boundary = "----WebKitFormBoundary" + base64.b64encode(os.urandom(16)).decode()[:16]
    body = io.BytesIO()
    for name, filename, content, ct in parts:
        body.write(f"--{boundary}\r\n".encode())
        if filename:
            body.write(f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode())
        else:
            body.write(f'Content-Disposition: form-data; name="{name}"\r\n'.encode())
        body.write(f"Content-Type: {ct}\r\n\r\n".encode())
        body.write(content.encode() if isinstance(content, str) else content)
        body.write(b"\r\n")
    body.write(f"--{boundary}--\r\n".encode())
    return body.getvalue(), f"multipart/form-data; boundary={boundary}"

def api(method, path, data=None, headers=None):
    h = {"Authorization": f"Bearer {TOKEN}"}
    if headers:
        h.update(headers)
    conn = http.client.HTTPSConnection("api.cloudflare.com")
    conn.request(method, "/client/v4" + path, body=data, headers=h)
    resp = conn.getresponse()
    body = resp.read().decode()
    conn.close()
    return json.loads(body)

main_script = read_file("index.js")
ledger_script = read_file("credit-ledger.js")
assets_inline = read_file("assets-inline.js")

metadata = {
    "main_module": "index.js",
    "compatibility_date": "2026-06-11",
    "tags": ["cf:service=dipdesigns"],
    "bindings": [
        {"type": "kv_namespace", "name": "WEBHOOKS_KV", "namespace_id": KV_ID},
        {"type": "durable_object_namespace", "name": "SESSION_HUB", "class_name": "SessionHub"},
        {"type": "durable_object_namespace", "name": "CREDIT_LEDGER", "class_name": "CreditLedger"}
    ]
}

parts = [
    ("metadata", None, json.dumps(metadata), "application/json"),
    ("index.js", "index.js", main_script, "application/javascript+module"),
    ("credit-ledger.js", "credit-ledger.js", ledger_script, "application/javascript+module"),
    ("assets-inline.js", "assets-inline.js", assets_inline, "application/javascript+module"),
]

body, ct = build_multipart(parts)

print(f"=== Deploying DipDesigns Worker ===")
print(f"Uploading {len(parts)} parts...")

result = api("PUT", f"/accounts/{ACCOUNT_ID}/workers/scripts/{SCRIPT_NAME}", data=body, headers={"Content-Type": ct})
print(json.dumps(result, indent=2))

if result.get("success", False):
    print(f"\n✅ {SCRIPT_NAME} deployed successfully!")
else:
    print(f"\n❌ Deploy to {SCRIPT_NAME} failed.")
    errors = result.get("errors", [])
    for err in errors:
        print(f"  - {err.get('message', '')}")

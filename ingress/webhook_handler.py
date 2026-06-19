"""
DipDesigns — Ingress Handler
Receives external webhooks (email-to-webhook, Cloudflare, etc.),
processes the payload through Gemma via OpenRouter,
and returns generated UI code or forwards to the desktop receiver.
"""
import os
import json
import re
import uuid

import httpx
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="dipdesigns.app Ingress")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE = "https://openrouter.ai/api/v1"
MODEL = "google/gemma-4-26b-a4b-it:free"

DESKTOP_FORWARD_URL = os.getenv("DESKTOP_FORWARD_URL", "http://127.0.0.1:3000")
DESKTOP_FORWARD_KEY = os.getenv("DESKTOP_FORWARD_KEY", "")  # no insecure default; must match receiver key
INGRESS_API_KEYS = set()

class IngressPayload(BaseModel):
    prompt: str
    forward: bool = False
    filename: str | None = None

class WebhookPayload(BaseModel):
    subject: str | None = None
    body: str
    sender: str | None = None

SYSTEM_PROMPT = """You are a web UI generator. Return ONLY valid JSON with NO markdown fences or extra text.
The JSON must have this exact structure:
{
  "html": "<string>",
  "css": "<string>",
  "js": "<string>"
}
Generate a clean, responsive UI based on the user's request. Use modern CSS (flexbox/grid). Be creative but practical."""

@app.on_event("startup")
def load_keys():
    raw = os.getenv("INGRESS_API_KEYS", "")
    for k in raw.split(","):
        k = k.strip()
        if k:
            INGRESS_API_KEYS.add(k)

def verify_key(x_api_key: str = Header(None)):
    if not INGRESS_API_KEYS:
        return True
    if not x_api_key or x_api_key not in INGRESS_API_KEYS:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True

async def call_gemma(prompt: str) -> dict:
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{OPENROUTER_BASE}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://dipdesigns.app",
                "X-Title": "dipdesigns.app",
            },
            json={
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": prompt},
                ],
                "extra_body": {"reasoning": {"enabled": True}},
            },
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"OpenRouter error: {resp.text}")
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r"\{[\s\S]*\}", content)
            if match:
                return json.loads(match.group(0))
            raise HTTPException(status_code=502, detail="Model returned invalid JSON")

def build_html(parsed: dict) -> str:
    css = parsed.get("css", "")
    html = parsed.get("html", "")
    js = parsed.get("js", "")
    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>{css}</style></head>
<body>{html}
<script>{js}</script>
</body>
</html>"""

@app.post("/api/ingress/generate")
async def ingress_generate(payload: IngressPayload, _=Depends(verify_key)):
    parsed = await call_gemma(payload.prompt)
    full_html = build_html(parsed)

    if payload.forward:
        filename = payload.filename or f"generated-{uuid.uuid4().hex[:8]}.html"
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                fwd = await client.post(
                    DESKTOP_FORWARD_URL,
                    headers={"Content-Type": "application/json", "x-api-key": DESKTOP_FORWARD_KEY},
                    json={"filename": filename, "content": full_html},
                )
                parsed["_forwarded"] = True
                parsed["_forward_status"] = fwd.status_code
            except Exception as e:
                parsed["_forward_error"] = str(e)

    return parsed

@app.post("/api/ingress/webhook")
async def ingress_webhook(payload: WebhookPayload, _=Depends(verify_key)):
    prompt = payload.body
    if payload.subject:
        prompt = f"{payload.subject}\n\n{payload.body}"
    parsed = await call_gemma(prompt)
    full_html = build_html(parsed)
    return {"html": full_html, **parsed}

@app.get("/api/ingress/health")
async def health():
    return {"status": "ok", "model": MODEL}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("webhook_handler:app", host="0.0.0.0", port=8001, reload=True)

import os
import json
import uuid
from datetime import datetime, timedelta

import uvicorn
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

app = FastAPI(title="webhooks.email API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "google/gemma-4-26b-a4b-it:free"

SUPPORTED_MODELS = {
    "google/gemma-4-26b-a4b-it:free": "Gemma 4 (26B) — Fast, default",
    "google/gemma-4-31b-it:free": "Gemma 4 (31B) — Higher quality",
    "google/gemma-3-12b-it": "Gemma 3 (12B) — Lightweight",
    "microsoft/phi-4": "Phi-4 — Excellent for code",
    "meta-llama/llama-3.2-3b-instruct:free": "Llama 3.2 (3B) — Tiny & fast",
    "mistralai/mistral-small-3.1-24b-instruct": "Mistral Small (24B) — Edge model",
    "qwen/qwen-2.5-7b-instruct": "Qwen 2.5 (7B) — Solid all-rounder",
}

usage_log = []
users_db = {}
api_keys_db = {}

class SignupRequest(BaseModel):
    email: str

class SignupResponse(BaseModel):
    user_id: str
    api_key: str
    message: str

class ChatRequest(BaseModel):
    prompt: str
    model: str = DEFAULT_MODEL
    user_id: str | None = None

class ChatResponse(BaseModel):
    html: str
    css: str
    js: str

class ValidateKeyResponse(BaseModel):
    valid: bool
    label: str | None = None
    models: list | None = None

SYSTEM_PROMPT = """You are a web UI generator. Return ONLY valid JSON with NO markdown fences or extra text.
The JSON must have this exact structure:
{
  "html": "<string>",
  "css": "<string>",
  "js": "<string>"
}
Generate a clean, responsive UI based on the user's request. Use modern CSS (flexbox/grid). Be creative."""

@app.post("/api/signup", response_model=SignupResponse)
async def signup(req: SignupRequest):
    if not req.email or "@" not in req.email:
        raise HTTPException(status_code=400, detail="Valid email required")
    user_id = uuid.uuid4().hex[:12]
    api_key = "wek_" + uuid.uuid4().hex[:24]
    users_db[user_id] = {"email": req.email, "created": datetime.utcnow().isoformat()}
    api_keys_db[api_key] = user_id
    return SignupResponse(
        user_id=user_id,
        api_key=api_key,
        message="Welcome to webhooks.email! Use your API key in x-api-key header."
    )

async def verify_api_key(x_api_key: str = Header(None)):
    if x_api_key and x_api_key in api_keys_db:
        return api_keys_db[x_api_key]
    return None

@app.post("/api/validate-key", response_model=ValidateKeyResponse)
async def validate_key(x_api_key: str = Header(None)):
    if not x_api_key:
        return ValidateKeyResponse(valid=False, label=None)
    user_id = api_keys_db.get(x_api_key)
    if user_id:
        return ValidateKeyResponse(
            valid=True,
            label=users_db[user_id]["email"] if user_id in users_db else "webhooks.email user",
            models=list(SUPPORTED_MODELS.keys()),
        )
    if x_api_key.startswith("sk-or-"):
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{OPENROUTER_BASE}/auth/key",
                headers={"Authorization": f"Bearer {x_api_key}"},
            )
            if resp.status_code == 200:
                data = resp.json()
                return ValidateKeyResponse(valid=True, label=data.get("label", "OpenRouter user"))
            return ValidateKeyResponse(valid=False, label=None)
    return ValidateKeyResponse(valid=False, label=None)

@app.get("/api/models")
async def list_models():
    return {
        "default": DEFAULT_MODEL,
        "models": SUPPORTED_MODELS,
    }

@app.post("/api/generate", response_model=ChatResponse)
async def generate(req: ChatRequest, user_id: str | None = Depends(verify_api_key)):
    model = req.model if req.model in SUPPORTED_MODELS else DEFAULT_MODEL
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{OPENROUTER_BASE}/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://webhooks.email",
                "X-Title": "webhooks.email",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": req.prompt},
                ],
                "extra_body": {"reasoning": {"enabled": True}},
            },
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"OpenRouter error: {resp.text}")
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            match = __import__("re").search(r"\{[\s\S]*\}", content)
            if match:
                parsed = json.loads(match.group(0))
            else:
                raise HTTPException(status_code=502, detail="Model returned invalid JSON")
    usage_log.append({
        "user_id": user_id,
        "model": model,
        "timestamp": datetime.utcnow().isoformat(),
        "prompt_length": len(req.prompt),
    })
    return ChatResponse(**parsed)

@app.get("/api/health")
async def health():
    return {"status": "ok", "model": DEFAULT_MODEL, "models_available": len(SUPPORTED_MODELS)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

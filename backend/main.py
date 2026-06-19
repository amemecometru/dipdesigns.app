import os
import uuid
from datetime import datetime

import uvicorn
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

app = FastAPI(title="dipdesigns.app Identity API", version="2.0.0")

_default_origins = "https://dipdesigns.app,https://www.dipdesigns.app,http://127.0.0.1:8080,http://127.0.0.1:5500"
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("BACKEND_ALLOWED_ORIGINS", _default_origins).split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

users_db = {}
api_keys_db = {}

class SignupRequest(BaseModel):
    email: str

class SignupResponse(BaseModel):
    user_id: str
    api_key: str
    message: str

class ValidateKeyResponse(BaseModel):
    valid: bool
    label: str | None = None
    models: list | None = None

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
        message="Welcome to dipdesigns.app! Use your API key in x-api-key header with the Worker."
    )

@app.post("/api/validate-key", response_model=ValidateKeyResponse)
async def validate_key(x_api_key: str = Header(None)):
    if not x_api_key:
        return ValidateKeyResponse(valid=False, label=None)
    user_id = api_keys_db.get(x_api_key)
    if user_id:
        return ValidateKeyResponse(
            valid=True,
            label=users_db[user_id]["email"] if user_id in users_db else "dipdesigns.app user",
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

@app.get("/api/health")
async def health():
    return {"status": "ok", "model": DEFAULT_MODEL, "models_available": len(SUPPORTED_MODELS)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

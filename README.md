# webhooks.email — Cross-Platform Flash UI

**Vibe-code anything. Email or webhook a prompt, get a live rendered UI instantly on any device.**

webhooks.email is a serverless, client-side Progressive Web App (PWA) that lets you describe a user interface in plain English and have **Gemma 4** (via OpenRouter) generate the HTML/CSS/JS on the fly. The result renders live in a sandboxed iframe — no build step, no backend required.

The architecture follows a simple loop:

```
[User Prompt] → [Gemma 4 processes it] → [Virtual File System (JSON)] → [Live iframe Render]
```

---

## Architecture

```
webhooks.email-new/
├── index.html          # PWA — split-pane chat + live iframe preview
├── client.js           # OpenRouter → Gemma 4 calls, JSON parse, Blob injection
├── manifest.json       # PWA manifest for Android installation
├── receiver.js         # Desktop webhook listener (writes files via POST)
├── backend/
│   ├── main.py         # FastAPI: user signup & OpenRouter proxy (key #1)
│   └── requirements.txt
├── ingress/
│   ├── webhook_handler.py  # External webhook → Gemma → forward (key #2)
│   └── requirements.txt
└── worker/
    ├── index.js        # Cloudflare Worker: routing, proxy, webhook ingest
    └── wrangler.toml
```

### Components

| Component | Stack | Purpose |
|-----------|-------|---------|
| **PWA Client** | Vanilla HTML/CSS/JS | Chat interface + sandboxed iframe preview |
| **Desktop Receiver** | Node.js | Local HTTP server that writes webhook'd files to disk |
| **Backend API** | FastAPI (Python) | User signup, API key management, OpenRouter proxy |
| **Ingress Handler** | FastAPI (Python) | Receive external webhooks (email, webhook sources) → Gemma → forward |
| **Cloudflare Worker** | JavaScript/Service Workers | Edge routing, OpenRouter proxy, webhook ingest, caching |
| **AI Engine** | Gemma 4 (via OpenRouter) | Structured JSON code generation (html/css/js blocks) |

### Key Features

- **Real-time generation** — type a prompt, see the UI render instantly in a sandboxed iframe
- **Mobile-first PWA** — installable on Android, works entirely offline-capable
- **Desktop sync** — send generated UIs from your phone to your laptop via webhook
- **Device preview toggle** — switch between desktop and mobile viewports
- **Multiple API keys** — built-in redundancy across three OpenRouter keys for rate limiting
- **Serverless by default** — the PWA can run against OpenRouter directly, no backend needed
- **Extensible ingress** — receive webhooks from email, Cloudflare, or any HTTP source

---

## Quick Start

### Prerequisites

- Python 3.10+ (for backend/ingress)
- Node.js 18+ (for receiver)
- An [OpenRouter](https://openrouter.ai) account with the free **Gemma 4** model

### Run the PWA (standalone — no backend required)

```bash
cd webhooks.email-new
python3 -m http.server 8080 --bind 0.0.0.0
```

Open `http://127.0.0.1:8080` in a browser. The API key is pre-configured in `client.js` — start prompting immediately.

### Run the Desktop Receiver (for mobile → laptop sync)

```bash
node receiver.js
```

Listens on port `3000` for POST payloads containing `{ filename, content }` and writes them to the project directory.

### Run the Backend API

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Serves on `http://127.0.0.1:8000` with endpoints:
- `POST /api/signup` — create an account and receive an API key
- `POST /api/generate` — proxy a prompt through OpenRouter
- `GET /api/health` — health check

### Run the Ingress Handler

```bash
cd ingress
pip install -r requirements.txt
python webhook_handler.py
```

Serves on `http://127.0.0.1:8001` with endpoints:
- `POST /api/ingress/generate` — prompt → Gemma → optional forward to desktop
- `POST /api/ingress/webhook` — accepts email/webhook-style payloads

### Deploy the Cloudflare Worker

```bash
cd worker
npx wrangler deploy
```

---

## Mobile → Desktop Workflow

1. **On your laptop** — serve the PWA (`python3 -m http.server 8080`) and start the receiver (`node receiver.js`)
2. **On your phone** — open `http://<laptop-ip>:8080` in Chrome
3. **Type a prompt** — Gemma generates the UI and renders it in the iframe
4. **Tap "Send to Desktop"** — the generated file lands on your laptop

```js
// Configure the desktop IP from the browser console
WebhooksEmail.setDesktopIP('192.168.1.42')
```

---

## Security

- **Desktop receiver** validates every request against an `x-api-key` header
- **Backend API** issues per-user API keys at signup
- **Ingress handler** supports optional API key allowlist
- **Sandboxed iframe** uses the `sandbox` attribute to prevent malicious generated code from escaping
- **Path traversal** is blocked by `path.basename()` in the receiver

---

## Monetization Model

| Tier | Features |
|------|----------|
| **Free** | Text-to-UI generation, sandboxed browser preview, transient hosting |
| **Premium Dev** | Permanent deployment URLs (my-app.webhooks.email), auto-render on webhook |
| **Pro** | One-click export, desktop sync, unlimited webhook ingress |

---

## Built With

- [Gemma 4](https://ai.google.dev/gemma) — Open-weight LLM for code generation
- [OpenRouter](https://openrouter.ai) — Unified API for 200+ LLMs
- [FastAPI](https://fastapi.tiangolo.com) — Python backend framework
- [Cloudflare Workers](https://workers.cloudflare.com) — Edge computing platform
- Vanilla HTML/CSS/JS — Zero framework lock-in

---

## License

MIT

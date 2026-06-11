# webhooks.email — Cross-Platform Flash UI

**Vibe-code anything. Email or webhook a prompt, get a live rendered UI instantly on any device.**

webhooks.email is a serverless, client-side Progressive Web App (PWA) that lets you describe a user interface in plain English and have **Gemma 4** (via OpenRouter) generate the HTML/CSS/JS on the fly. The result renders live in a sandboxed iframe — no build step, no backend required.

---

## Architecture

```
[Phone PWA: Cover → App/Library/Pricing/Docs]
     │
     ├── OpenRouter ──> Gemma 4 ──> SkillChain ──> Blob URL ──> iframe
     │                              (architect → styler → engineer)
     │
     ├── POST / (x-api-key + HTML) ──> [Laptop receiver.js:3000] ──> .html to disk
     │
     ├── wek_* key ──> backend/main.py (proxy) ──> OpenRouter
     │
     └── SSE stream ──> Cloudflare Worker (message bus) ──> Durable Object ──> KV
```

```
webhooks.email-new/
├── index.html           # PWA — cover page + split-pane chat + iframe preview
├── client.js            # SkillChain orchestrator, OpenRouter calls, SSE consumer, key mgmt, library
├── manifest.json        # PWA manifest for Android install
├── receiver.js          # Desktop webhook listener (port 3000)
├── DESIGN/              # Copper/patina/spectral design packages
├── backend/
│   ├── main.py          # FastAPI: user signup + /api/generate proxy
│   └── requirements.txt
├── ingress/
│   ├── webhook_handler.py  # External webhook → Gemma → forward to desktop
│   └── requirements.txt
└── worker/
    ├── index.js         # Cloudflare Worker: Hybrid Message Bus (DO + KV + SSE)
    └── wrangler.toml
```

### Key Components

| Component | Stack | Purpose |
|-----------|-------|---------|
| **PWA Client** | Vanilla HTML/CSS/JS | 4-tab navigation (App/Library/Pricing/Docs), chat + iframe preview |
| **SkillChain** | client.js (3-step pipeline) | architect → styler → engineer for higher quality output |
| **Desktop Receiver** | Node.js | Local HTTP server that writes webhook'd files to disk |
| **Backend API** | FastAPI (Python) | User signup, proxy mode for `wek_*` keys |
| **Ingress Handler** | FastAPI (Python) | External webhooks → Gemma → forward to desktop |
| **Cloudflare Worker** | JavaScript (DO + KV) | Real-time SSE broadcast, session persistence, lightweight webhook |
| **AI Engine** | Gemma 4 (via OpenRouter) | Structured HTML/CSS/JS generation |

### Key Features

- **SkillChain** — 3-step generation pipeline (architect → styler → engineer) for higher quality vs single-shot
- **Self-healing** — automatic re-render on parse failure, max 3 repair attempts
- **4-tab navigation** — Cover landing → App (Design Studio) → Library (Skills) → Pricing → Docs
- **12 built-in skills** — categorized library with user submissions (localStorage)
- **Real-time preview** — sandboxed iframe renders generated UI instantly
- **Mobile-first PWA** — installable on Android, works offline-capable
- **Desktop sync** — send UIs from phone to laptop via webhook
- **Device preview toggle** — switch between desktop and mobile viewports
- **Dual key mode** — `sk-or-*` for direct OpenRouter, `wek_*` for proxy/paid mode
- **Hybrid Message Bus** — Cloudflare Worker + Durable Objects + KV for real-time SSE events
- **Copper/patina design system** — industrial aesthetic with copper gradients, patina accents

---

## Quick Start

### Prerequisites

- Python 3.10+ (for backend/ingress)
- Node.js 18+ (for receiver)
- An [OpenRouter](https://openrouter.ai) account with the free **Gemma 4** model

### Run the PWA (standalone — no backend required)

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

Open `http://127.0.0.1:8080` in a browser. Click the **API** button in the header to set your OpenRouter key, then start prompting.

### Run the Desktop Receiver (for mobile → laptop sync)

```bash
node receiver.js
```

Listens on port `3000` for POST payloads containing `{ filename, content }`.

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

Serves on `http://127.0.0.1:8001` with:
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
3. **Type a prompt** — SkillChain generates the UI and renders it in the iframe
4. **Tap "Send to Desktop"** — the generated file lands on your laptop

```js
// Configure the desktop IP from the browser console
WebhooksEmail.setDesktopIP('192.168.1.42')
```

---

## Site Structure

```
Cover (landing) ──> App (Design Studio)
                ──> Library (Skills)
                ──> Pricing
                ──> Docs (Quickstart + API Config)
```

- **Cover** — Hero title in Playfair Display, copper→patina gradient, 4 feature cards, two CTAs
- **App** — Split-pane chat + sandboxed iframe preview, toolbar with device toggle, API button, model selector
- **Library** — 12 built-in skills + user submissions, category filters, search
- **Pricing** — 3 tiers (Free $0, Premium $12/mo, Pro $29/mo)
- **Docs** — 8-step quickstart, API key configuration

---

## Design System

| Token | Value |
|-------|-------|
| Base dark | `#0a0e12` |
| Copper | `#e37e44` / `#ff9d6a` |
| Patina | `#3de1d1` / `#1b4d4a` |
| Fonts | Outfit (headings), Space Mono (UI/code), Playfair Display (hero) |
| Background | Patina noise SVG + grid overlay + radial gradient canvas |

---

## Security

- **Desktop receiver** validates every request against an `x-api-key` header
- **Backend API** issues per-user API keys at signup
- **Ingress handler** supports optional API key allowlist
- **Sandboxed iframe** uses the `sandbox` attribute to prevent malicious generated code from escaping
- **Path traversal** is blocked by `path.basename()` in the receiver
- **API keys** are stored in localStorage (client) or env vars (server) — never hardcoded

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

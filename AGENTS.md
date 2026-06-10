# webhooks.email — Session Handoff

## Project
- **Name:** webhooks.email — Cross-Platform Flash UI
- **Root:** `/home/lemon/webhooks.email-new`
- **Repo:** `https://github.com/amemecometru/Webhooks.email-cross-platform-flash-ui` (private)
- **Account:** `amemecometru` / `toofargone.trading@gmail.com`

## What's Built (all 3 use cases complete)

| File | Purpose |
|------|---------|
| `index.html` | PWA — split-pane chat (left) + sandboxed iframe preview (right) |
| `client.js` | OpenRouter direct calls + proxy mode + desktop sync button |
| `manifest.json` | PWA manifest for Android install |
| `receiver.js` | Desktop webhook listener (port 3000, CORS enabled, 0.0.0.0) |
| `backend/main.py` | FastAPI: user signup + `/api/generate` proxy (OpenRouter key #1) |
| `ingress/webhook_handler.py` | External webhook receiver → Gemma → forward to desktop (key #2) |
| `worker/index.js` | Cloudflare Worker: routing, proxy, webhook ingest |

## Credentials (from .env — gitignored)

### GitHub PAT
```
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
```

### Cloudflare (domain: `logiclemonai.com`)
```
Account ID: 8a460817bc554362e040644c8e003fb9
Zone ID:    349934a4962bacc0bee1362c1e438bed
API Token:  cfk_YYFPPNHvB5lxPmFrourgaCEGsjP2zTttThS143AC24f2a7d4
```

### OpenRouter API Keys (google/gemma-4-26b-a4b-it:free)
| # | Key | Used In |
|---|-----|---------|
| 1 | `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` | `backend/main.py` |
| 2 | `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` | `ingress/webhook_handler.py` |
| 3 | `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` | `client.js` / `worker/index.js` |

All keys were stripped from the git history — they must be set via env vars or `WebhooksEmail.setApiKey()` at runtime.

## Design Decisions

- **Serverless-first:** PWA works standalone hitting OpenRouter directly. No backend needed for basic use.
- **Gemma 4 is cloud-based:** Users do NOT download the model to their device. They provide an OpenRouter API key (free tier available) and the PWA talks to the API.
- **3-key redundancy:** Three keys for the same free model — if one rate-limits, rotate.
- **Mobile → Desktop sync:** The PWA has a "Send to Desktop" button. Configure via `WebhooksEmail.setDesktopIP('192.168.x.x')`.
- **127.0.0.1 required:** Linux/ChromeOS doesn't resolve `localhost` reliably — all bindings and URLs use explicit IPs.

## Next Steps (priority order)

### 1. Fix PROJECT.md ("Zapier" → "Cloudflare")
Search PROJECT.md for "Zapier" and replace with "Cloudflare" — it's a minor copy-paste slip.

### 2. RevenueCat Integration (monetization layer)
- Implement RevenueCat for cross-platform paywalls (Android PWA + web)
- Free tier: text-to-UI generation, sandboxed preview, transient hosting
- Premium tier: persistent deployment URLs (my-app.webhooks.email), desktop sync, unlimited webhook ingress
- RevenueCat handles subscription management, receipts, and cross-platform entitlements
- Keep it API-key-gated: premium users get a validated API key that unlocks server-side features

### 3. User-Facing API Key Flow
- Users get an OpenRouter key (free) and optionally a webhooks.email premium key
- The PWA should prompt for the key on first launch if not set
- Store key in `localStorage` for persistence
- Validate key against OpenRouter before saving

### 4. Revenue Target
- **Goal:** $2,500/month MRR
- **At $2,500 MRR:** Evaluate stepping up RevenueCat plan or migrating to Stripe (account already exists — details TBD)
- Pricing model TBD (suggested: $9-19/mo for Premium, $29-49/mo for Pro)

### 5. Testing
- Test PWA on Moto Stylus 5G (Android/Chrome)
- Test mobile → desktop webhook flow over LAN
- Test OpenRouter rate limits across all 3 keys
- Test PWA installability (manifest validation)
- Test backend signup + generate endpoints

### 6. Polish
- Handle OpenRouter 429 rate limits gracefully (rotate key, retry)
- Better error messages for missing API key
- Loading states and progress indicators
- Mobile responsive refinements for the chat panel

## Architecture Diagram (current)

```
[Phone PWA] ──OpenRouter──> Gemma 4 ──> JSON {html,css,js} ──> Blob URL ──> iframe
     │
     └── POST / (x-api-key + HTML) ──> [Laptop receiver.js:3000] ──> writes .html to disk
```

## Useful Commands

```bash
# Serve PWA
python3 -m http.server 8080 --bind 0.0.0.0

# Desktop receiver
node receiver.js

# Backend
cd backend && OPENROUTER_API_KEY="sk-or-v1-00e3..." python main.py

# Ingress
cd ingress && OPENROUTER_API_KEY="sk-or-v1-8f12..." python webhook_handler.py

# PWA console (set key in browser)
WebhooksEmail.setApiKey('sk-or-v1-d05d...')
WebhooksEmail.setDesktopIP('192.168.1.42')
```

---

*Handoff created 2026-06-10. Next session: pick up at "Next Steps" above.*

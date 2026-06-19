# DipDesigns.App — Cross-Platform AI-Design-Studio

Vibe/Text a ui-design on your mobile-android, click-a-button & now it's waiting at your desk. A live rendered ui is ready for work on your favorite device.

DipDesigns.App is a serverless, client-side Progressive Mobile/Web App (PWA) that lets you describe a user interface in plain English and have Gemma 4 [or model] (via OpenRouter) generate the HTML/CSS/JS on the fly. The result renders live in a sandboxed iframe — no build step, no backend required. When the design is complete the AI-Design-Assistant will create a "backend-handoff.md" tailored for the "Target-Stack" — your stack.

## Architecture

```
[PWA: Landing → Studio / Library / Pricing / Docs]
     │
     ├── OpenRouter ──> Gemma 4 ──> SkillChain ──> Blob URL ──> iframe
     │                              (architect → styler → engineer → debugger)
     │
     ├── POST / (x-api-key + HTML) ──> [Laptop receiver.js:3000] ──> .html to disk
     │
     ├── wek_* key ──> Cloudflare Worker /api/generate (CreditLedger gate) ──> OpenRouter
     │                  (backend/main.py is identity only: signup + validate-key)
     │
     └── SSE ──> Cloudflare Worker (SessionHub DO + KV message bus) ──> live render across devices
```

```
LogiclemonAI/
├── README.md
├── receiver.js              # Desktop webhook listener (port 3000) — writes pushed UIs to disk
├── backend/
│   ├── main.py              # FastAPI — identity only: signup + validate-key
│   └── requirements.txt
├── ingress/
│   ├── webhook_handler.py   # External webhook → Gemma → forward to desktop
│   └── requirements.txt
└── worker/                  # the deployed app (Cloudflare)
    ├── index.js             # Worker: /api/* (OAuth, generate, webhook, Stripe, SSE bus) + Durable Objects
    ├── credit-ledger.js     # CreditLedger Durable Object (prepaid spend / grant)
    ├── wrangler.toml        # main = "index.js";  [assets] directory = "./assets"
    └── assets/              # ── THE SERVED PWA (static, all vanilla) ──
        ├── index.html       # Studio shell: split-pane chat + live iframe preview, device/zoom/export pods, Handoff.md slide-out
        ├── client.js        # SkillChain orchestrator, OpenRouter calls, SSE consumer, key mgmt, skills library
        ├── landing.html     # Marketing landing (the phone → desktop pitch)
        ├── signin.html      # Access Node — GitHub / Google OAuth
        ├── dashboard.html   # Flash Dashboard — signal stream + payload inspector
        ├── tokens.css       # Glazier kit — design tokens (single source of truth)
        ├── glazier.css      # Glazier kit — component classes (.glz-*)
        └── manifest.json    # PWA manifest (Android install)
```

> The Worker serves everything in `worker/assets/` as static files and handles `/api/*` in code (`index.js`). `python3 -m http.server` from `worker/assets/` previews the UI only; run `npx wrangler dev` / `deploy` for the full app with `/api/*`.

## Design system — Glazier Kit

Near-black canvas · glazier-blue glass · brushed-metal silver · electric-teal accent · sparing warm amber. Black text on silver, teal/amber as accents on dark. Defined once in `tokens.css` + `glazier.css`; every surface composes from it.

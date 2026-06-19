import { CreditLedger } from './credit-ledger.js';
export { CreditLedger };
import { serveAsset } from './assets-inline.js';

const CONFIG = {
  OPENROUTER_API_KEY: typeof OPENROUTER_API_KEY !== 'undefined' ? OPENROUTER_API_KEY : '',
  OPENROUTER_BASE: 'https://openrouter.ai/api/v1',
  MODEL: 'google/gemma-4-26b-a4b-it:free',
  FREE_MODEL: 'google/gemma-3-12b-it',
  ALLOWED_ORIGINS: ['https://dipdesigns.app', 'https://jump.logiclemonai.workers.dev', 'http://127.0.0.1:5500', 'http://127.0.0.1:8000', 'http://127.0.0.1:8080'],
  STRIPE_API: 'https://api.stripe.com/v1',
  PRICE_IDS: {
    pack_small: 'price_1ThKvDQyNHJ9tQdyQyIPLBXj',
    pack_large: 'price_1ThKvEQyNHJ9tQdytSQWPmu6',
    sub_pro: 'price_1ThKvEQyNHJ9tQdyl8Lsk0y5',
    pack_test: 'price_1ThLtzQyNHJ9tQdyKlb2x6F6',
  },
  CREDIT_PACKS: {
    pack_small: 10,
    pack_large: 50,
    pack_test: 3,
  },
  SUB_CREDITS: 100,
};

const SYSTEM_PROMPT = `You are a web UI generator. Return ONLY valid JSON with NO markdown fences or extra text.
The JSON must have this exact structure:
{
  "html": "<string>",
  "css": "<string>",
  "js": "<string>"
}
Generate a clean, responsive UI based on the user's request. Use modern CSS (flexbox/grid). Be creative but practical.`;

const FREE_SYSTEM_PROMPT = `You are a web UI generator. Return ONLY valid JSON with NO markdown fences or extra text.
The JSON must have this exact structure:
{
  "html": "<string>",
  "css": "<string>",
  "js": "<string>"
}
Generate a clean, responsive UI based on the user's request. Use modern CSS (flexbox/grid). Be creative but practical. Keep it simple — single-file output, no external dependencies.`;

function corsHeaders(origin) {
  const allowed = CONFIG.ALLOWED_ORIGINS.some(p => {
    if (p.endsWith('*')) return origin?.startsWith(p.slice(0, -1));
    return p === origin;
  });
  return {
    'Access-Control-Allow-Origin': allowed ? origin : CONFIG.ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key, X-Proxy-Key, X-Principal, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
}

function getSessionId(url) {
  return url.searchParams.get('session') || 'default';
}

function generatePrincipalHash(key) {
  const encoder = new TextEncoder();
  return crypto.subtle.digest('SHA-256', encoder.encode(key)).then(h => {
    return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('');
  });
}

function getLedger(principal, env) {
  const doId = env.CREDIT_LEDGER.idFromName(principal);
  return env.CREDIT_LEDGER.get(doId);
}

// ---- Account keys (random secret, NOT derived from the email) ----
function randomToken(bytes = 32) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Issue (or fetch the existing) per-account record. The wek_ key is a RANDOM
// secret — it is NOT a function of the email, so it can't be computed by
// anyone who knows the address. A reverse index (wek:<principal>) lets the
// spend paths confirm a presented key was actually issued by us.
async function issueOrGetUser(env, email, provider) {
  const e = (email || '').toLowerCase().trim();
  if (env.WEBHOOKS_KV) {
    const existing = await env.WEBHOOKS_KV.get('user:email:' + e, 'json');
    if (existing && existing.wekKey) return existing;
  }
  const wekKey = 'wek_' + randomToken(32);
  const principal = await generatePrincipalHash(wekKey);
  const record = { email: e, provider, wekKey, principal, createdAt: Date.now() };
  if (env.WEBHOOKS_KV) {
    await env.WEBHOOKS_KV.put('user:email:' + e, JSON.stringify(record));
    await env.WEBHOOKS_KV.put('wek:' + principal, JSON.stringify({ email: e, provider, createdAt: record.createdAt }));
  }
  return record;
}

// Resolve a presented wek_ key to its ledger principal, or null if it was not
// issued by us. Falls back to the raw hash only when KV is unavailable
// (local dev with no bound namespace).
async function principalFromWekKey(env, wekKey) {
  const principal = await generatePrincipalHash(wekKey);
  if (env.WEBHOOKS_KV) {
    const rec = await env.WEBHOOKS_KV.get('wek:' + principal, 'json');
    return rec ? principal : null;
  }
  return principal;
}

async function verifyStripeSignature(rawBody, sigHeader, secret) {
  if (!sigHeader || !secret) return null;
  try {
    const parts = sigHeader.split(',');
    let timestamp = '';
    let signatures = [];
    for (const p of parts) {
      const [k, v] = p.split('=');
      if (k === 't') timestamp = v;
      if (k === 'v1') signatures = v.split(',');
    }
    if (!timestamp || !signatures.length) return null;

    const signedPayload = `${timestamp}.${rawBody}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['verify']
    );

    let valid = false;
    for (const sig of signatures) {
      const sigBin = hexToBytes(sig);
      const result = await crypto.subtle.verify('HMAC', key, sigBin, encoder.encode(signedPayload));
      if (result) { valid = true; break; }
    }
    return valid ? parseInt(timestamp) : null;
  } catch { return null; }
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function doLedgerAction(ledger, action, body) {
  const res = await ledger.fetch(`https://do/${action}`, {
    method: 'POST',
    body: JSON.stringify(body || {}),
  });
  return res.json();
}

function parseGemmaResponse(content) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return { html: '', css: '', js: '' };
  }
}

function buildHtml(parsed) {
  const css = parsed.css || '';
  const html = parsed.html || '';
  const js = parsed.js || '';
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>${css}</style></head>
<body>${html}
<script>${js}<\/script>
</body>
</html>`;
}

async function callOpenRouter(prompt, systemPrompt, model, env) {
  const resp = await fetch(CONFIG.OPENROUTER_BASE + '/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + (env.OPENROUTER_API_KEY || CONFIG.OPENROUTER_API_KEY),
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://jump.logiclemonai.workers.dev',
      'X-Title': 'LogicLemonAI - Jump',
    },
    body: JSON.stringify({
      model: model || CONFIG.MODEL,
      messages: [
        { role: 'system', content: systemPrompt || SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      ...(model !== CONFIG.FREE_MODEL ? { extra_body: { reasoning: { enabled: true } } } : {}),
    }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error('OpenRouter: ' + err);
  }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || '';
  return parseGemmaResponse(content);
}

async function proxyOpenRouter(request, cors, env) {
  try {
    const xApiKey = request.headers.get('x-api-key') || '';
    const xProxyKey = request.headers.get('x-proxy-key') || '';

    let principal = '';
    let isWekKey = false;

    if (xApiKey.startsWith('wek_')) {
      principal = await principalFromWekKey(env, xApiKey);
      if (!principal) {
        return new Response(JSON.stringify({ error: 'Unauthorized: unknown or revoked key — sign in again.' }), {
          status: 401, headers: { 'Content-Type': 'application/json', ...cors },
        });
      }
      isWekKey = true;
    } else if (xProxyKey && env.PROXY_SECRET && xProxyKey === env.PROXY_SECRET) {
      principal = request.headers.get('x-principal') || '';
    } else {
      return new Response(JSON.stringify({ error: 'Unauthorized: provide x-api-key (wek_*) or valid x-proxy-key' }), {
        status: 401, headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    const body = await request.json();
    const { prompt, model } = body;
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    const cost = parseInt(env.CREDIT_COST || CONFIG.CREDIT_COST || '1');

    if (principal && env.CREDIT_LEDGER) {
      const ledger = getLedger(principal, env);
      const spendResult = await doLedgerAction(ledger, 'spend', { cost });
      if (!spendResult.ok) {
        return new Response(JSON.stringify({ error: 'insufficient_credits', balance: spendResult.balance }), {
          status: 402, headers: { 'Content-Type': 'application/json', ...cors },
        });
      }
    }

    const parsed = await callOpenRouter(prompt, null, model || null, env);
    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', ...cors },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...cors },
    });
  }
}

async function handleFreeGenerate(request, cors, env) {
  try {
    const body = await request.json();
    const { prompt, session } = body;
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    const sessionId = session || 'anon_' + (request.headers.get('CF-Connecting-IP') || 'unknown');
    const principal = 'tier0_' + await generatePrincipalHash(sessionId);

    let freeOk = false;
    let freeRemaining = 0;
    let freeLimit = 1;
    if (env.CREDIT_LEDGER) {
      const ledger = getLedger(principal, env);
      const freeResult = await doLedgerAction(ledger, 'tryTier0');
      freeOk = freeResult.ok;
      freeRemaining = freeResult.remaining || 0;
      freeLimit = freeResult.limit || 1;
      if (!freeOk) {
        return new Response(JSON.stringify({ error: 'free_limit_reached', remaining: 0, limit: freeLimit }), {
          status: 429, headers: { 'Content-Type': 'application/json', ...cors },
        });
      }
    }

    const parsed = await callOpenRouter(prompt, FREE_SYSTEM_PROMPT, CONFIG.FREE_MODEL, env);
    return new Response(JSON.stringify({ ...parsed, free: true, remaining: freeRemaining }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', ...cors },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...cors },
    });
  }
}

async function handleCheckout(request, cors, env) {
  try {
    const body = await request.json();
    const { item } = body;

    let principal = body.principal || request.headers.get('x-principal') || '';
    const apiKey = request.headers.get('x-api-key') || request.headers.get('x-proxy-key') || '';
    if (!principal && apiKey.startsWith('wek_')) {
      principal = await principalFromWekKey(env, apiKey);
    }

    if (!item || !CONFIG.PRICE_IDS[item]) {
      return new Response(JSON.stringify({ error: 'Invalid item. Choose: pack_small, pack_large, sub_pro' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    if (!principal) {
      return new Response(JSON.stringify({ error: 'principal required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    const isSub = item === 'sub_pro';
    const credits = isSub ? CONFIG.SUB_CREDITS : CONFIG.CREDIT_PACKS[item];

    const stripeRes = await fetch(CONFIG.STRIPE_API + '/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + (env.STRIPE_SECRET_KEY || ''),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        mode: isSub ? 'subscription' : 'payment',
        'line_items[0][price]': CONFIG.PRICE_IDS[item],
        'line_items[0][quantity]': '1',
        'success_url': 'https://dipdesigns.app/studio?checkout=success&session_id={CHECKOUT_SESSION_ID}',
        'cancel_url': 'https://dipdesigns.app/studio?checkout=cancel',
        'client_reference_id': principal,
        'metadata[principal]': principal,
        'metadata[item]': item,
        'metadata[credits]': String(credits || 0),
      }),
    });

    if (!stripeRes.ok) {
      const err = await stripeRes.text();
      return new Response(JSON.stringify({ error: 'Stripe: ' + err }), {
        status: 502, headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    const session = await stripeRes.json();
    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...cors },
    });
  }
}

async function handleStripeWebhook(request, cors, env) {
  try {
    const rawBody = await request.text();
    const sigHeader = request.headers.get('stripe-signature');
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET || '';

    if (!sigHeader || !webhookSecret) {
      return new Response('Webhook verification not configured', { status: 500, headers: cors });
    }

    const verified = await verifyStripeSignature(rawBody, sigHeader, webhookSecret);
    if (!verified) {
      return new Response('Bad signature', { status: 400, headers: cors });
    }

    const event = JSON.parse(rawBody);

    if (!env.CREDIT_LEDGER) {
      return new Response('CREDIT_LEDGER not available', { status: 503, headers: cors });
    }

    const principal = event.data?.object?.metadata?.principal;
    if (!principal) {
      return new Response(JSON.stringify({ ok: true, note: 'no principal in metadata' }), {
        status: 200, headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    const ledger = getLedger(principal, env);
    const wasProcessed = await doLedgerAction(ledger, 'wasEventProcessed', { eventId: event.id });
    if (wasProcessed.processed) {
      return new Response(JSON.stringify({ ok: true, duplicate: true }), {
        status: 200, headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    const eventType = event.type;
    if (eventType === 'checkout.session.completed') {
      const mode = event.data.object.mode;
      const credits = parseInt(event.data.object.metadata?.credits || '0');
      if (mode === 'payment' && credits > 0) {
        await doLedgerAction(ledger, 'grant', { credits });
      } else if (mode === 'subscription') {
        await doLedgerAction(ledger, 'grant', { credits: credits || CONFIG.SUB_CREDITS });
        await doLedgerAction(ledger, 'setSubscription', {
          status: 'active',
          tier: 'pro',
          stripeCustomerId: event.data.object.customer,
          stripeSubscriptionId: event.data.object.subscription,
          currentPeriodEnd: null,
        });
      }
    } else if (eventType === 'invoice.paid') {
      const subId = event.data.object.subscription;
      if (subId) {
        await doLedgerAction(ledger, 'grant', { credits: CONFIG.SUB_CREDITS });
        await doLedgerAction(ledger, 'setSubscription', {
          status: 'active', tier: 'pro',
          stripeSubscriptionId: subId,
          currentPeriodEnd: event.data.object.lines?.data?.[0]?.period?.end || null,
        });
      }
    } else if (eventType === 'customer.subscription.updated' || eventType === 'customer.subscription.deleted') {
      const isDeleted = eventType === 'customer.subscription.deleted';
      await doLedgerAction(ledger, 'setSubscription', {
        status: isDeleted ? 'canceled' : (event.data.object.status === 'past_due' ? 'past_due' : 'active'),
        tier: 'pro',
        stripeCustomerId: event.data.object.customer,
        stripeSubscriptionId: event.data.object.id,
        currentPeriodEnd: event.data.object.current_period_end || null,
      });
    }

    await doLedgerAction(ledger, 'markEvent', { eventId: event.id });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { 'Content-Type': 'application/json', ...cors },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...cors },
    });
  }
}

function generateId(length = 24) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
  return id;
}

async function handleOAuth(request, url, env) {
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  const providerMatch = url.pathname.match(/\/api\/auth\/(github|google)(\/callback)?/);
  if (!providerMatch) return new Response('Not found', { status: 404, headers: cors });
  const provider = providerMatch[1];
  const isCallback = !!providerMatch[2];
  const baseUrl = env.OAUTH_REDIRECT_URL || `${url.protocol}//${url.host}`;

  if (!isCallback) {
    const state = generateId(32);
    const appRedirect = url.searchParams.get('redirect') || 'https://dipdesigns.app';
    if (env.WEBHOOKS_KV) {
      await env.WEBHOOKS_KV.put('oauth_state:' + state, JSON.stringify({ provider, appRedirect }), { expirationTtl: 300 });
    }

    let redirectUrl;
    if (provider === 'github') {
      redirectUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(baseUrl + '/api/auth/github/callback')}&state=${state}&scope=read:user,user:email`;
    } else {
      redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(baseUrl + '/api/auth/google/callback')}&state=${state}&response_type=code&scope=openid%20email%20profile`;
    }
    return Response.redirect(redirectUrl, 302);
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return new Response('Missing code or state', { status: 400, headers: cors });

  let stateData;
  if (env.WEBHOOKS_KV) {
    stateData = await env.WEBHOOKS_KV.get('oauth_state:' + state, 'json');
    await env.WEBHOOKS_KV.delete('oauth_state:' + state);
  }
  if (!stateData) return new Response('Invalid or expired state', { status: 400, headers: cors });
  const appRedirect = stateData.appRedirect || 'https://dipdesigns.app';

  try {
    let accessToken, email;
    if (provider === 'github') {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code, redirect_uri: baseUrl + '/api/auth/github/callback' }),
      });
      const tokenData = await tokenRes.json();
      accessToken = tokenData.access_token;
      if (!accessToken) return new Response('GitHub: ' + (tokenData.error_description || 'token exchange failed'), { status: 502, headers: cors });

      const userRes = await fetch('https://api.github.com/user', { headers: { 'Authorization': 'Bearer ' + accessToken, 'User-Agent': 'dipdesigns.app' } });
      const userData = await userRes.json();
      if (userData.email) { email = userData.email; }
      else {
        const emailsRes = await fetch('https://api.github.com/user/emails', { headers: { 'Authorization': 'Bearer ' + accessToken, 'User-Agent': 'dipdesigns.app' } });
        const emails = await emailsRes.json();
        const primary = emails.find(e => e.primary && e.verified);
        email = primary ? primary.email : (emails[0]?.email || '');
      }
    } else {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: baseUrl + '/api/auth/google/callback', grant_type: 'authorization_code' }),
      });
      const tokenData = await tokenRes.json();
      accessToken = tokenData.access_token;
      if (!accessToken) return new Response('Google: token exchange failed', { status: 502, headers: cors });

      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { 'Authorization': 'Bearer ' + accessToken } });
      const userData = await userRes.json();
      email = userData.email;
    }

    if (!email) return new Response('Could not retrieve email from ' + provider, { status: 502, headers: cors });

    // Mint (or reuse) a per-account record with a RANDOM secret key — the key
    // is no longer derived from the email, so knowing the address tells an
    // attacker nothing about the key.
    const user = await issueOrGetUser(env, email, provider);
    const wekKey = user.wekKey;
    const authRedirect = appRedirect + (appRedirect.includes('?') ? '&' : '?') + 'auth=' + wekKey;
    return Response.redirect(authRedirect, 302);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });
  }
}

async function handleBalance(request, env, cors) {
  try {
    let principal = request.headers.get('x-principal') || '';
    const apiKey = request.headers.get('x-api-key') || '';

    if (!principal && apiKey.startsWith('wek_')) {
      principal = (await principalFromWekKey(env, apiKey)) || '';
    }

    if (!principal || !env.CREDIT_LEDGER) {
      return new Response(JSON.stringify({ balance: 0, tier0: null, free: null, subscription: { status: 'none' } }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    const isTier0 = principal.startsWith('tier0_');
    const ledger = getLedger(principal, env);
    const [balanceData, tier0Data, freeData, subData] = await Promise.all([
      doLedgerAction(ledger, 'balance'),
      isTier0 ? doLedgerAction(ledger, 'tier0Status').catch(() => ({ remaining: 0, limit: 1 })) : Promise.resolve(null),
      !isTier0 ? doLedgerAction(ledger, 'tryFree').catch(() => ({ ok: false, remaining: 0 })) : Promise.resolve(null),
      doLedgerAction(ledger, 'subscription').catch(() => ({ subscription: { status: 'none' } })),
    ]);
    return new Response(JSON.stringify({
      balance: balanceData.balance || 0,
      tier0: isTier0 ? { remaining: tier0Data.remaining || 0, limit: tier0Data.limit || 1 } : null,
      free: !isTier0 ? { remaining: freeData.remaining || 0, limit: freeData.limit || 3 } : null,
      subscription: subData.subscription,
    }), { headers: { 'Content-Type': 'application/json', ...cors } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...cors },
    });
  }
}

async function handleWebhook(request, cors, env) {
  try {
    const payload = await request.json();
    const prompt = payload.body || payload.text || payload.prompt || '';
    const sessionId = payload.session || 'default';

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'No prompt found in webhook payload' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    const webhookEvent = {
      type: 'INBOUND_WEBHOOK_PROMPT',
      prompt: prompt,
      timestamp: Date.now(),
      session: sessionId,
    };

    if (env.SESSION_HUB) {
      const doId = env.SESSION_HUB.idFromName(sessionId);
      const stub = env.SESSION_HUB.get(doId);
      try {
        await stub.fetch('https://do/broadcast', {
          method: 'POST',
          body: JSON.stringify(webhookEvent),
        });
      } catch (e) {
        console.error('DO broadcast failed:', e.message);
      }
    }

    return new Response(JSON.stringify({ success: true, status: 'Prompt forwarded to active client' }), {
      status: 202, headers: { 'Content-Type': 'application/json', ...cors },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...cors },
    });
  }
}

async function handleStream(request, env) {
  const url = new URL(request.url);
  const sessionId = getSessionId(url);

  if (!env.SESSION_HUB) {
    return new Response(JSON.stringify({ error: 'Session hub not available' }), {
      status: 503, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const doId = env.SESSION_HUB.idFromName(sessionId);
  const stub = env.SESSION_HUB.get(doId);

  // Forward the request to the DO — it handles SSE
  const doResponse = await stub.fetch(request);

  // Return the SSE stream response with CORS
  const headers = new Headers(doResponse.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');

  return new Response(doResponse.body, {
    status: doResponse.status,
    headers,
  });
}

async function handleState(request, env, cors) {
  const url = new URL(request.url);
  const sessionId = getSessionId(url);

  if (request.method === 'GET') {
    if (!env.WEBHOOKS_KV) {
      return new Response(JSON.stringify({ error: 'KV not available' }), {
        status: 503, headers: { 'Content-Type': 'application/json', ...cors },
      });
    }
    const state = await env.WEBHOOKS_KV.get('state:' + sessionId, 'json');
    return new Response(JSON.stringify(state || { empty: true, session: sessionId }), {
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const vfsState = { ...body, timestamp: Date.now() };

    if (env.WEBHOOKS_KV) {
      await env.WEBHOOKS_KV.put('state:' + sessionId, JSON.stringify(vfsState));
    }

    if (env.SESSION_HUB) {
      const doId = env.SESSION_HUB.idFromName(sessionId);
      const stub = env.SESSION_HUB.get(doId);
      try {
        await stub.fetch('https://do/broadcast', {
          method: 'POST',
          body: JSON.stringify(vfsState),
        });
      } catch (e) {
        console.error('DO broadcast failed:', e.message);
      }
    }

    return new Response(JSON.stringify(vfsState), {
      headers: { 'Content-Type': 'application/json', ...cors },
    });
  }

  return new Response('Method not allowed', { status: 405, headers: cors });
}

const BLOCKED_UA_PATTERNS = [
  'bot', 'crawl', 'scrape', 'spider', 'python-requests', 'curl', 'wget',
  'go-http-client', 'java/', 'okhttp', 'axios', 'php', 'ruby', 'perl',
  'postman', 'http-client', 'aiohttp', 'httpx', 'httplib',
];

function isBotRequest(request) {
  const ua = (request.headers.get('User-Agent') || '').toLowerCase();
  if (!ua) return true;
  const secFetch = request.headers.get('Sec-Fetch-Dest');
  if (secFetch === 'document' || secFetch === 'iframe') return false;
  return BLOCKED_UA_PATTERNS.some(p => ua.includes(p));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '*';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname.startsWith('/api/') && url.pathname !== '/api/stripe-webhook') {
      if (isBotRequest(request)) {
        return new Response('Forbidden', { status: 403 });
      }
    }

    switch (url.pathname) {
      case '/api/generate':
        if (request.method === 'POST') return proxyOpenRouter(request, cors, env);
        break;
      case '/api/free-generate':
        if (request.method === 'POST') return handleFreeGenerate(request, cors, env);
        break;
      case '/api/webhook':
        if (request.method === 'POST') return handleWebhook(request, cors, env);
        break;
      case '/api/checkout':
        if (request.method === 'POST') return handleCheckout(request, cors, env);
        break;
      case '/api/stripe-webhook':
        if (request.method === 'POST') return handleStripeWebhook(request, cors, env);
        break;
      case '/api/balance':
        return handleBalance(request, env, cors);
      case '/api/auth/github':
      case '/api/auth/github/callback':
      case '/api/auth/google':
      case '/api/auth/google/callback':
        return handleOAuth(request, url, env);
      case '/api/health':
        return new Response(JSON.stringify({ status: 'ok', model: CONFIG.MODEL }), {
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      default:
        break;
    }

    if (url.pathname.startsWith('/api/stream')) {
      return handleStream(request, env);
    }

    if (url.pathname.startsWith('/api/state')) {
      return handleState(request, env, cors);
    }

    // Serve static assets (PWA files, manifest, CSS, JS, landing/signin pages)
    // Route mapping: root = landing, /studio = studio, everything else = asset
    let assetPath = url.pathname;
    if (assetPath === '/' || assetPath === '') {
      assetPath = '/landing.html';
    } else if (assetPath === '/studio') {
      assetPath = '/index.html';
    }
    const assetResponse = await serveAsset(assetPath);
    if (assetResponse) return assetResponse;
    return new Response('Not found', { status: 404 });
  },
};

export class SessionHub {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.connections = new Set();
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.endsWith('/stream')) {
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      this.connections.add(writer);

      const heartbeat = setInterval(() => {
        try {
          writer.write(encoder.encode(': heartbeat\n\n'));
        } catch {
          clearInterval(heartbeat);
          this.connections.delete(writer);
        }
      }, 30000);

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        this.connections.delete(writer);
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    if (url.pathname.endsWith('/broadcast') && request.method === 'POST') {
      const data = await request.json();
      const encoder = new TextEncoder();
      const message = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);

      const dead = new Set();
      for (const writer of this.connections) {
        try {
          writer.write(message);
        } catch {
          dead.add(writer);
        }
      }
      for (const w of dead) this.connections.delete(w);

      return new Response(JSON.stringify({ broadcast: true, clients: this.connections.size }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }
}

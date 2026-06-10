const CONFIG = {
  OPENROUTER_API_KEY: typeof OPENROUTER_API_KEY !== 'undefined' ? OPENROUTER_API_KEY : '',
  OPENROUTER_BASE: 'https://openrouter.ai/api/v1',
  MODEL: 'google/gemma-4-26b-a4b-it:free',
  DESKTOP_FORWARD_KEY: 'wek_desktop_sync_key_change_me',
  ALLOWED_ORIGINS: ['https://webhooks.email', 'https://*.webhooks.email', 'http://127.0.0.1:5500', 'http://127.0.0.1:8000', 'http://127.0.0.1:8080'],
};

const SYSTEM_PROMPT = `You are a web UI generator. Return ONLY valid JSON with NO markdown fences or extra text.
The JSON must have this exact structure:
{
  "html": "<string>",
  "css": "<string>",
  "js": "<string>"
}
Generate a clean, responsive UI based on the user's request. Use modern CSS (flexbox/grid). Be creative but practical.`;

function corsHeaders(origin) {
  const allowed = CONFIG.ALLOWED_ORIGINS.some(p => {
    if (p.endsWith('*')) return origin?.startsWith(p.slice(0, -1));
    return p === origin;
  });
  return {
    'Access-Control-Allow-Origin': allowed ? origin : CONFIG.ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
}

function getSessionId(url) {
  return url.searchParams.get('session') || 'default';
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

async function proxyOpenRouter(request, cors) {
  try {
    const body = await request.json();
    const { prompt } = body;
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'prompt is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...cors },
      });
    }
    const resp = await fetch(CONFIG.OPENROUTER_BASE + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + CONFIG.OPENROUTER_API_KEY,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://webhooks.email',
        'X-Title': 'webhooks.email',
      },
      body: JSON.stringify({
        model: CONFIG.MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        extra_body: { reasoning: { enabled: true } },
      }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      return new Response(JSON.stringify({ error: 'OpenRouter: ' + err }), {
        status: 502, headers: { 'Content-Type': 'application/json', ...cors },
      });
    }
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';
    const parsed = parseGemmaResponse(content);
    return new Response(JSON.stringify(parsed), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', ...cors },
    });
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
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'No prompt found in webhook body' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    const orBody = {
      model: CONFIG.MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      extra_body: { reasoning: { enabled: true } },
    };

    const resp = await fetch(CONFIG.OPENROUTER_BASE + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + CONFIG.OPENROUTER_API_KEY,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://webhooks.email',
        'X-Title': 'webhooks.email',
      },
      body: JSON.stringify(orBody),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return new Response(JSON.stringify({ error: 'OpenRouter: ' + err }), {
        status: 502, headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';
    const parsed = parseGemmaResponse(content);
    const fullHtml = buildHtml(parsed);

    const sessionId = payload.session || 'default';
    const vfsState = { html: fullHtml, parsed, timestamp: Date.now(), prompt };

    // Persist to KV
    if (env.WEBHOOKS_KV) {
      await env.WEBHOOKS_KV.put('state:' + sessionId, JSON.stringify(vfsState));
    }

    // Broadcast via Durable Object
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

    return new Response(JSON.stringify({ html: fullHtml, ...parsed, _session: sessionId }), {
      headers: { 'Content-Type': 'application/json', ...cors },
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '*';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    switch (url.pathname) {
      case '/api/generate':
        if (request.method === 'POST') return proxyOpenRouter(request, cors);
        break;
      case '/api/webhook':
        if (request.method === 'POST') return handleWebhook(request, cors, env);
        break;
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

    return fetch(request);
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

    if (url.pathname === '/stream') {
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

    if (url.pathname === '/broadcast' && request.method === 'POST') {
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

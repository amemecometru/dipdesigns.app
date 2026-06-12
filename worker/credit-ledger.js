const TIER0_LIMIT = 1;

export class CreditLedger {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname.endsWith('/grant') && request.method === 'POST') {
      const { credits } = await request.json();
      let balance = (await this.state.storage.get('balance')) ?? 0;
      balance += credits;
      await this.state.storage.put('balance', balance);
      return new Response(JSON.stringify({ ok: true, balance }), { headers: { 'Content-Type': 'application/json', ...cors } });
    }

    if (url.pathname.endsWith('/spend') && request.method === 'POST') {
      const { cost = 1 } = await request.json();
      let balance = (await this.state.storage.get('balance')) ?? 0;
      if (balance < cost) {
        return new Response(JSON.stringify({ ok: false, balance }), {
          status: 402,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }
      balance -= cost;
      await this.state.storage.put('balance', balance);
      return new Response(JSON.stringify({ ok: true, balance }), { headers: { 'Content-Type': 'application/json', ...cors } });
    }

    if (url.pathname.endsWith('/balance')) {
      const balance = (await this.state.storage.get('balance')) ?? 0;
      return new Response(JSON.stringify({ balance }), { headers: { 'Content-Type': 'application/json', ...cors } });
    }

    if (url.pathname.endsWith('/tier0Status')) {
      const remaining = (await this.state.storage.get('tier0Remaining')) ?? TIER0_LIMIT;
      return new Response(JSON.stringify({ remaining, limit: TIER0_LIMIT }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    if (url.pathname.endsWith('/tryTier0') && request.method === 'POST') {
      let remaining = (await this.state.storage.get('tier0Remaining')) ?? TIER0_LIMIT;
      if (remaining <= 0) {
        return new Response(JSON.stringify({ ok: false, remaining: 0, limit: TIER0_LIMIT }), {
          status: 429, headers: { 'Content-Type': 'application/json', ...cors },
        });
      }
      remaining--;
      await this.state.storage.put('tier0Remaining', remaining);
      return new Response(JSON.stringify({ ok: true, remaining, limit: TIER0_LIMIT }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    if (url.pathname.endsWith('/tryFree') && request.method === 'POST') {
      const now = Date.now();
      let freeUsedToday = (await this.state.storage.get('freeUsedToday')) ?? 0;
      let freeResetAt = (await this.state.storage.get('freeResetAt')) ?? 0;
      const dailyLimit = parseInt(this.env?.FREE_DAILY_LIMIT) || 3;

      if (now > freeResetAt) {
        freeUsedToday = 0;
        freeResetAt = now + 86400000;
        await this.state.storage.put('freeResetAt', freeResetAt);
      }

      if (freeUsedToday >= dailyLimit) {
        return new Response(JSON.stringify({ ok: false, remaining: 0, limit: dailyLimit }), {
          status: 429,
          headers: { 'Content-Type': 'application/json', ...cors },
        });
      }

      freeUsedToday++;
      await this.state.storage.put('freeUsedToday', freeUsedToday);
      return new Response(JSON.stringify({ ok: true, remaining: dailyLimit - freeUsedToday, limit: dailyLimit }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    if (url.pathname.endsWith('/setSubscription') && request.method === 'POST') {
      const data = await request.json();
      await this.state.storage.put('subscription', data);
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json', ...cors } });
    }

    if (url.pathname.endsWith('/markEvent') && request.method === 'POST') {
      const { eventId } = await request.json();
      if (!eventId) return new Response('missing eventId', { status: 400 });
      let processed = (await this.state.storage.get('processedEvents')) || [];
      if (processed.includes(eventId)) {
        return new Response(JSON.stringify({ ok: true, already: true }), { headers: { 'Content-Type': 'application/json', ...cors } });
      }
      processed.push(eventId);
      if (processed.length > 500) processed.splice(0, processed.length - 500);
      await this.state.storage.put('processedEvents', processed);
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json', ...cors } });
    }

    if (url.pathname.endsWith('/wasEventProcessed') && request.method === 'POST') {
      const { eventId } = await request.json();
      const processed = (await this.state.storage.get('processedEvents')) || [];
      return new Response(JSON.stringify({ processed: processed.includes(eventId) }), {
        headers: { 'Content-Type': 'application/json', ...cors },
      });
    }

    if (url.pathname.endsWith('/subscription')) {
      const sub = (await this.state.storage.get('subscription')) || { status: 'none' };
      return new Response(JSON.stringify({ subscription: sub }), { headers: { 'Content-Type': 'application/json', ...cors } });
    }

    return new Response('Not found', { status: 404 });
  }
}

(function () {
  const MODELS = [
    { id: 'google/gemma-4-26b-a4b-it:free', name: 'Gemma 4 (26B)', desc: 'Fast, default' },
    { id: 'google/gemma-4-31b-it:free', name: 'Gemma 4 (31B)', desc: 'Higher quality' },
    { id: 'google/gemma-3-12b-it', name: 'Gemma 3 (12B)', desc: 'Lightweight' },
    { id: 'microsoft/phi-4', name: 'Phi-4', desc: 'Excellent for code' },
    { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 (3B)', desc: 'Tiny & fast' },
    { id: 'mistralai/mistral-small-3.1-24b-instruct', name: 'Mistral Small (24B)', desc: 'Edge model' },
    { id: 'qwen/qwen-2.5-7b-instruct', name: 'Qwen 2.5 (7B)', desc: 'Solid all-rounder' },
  ];

  const CONFIG = {
    model: MODELS[0].id,
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: '',
    workerURL: 'https://workers.dipdesigns.app',
    proxyEndpoint: '',
    siteURL: window.location.origin || 'https://dipdesigns.app',
    siteName: 'dipdesigns.app',
    isProxyMode: false,
  };

  const dom = {
    messages: document.getElementById('messages'),
    promptInput: document.getElementById('promptInput'),
    sendBtn: document.getElementById('sendBtn'),
    preview: document.getElementById('preview'),
    clearBtn: document.getElementById('clearPreviewBtn'),
    devicePod: document.getElementById('devicePod'),
    deviceTrigger: document.getElementById('deviceTrigger'),
    deviceLabel: document.getElementById('deviceLabel'),
    deviceItems: document.querySelectorAll('.pod-item[data-device]'),
    exportPod: document.getElementById('exportPod'),
    exportTrigger: document.getElementById('exportTrigger'),
    exportItems: document.querySelectorAll('#exportMenu .pod-item'),
    previewCanvas: document.getElementById('previewCanvas'),
    previewStage: document.getElementById('previewStage'),
    zoomInBtn: document.getElementById('zoomInBtn'),
    zoomOutBtn: document.getElementById('zoomOutBtn'),
    zoomValue: document.getElementById('zoomValue'),
  };

  const SKILLS = {
    architect: {
      system: `You are a software architect. Analyze the user's UI request and output ONLY valid JSON with NO markdown fences or extra text.

The JSON must have this exact structure:
{
  "title": "brief app title",
  "state": { "variableName": "type-or-description" },
  "components": ["list of UI components needed"],
  "layout": "description of layout structure",
  "theme": "dark/light/minimalist/etc",
  "interactions": ["key user interactions"]
}

Describe what data the app manages, what components it needs, and how they connect. Be specific but concise.`
    },
    styler: {
      system: `You are a UI designer. Given a user request and an application blueprint, output ONLY valid JSON with NO markdown fences or extra text.

The JSON must have this exact structure:
{
  "html": "<string>",
  "css": "<string>"
}

Create a clean, responsive UI using semantic HTML5 and modern CSS (flexbox, grid, custom properties). Add id and class attributes for JS hooks. Do NOT include any JavaScript. Match the theme and layout from the blueprint.`
    },
    engineer: {
      system: `You are a frontend engineer. Given an existing HTML/CSS layout and an application blueprint, output ONLY valid JSON with NO markdown fences or extra text.

The JSON must have this exact structure:
{
  "js": "<string>"
}

Write vanilla JavaScript that adds interactivity to the existing HTML elements. Reference elements by their existing IDs and classes. Do NOT modify HTML or CSS — only add behavior. Handle events, update DOM, and manage state as described in the blueprint.`
    },
    debugger: {
      system: `You are a debugger. A user's generated UI has a runtime error. Given the original user intent, the current code, and the error details, fix the bug and output the COMPLETE corrected code as valid JSON with NO markdown fences or extra text.

The JSON must have this exact structure:
{
  "html": "<string>",
  "css": "<string>",
  "js": "<string>"
}

Return the full working UI with the bug fixed. Pay attention to:
- Missing variable definitions
- Incorrect DOM queries or null references
- Type errors
- Async/promise handling
- Event listener binding`
    },
    webhooker: {
      system: `You are a webhook configuration assistant. Given a user's description of what they want to connect or sync, output ONLY valid JSON with NO markdown fences or extra text.

The JSON must have this exact structure:
{
  "endpoint": "suggested path (e.g., /api/webhook/sync)",
  "method": "POST",
  "payload": { "key": "description of value" },
  "description": "what this endpoint does",
  "response": "what the webhook returns"
}

Suggest practical webhook endpoints that integrate with the Cloudflare Worker and desktop receiver.`
    },
  };

  const BUILTIN_SKILLS = [
    { id: 'dark-dashboard', name: 'Dark Dashboard', category: 'dashboard', prompt: 'a dark dashboard with sidebar navigation, stat cards, a chart area, and a top header with user avatar', tags: ['dashboard', 'dark', 'analytics'], contributor: 'dipdesigns.app' },
    { id: 'landing-page', name: 'Landing Page', category: 'landing', prompt: 'a modern landing page with a hero section, feature grid, testimonials, and a footer with social links', tags: ['landing', 'marketing', 'hero'], contributor: 'dipdesigns.app' },
    { id: 'chat-interface', name: 'Chat Interface', category: 'app', prompt: 'a messaging chat interface with a contact list on the left, message bubbles, and an input bar at the bottom', tags: ['chat', 'messaging', 'social'], contributor: 'dipdesigns.app' },
    { id: 'ecommerce-product', name: 'Product Page', category: 'ecommerce', prompt: 'an ecommerce product page with image gallery, product details, size selector, add to cart button, and reviews section', tags: ['ecommerce', 'product', 'shop'], contributor: 'dipdesigns.app' },
    { id: 'settings-panel', name: 'Settings Panel', category: 'dashboard', prompt: 'a settings panel with tabs for profile, notifications, security, and appearance with toggle switches and form inputs', tags: ['settings', 'form', 'profile'], contributor: 'dipdesigns.app' },
    { id: 'analytics-dashboard', name: 'Analytics Dashboard', category: 'dashboard', prompt: 'an analytics dashboard with a date range picker, line chart, bar chart, stat cards, and a data table', tags: ['dashboard', 'analytics', 'charts'], contributor: 'dipdesigns.app' },
    { id: 'signin-form', name: 'Sign In Form', category: 'auth', prompt: 'a clean sign-in page with email and password fields, remember me checkbox, social login buttons, and a sign up link', tags: ['auth', 'login', 'form'], contributor: 'dipdesigns.app' },
    { id: 'pricing-table', name: 'Pricing Table', category: 'landing', prompt: 'a pricing comparison page with three tiers (Free, Pro, Enterprise), feature lists, and CTA buttons with a toggle for monthly/yearly', tags: ['pricing', 'landing', 'saas'], contributor: 'dipdesigns.app' },
    { id: 'music-player', name: 'Music Player', category: 'media', prompt: 'a music player UI with album art, track list, progress bar, play/pause/skip controls, and volume slider', tags: ['media', 'player', 'music'], contributor: 'dipdesigns.app' },
    { id: 'kanban-board', name: 'Kanban Board', category: 'app', prompt: 'a kanban board with three columns (Todo, In Progress, Done), draggable task cards with avatars and priority labels', tags: ['kanban', 'project', 'productivity'], contributor: 'dipdesigns.app' },
    { id: 'weather-widget', name: 'Weather Dashboard', category: 'widget', prompt: 'a weather dashboard showing current conditions, 7-day forecast, hourly breakdown, and location search', tags: ['weather', 'widget', 'data'], contributor: 'dipdesigns.app' },
    { id: 'social-feed', name: 'Social Feed', category: 'social', prompt: 'a social media feed with post cards containing user avatar, text content, image, like/comment/share buttons', tags: ['social', 'feed', 'cards'], contributor: 'dipdesigns.app' },
  ];

  const STORAGE_SKILLS_KEY = 'webhooks_email_user_skills';

  function getUserSkills() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_SKILLS_KEY)) || [];
    } catch { return []; }
  }

  function saveUserSkill(skill) {
    const skills = getUserSkills();
    skill.id = 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    skill.contributor = 'You';
    skills.push(skill);
    localStorage.setItem(STORAGE_SKILLS_KEY, JSON.stringify(skills));
    return skill;
  }

  function removeUserSkill(id) {
    const skills = getUserSkills().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_SKILLS_KEY, JSON.stringify(skills));
  }

  function getAllSkills() {
    return [...BUILTIN_SKILLS, ...getUserSkills()];
  }

  function renderLibrary(category, query) {
    const grid = document.getElementById('skillGrid');
    const filters = document.getElementById('categoryFilters');
    if (!grid || !filters) return;

    const all = getAllSkills();
    const cats = [...new Set(all.map(s => s.category))];
    filters.innerHTML = '<button class="active" data-cat="">All</button>' +
      cats.map(c => '<button data-cat="' + c + '">' + c.charAt(0).toUpperCase() + c.slice(1) + '</button>').join('');
    filters.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        filters.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderLibrary(btn.dataset.cat, document.getElementById('librarySearch').value);
      });
    });

    let filtered = all;
    if (category) filtered = filtered.filter(s => s.category === category);
    if (query) filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.tags || []).some(t => t.includes(query.toLowerCase()))
    );

    if (filtered.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-dim)">No skills found. <button onclick="DipDesigns.showAddSkill()" style="background:none;border:1px solid var(--accent);color:var(--accent);padding:8px 16px;border-radius:8px;cursor:pointer;margin-top:12px;font-family:var(--font)">Add your own</button></div>';
      return;
    }

    grid.innerHTML = filtered.map(s => {
      const isUser = s.contributor === 'You';
      return '<div class="skill-card">' +
        '<span class="tag">' + s.category + (isUser ? ' &middot; Yours' : '') + '</span>' +
        '<h3>' + s.name + '</h3>' +
        '<p>' + (s.prompt.slice(0, 100)) + (s.prompt.length > 100 ? '...' : '') + '</p>' +
        '<div class="skill-footer">' +
        '<span>' + (s.tags ? s.tags.slice(0, 3).join(', ') : '') + '</span>' +
        '<div>' +
        (isUser ? '<button class="use-btn" style="margin-right:6px;background:var(--error)" onclick="DipDesigns._removeSkill(\'' + s.id + '\')">X</button>' : '') +
        '<button class="use-btn" onclick="DipDesigns._useSkill(\'' + s.id + '\')">Use Skill</button>' +
        '</div></div></div>';
    }).join('');
  }

  function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById('view-' + viewId);
    if (target) target.classList.add('active');
    document.querySelectorAll('header nav button').forEach(b => {
      b.classList.toggle('active', b.dataset.view === viewId);
    });
    if (viewId === 'library') {
      setTimeout(() => renderLibrary('', ''), 50);
    }
    if (viewId === 'pricing') {
      setTimeout(() => refreshPricingCreditBar(), 50);
    }
  }

  function showAddSkill() {
    const name = prompt('Skill name:');
    if (!name) return;
    const prompt_text = prompt('Prompt / description (what should the AI generate?):');
    if (!prompt_text) return;
    const category = prompt('Category (e.g. dashboard, landing, app, widget):') || 'uncategorized';
    const tags = prompt('Tags (comma separated):') || '';
    const skill = { name, prompt: prompt_text, category, tags: tags.split(',').map(t => t.trim()).filter(Boolean) };
    saveUserSkill(skill);
    renderLibrary('', '');
  }

  let abortController = null;
  let lastResult = null;
  let lastPrompt = '';
  let desktopURL = '';
  let desktopKey = '';
  let repairCount = 0;
  const MAX_REPAIRS = 3;
  const STORAGE_KEY = 'webhooks_email_api_key';

  function loadApiKey() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      CONFIG.apiKey = stored;
      return true;
    }
    return false;
  }

  function saveApiKey(key) {
    CONFIG.apiKey = key;
    localStorage.setItem(STORAGE_KEY, key);
    setFreeRemaining(0);
    if (key.startsWith('wek_')) {
      CONFIG.isProxyMode = true;
      // The Worker owns /api/generate, so default the proxy target to the Worker.
      CONFIG.proxyEndpoint = localStorage.getItem('webhooks_email_proxy') || workerBase();
      showModelSelector(true);
    } else {
      CONFIG.isProxyMode = false;
      CONFIG.proxyEndpoint = '';
      showModelSelector(false);
    }
    updateStatus('connected');
    refreshAuthUI();
  }

  function clearApiKey() {
    CONFIG.apiKey = '';
    CONFIG.isProxyMode = false;
    CONFIG.proxyEndpoint = '';
    localStorage.removeItem(STORAGE_KEY);
    showModelSelector(false);
    updateStatus('disconnected');
    refreshAuthUI();
  }

  function setModel(modelId) {
    if (MODELS.some(m => m.id === modelId)) {
      CONFIG.model = modelId;
    }
  }

  function getSelectedModel() {
    return CONFIG.model;
  }

  function showModelSelector(show) {
    const container = document.getElementById('modelSelector');
    if (container) container.style.display = show ? 'inline-flex' : 'none';
  }

  function populateModelSelector() {
    const container = document.getElementById('modelSelector');
    if (!container) return;
    container.innerHTML = '';
    MODELS.forEach(m => {
      const opt = document.createElement('button');
      opt.className = 'model-opt' + (m.id === CONFIG.model ? ' active' : '');
      opt.textContent = m.name;
      opt.title = m.desc;
      opt.dataset.model = m.id;
      opt.addEventListener('click', () => {
        container.querySelectorAll('.model-opt').forEach(b => b.classList.remove('active'));
        opt.classList.add('active');
        setModel(m.id);
        CONFIG.model = m.id;
        if (m.id !== MODELS[0].id && CONFIG.isProxyMode) {
          addMessage('Switched to ' + m.name + ' (' + m.desc + ')', 'assistant');
        }
      });
      container.appendChild(opt);
    });
  }

  async function validateApiKey(key) {
    if (key.startsWith('wek_')) {
      const proxyURL = localStorage.getItem('webhooks_email_proxy') || '';
      if (!proxyURL) {
        throw new Error('Set your dipdesigns.app backend URL first via DipDesigns.setProxyEndpoint()');
      }
      const res = await fetch(proxyURL.replace(/\/+$/, '') + '/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      });
      if (!res.ok) throw new Error('Backend validation failed: ' + res.status);
      const data = await res.json();
      if (!data.valid) throw new Error('Invalid dipdesigns.app key');
      return { label: data.label, models: data.models || [] };
    }
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { 'Authorization': 'Bearer ' + key },
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Invalid OpenRouter API key');
      throw new Error('Validation failed: ' + res.status);
    }
    const data = await res.json();
    return data;
  }

  function updateStatus(state) {
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    if (!dot || !text) return;
    if (state === 'connected') {
      dot.style.background = 'var(--success)';
      text.textContent = 'Gemma-4 Ready';
    } else if (state === 'disconnected') {
      dot.style.background = 'var(--error)';
      text.textContent = 'No API Key';
    } else if (state === 'validating') {
      dot.style.background = '#fbbf24';
      text.textContent = 'Validating...';
    }
  }

  function showKeyModal() {
    const modal = document.getElementById('keyModal');
    if (modal) modal.classList.remove('hidden');
    prefillSettings();
  }

  function hideKeyModal() {
    const modal = document.getElementById('keyModal');
    if (modal) modal.classList.add('hidden');
  }

  function setApiKey(key) {
    CONFIG.apiKey = key;
  }

  function setBaseURL(url) {
    CONFIG.baseURL = url;
  }

  function setWorkerURL(url) {
    CONFIG.workerURL = (url || '').replace(/\/+$/, '');
    if (CONFIG.workerURL) {
      localStorage.setItem('webhooks_email_worker', CONFIG.workerURL);
    } else {
      localStorage.removeItem('webhooks_email_worker');
    }
    connectStream();
  }

  function setProxyEndpoint(endpoint) {
    CONFIG.proxyEndpoint = endpoint;
    if (endpoint) {
      localStorage.setItem('webhooks_email_proxy', endpoint);
    } else {
      localStorage.removeItem('webhooks_email_proxy');
    }
  }

  // ---------- Worker URL auto-detect + OAuth (GitHub / Google) ----------
  function detectWorkerURL() {
    const saved = (localStorage.getItem('webhooks_email_worker') || '').replace(/\/+$/, '');
    if (saved) return saved;
    const origin = window.location.origin || '';
    // In production the Worker serves this page, so same-origin IS the Worker.
    // Fall back to the configured default for local dev (file://, localhost).
    if (/^https?:\/\//.test(origin) && !/(localhost|127\.0\.0\.1|0\.0\.0\.0)/.test(origin)) {
      return origin.replace(/\/+$/, '');
    }
    return (CONFIG.workerURL || '').replace(/\/+$/, '');
  }

  function workerBase() {
    return (CONFIG.workerURL || detectWorkerURL() || '').replace(/\/+$/, '');
  }

  function startOAuth(provider) {
    const base = workerBase();
    if (!base) {
      addMessage('No Worker URL configured for sign-in. Set it in Settings → Device Sync.', 'error');
      showKeyModal();
      return;
    }
    const back = window.location.origin + window.location.pathname;
    window.location.href = base + '/api/auth/' + provider + '?redirect=' + encodeURIComponent(back);
  }

  function handleAuthRedirect() {
    const params = new URLSearchParams(window.location.search);
    const authKey = params.get('auth');
    if (authKey && authKey.startsWith('wek_')) {
      saveApiKey(authKey);
      try { populateModelSelector(); } catch (e) {}
      // Strip ?auth= from the URL so the key isn't left in history/referrer.
      params.delete('auth');
      const qs = params.toString();
      const clean = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
      window.history.replaceState({}, document.title, clean);
      refreshAuthUI();
      switchView('app');
      addMessage('✓ Signed in — you’re connected. Start generating.', 'assistant');
      return true;
    }
    return false;
  }

  function refreshAuthUI() {
    const cluster = document.getElementById('authCluster');
    const pill = document.getElementById('signedInPill');
    const connected = !!CONFIG.apiKey;
    if (cluster) cluster.style.display = connected ? 'none' : 'flex';
    if (pill) pill.style.display = connected ? 'inline-flex' : 'none';
  }

  function setDesktopIP(ip) {
    localStorage.setItem('webhooks_email_desktop_ip', ip);
    desktopURL = ip.startsWith('http') ? ip : 'http://' + ip;
    desktopURL = desktopURL.replace(/\/+$/, '') + ':3000';
    const btn = document.getElementById('sendDesktopBtn');
    if (btn) btn.style.display = desktopURL ? 'inline-flex' : 'none';
  }

  function setDesktopKey(key) {
    desktopKey = key || '';
    if (desktopKey) {
      localStorage.setItem('webhooks_email_desktop_key', desktopKey);
    } else {
      localStorage.removeItem('webhooks_email_desktop_key');
    }
  }

  function getOrCreateSessionId() {
    let id = localStorage.getItem('webhooks_session');
    if (!id) {
      id = 'sess_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      localStorage.setItem('webhooks_session', id);
    }
    return id;
  }

  function addMessage(text, role) {
    const el = document.createElement('div');
    el.className = 'msg ' + role;
    el.textContent = text;
    dom.messages.appendChild(el);
    dom.messages.scrollTop = dom.messages.scrollHeight;
    return el;
  }

  function removeTyping() {
    const t = dom.messages.querySelector('.msg.typing');
    if (t) t.remove();
  }

  function showStatus(text) {
    let el = dom.messages.querySelector('.msg.typing');
    if (el) {
      el.textContent = text;
    } else {
      el = addMessage(text, 'typing');
    }
    return el;
  }

  function mergeCode(uiShell, appCode) {
    return {
      html: uiShell.html || '',
      css: uiShell.css || '',
      js: appCode.js || '',
    };
  }

  function injectTelemetry(fullDoc) {
    const telemetry = `
<script>
window.onerror = function(message, source, lineno, colno, error) {
  window.parent.postMessage({
    type: 'IFRAME_RUNTIME_ERROR',
    error: message,
    line: lineno,
    col: colno,
    source: source
  }, '*');
  return true;
};
window.addEventListener('unhandledrejection', function(e) {
  window.parent.postMessage({
    type: 'IFRAME_RUNTIME_ERROR',
    error: 'Unhandled Promise: ' + e.reason,
    line: 0,
    col: 0,
    source: ''
  }, '*');
});
<\/script>`;
    return fullDoc.replace('</body>', telemetry + '\n</body>');
  }

  function buildFullDoc(data) {
    const html = data.html || '';
    const css = data.css || '';
    const js = data.js || '';
    return '<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>' + css + '</style></head>\n<body>' + html + '\n<script>' + js + '<\/script>\n</body>\n</html>';
  }

  function renderPreview(data) {
    const fullDoc = buildFullDoc(data);
    const docWithTelemetry = injectTelemetry(fullDoc);
    const blob = new Blob([docWithTelemetry], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    dom.preview.src = url;
    if (typeof fitPreviewIfFit === 'function') fitPreviewIfFit();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  function parseJSON(content) {
    try {
      return JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error('Model returned invalid JSON: ' + content.slice(0, 200));
    }
  }

  // ---------- Zero-key free trial + in-UI settings ----------
  const FREE_KEY = 'webhooks_email_free_remaining';
  const DEFAULT_FREE_USES = 3;
  function getFreeRemaining() {
    const v = parseInt(localStorage.getItem(FREE_KEY), 10);
    return Number.isFinite(v) ? Math.max(0, v) : DEFAULT_FREE_USES;
  }
  function setFreeRemaining(n) {
    localStorage.setItem(FREE_KEY, String(Math.max(0, n)));
    refreshFreeStatus();
  }
  function isFreeMode() {
    return !CONFIG.apiKey && getFreeRemaining() > 0;
  }
  function refreshFreeStatus() {
    const hint = document.getElementById('freeCountHint');
    if (hint) hint.textContent = '(' + getFreeRemaining() + ' free left)';
    if (!CONFIG.apiKey) {
      const text = document.getElementById('statusText');
      const dot = document.getElementById('statusDot');
      const left = getFreeRemaining();
      if (text) text.textContent = left > 0 ? ('Free: ' + left + ' left') : 'Add a key';
      if (dot) dot.style.background = left > 0 ? '#fbbf24' : 'var(--error)';
    }
  }
  async function callFree(userPrompt, signal) {
    const workerURL = CONFIG.workerURL || localStorage.getItem('webhooks_email_worker');
    const base = (workerURL || CONFIG.proxyEndpoint || '').replace(/\/+$/, '');
    const res = await fetch(base + '/api/free-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userPrompt }),
      signal: signal,
    });
    if (res.status === 429) throw new Error('Free generations used up. Add a free OpenRouter key in Settings for unlimited use.');
    if (!res.ok) throw new Error('Free generate failed (' + res.status + ').');
    const data = await res.json();
    setFreeRemaining(getFreeRemaining() - 1);
    return data;
  }
  function saveConnectionsFromModal() {
    const val = id => ((document.getElementById(id) || {}).value || '').trim();
    const be = val('backendUrlInput');
    const w = val('workerUrlInput');
    const ip = val('desktopIpInput');
    const dk = val('desktopKeyInput');
    if (be) setProxyEndpoint(be);
    if (w) setWorkerURL(w);
    if (ip) setDesktopIP(ip);
    if (dk) setDesktopKey(dk);
    const fb = document.getElementById('connFeedback');
    if (fb) { fb.className = 'key-success'; fb.textContent = 'Saved on this device.'; }
  }
  function prefillSettings() {
    const map = {
      backendUrlInput: 'webhooks_email_proxy',
      workerUrlInput: 'webhooks_email_worker',
      desktopIpInput: 'webhooks_email_desktop_ip',
      desktopKeyInput: 'webhooks_email_desktop_key',
    };
    for (const id in map) {
      const el = document.getElementById(id);
      if (el) el.value = localStorage.getItem(map[id]) || '';
    }
    refreshFreeStatus();
    refreshCreditStatus();
  }

  async function refreshCreditStatus() {
    const statusEl = document.getElementById('creditStatus');
    const actionsEl = document.getElementById('creditActions');
    const fb = document.getElementById('creditFeedback');
    if (!statusEl) return;

    const workerURL = CONFIG.workerURL || localStorage.getItem('webhooks_email_worker');
    const key = CONFIG.apiKey || localStorage.getItem(STORAGE_KEY);

    if (!key || !workerURL) {
      statusEl.textContent = !key ? 'Add an API key to purchase credits.' : 'Set your Worker URL in Device Sync to enable credits.';
      if (actionsEl) actionsEl.style.display = 'none';
      return;
    }

    statusEl.textContent = 'Loading...';
    if (actionsEl) actionsEl.style.display = 'none';
    if (fb) { fb.className = ''; fb.textContent = ''; }

    try {
      const res = await fetch(workerURL.replace(/\/+$/, '') + '/api/balance', {
        headers: key.startsWith('wek_') ? { 'x-api-key': key } : {},
      });
      if (!res.ok) throw new Error('' + res.status);
      const data = await res.json();
      const parts = [];
      if (data.balance > 0) parts.push(data.balance + ' credits');
      if (data.subscription?.status === 'active') parts.push('Pro (active)');
      if (data.free?.remaining > 0) parts.push(data.free.remaining + ' free/day');
      statusEl.textContent = parts.length ? parts.join(' · ') : 'No credits yet.';
      if (actionsEl) actionsEl.style.display = 'block';
    } catch (err) {
      statusEl.textContent = 'Could not load balance (' + err.message + ').';
      if (actionsEl) actionsEl.style.display = 'none';
    }

    if (window.location.search.includes('checkout=success')) {
      if (fb) { fb.className = 'key-success'; fb.textContent = 'Purchase complete! Refreshing balance...'; }
      setTimeout(refreshCreditStatus, 2000);
    }
  }

  async function refreshPricingCreditBar() {
    const bar = document.getElementById('pricingCreditBar');
    const text = document.getElementById('pricingCreditText');
    if (!bar || !text) return;
    const workerURL = CONFIG.workerURL || localStorage.getItem('webhooks_email_worker');
    const key = CONFIG.apiKey || localStorage.getItem(STORAGE_KEY);
    if (!workerURL || !key || !key.startsWith('wek_')) {
      bar.style.display = 'none';
      return;
    }
    try {
      const res = await fetch(workerURL.replace(/\/+$/, '') + '/api/balance', {
        headers: { 'x-api-key': key },
      });
      if (!res.ok) throw new Error('' + res.status);
      const data = await res.json();
      const parts = [];
      if (data.balance > 0) parts.push(data.balance + ' credits');
      if (data.subscription?.status === 'active') parts.push('Pro active');
      if (data.free?.remaining > 0) parts.push(data.free.remaining + ' free/day');
      text.textContent = parts.length ? 'Current: ' + parts.join(' · ') : 'No credits yet — choose a plan below.';
      bar.style.display = 'block';
    } catch (err) {
      bar.style.display = 'none';
    }
  }

  async function buyCredits(item) {
    const fb = document.getElementById('creditFeedback');
    if (!fb) return;
    fb.className = '';
    fb.textContent = 'Opening checkout...';

    const workerURL = CONFIG.workerURL || localStorage.getItem('webhooks_email_worker');
    const key = CONFIG.apiKey || localStorage.getItem(STORAGE_KEY);
    if (!workerURL || !key) {
      fb.className = 'key-error';
      fb.textContent = 'Set Worker URL and API key first.';
      return;
    }

    try {
      const res = await fetch(workerURL.replace(/\/+$/, '') + '/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key },
        body: JSON.stringify({ item }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '' + res.status);
      }
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      fb.className = 'key-error';
      fb.textContent = 'Checkout failed: ' + err.message;
    }
  }

  async function callGemma(messages, { signal } = {}) {
    if (!CONFIG.apiKey) {
      if (getFreeRemaining() > 0) {
        const userMsg = messages.find(m => m.role === 'user');
        return callFree(userMsg ? userMsg.content : '', signal);
      }
      throw new Error('No API key and no free generations left. Add a key in Settings.');
    }

    if (CONFIG.isProxyMode && CONFIG.proxyEndpoint) {
      const userMsg = messages.find(m => m.role === 'user');
      const payload = { prompt: userMsg?.content || '', model: CONFIG.model };
      const res = await fetch(CONFIG.proxyEndpoint.replace(/\/+$/, '') + '/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CONFIG.apiKey },
        body: JSON.stringify(payload),
        signal: signal,
      });
      if (!res.ok) {
        const errBody = await res.text();
        if (res.status === 401) {
          // Key was issued under the old (insecure) scheme and is no longer valid,
          // or was revoked. Clear it — clearApiKey() re-surfaces the top-bar sign-in —
          // and tell the user to re-authenticate, so the key migration is seamless.
          clearApiKey();
          addMessage('Your session expired — sign in again with GitHub or Google (top bar) to keep generating.', 'error');
          throw new Error('Session expired — please sign in again.');
        }
        if (res.status === 402) {
          showKeyModal();
          setTimeout(refreshCreditStatus, 100);
          throw new Error('Insufficient credits. Buy a pack in Settings to keep generating.');
        }
        throw new Error('Proxy: ' + res.status + ' ' + errBody);
      }
      return res.json();
    }

    const res = await fetch(CONFIG.baseURL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + CONFIG.apiKey,
        'HTTP-Referer': CONFIG.siteURL,
        'X-Title': CONFIG.siteName,
      },
      body: JSON.stringify({
        model: CONFIG.model,
        messages: messages,
        extra_body: { reasoning: { enabled: true } },
      }),
      signal: signal,
    });
    if (!res.ok) {
      const errBody = await res.text();
      if (res.status === 429) throw new Error('Rate limited (429) — try again in a moment or rotate your API key.');
      throw new Error(res.status + ': ' + errBody);
    }
    const raw = await res.json();
    const content = raw.choices?.[0]?.message?.content || '';
    return parseJSON(content);
  }

  async function skillArchitect(prompt, signal) {
    showStatus('Architecting application state...');
    return callGemma([
      { role: 'system', content: SKILLS.architect.system },
      { role: 'user', content: prompt },
    ], { signal });
  }

  async function skillStyler(prompt, blueprint, signal) {
    showStatus('Designing layout...');
    return callGemma([
      { role: 'system', content: SKILLS.styler.system },
      { role: 'user', content: 'User request: ' + prompt + '\n\nApplication blueprint:\n' + JSON.stringify(blueprint, null, 2) },
    ], { signal });
  }

  async function skillEngineer(uiShell, blueprint, signal) {
    showStatus('Adding interactivity...');
    return callGemma([
      { role: 'system', content: SKILLS.engineer.system },
      { role: 'user', content: 'HTML layout:\n' + (uiShell.html || '') + '\n\nCSS:\n' + (uiShell.css || '') + '\n\nApplication blueprint:\n' + JSON.stringify(blueprint, null, 2) },
    ], { signal });
  }

  async function skillDebugger(originalPrompt, brokenData, errorInfo, signal) {
    showStatus('Self-healing: fixing runtime error...');
    const currentCode = buildFullDoc(brokenData);
    return callGemma([
      { role: 'system', content: SKILLS.debugger.system },
      { role: 'user', content: 'Original user intent:\n' + originalPrompt + '\n\nCurrent code:\n' + currentCode + '\n\nRuntime error:\n' + errorInfo.error + '\nLine: ' + errorInfo.line + ' Column: ' + errorInfo.col + '\n\nFix the bug and return the complete corrected HTML, CSS, and JS.' },
    ], { signal });
  }

  async function executeSkillChain(userPrompt, signal) {
    if (CONFIG.isProxyMode || isFreeMode()) {
      showStatus(isFreeMode() ? 'Generating (free)...' : 'Generating via dipdesigns.app...');
      return callGemma([
        { role: 'user', content: userPrompt },
      ], { signal });
    }
    const blueprint = await skillArchitect(userPrompt, signal);
    const uiShell = await skillStyler(userPrompt, blueprint, signal);
    const appCode = await skillEngineer(uiShell, blueprint, signal);
    const merged = mergeCode(uiShell, appCode);
    return merged;
  }

  async function sendPrompt(prompt) {
    if (!prompt.trim()) return;
    if (!CONFIG.apiKey && getFreeRemaining() <= 0) {
      addMessage('You are out of free generations. Add a free OpenRouter key in Settings (the API button) for unlimited use.', 'error');
      showKeyModal();
      return;
    }

    dom.sendBtn.disabled = true;
    abortController = new AbortController();
    addMessage(prompt, 'user');
    dom.promptInput.value = '';
    dom.promptInput.style.height = 'auto';

    lastPrompt = prompt;
    repairCount = 0;

    try {
      showStatus('Starting SkillChain...');
      const data = await executeSkillChain(prompt, abortController.signal);

      removeTyping();
      lastResult = data;
      addMessage('Rendered live!', 'assistant');
      renderPreview(data);
      pushState(data, prompt);
      if (!CONFIG.apiKey) {
        const left = getFreeRemaining();
        addMessage(left > 0
          ? ('✨ Free generation used — ' + left + ' left. Add a key in Settings for unlimited + the full SkillChain.')
          : '✨ That was your last free generation. Add a free OpenRouter key in Settings to keep going.', 'assistant');
      }
      const sendBtn = document.getElementById('sendDesktopBtn');
      if (sendBtn) sendBtn.style.display = desktopURL ? 'inline-flex' : 'none';
    } catch (err) {
      removeTyping();
      if (err.name === 'AbortError') {
        addMessage('Generation cancelled.', 'assistant');
      } else {
        addMessage('Error: ' + err.message, 'error');
      }
    } finally {
      dom.sendBtn.disabled = false;
      abortController = null;
    }
  }

  const CLIENT_ID = 'c_' + Math.random().toString(36).slice(2, 10);

  async function pushState(parsed, prompt) {
    if (!CONFIG.workerURL || !parsed) return;
    try {
      await fetch(CONFIG.workerURL + '/api/state?session=' + getOrCreateSessionId(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parsed: parsed, prompt: prompt || lastPrompt, origin: CLIENT_ID }),
      });
    } catch (err) {
      console.warn('pushState failed (non-fatal):', err.message);
    }
  }

  async function hydrateState() {
    if (!CONFIG.workerURL) return;
    try {
      const res = await fetch(CONFIG.workerURL + '/api/state?session=' + getOrCreateSessionId());
      if (!res.ok) return;
      const state = await res.json();
      if (state && state.parsed) {
        lastResult = state.parsed;
        lastPrompt = state.prompt || lastPrompt;
        renderPreview(state.parsed);
      }
    } catch (err) {
      console.warn('hydrateState failed (non-fatal):', err.message);
    }
  }

  let eventSource = null;

  function connectStream() {
    if (!CONFIG.workerURL) return;
    disconnectStream();
    const sessionId = getOrCreateSessionId();
    eventSource = new EventSource(CONFIG.workerURL + '/api/stream?session=' + sessionId);
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.origin && data.origin === CLIENT_ID) return;
        if (data.type === 'INBOUND_WEBHOOK_PROMPT') {
          addMessage('External webhook triggered: "' + data.prompt.slice(0, 80) + '"', 'assistant');
          sendPrompt(data.prompt);
        } else if (data.parsed) {
          lastResult = data.parsed;
          lastPrompt = data.prompt || lastPrompt;
          renderPreview(data.parsed);
          addMessage('Live state synced across devices.', 'assistant');
          const sendBtn = document.getElementById('sendDesktopBtn');
          if (sendBtn) sendBtn.style.display = desktopURL ? 'inline-flex' : 'none';
        }
      } catch {}
    };
    eventSource.onopen = () => { hydrateState(); };
    eventSource.onerror = () => {
      eventSource.close();
      eventSource = null;
      setTimeout(connectStream, 5000);
    };
  }

  function disconnectStream() {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  }

  dom.sendBtn.addEventListener('click', () => sendPrompt(dom.promptInput.value));

  dom.promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt(dom.promptInput.value);
    }
  });

  dom.promptInput.addEventListener('input', () => {
    dom.promptInput.style.height = 'auto';
    dom.promptInput.style.height = Math.min(dom.promptInput.scrollHeight, 120) + 'px';
  });

  // --- Preview zoom (Slice 2) — always-visible compact control, pure CSS `zoom`, no deps ---
  const ZOOM_MIN = 0.125, ZOOM_MAX = 2;
  const ZOOM_STEPS = [0.125, 0.25, 0.333, 0.5, 0.666, 0.75, 1, 1.25, 1.5, 2];
  const DEVICES = {
    mobile:  { w: 390,  h: 800 },
    tablet:  { w: 820,  h: 1180 },
    laptop:  { w: 1280, h: 900 },
    desktop: { w: 1440, h: 960 },
  };
  let currentDevice = 'laptop';
  let zoomLevel = 1;
  let zoomMode = 'fit'; // 'fit' (auto fit-to-width) | 'manual'

  function currentDesignWidth() { return (DEVICES[currentDevice] || DEVICES.laptop).w; }
  function applyZoom() {
    if (dom.previewStage) dom.previewStage.style.zoom = String(zoomLevel);
    if (dom.zoomValue) dom.zoomValue.textContent = Math.round(zoomLevel * 100) + '%';
  }
  function fitToWidth() {
    if (!dom.previewCanvas) return;
    const avail = Math.max(80, dom.previewCanvas.clientWidth - 32);
    let z = avail / currentDesignWidth();
    z = Math.max(ZOOM_MIN, Math.min(1, z)); // fit never upscales past 100%
    zoomLevel = z; zoomMode = 'fit'; applyZoom();
  }
  function setZoom(z) {
    zoomLevel = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));
    zoomMode = 'manual'; applyZoom();
  }
  function zoomStep(dir) {
    if (dir > 0) { const n = ZOOM_STEPS.find(s => s > zoomLevel + 1e-3); setZoom(n != null ? n : ZOOM_MAX); }
    else { const n = ZOOM_STEPS.slice().reverse().find(s => s < zoomLevel - 1e-3); setZoom(n != null ? n : ZOOM_MIN); }
  }
  // refit on new render when in fit mode (hoisted; callable from renderPreview above)
  function fitPreviewIfFit() { if (zoomMode === 'fit') fitToWidth(); }

  if (dom.zoomInBtn) dom.zoomInBtn.addEventListener('click', () => zoomStep(1));
  if (dom.zoomOutBtn) dom.zoomOutBtn.addEventListener('click', () => zoomStep(-1));
  if (dom.zoomValue) dom.zoomValue.addEventListener('click', () => fitToWidth()); // % readout doubles as Fit
  window.addEventListener('resize', () => { if (zoomMode === 'fit') fitToWidth(); });

  // --- Device pod (Slice 2.1) — conceal/expand picker; replaces the inline Desktop/Mobile toolbar buttons ---
  function setDevice(d) {
    const dev = DEVICES[d] ? d : 'laptop';
    currentDevice = dev;
    const { w, h } = DEVICES[dev];
    if (dom.preview) {
      dom.preview.style.width = w + 'px';
      dom.preview.style.height = h + 'px';
      dom.preview.classList.toggle('framed', dev === 'mobile' || dev === 'tablet');
    }
    if (dom.deviceLabel) dom.deviceLabel.textContent = dev.charAt(0).toUpperCase() + dev.slice(1);
    if (dom.deviceItems) dom.deviceItems.forEach(it => it.classList.toggle('active', it.dataset.device === dev));
    if (zoomMode === 'fit') fitToWidth(); else applyZoom();
  }
  function closeDevicePod() {
    if (dom.devicePod) dom.devicePod.classList.remove('open');
    if (dom.deviceTrigger) dom.deviceTrigger.setAttribute('aria-expanded', 'false');
  }
  if (dom.deviceTrigger) dom.deviceTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = dom.devicePod.classList.toggle('open');
    dom.deviceTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  if (dom.deviceItems) dom.deviceItems.forEach(it => it.addEventListener('click', (e) => {
    e.stopPropagation();
    setDevice(it.dataset.device);
    closeDevicePod();
  }));
  document.addEventListener('click', (e) => { if (dom.devicePod && !dom.devicePod.contains(e.target)) closeDevicePod(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeDevicePod(); closeExportPod(); } });

  // --- Export pod (Slice 3) — download, copy, send-to-desktop, handoff.md ---
  function closeExportPod() {
    if (dom.exportPod) dom.exportPod.classList.remove('open');
    if (dom.exportTrigger) dom.exportTrigger.setAttribute('aria-expanded', 'false');
  }
  if (dom.exportTrigger) dom.exportTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = dom.exportPod.classList.toggle('open');
    dom.exportTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.addEventListener('click', (e) => {
    if (dom.exportPod && !dom.exportPod.contains(e.target)) closeExportPod();
  });

  function showToast(msg) {
    let toast = document.querySelector('.copy-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'copy-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 2000);
  }

  function downloadHTML() {
    if (!lastResult) { addMessage('Nothing to export — generate a UI first.', 'error'); return; }
    const fullDoc = buildFullDoc(lastResult);
    const blob = new Blob([fullDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'webhooks-ui-' + Date.now() + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    showToast('HTML downloaded');
  }

  async function copyHTML() {
    if (!lastResult) { addMessage('Nothing to export — generate a UI first.', 'error'); return; }
    const fullDoc = buildFullDoc(lastResult);
    try {
      await navigator.clipboard.writeText(fullDoc);
      showToast('HTML copied to clipboard');
    } catch (err) {
      addMessage('Copy failed: ' + err.message, 'error');
    }
  }

  function generateHandoff() {
    if (!lastResult) { addMessage('Nothing to export — generate a UI first.', 'error'); return; }
    const data = lastResult;
    const htmlLen = (data.html || '').length;
    const cssLen = (data.css || '').length;
    const jsLen = (data.js || '').length;
    const totalLen = htmlLen + cssLen + jsLen;
    const prompt = lastPrompt || '(not recorded)';
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const model = CONFIG.model || 'unknown';

    let md = '# Implementation Handoff\n\n';
    md += '> Auto-generated by dipdesigns.app Export · ' + now + '\n';
    md += '> Model: `' + model + '`\n\n';
    md += '## Source Prompt\n\n';
    md += '```\n' + prompt + '\n```\n\n';
    md += '## Generated Output Summary\n\n';
    md += '| Component | Size |\n';
    md += '|-----------|------|\n';
    md += '| HTML      | ' + htmlLen + ' chars |\n';
    md += '| CSS       | ' + cssLen + ' chars |\n';
    md += '| JS        | ' + jsLen + ' chars |\n';
    md += '| **Total** | **' + totalLen + ' chars** |\n\n';
    md += '## Architecture\n\n';
    md += '- **Rendering**: Client-side blob URL → sandboxed iframe\n';
    md += '- **Self-healing**: Up to ' + MAX_REPAIRS + ' auto-repair attempts on runtime errors\n';
    md += '- **Design system**: Copper/patina tokens (see DESIGN/ packages)\n';
    md += '- **SkillChain**: architect → styler → engineer (3-step pipeline)\n\n';
    md += '## Integration Instructions\n\n';
    md += '### Option A — Standalone HTML file\n\n';
    md += 'Save the downloaded HTML file as-is. Self-contained with inline CSS and JS.\n\n';
    md += '```bash\npython3 -m http.server 8080\n# Open http://localhost:8080/webhooks-ui.html\n```\n\n';
    md += '### Option B — Extract into a project\n\n';
    md += '```\nproject/\n├── index.html    # HTML block below\n├── styles.css    # CSS block below\n└── app.js        # JS block below\n```\n\n';
    md += '### Option C — Embed in existing app\n\n';
    md += 'Use as an iframe embed or extract components into your framework.\n\n';
    md += '---\n\n';
    md += '## Generated HTML\n\n';
    md += '```html\n' + (data.html || '') + '\n```\n\n';
    md += '## Generated CSS\n\n';
    md += '```css\n' + (data.css || '') + '\n```\n\n';
    md += '## Generated JS\n\n';
    md += '```javascript\n' + (data.js || '') + '\n```\n\n';
    md += '---\n\n';
    md += '*Generated by [workers.dipdesigns.app](https://dipdesigns.app) — the AI design studio.*\n';

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HANDOFF-' + Date.now() + '.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    showToast('Handoff.md downloaded');
  }

  const EXPORT_ACTIONS = {
    download: downloadHTML,
    copy: copyHTML,
    desktop: sendToDesktop,
    handoff: generateHandoff,
  };

  if (dom.exportItems) dom.exportItems.forEach(it => it.addEventListener('click', (e) => {
    e.stopPropagation();
    const action = it.dataset.action;
    if (EXPORT_ACTIONS[action]) EXPORT_ACTIONS[action]();
    closeExportPod();
  }));

  dom.clearBtn.addEventListener('click', () => {
    dom.preview.src = 'about:blank';
    lastResult = null;
    lastPrompt = '';
    repairCount = 0;
    const btn = document.getElementById('sendDesktopBtn');
    if (btn) btn.style.display = 'none';
  });

  async function sendToDesktop() {
    if (!lastResult) {
      addMessage('Nothing to send — generate a UI first.', 'error');
      return;
    }
    if (!desktopURL) {
      addMessage('Set the desktop IP first: DipDesigns.setDesktopIP("192.168.x.x")', 'error');
      return;
    }
    if (!desktopKey) {
      addMessage('Set your desktop key first: DipDesigns.setDesktopKey("<key printed by receiver.js>")', 'error');
      return;
    }
    const fullDoc = buildFullDoc(lastResult);
    const msg = addMessage('Sending to desktop…', 'typing');
    try {
      const res = await fetch(desktopURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': desktopKey,
        },
        body: JSON.stringify({
          filename: 'webhooks-ui.html',
          content: fullDoc,
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      removeTyping();
      addMessage('Sent to desktop! Open webhooks-ui.html on your laptop.', 'assistant');
    } catch (err) {
      removeTyping();
      addMessage('Desktop send failed: ' + err.message, 'error');
    }
  }

  async function createWebhookEndpoint(description) {
    if (!CONFIG.apiKey) {
      addMessage('API key not set.', 'error');
      return;
    }
    const msgEl = addMessage('Designing webhook endpoint…', 'typing');
    try {
      const config = await callGemma([
        { role: 'system', content: SKILLS.webhooker.system },
        { role: 'user', content: description },
      ]);
      removeTyping();
      const text = 'Webhook endpoint suggested:\n' +
        'Endpoint: ' + config.endpoint + '\n' +
        'Method: ' + config.method + '\n' +
        'Description: ' + config.description + '\n' +
        'Payload: ' + JSON.stringify(config.payload, null, 2) + '\n' +
        'Response: ' + config.response;
      addMessage(text, 'assistant');
      return config;
    } catch (err) {
      removeTyping();
      addMessage('Webhooker error: ' + err.message, 'error');
    }
  }

  window.addEventListener('message', async (event) => {
    if (event.data.type === 'IFRAME_RUNTIME_ERROR') {
      if (!lastResult || repairCount >= MAX_REPAIRS) {
        console.warn('Self-healing skipped (no result or max repairs reached)');
        return;
      }
      repairCount++;
      console.warn('Self-healing attempt ' + repairCount + '/' + MAX_REPAIRS + ' for:', event.data.error);
      try {
        abortController = new AbortController();
        const fixed = await skillDebugger(lastPrompt, lastResult, event.data, abortController.signal);
        removeTyping();
        lastResult = fixed;
        renderPreview(fixed);
        pushState(fixed, lastPrompt);
        addMessage('Self-healed! Bug fixed (attempt ' + repairCount + '/' + MAX_REPAIRS + ').', 'assistant');
      } catch (err) {
        removeTyping();
        if (err.name !== 'AbortError') {
          addMessage('Self-heal failed: ' + err.message, 'error');
        }
      } finally {
        abortController = null;
      }
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    const desktopBtn = document.getElementById('sendDesktopBtn');
    if (desktopBtn) {
      desktopBtn.addEventListener('click', sendToDesktop);
      desktopBtn.style.display = 'none';
    }
    const whBtn = document.getElementById('webhookerBtn');
    if (whBtn) {
      whBtn.style.display = 'inline-flex';
      whBtn.addEventListener('click', () => {
        const prompt = dom.promptInput.value.trim();
        if (prompt) {
          createWebhookEndpoint(prompt);
        } else {
          addMessage('Describe what you want the webhook to do in the chat input first.', 'error');
        }
      });
    }

    document.querySelectorAll('header nav button').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    const searchInput = document.getElementById('librarySearch');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const activeCat = document.querySelector('#categoryFilters .active');
        renderLibrary(activeCat ? activeCat.dataset.cat : '', searchInput.value);
      });
    }

    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', showKeyModal);
    }

    const configBtn = document.getElementById('configBtn');
    if (configBtn) {
      configBtn.addEventListener('click', showKeyModal);
    }

    const saveConnBtn = document.getElementById('saveConnBtn');
    if (saveConnBtn) saveConnBtn.addEventListener('click', saveConnectionsFromModal);
    const tryFreeBtn = document.getElementById('tryFreeBtn');
    if (tryFreeBtn) tryFreeBtn.addEventListener('click', () => {
      hideKeyModal();
      addMessage('✨ Free mode — you have ' + getFreeRemaining() + ' free generations. Type a prompt to start.', 'assistant');
      if (dom.promptInput) dom.promptInput.focus();
    });

    const appApiBtn = document.getElementById('appApiBtn');
    if (appApiBtn) {
      appApiBtn.addEventListener('click', showKeyModal);
    }

    const docsApiBtn = document.getElementById('docsApiBtn');
    if (docsApiBtn) {
      docsApiBtn.addEventListener('click', showKeyModal);
    }

    const keyInput = document.getElementById('keyInput');
    const validateBtn = document.getElementById('keyValidateBtn');
    const skipBtn = document.getElementById('keySkipBtn');
    const feedback = document.getElementById('keyFeedback');

    if (validateBtn && keyInput) {
      validateBtn.addEventListener('click', async () => {
        const key = keyInput.value.trim();
        if (!key) {
          feedback.className = 'key-error';
          feedback.textContent = 'Enter your OpenRouter API key.';
          return;
        }
        validateBtn.disabled = true;
        validateBtn.textContent = 'Validating...';
        feedback.className = '';
        feedback.textContent = '';
        try {
          const info = await validateApiKey(key);
          saveApiKey(key);
          const label = info.label || info.name || 'OpenRouter';
          feedback.className = 'key-success';
          feedback.textContent = 'Connected as ' + label + (key.startsWith('wek_') ? '. Model selector available.' : '.');
          if (key.startsWith('wek_') || key.startsWith('sk-or-')) {
            populateModelSelector();
          }
          setTimeout(hideKeyModal, 1500);
        } catch (err) {
          feedback.className = 'key-error';
          feedback.textContent = err.message;
        } finally {
          validateBtn.disabled = false;
          validateBtn.textContent = 'Validate & Save';
        }
      });
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        hideKeyModal();
        updateStatus('disconnected');
      });
    }

    keyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') validateBtn.click();
    });

    const buyTest = document.getElementById('buyTestBtn');
    if (buyTest) buyTest.addEventListener('click', () => buyCredits('pack_test'));
    const buySmall = document.getElementById('buySmallBtn');
    if (buySmall) buySmall.addEventListener('click', () => buyCredits('pack_small'));
    const buyLarge = document.getElementById('buyLargeBtn');
    if (buyLarge) buyLarge.addEventListener('click', () => buyCredits('pack_large'));
    const subBtn = document.getElementById('subProBtn');
    if (subBtn) subBtn.addEventListener('click', () => buyCredits('sub_pro'));

    const pricingFree = document.getElementById('pricingFreeBtn');
    if (pricingFree) pricingFree.addEventListener('click', () => { hideKeyModal(); switchView('view-app'); dom.promptInput?.focus(); });
    const pricingTest = document.getElementById('pricingTestBtn');
    if (pricingTest) pricingTest.addEventListener('click', () => buyCredits('pack_test'));
    const pricingSmall = document.getElementById('pricingSmallBtn');
    if (pricingSmall) pricingSmall.addEventListener('click', () => buyCredits('pack_small'));
    const pricingPro = document.getElementById('pricingProBtn');
    if (pricingPro) pricingPro.addEventListener('click', () => buyCredits('sub_pro'));

    // Load credit balance into the pricing page bar
    refreshPricingCreditBar();

    // Header sign-in buttons (GitHub / Google) — surfaced in the top bar.
    const ghBtn = document.getElementById('signinGithubBtn');
    if (ghBtn) ghBtn.addEventListener('click', () => startOAuth('github'));
    const goBtn = document.getElementById('signinGoogleBtn');
    if (goBtn) goBtn.addEventListener('click', () => startOAuth('google'));

    if (window.location.search.includes('checkout=success')) {
      setTimeout(() => { showKeyModal(); refreshCreditStatus(); }, 500);
    }

    // Worker URL: prefer a saved value, else auto-detect (the Worker serves this page).
    const savedWorker = localStorage.getItem('webhooks_email_worker');
    if (savedWorker) {
      setWorkerURL(savedWorker);
    } else {
      CONFIG.workerURL = detectWorkerURL();
      connectStream();
    }

    // OAuth return (?auth=wek_...): capture the key before the normal key load.
    const cameFromOAuth = handleAuthRedirect();
    if (!cameFromOAuth && loadApiKey()) {
      updateStatus('connected');
    }

    const savedDesktopKey = localStorage.getItem('webhooks_email_desktop_key');
    if (savedDesktopKey) desktopKey = savedDesktopKey;
    const savedIp = localStorage.getItem('webhooks_email_desktop_ip');
    if (savedIp) setDesktopIP(savedIp);
    refreshFreeStatus();
    refreshAuthUI();
  });

  window.DipDesigns = {
    setApiKey,
    setBaseURL,
    setProxyEndpoint,
    setWorkerURL,
    startOAuth,
    setDesktopIP,
    setDesktopKey,
    setFreeRemaining,
    getFreeRemaining,
    setModel,
    getSelectedModel,
    sendPrompt,
    sendToDesktop,
    downloadHTML,
    copyHTML,
    generateHandoff,
    createWebhookEndpoint,
    pushState,
    hydrateState,
    connectStream,
    disconnectStream,
    validateApiKey,
    loadApiKey,
    saveApiKey,
    clearApiKey,
    showKeyModal,
    hideKeyModal,
    switchView,
    renderLibrary,
    showAddSkill,
    getAllSkills: () => getAllSkills(),
    getBuiltinSkills: () => BUILTIN_SKILLS,
    getUserSkills: () => getUserSkills(),
    _useSkill: (id) => {
      const all = getAllSkills();
      const skill = all.find(s => s.id === id);
      if (skill) {
        switchView('app');
        dom.promptInput.value = skill.prompt;
        dom.promptInput.style.height = 'auto';
        dom.promptInput.focus();
        sendPrompt(skill.prompt);
      }
    },
    _removeSkill: (id) => {
      removeUserSkill(id);
      renderLibrary('', document.getElementById('librarySearch')?.value || '');
    },
    getLastResult: () => lastResult,
    getModels: () => MODELS,
    getSkills: () => Object.keys(SKILLS),
  };
})();

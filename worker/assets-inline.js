
const ASSETS = {};

ASSETS["client.js"] = {
  contentType: "application/javascript",
  content: `(function () {
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
    workerURL: 'https://jump-studio.logiclemonai.workers.dev',
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
      system: \`You are a software architect. Analyze the user's UI request and output ONLY valid JSON with NO markdown fences or extra text.

The JSON must have this exact structure:
{
  "title": "brief app title",
  "state": { "variableName": "type-or-description" },
  "components": ["list of UI components needed"],
  "layout": "description of layout structure",
  "theme": "dark/light/minimalist/etc",
  "interactions": ["key user interactions"]
}

Describe what data the app manages, what components it needs, and how they connect. Be specific but concise.\`
    },
    styler: {
      system: \`You are a UI designer. Given a user request and an application blueprint, output ONLY valid JSON with NO markdown fences or extra text.

The JSON must have this exact structure:
{
  "html": "<string>",
  "css": "<string>"
}

Create a clean, responsive UI using semantic HTML5 and modern CSS (flexbox, grid, custom properties). Add id and class attributes for JS hooks. Do NOT include any JavaScript. Match the theme and layout from the blueprint.\`
    },
    engineer: {
      system: \`You are a frontend engineer. Given an existing HTML/CSS layout and an application blueprint, output ONLY valid JSON with NO markdown fences or extra text.

The JSON must have this exact structure:
{
  "js": "<string>"
}

Write vanilla JavaScript that adds interactivity to the existing HTML elements. Reference elements by their existing IDs and classes. Do NOT modify HTML or CSS — only add behavior. Handle events, update DOM, and manage state as described in the blueprint.\`
    },
    debugger: {
      system: \`You are a debugger. A user's generated UI has a runtime error. Given the original user intent, the current code, and the error details, fix the bug and output the COMPLETE corrected code as valid JSON with NO markdown fences or extra text.

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
- Event listener binding\`
    },
    webhooker: {
      system: \`You are a webhook configuration assistant. Given a user's description of what they want to connect or sync, output ONLY valid JSON with NO markdown fences or extra text.

The JSON must have this exact structure:
{
  "endpoint": "suggested path (e.g., /api/webhook/sync)",
  "method": "POST",
  "payload": { "key": "description of value" },
  "description": "what this endpoint does",
  "response": "what the webhook returns"
}

Suggest practical webhook endpoints that integrate with the Cloudflare Worker and desktop receiver.\`
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
        (isUser ? '<button class="use-btn" style="margin-right:6px;background:var(--error)" onclick="DipDesigns._removeSkill(\\'' + s.id + '\\')">X</button>' : '') +
        '<button class="use-btn" onclick="DipDesigns._useSkill(\\'' + s.id + '\\')">Use Skill</button>' +
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
      const res = await fetch(proxyURL.replace(/\\/+$/, '') + '/api/validate-key', {
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
    CONFIG.workerURL = (url || '').replace(/\\/+$/, '');
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
    const saved = (localStorage.getItem('webhooks_email_worker') || '').replace(/\\/+$/, '');
    if (saved) return saved;
    const origin = window.location.origin || '';
    // In production the Worker serves this page, so same-origin IS the Worker.
    // Fall back to the configured default for local dev (file://, localhost).
    if (/^https?:\\/\\//.test(origin) && !/(localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0)/.test(origin)) {
      return origin.replace(/\\/+$/, '');
    }
    return (CONFIG.workerURL || '').replace(/\\/+$/, '');
  }

  function workerBase() {
    return (CONFIG.workerURL || detectWorkerURL() || '').replace(/\\/+$/, '');
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
    desktopURL = desktopURL.replace(/\\/+$/, '') + ':3000';
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
    const telemetry = \`
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
<\\/script>\`;
    return fullDoc.replace('</body>', telemetry + '\\n</body>');
  }

  function buildFullDoc(data) {
    const html = data.html || '';
    const css = data.css || '';
    const js = data.js || '';
    return '<!DOCTYPE html>\\n<html lang="en">\\n<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>' + css + '</style></head>\\n<body>' + html + '\\n<script>' + js + '<\\/script>\\n</body>\\n</html>';
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
      const match = content.match(/\\{[\\s\\S]*\\}/);
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
    const base = (workerURL || CONFIG.proxyEndpoint || '').replace(/\\/+$/, '');
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
      const res = await fetch(workerURL.replace(/\\/+$/, '') + '/api/balance', {
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
      const res = await fetch(workerURL.replace(/\\/+$/, '') + '/api/balance', {
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
      const res = await fetch(workerURL.replace(/\\/+$/, '') + '/api/checkout', {
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
      const res = await fetch(CONFIG.proxyEndpoint.replace(/\\/+$/, '') + '/api/generate', {
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
      { role: 'user', content: 'User request: ' + prompt + '\\n\\nApplication blueprint:\\n' + JSON.stringify(blueprint, null, 2) },
    ], { signal });
  }

  async function skillEngineer(uiShell, blueprint, signal) {
    showStatus('Adding interactivity...');
    return callGemma([
      { role: 'system', content: SKILLS.engineer.system },
      { role: 'user', content: 'HTML layout:\\n' + (uiShell.html || '') + '\\n\\nCSS:\\n' + (uiShell.css || '') + '\\n\\nApplication blueprint:\\n' + JSON.stringify(blueprint, null, 2) },
    ], { signal });
  }

  async function skillDebugger(originalPrompt, brokenData, errorInfo, signal) {
    showStatus('Self-healing: fixing runtime error...');
    const currentCode = buildFullDoc(brokenData);
    return callGemma([
      { role: 'system', content: SKILLS.debugger.system },
      { role: 'user', content: 'Original user intent:\\n' + originalPrompt + '\\n\\nCurrent code:\\n' + currentCode + '\\n\\nRuntime error:\\n' + errorInfo.error + '\\nLine: ' + errorInfo.line + ' Column: ' + errorInfo.col + '\\n\\nFix the bug and return the complete corrected HTML, CSS, and JS.' },
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

  // --- Preview zoom (Slice 2) — always-visible compact control, pure CSS \`zoom\`, no deps ---
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

    let md = '# Implementation Handoff\\n\\n';
    md += '> Auto-generated by dipdesigns.app Export · ' + now + '\\n';
    md += '> Model: \`' + model + '\`\\n\\n';
    md += '## Source Prompt\\n\\n';
    md += '\`\`\`\\n' + prompt + '\\n\`\`\`\\n\\n';
    md += '## Generated Output Summary\\n\\n';
    md += '| Component | Size |\\n';
    md += '|-----------|------|\\n';
    md += '| HTML      | ' + htmlLen + ' chars |\\n';
    md += '| CSS       | ' + cssLen + ' chars |\\n';
    md += '| JS        | ' + jsLen + ' chars |\\n';
    md += '| **Total** | **' + totalLen + ' chars** |\\n\\n';
    md += '## Architecture\\n\\n';
    md += '- **Rendering**: Client-side blob URL → sandboxed iframe\\n';
    md += '- **Self-healing**: Up to ' + MAX_REPAIRS + ' auto-repair attempts on runtime errors\\n';
    md += '- **Design system**: Copper/patina tokens (see DESIGN/ packages)\\n';
    md += '- **SkillChain**: architect → styler → engineer (3-step pipeline)\\n\\n';
    md += '## Integration Instructions\\n\\n';
    md += '### Option A — Standalone HTML file\\n\\n';
    md += 'Save the downloaded HTML file as-is. Self-contained with inline CSS and JS.\\n\\n';
    md += '\`\`\`bash\\npython3 -m http.server 8080\\n# Open http://localhost:8080/webhooks-ui.html\\n\`\`\`\\n\\n';
    md += '### Option B — Extract into a project\\n\\n';
    md += '\`\`\`\\nproject/\\n├── index.html    # HTML block below\\n├── styles.css    # CSS block below\\n└── app.js        # JS block below\\n\`\`\`\\n\\n';
    md += '### Option C — Embed in existing app\\n\\n';
    md += 'Use as an iframe embed or extract components into your framework.\\n\\n';
    md += '---\\n\\n';
    md += '## Generated HTML\\n\\n';
    md += '\`\`\`html\\n' + (data.html || '') + '\\n\`\`\`\\n\\n';
    md += '## Generated CSS\\n\\n';
    md += '\`\`\`css\\n' + (data.css || '') + '\\n\`\`\`\\n\\n';
    md += '## Generated JS\\n\\n';
    md += '\`\`\`javascript\\n' + (data.js || '') + '\\n\`\`\`\\n\\n';
    md += '---\\n\\n';
    md += '*Generated by [dipdesigns.app](https://dipdesigns.app) — the AI design studio.*\\n';

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
      const text = 'Webhook endpoint suggested:\\n' +
        'Endpoint: ' + config.endpoint + '\\n' +
        'Method: ' + config.method + '\\n' +
        'Description: ' + config.description + '\\n' +
        'Payload: ' + JSON.stringify(config.payload, null, 2) + '\\n' +
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
`,
};

ASSETS["dashboard.html"] = {
  contentType: "text/html",
  content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flash Dashboard — LogicLemonAI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
/* ============================================================================
   GLAZIER KIT · tokens.css   (v2 — hardened)
   Single source of truth. Pure CSS custom properties. No build, no dependency.
   v2 changes: added pre-alpha'd glass tokens so glazier.css needs NO color-mix().
   ============================================================================ */

:root {
  /* ---- Canvas (near-black → black) ---- */
  --bg-void:        #04060a;
  --bg-base:        #070b12;
  --bg-raise:       #0b111b;

  /* ---- Glazier blue (the glass) ---- */
  --glazier-1:      #16273d;
  --glazier-2:      #0d1726;
  --glazier-edge:   #2f5f86;
  --glazier-deep:   #0a2036;
  /* pre-alpha'd glass fills — replace color-mix() for full browser support */
  --glazier-glass-1: rgba(22, 39, 61, 0.78);   /* = #16273d @ 78% */
  --glazier-glass-2: rgba(13, 23, 38, 0.72);   /* = #0d1726 @ 72% */

  /* ---- Brushed metal (the silver) ---- */
  --metal-hi:       #eef2f6;
  --metal-1:        #d4dbe3;
  --metal-2:        #b9c2cc;
  --metal-3:        #9aa4b1;
  --metal-4:        #7e8a98;
  --metal-lo:       #6c7886;

  /* ---- Electric teal (accent / selection / glow) ---- */
  --teal:           #3fe0d0;
  --teal-bright:    #6bf0e3;
  --teal-ink:       #0a8f81;   /* deepened teal — legible on silver */
  --teal-soft:      rgba(63, 224, 208, 0.45);
  --teal-faint:     rgba(63, 224, 208, 0.14);

  /* ---- Warm accent (sparing counterpoint: red-ish → amber) ---- */
  --ember:          #ff6a3d;   /* red-ish */
  --amber:          #f6a93b;   /* amber */
  --warm-grad:      linear-gradient(135deg, #ff7a4d, #f6a93b);
  --ember-soft:     rgba(255, 106, 61, 0.40);
  --amber-soft:     rgba(246, 169, 59, 0.38);
  --amber-faint:    rgba(246, 169, 59, 0.12);

  /* ---- Text ---- */
  --ink-on-dark:    #e6edf5;
  --ink-on-dark-dim:#9fb0c3;
  --ink-on-metal:   #0a0e14;
  --ink-on-metal-dim:#3a4555;

  /* ---- Hairlines & dividers ---- */
  --line-dark:      rgba(120, 170, 210, 0.16);
  --line-metal:     rgba(255, 255, 255, 0.5);

  /* ---- Blur ---- */
  --blur-glass:     blur(18px) saturate(140%);

  /* ---- Shadows (depth) ---- */
  --shadow-card:    0 24px 60px rgba(0, 0, 0, 0.55);
  --shadow-raise:   0 10px 30px rgba(0, 0, 0, 0.45);
  --inset-glass:    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  --inset-metal:    inset 0 1px 0 rgba(255, 255, 255, 0.85),
                    inset 0 -1px 2px rgba(0, 0, 0, 0.28);

  /* ---- Radii ---- */
  --r-sm: 8px;  --r-md: 14px;  --r-lg: 20px;  --r-pill: 999px;

  /* ---- Spacing scale ---- */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px;
  --sp-5: 24px; --sp-6: 32px; --sp-7: 48px; --sp-8: 64px;

  /* ---- Type ---- */
  --font-ui:   'Outfit', system-ui, -apple-system, sans-serif;
  --font-mono: 'Space Mono', ui-monospace, 'SF Mono', monospace;

  /* ---- Motion ---- */
  --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
  --t-fast: 0.15s;  --t-base: 0.3s;
}

</style>
  <style>
/* ============================================================================
   GLAZIER KIT · glazier.css   (v2 — hardened)
   Hard aesthetics crafted ONCE as classes. Depends only on tokens.css.
   v2 changes:
     • EVERY class is namespaced \`glz-\` → cannot collide with the existing
       copper/patina stylesheet (resolves the .btn / pseudo-element concerns).
     • color-mix() removed → uses pre-alpha'd --glazier-glass-* tokens.
     • .glz-btn defaults to width:auto; use .glz-btn-block for full-width.
   Apply these classes to NEW markup only — never bolt onto already-themed
   elements (keeps ::before/::after exclusively ours).
   ============================================================================ */

*, *::before, *::after { box-sizing: border-box; }

.glz-body {
  margin: 0;
  font-family: var(--font-ui);
  color: var(--ink-on-dark);
  background: var(--bg-void);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* ---- CANVAS ---- */
.glz-canvas {
  position: relative;
  min-height: 100vh;
  background:
    radial-gradient(1100px 600px at 50% -10%, rgba(63, 224, 208, 0.10), transparent 60%),
    radial-gradient(900px 700px at 85% 110%, rgba(36, 75, 110, 0.30), transparent 60%),
    linear-gradient(180deg, var(--bg-base), var(--bg-void));
  overflow: hidden;
}
.glz-canvas::before {
  content: "";
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(120, 170, 210, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 170, 210, 0.05) 1px, transparent 1px);
  background-size: 44px 44px;
  -webkit-mask-image: radial-gradient(circle at 50% 40%, #000 30%, transparent 78%);
  mask-image: radial-gradient(circle at 50% 40%, #000 30%, transparent 78%);
  pointer-events: none;
}

/* ---- SURFACE: GLASS (no color-mix) ---- */
.glz-surface-glass {
  position: relative;
  background: linear-gradient(160deg, var(--glazier-glass-1), var(--glazier-glass-2));
  -webkit-backdrop-filter: var(--blur-glass);
  backdrop-filter: var(--blur-glass);
  border: 1px solid var(--line-dark);
  border-radius: var(--r-lg);
  box-shadow: var(--inset-glass), var(--shadow-card);
}
.glz-surface-glass::after {
  content: "";
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: linear-gradient(180deg, rgba(140, 200, 230, 0.10), transparent 22%);
}

/* ---- SURFACE: METAL (brushed silver) ---- */
.glz-surface-metal {
  position: relative;
  color: var(--ink-on-metal);
  background:
    linear-gradient(176deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 12%),
    repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, rgba(0,0,0,0.04) 1px 3px),
    linear-gradient(145deg, var(--metal-hi) 0%, var(--metal-1) 16%, var(--metal-3) 40%,
      var(--metal-2) 58%, var(--metal-4) 80%, var(--metal-1) 100%);
  border: 1px solid var(--line-metal);
  border-radius: var(--r-lg);
  box-shadow: var(--inset-metal), var(--shadow-raise);
}
.glz-surface-metal::before {
  content: "";
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  opacity: 0.10; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* ---- ACCENT: TEAL ---- */
.glz-glow-teal {
  box-shadow: 0 0 0 1px var(--teal-soft), 0 0 18px rgba(63, 224, 208, 0.30), var(--shadow-raise);
}
.glz-text-teal { color: var(--teal); }
.glz-text-amber { color: var(--amber); }
.glz-glow-amber { box-shadow: 0 0 0 1px var(--amber-soft), 0 0 18px rgba(246,169,59,0.26), var(--shadow-raise); }

/* Brushed-metal button (black text — the readability rule) */
.glz-btn-metal {
  color: var(--ink-on-metal); border: 1px solid var(--line-metal); font-weight: 700;
  background:
    linear-gradient(176deg, rgba(255,255,255,0.60) 0%, rgba(255,255,255,0) 12%),
    linear-gradient(145deg, var(--metal-hi), var(--metal-2) 45%, var(--metal-4) 80%, var(--metal-1));
  box-shadow: var(--inset-metal);
}
.glz-btn-metal:hover { filter: brightness(1.05); transform: translateY(-1px); background:
    linear-gradient(176deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 12%),
    linear-gradient(145deg, var(--metal-hi), var(--metal-1) 45%, var(--metal-3) 80%, var(--metal-hi)); }

/* ---- TEXT-READABLE (black on metal, deep-teal on hover/active) ---- */
.glz-text-readable { color: var(--ink-on-metal); }
.glz-text-readable.glz-dim { color: var(--ink-on-metal-dim); }

.glz-queue-item {
  position: relative;
  display: flex; align-items: center; gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  color: var(--ink-on-metal);
  font-family: var(--font-mono); font-size: 13px;
  border-radius: var(--r-sm); cursor: pointer;
  transition: color var(--t-fast) var(--ease), background var(--t-fast) var(--ease);
}
.glz-queue-item::before {
  content: ""; position: absolute; left: 0; top: 50%; transform: translateY(-50%) scaleY(0);
  width: 3px; height: 64%; border-radius: 2px; background: var(--teal);
  box-shadow: 0 0 10px var(--teal-soft); transition: transform var(--t-fast) var(--ease);
}
.glz-queue-item:hover { color: var(--teal-ink); background: rgba(255, 255, 255, 0.28); }
.glz-queue-item.glz-active { color: var(--teal-ink); background: rgba(63, 224, 208, 0.16); font-weight: 700; }
.glz-queue-item.glz-active::before { transform: translateY(-50%) scaleY(1); }

/* ---- ELECTRIC LINES (the webhook-bridge motif) ---- */
.glz-electric-line { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
.glz-electric-line path {
  fill: none; stroke: var(--teal); stroke-width: 1.4; stroke-dasharray: 5 9;
  filter: drop-shadow(0 0 4px var(--teal-soft)); animation: glz-flow 2.6s linear infinite; opacity: 0.85;
}
.glz-electric-line path.glz-slow { animation-duration: 4.2s; opacity: 0.5; }
@keyframes glz-flow { to { stroke-dashoffset: -56; } }
@media (prefers-reduced-motion: reduce) { .glz-electric-line path { animation: none; } }

.glz-node-dot {
  width: 9px; height: 9px; border-radius: 50%; background: var(--teal);
  box-shadow: 0 0 0 4px var(--teal-faint), 0 0 14px var(--teal-soft);
}

/* ---- CONTROLS ---- */
.glz-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--sp-3);
  width: auto;                       /* v2: was 100% — full-width is opt-in now */
  padding: 13px 18px;
  font-family: var(--font-ui); font-size: 14px; font-weight: 600;
  border-radius: var(--r-md); cursor: pointer;
  border: 1px solid var(--line-dark); color: var(--ink-on-dark);
  background: rgba(255, 255, 255, 0.04); transition: all var(--t-base) var(--ease);
}
.glz-btn:hover { border-color: var(--teal-soft); background: rgba(63, 224, 208, 0.08); transform: translateY(-1px); }
.glz-btn svg { width: 18px; height: 18px; }
.glz-btn-block { width: 100%; }       /* opt-in full width (used by stacked auth buttons) */
.glz-btn-primary {
  border: none; color: #04201d; font-weight: 700;
  background: linear-gradient(135deg, var(--teal-bright), var(--teal));
  box-shadow: 0 0 22px rgba(63, 224, 208, 0.35);
}
.glz-btn-primary:hover { filter: brightness(1.06); transform: translateY(-1px); }

.glz-field {
  width: 100%; padding: 13px 16px;
  font-family: var(--font-mono); font-size: 13px; color: var(--ink-on-dark);
  background: rgba(4, 8, 14, 0.55); border: 1px solid var(--line-dark);
  border-radius: var(--r-md); transition: all var(--t-base) var(--ease);
}
.glz-field::placeholder { color: var(--ink-on-dark-dim); }
.glz-field:focus { outline: none; border-color: var(--teal); box-shadow: 0 0 0 3px var(--teal-faint); }

.glz-divider { display: flex; align-items: center; gap: var(--sp-4); color: var(--ink-on-dark-dim);
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 1px; }
.glz-divider::before, .glz-divider::after { content: ""; flex: 1; height: 1px; background: var(--line-dark); }
.glz-label-mono { font-family: var(--font-mono); font-size: 11px; letter-spacing: 2px;
  text-transform: uppercase; color: var(--ink-on-dark-dim); }

</style>
  <style>
  body{overflow:hidden;}
  .bg{position:fixed;inset:0;z-index:0;pointer-events:none;
    background:radial-gradient(1000px 560px at 50% -12%,rgba(63,224,208,.08),transparent 60%),
    radial-gradient(720px 640px at 92% 4%,rgba(246,169,59,.06),transparent 58%),
    radial-gradient(820px 700px at 6% 112%,rgba(36,75,110,.26),transparent 60%),
    linear-gradient(180deg,var(--bg-base),var(--bg-void));}
  .app{position:relative;z-index:1;height:100vh;display:flex;flex-direction:column;}

  /* top bar */
  .topbar{display:flex;align-items:center;gap:14px;padding:14px 20px;border-bottom:1px solid var(--line-dark);}
  .brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:15px;letter-spacing:-.3px;}
  .brand .badge{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;}
  .brand .badge .glz-node-dot{width:7px;height:7px;}
  .topbar .sep{width:1px;height:20px;background:var(--line-dark);}
  .topbar .title{font-family:var(--font-mono);font-size:12px;letter-spacing:2px;color:var(--ink-on-dark-dim);text-transform:uppercase;}
  .topbar .right{margin-left:auto;display:flex;align-items:center;gap:12px;}
  .status{display:inline-flex;align-items:center;gap:7px;font-family:var(--font-mono);font-size:11px;color:var(--ink-on-dark-dim);}
  .status i{width:6px;height:6px;border-radius:50%;background:var(--teal);box-shadow:0 0 8px var(--teal-soft);}

  /* 3-column body */
  .grid{flex:1;display:grid;grid-template-columns:212px 1fr 392px;gap:14px;padding:14px 20px 20px;min-height:0;}
  .col-head{display:flex;align-items:center;gap:10px;font-family:var(--font-mono);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--ink-on-dark-dim);margin:2px 4px 12px;}
  .col-head .ct{margin-left:auto;color:var(--teal);}

  /* left rail */
  .rail{padding:16px 12px;display:flex;flex-direction:column;gap:4px;}
  .rail .navi{display:flex;align-items:center;gap:11px;padding:10px 12px;border-radius:10px;color:var(--ink-on-dark-dim);font-size:13.5px;cursor:pointer;transition:all var(--t-fast) var(--ease);}
  .rail .navi:hover{background:rgba(255,255,255,.04);color:var(--ink-on-dark);}
  .rail .navi.on{background:rgba(63,224,208,.12);color:var(--teal);font-weight:600;}
  .rail .navi .g{width:18px;text-align:center;opacity:.85;}
  .rail .spacer{flex:1;}
  .rail .acct{display:flex;align-items:center;gap:10px;padding:10px 12px;border-top:1px solid var(--line-dark);margin-top:8px;font-size:12px;color:var(--ink-on-dark-dim);}
  .rail .acct .av{width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,var(--teal),var(--glazier-edge));}

  /* center: signal stream (metallic queue) */
  .stream{display:flex;flex-direction:column;min-height:0;}
  .queue{flex:1;overflow:auto;padding:8px;display:flex;flex-direction:column;gap:3px;}
  .sig{align-items:center;}
  .sig .src{width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:rgba(10,14,20,.14);font-size:13px;flex-shrink:0;}
  .sig .body{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;}
  .sig .ttl{font-family:var(--font-ui);font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .sig .meta{font-size:10.5px;opacity:.7;}
  .sig .tm{font-size:10px;opacity:.6;flex-shrink:0;}
  .st{font-family:var(--font-mono);font-size:8.5px;font-weight:700;padding:2px 7px;border-radius:999px;letter-spacing:.5px;flex-shrink:0;}
  .st.ok{background:rgba(63,224,208,.20);color:#075e55;border:1px solid var(--teal-soft);}
  .st.new{background:rgba(246,169,59,.24);color:#6e4a0f;border:1px solid var(--amber-soft);}
  .st.err{background:rgba(255,106,61,.20);color:#7a2613;border:1px solid var(--ember-soft);}

  /* right: payload inspector */
  .inspector{display:flex;flex-direction:column;padding:16px;min-height:0;}
  .insp-meta{display:flex;flex-direction:column;gap:4px;padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid var(--line-dark);}
  .insp-meta h3{margin:0;font-size:16px;font-weight:700;}
  .insp-meta .row{display:flex;gap:8px;align-items:center;font-family:var(--font-mono);font-size:11px;color:var(--ink-on-dark-dim);}
  .insp-json{flex:1;overflow:auto;margin:0;background:rgba(4,8,14,.55);border:1px solid var(--line-dark);border-radius:12px;padding:14px;font-family:var(--font-mono);font-size:12px;line-height:1.55;color:var(--ink-on-dark);white-space:pre;}
  .insp-json .k{color:var(--teal);} .insp-json .s{color:var(--amber);} .insp-json .n{color:var(--teal-bright);}
  .insp-actions{display:flex;gap:10px;margin-top:14px;}
  .insp-actions .glz-btn{flex:1;}

  @media(max-width:1024px){ .grid{grid-template-columns:1fr 1fr;} .rail{display:none;} }
  @media(max-width:720px){ .grid{grid-template-columns:1fr;} .inspector{display:none;} body{overflow:auto;} .app{height:auto;min-height:100vh;} .queue{max-height:none;} }
  </style>
</head>
<body class="glz-body">
  <div class="bg"></div>
  <div class="app">

    <header class="topbar">
      <div class="brand"><span class="badge glz-surface-metal"><span class="glz-node-dot"></span></span> LogicLemonAI</div>
      <span class="sep"></span>
      <span class="title">Flash Dashboard</span>
      <div class="right">
        <span class="status"><i></i> Bridge live</span>
        <span class="status" style="color:var(--amber)"><i style="background:var(--amber);box-shadow:0 0 8px var(--amber-soft)"></i> 2 new</span>
      </div>
    </header>

    <div class="grid">

      <!-- left rail -->
      <aside class="rail glz-surface-glass">
        <div class="navi on"><span class="g">⇲</span> Inbox</div>
        <div class="navi"><span class="g">▤</span> Projects</div>
        <div class="navi"><span class="g">⛓</span> Skills</div>
        <div class="navi"><span class="g">◷</span> History</div>
        <div class="navi"><span class="g">⚙</span> Settings</div>
        <div class="spacer"></div>
        <div class="acct"><span class="av"></span> <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="6811071d281b1c1d0c0107460c0d1e">[email&#160;protected]</a></div>
      </aside>

      <!-- center: signal stream -->
      <section class="stream">
        <div class="col-head">Signal Stream <span class="ct" id="sigCount">6</span></div>
        <div class="queue glz-surface-metal" id="queue"><!-- rows injected --></div>
      </section>

      <!-- right: payload inspector -->
      <section class="inspector glz-surface-glass">
        <div class="col-head">Payload Inspector</div>
        <div class="insp-meta">
          <h3 id="ispTitle">—</h3>
          <div class="row"><span id="ispSrc">—</span> · <span id="ispWhen">—</span></div>
        </div>
        <pre class="insp-json" id="ispJson">{ }</pre>
        <div class="insp-actions">
          <button class="glz-btn glz-btn-primary" id="openStudio">Open in Studio</button>
          <button class="glz-btn glz-btn-metal" id="sendDesk">Send to desktop</button>
        </div>
      </section>

    </div>
  </div>

  <script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script><script>
  // Mock bridge inbox — replace with live SSE from the Worker (SESSION_HUB) later.
  var SIGNALS = [
    { id:'s1', src:'📱', kind:'phone',   title:'pricing page — 3 tiers, dark', status:'ok',  when:'2m ago',
      payload:{ source:'phone', prompt:'a pricing page with 3 tiers, dark, teal accents', model:'gemma-4-26b', status:'rendered', files:['index.html','styles.css','app.js'], bytes:6481 } },
    { id:'s2', src:'✉', kind:'email',   title:'dashboard@ → analytics layout', status:'new', when:'12m ago',
      payload:{ source:'email', from:'dashboard@logiclemonai.com', subject:'analytics layout', prompt:'analytics dashboard with sidebar + 4 stat cards + line chart', status:'queued' } },
    { id:'s3', src:'⇋', kind:'webhook', title:'stripe.event → receipt UI', status:'ok',  when:'1h ago',
      payload:{ source:'webhook', endpoint:'/api/webhook', event:'invoice.paid', prompt:'a clean receipt UI from this payload', status:'rendered', files:['index.html','styles.css'] } },
    { id:'s4', src:'📱', kind:'phone',   title:'kanban board, 3 columns', status:'err', when:'3h ago',
      payload:{ source:'phone', prompt:'a kanban board with three columns and draggable cards', status:'failed', error:'drag handler referenced undefined #board', repair_attempts:3 } },
    { id:'s5', src:'⇋', kind:'webhook', title:'github.push → changelog page', status:'ok', when:'5h ago',
      payload:{ source:'webhook', endpoint:'/api/webhook', event:'github.push', commits:7, prompt:'a changelog page from these commits', status:'rendered' } },
    { id:'s6', src:'✉', kind:'email',   title:'signup form, glassy', status:'new', when:'1d ago',
      payload:{ source:'email', from:'me@studio.dev', subject:'signup form', prompt:'a glassy signup form, dark, with GitHub + Google', status:'queued' } }
  ];

  function jsonHL(obj){
    var s = JSON.stringify(obj, null, 2);
    s = s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
    s = s.replace(/"([^"]+)":/g, '"<span class="k">$1</span>":');
    s = s.replace(/: "([^"]*)"/g, ': "<span class="s">$1</span>"');
    s = s.replace(/: (\\d+)/g, ': <span class="n">$1</span>');
    return s;
  }
  function render(){
    var q = document.getElementById('queue');
    q.innerHTML = SIGNALS.map(function(x){
      return '<div class="glz-queue-item sig" data-id="'+x.id+'">'+
        '<span class="src">'+x.src+'</span>'+
        '<span class="body"><span class="ttl">'+x.title+'</span>'+
        '<span class="meta">'+x.kind+'</span></span>'+
        '<span class="st '+x.status+'">'+({ok:'RENDERED',new:'NEW',err:'FAILED'}[x.status])+'</span>'+
        '<span class="tm">'+x.when+'</span></div>';
    }).join('');
    q.querySelectorAll('.glz-queue-item').forEach(function(el){
      el.addEventListener('click', function(){ select(el.dataset.id); });
    });
    document.getElementById('sigCount').textContent = SIGNALS.length;
  }
  function select(id){
    var x = SIGNALS.find(function(s){ return s.id===id; });
    if(!x) return;
    document.querySelectorAll('.glz-queue-item').forEach(function(el){ el.classList.toggle('glz-active', el.dataset.id===id); });
    document.getElementById('ispTitle').textContent = x.title;
    document.getElementById('ispSrc').textContent = x.kind;
    document.getElementById('ispWhen').textContent = x.when;
    document.getElementById('ispJson').innerHTML = jsonHL(x.payload);
  }
  document.getElementById('openStudio').onclick = function(){ window.location.href = '/index.html'; };
  document.getElementById('sendDesk').onclick   = function(){ alert('Send to desktop — wires to receiver.js (localhost:3000) in the studio.'); };
  render(); select('s1');
  </script>
</body>
</html>
`,
};

ASSETS["glazier.css"] = {
  contentType: "text/css",
  content: `/* ============================================================================
   GLAZIER KIT · glazier.css   (v2 — hardened)
   Hard aesthetics crafted ONCE as classes. Depends only on tokens.css.
   v2 changes:
     • EVERY class is namespaced \`glz-\` → cannot collide with the existing
       copper/patina stylesheet (resolves the .btn / pseudo-element concerns).
     • color-mix() removed → uses pre-alpha'd --glazier-glass-* tokens.
     • .glz-btn defaults to width:auto; use .glz-btn-block for full-width.
   Apply these classes to NEW markup only — never bolt onto already-themed
   elements (keeps ::before/::after exclusively ours).
   ============================================================================ */

*, *::before, *::after { box-sizing: border-box; }

.glz-body {
  margin: 0;
  font-family: var(--font-ui);
  color: var(--ink-on-dark);
  background: var(--bg-void);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* ---- CANVAS ---- */
.glz-canvas {
  position: relative;
  min-height: 100vh;
  background:
    radial-gradient(1100px 600px at 50% -10%, rgba(63, 224, 208, 0.10), transparent 60%),
    radial-gradient(900px 700px at 85% 110%, rgba(36, 75, 110, 0.30), transparent 60%),
    linear-gradient(180deg, var(--bg-base), var(--bg-void));
  overflow: hidden;
}
.glz-canvas::before {
  content: "";
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(120, 170, 210, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 170, 210, 0.05) 1px, transparent 1px);
  background-size: 44px 44px;
  -webkit-mask-image: radial-gradient(circle at 50% 40%, #000 30%, transparent 78%);
  mask-image: radial-gradient(circle at 50% 40%, #000 30%, transparent 78%);
  pointer-events: none;
}

/* ---- SURFACE: GLASS (no color-mix) ---- */
.glz-surface-glass {
  position: relative;
  background: linear-gradient(160deg, var(--glazier-glass-1), var(--glazier-glass-2));
  -webkit-backdrop-filter: var(--blur-glass);
  backdrop-filter: var(--blur-glass);
  border: 1px solid var(--line-dark);
  border-radius: var(--r-lg);
  box-shadow: var(--inset-glass), var(--shadow-card);
}
.glz-surface-glass::after {
  content: "";
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: linear-gradient(180deg, rgba(140, 200, 230, 0.10), transparent 22%);
}

/* ---- SURFACE: METAL (brushed silver) ---- */
.glz-surface-metal {
  position: relative;
  color: var(--ink-on-metal);
  background:
    linear-gradient(176deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 12%),
    repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, rgba(0,0,0,0.04) 1px 3px),
    linear-gradient(145deg, var(--metal-hi) 0%, var(--metal-1) 16%, var(--metal-3) 40%,
      var(--metal-2) 58%, var(--metal-4) 80%, var(--metal-1) 100%);
  border: 1px solid var(--line-metal);
  border-radius: var(--r-lg);
  box-shadow: var(--inset-metal), var(--shadow-raise);
}
.glz-surface-metal::before {
  content: "";
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  opacity: 0.10; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* ---- ACCENT: TEAL ---- */
.glz-glow-teal {
  box-shadow: 0 0 0 1px var(--teal-soft), 0 0 18px rgba(63, 224, 208, 0.30), var(--shadow-raise);
}
.glz-text-teal { color: var(--teal); }
.glz-text-amber { color: var(--amber); }
.glz-glow-amber { box-shadow: 0 0 0 1px var(--amber-soft), 0 0 18px rgba(246,169,59,0.26), var(--shadow-raise); }

/* Brushed-metal button (black text — the readability rule) */
.glz-btn-metal {
  color: var(--ink-on-metal); border: 1px solid var(--line-metal); font-weight: 700;
  background:
    linear-gradient(176deg, rgba(255,255,255,0.60) 0%, rgba(255,255,255,0) 12%),
    linear-gradient(145deg, var(--metal-hi), var(--metal-2) 45%, var(--metal-4) 80%, var(--metal-1));
  box-shadow: var(--inset-metal);
}
.glz-btn-metal:hover { filter: brightness(1.05); transform: translateY(-1px); background:
    linear-gradient(176deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 12%),
    linear-gradient(145deg, var(--metal-hi), var(--metal-1) 45%, var(--metal-3) 80%, var(--metal-hi)); }

/* ---- TEXT-READABLE (black on metal, deep-teal on hover/active) ---- */
.glz-text-readable { color: var(--ink-on-metal); }
.glz-text-readable.glz-dim { color: var(--ink-on-metal-dim); }

.glz-queue-item {
  position: relative;
  display: flex; align-items: center; gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  color: var(--ink-on-metal);
  font-family: var(--font-mono); font-size: 13px;
  border-radius: var(--r-sm); cursor: pointer;
  transition: color var(--t-fast) var(--ease), background var(--t-fast) var(--ease);
}
.glz-queue-item::before {
  content: ""; position: absolute; left: 0; top: 50%; transform: translateY(-50%) scaleY(0);
  width: 3px; height: 64%; border-radius: 2px; background: var(--teal);
  box-shadow: 0 0 10px var(--teal-soft); transition: transform var(--t-fast) var(--ease);
}
.glz-queue-item:hover { color: var(--teal-ink); background: rgba(255, 255, 255, 0.28); }
.glz-queue-item.glz-active { color: var(--teal-ink); background: rgba(63, 224, 208, 0.16); font-weight: 700; }
.glz-queue-item.glz-active::before { transform: translateY(-50%) scaleY(1); }

/* ---- ELECTRIC LINES (the webhook-bridge motif) ---- */
.glz-electric-line { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
.glz-electric-line path {
  fill: none; stroke: var(--teal); stroke-width: 1.4; stroke-dasharray: 5 9;
  filter: drop-shadow(0 0 4px var(--teal-soft)); animation: glz-flow 2.6s linear infinite; opacity: 0.85;
}
.glz-electric-line path.glz-slow { animation-duration: 4.2s; opacity: 0.5; }
@keyframes glz-flow { to { stroke-dashoffset: -56; } }
@media (prefers-reduced-motion: reduce) { .glz-electric-line path { animation: none; } }

.glz-node-dot {
  width: 9px; height: 9px; border-radius: 50%; background: var(--teal);
  box-shadow: 0 0 0 4px var(--teal-faint), 0 0 14px var(--teal-soft);
}

/* ---- CONTROLS ---- */
.glz-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--sp-3);
  width: auto;
  padding: 13px 18px;
  font-family: var(--font-ui); font-size: 14px; font-weight: 600;
  border-radius: var(--r-md); cursor: pointer;
  border: 1px solid var(--line-dark); color: var(--ink-on-dark);
  background: rgba(255, 255, 255, 0.04); transition: all var(--t-base) var(--ease);
}
.glz-btn:hover { border-color: var(--teal-soft); background: rgba(63, 224, 208, 0.08); transform: translateY(-1px); }
.glz-btn svg { width: 18px; height: 18px; }
.glz-btn-block { width: 100%; }
.glz-btn-primary {
  border: none; color: #04201d; font-weight: 700;
  background: linear-gradient(135deg, var(--teal-bright), var(--teal));
  box-shadow: 0 0 22px rgba(63, 224, 208, 0.35);
}
.glz-btn-primary:hover { filter: brightness(1.06); transform: translateY(-1px); }

.glz-field {
  width: 100%; padding: 13px 16px;
  font-family: var(--font-mono); font-size: 13px; color: var(--ink-on-dark);
  background: rgba(4, 8, 14, 0.55); border: 1px solid var(--line-dark);
  border-radius: var(--r-md); transition: all var(--t-base) var(--ease);
}
.glz-field::placeholder { color: var(--ink-on-dark-dim); }
.glz-field:focus { outline: none; border-color: var(--teal); box-shadow: 0 0 0 3px var(--teal-faint); }

.glz-divider { display: flex; align-items: center; gap: var(--sp-4); color: var(--ink-on-dark-dim);
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 1px; }
.glz-divider::before, .glz-divider::after { content: ""; flex: 1; height: 1px; background: var(--line-dark); }
.glz-label-mono { font-family: var(--font-mono); font-size: 11px; letter-spacing: 2px;
  text-transform: uppercase; color: var(--ink-on-dark-dim); }
`,
};

ASSETS["index.html"] = {
  contentType: "text/html",
  content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LogicLemonAI — Studio</title>
  <link rel="manifest" href="manifest.json">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
/* ============================================================================
   GLAZIER KIT · tokens.css   (v2 — hardened)
   Single source of truth. Pure CSS custom properties. No build, no dependency.
   v2 changes: added pre-alpha'd glass tokens so glazier.css needs NO color-mix().
   ============================================================================ */

:root {
  /* ---- Canvas (near-black → black) ---- */
  --bg-void:        #04060a;
  --bg-base:        #070b12;
  --bg-raise:       #0b111b;

  /* ---- Glazier blue (the glass) ---- */
  --glazier-1:      #16273d;
  --glazier-2:      #0d1726;
  --glazier-edge:   #2f5f86;
  --glazier-deep:   #0a2036;
  /* pre-alpha'd glass fills — replace color-mix() for full browser support */
  --glazier-glass-1: rgba(22, 39, 61, 0.78);   /* = #16273d @ 78% */
  --glazier-glass-2: rgba(13, 23, 38, 0.72);   /* = #0d1726 @ 72% */

  /* ---- Brushed metal (the silver) ---- */
  --metal-hi:       #eef2f6;
  --metal-1:        #d4dbe3;
  --metal-2:        #b9c2cc;
  --metal-3:        #9aa4b1;
  --metal-4:        #7e8a98;
  --metal-lo:       #6c7886;

  /* ---- Electric teal (accent / selection / glow) ---- */
  --teal:           #3fe0d0;
  --teal-bright:    #6bf0e3;
  --teal-ink:       #0a8f81;   /* deepened teal — legible on silver */
  --teal-soft:      rgba(63, 224, 208, 0.45);
  --teal-faint:     rgba(63, 224, 208, 0.14);

  /* ---- Warm accent (sparing counterpoint: red-ish → amber) ---- */
  --ember:          #ff6a3d;   /* red-ish */
  --amber:          #f6a93b;   /* amber */
  --warm-grad:      linear-gradient(135deg, #ff7a4d, #f6a93b);
  --ember-soft:     rgba(255, 106, 61, 0.40);
  --amber-soft:     rgba(246, 169, 59, 0.38);
  --amber-faint:    rgba(246, 169, 59, 0.12);

  /* ---- Text ---- */
  --ink-on-dark:    #e6edf5;
  --ink-on-dark-dim:#9fb0c3;
  --ink-on-metal:   #0a0e14;
  --ink-on-metal-dim:#262d37;   /* darker slate — high contrast on silver (no low-opacity grey) */

  /* ---- Hairlines & dividers ---- */
  --line-dark:      rgba(120, 170, 210, 0.16);
  --line-metal:     rgba(255, 255, 255, 0.5);

  /* ---- Blur ---- */
  --blur-glass:     blur(18px) saturate(140%);

  /* ---- Shadows (depth) ---- */
  --shadow-card:    0 24px 60px rgba(0, 0, 0, 0.55);
  --shadow-raise:   0 10px 30px rgba(0, 0, 0, 0.45);
  --inset-glass:    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  --inset-metal:    inset 0 1px 0 rgba(255, 255, 255, 0.85),
                    inset 0 -1px 2px rgba(0, 0, 0, 0.28);

  /* ---- Radii ---- */
  --r-sm: 8px;  --r-md: 14px;  --r-lg: 20px;  --r-pill: 999px;

  /* ---- Spacing scale ---- */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px;
  --sp-5: 24px; --sp-6: 32px; --sp-7: 48px; --sp-8: 64px;

  /* ---- Type ---- */
  --font-ui:   'Outfit', system-ui, -apple-system, sans-serif;
  --font-mono: 'Space Mono', ui-monospace, 'SF Mono', monospace;

  /* ---- Motion ---- */
  --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
  --t-fast: 0.15s;  --t-base: 0.3s;
}

</style>
  <style>
/* ============================================================================
   GLAZIER KIT · glazier.css   (v2 — hardened)
   Hard aesthetics crafted ONCE as classes. Depends only on tokens.css.
   v2 changes:
     • EVERY class is namespaced \`glz-\` → cannot collide with the existing
       copper/patina stylesheet (resolves the .btn / pseudo-element concerns).
     • color-mix() removed → uses pre-alpha'd --glazier-glass-* tokens.
     • .glz-btn defaults to width:auto; use .glz-btn-block for full-width.
   Apply these classes to NEW markup only — never bolt onto already-themed
   elements (keeps ::before/::after exclusively ours).
   ============================================================================ */

*, *::before, *::after { box-sizing: border-box; }

.glz-body {
  margin: 0;
  font-family: var(--font-ui);
  color: var(--ink-on-dark);
  background: var(--bg-void);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* ---- CANVAS ---- */
.glz-canvas {
  position: relative;
  min-height: 100vh;
  background:
    radial-gradient(1100px 600px at 50% -10%, rgba(63, 224, 208, 0.10), transparent 60%),
    radial-gradient(900px 700px at 85% 110%, rgba(36, 75, 110, 0.30), transparent 60%),
    linear-gradient(180deg, var(--bg-base), var(--bg-void));
  overflow: hidden;
}
.glz-canvas::before {
  content: "";
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(120, 170, 210, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 170, 210, 0.05) 1px, transparent 1px);
  background-size: 44px 44px;
  -webkit-mask-image: radial-gradient(circle at 50% 40%, #000 30%, transparent 78%);
  mask-image: radial-gradient(circle at 50% 40%, #000 30%, transparent 78%);
  pointer-events: none;
}

/* ---- SURFACE: GLASS (no color-mix) ---- */
.glz-surface-glass {
  position: relative;
  background: linear-gradient(160deg, var(--glazier-glass-1), var(--glazier-glass-2));
  -webkit-backdrop-filter: var(--blur-glass);
  backdrop-filter: var(--blur-glass);
  border: 1px solid var(--line-dark);
  border-radius: var(--r-lg);
  box-shadow: var(--inset-glass), var(--shadow-card);
}
.glz-surface-glass::after {
  content: "";
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  background: linear-gradient(180deg, rgba(140, 200, 230, 0.10), transparent 22%);
}

/* ---- SURFACE: METAL (brushed silver) ---- */
.glz-surface-metal {
  position: relative;
  color: var(--ink-on-metal);
  background:
    linear-gradient(176deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 12%),
    repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, rgba(0,0,0,0.04) 1px 3px),
    linear-gradient(145deg, var(--metal-hi) 0%, var(--metal-1) 16%, var(--metal-3) 40%,
      var(--metal-2) 58%, var(--metal-4) 80%, var(--metal-1) 100%);
  border: 1px solid var(--line-metal);
  border-radius: var(--r-lg);
  box-shadow: var(--inset-metal), var(--shadow-raise);
}
.glz-surface-metal::before {
  content: "";
  position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  opacity: 0.10; mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* ---- ACCENT: TEAL ---- */
.glz-glow-teal {
  box-shadow: 0 0 0 1px var(--teal-soft), 0 0 18px rgba(63, 224, 208, 0.30), var(--shadow-raise);
}
.glz-text-teal { color: var(--teal); }
.glz-text-amber { color: var(--amber); }
.glz-glow-amber { box-shadow: 0 0 0 1px var(--amber-soft), 0 0 18px rgba(246,169,59,0.26), var(--shadow-raise); }

/* Brushed-metal button (black text — the readability rule) */
.glz-btn-metal {
  color: var(--ink-on-metal); border: 1px solid var(--line-metal); font-weight: 700;
  background:
    linear-gradient(176deg, rgba(255,255,255,0.60) 0%, rgba(255,255,255,0) 12%),
    linear-gradient(145deg, var(--metal-hi), var(--metal-2) 45%, var(--metal-4) 80%, var(--metal-1));
  box-shadow: var(--inset-metal);
}
.glz-btn-metal:hover { filter: brightness(1.05); transform: translateY(-1px); background:
    linear-gradient(176deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 12%),
    linear-gradient(145deg, var(--metal-hi), var(--metal-1) 45%, var(--metal-3) 80%, var(--metal-hi)); }

/* ---- TEXT-READABLE (black on metal, deep-teal on hover/active) ---- */
.glz-text-readable { color: var(--ink-on-metal); }
.glz-text-readable.glz-dim { color: var(--ink-on-metal-dim); }

.glz-queue-item {
  position: relative;
  display: flex; align-items: center; gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  color: var(--ink-on-metal);
  font-family: var(--font-mono); font-size: 13px;
  border-radius: var(--r-sm); cursor: pointer;
  transition: color var(--t-fast) var(--ease), background var(--t-fast) var(--ease);
}
.glz-queue-item::before {
  content: ""; position: absolute; left: 0; top: 50%; transform: translateY(-50%) scaleY(0);
  width: 3px; height: 64%; border-radius: 2px; background: var(--teal);
  box-shadow: 0 0 10px var(--teal-soft); transition: transform var(--t-fast) var(--ease);
}
.glz-queue-item:hover { color: var(--teal-ink); background: rgba(255, 255, 255, 0.28); }
.glz-queue-item.glz-active { color: var(--teal-ink); background: rgba(63, 224, 208, 0.16); font-weight: 700; }
.glz-queue-item.glz-active::before { transform: translateY(-50%) scaleY(1); }

/* ---- ELECTRIC LINES (the webhook-bridge motif) ---- */
.glz-electric-line { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
.glz-electric-line path {
  fill: none; stroke: var(--teal); stroke-width: 1.4; stroke-dasharray: 5 9;
  filter: drop-shadow(0 0 4px var(--teal-soft)); animation: glz-flow 2.6s linear infinite; opacity: 0.85;
}
.glz-electric-line path.glz-slow { animation-duration: 4.2s; opacity: 0.5; }
@keyframes glz-flow { to { stroke-dashoffset: -56; } }
@media (prefers-reduced-motion: reduce) { .glz-electric-line path { animation: none; } }

.glz-node-dot {
  width: 9px; height: 9px; border-radius: 50%; background: var(--teal);
  box-shadow: 0 0 0 4px var(--teal-faint), 0 0 14px var(--teal-soft);
}

/* ---- CONTROLS ---- */
.glz-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: var(--sp-3);
  width: auto;                       /* v2: was 100% — full-width is opt-in now */
  padding: 13px 18px;
  font-family: var(--font-ui); font-size: 14px; font-weight: 600;
  border-radius: var(--r-md); cursor: pointer;
  border: 1px solid var(--line-dark); color: var(--ink-on-dark);
  background: rgba(255, 255, 255, 0.04); transition: all var(--t-base) var(--ease);
}
.glz-btn:hover { border-color: var(--teal-soft); background: rgba(63, 224, 208, 0.08); transform: translateY(-1px); }
.glz-btn svg { width: 18px; height: 18px; }
.glz-btn-block { width: 100%; }       /* opt-in full width (used by stacked auth buttons) */
.glz-btn-primary {
  border: none; color: #04201d; font-weight: 700;
  background: linear-gradient(135deg, var(--teal-bright), var(--teal));
  box-shadow: 0 0 22px rgba(63, 224, 208, 0.35);
}
.glz-btn-primary:hover { filter: brightness(1.06); transform: translateY(-1px); }

.glz-field {
  width: 100%; padding: 13px 16px;
  font-family: var(--font-mono); font-size: 13px; color: var(--ink-on-dark);
  background: rgba(4, 8, 14, 0.55); border: 1px solid var(--line-dark);
  border-radius: var(--r-md); transition: all var(--t-base) var(--ease);
}
.glz-field::placeholder { color: var(--ink-on-dark-dim); }
.glz-field:focus { outline: none; border-color: var(--teal); box-shadow: 0 0 0 3px var(--teal-faint); }

.glz-divider { display: flex; align-items: center; gap: var(--sp-4); color: var(--ink-on-dark-dim);
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 1px; }
.glz-divider::before, .glz-divider::after { content: ""; flex: 1; height: 1px; background: var(--line-dark); }
.glz-label-mono { font-family: var(--font-mono); font-size: 11px; letter-spacing: 2px;
  text-transform: uppercase; color: var(--ink-on-dark-dim); }

</style>
  <style>
  /* ===== STUDIO LAYOUT (Glazier) — page-specific only; kit does the materials ===== */
  body{height:100vh;overflow:hidden;}
  .bg{position:fixed;inset:0;z-index:0;pointer-events:none;
    background:radial-gradient(1100px 560px at 50% -12%,rgba(63,224,208,.07),transparent 60%),
    radial-gradient(700px 600px at 94% 2%,rgba(246,169,59,.05),transparent 58%),
    radial-gradient(820px 700px at 4% 110%,rgba(36,75,110,.24),transparent 60%),
    linear-gradient(180deg,var(--bg-base),var(--bg-void));}
  .app-root{position:relative;z-index:1;height:100vh;display:flex;flex-direction:column;}

  /* header */
  header{display:flex;align-items:center;gap:14px;padding:12px 18px;border-bottom:1px solid var(--line-dark);flex-shrink:0;position:relative;z-index:100;}
  .brand{display:flex;align-items:center;gap:12px;}
  .brand .badge{width:28px;height:28px;border-radius:8px;display:grid;place-items:center;}
  .brand .badge .glz-node-dot{width:7px;height:7px;}
  .brand h1{font-size:16px;font-weight:800;letter-spacing:-.3px;margin:0;}
  .brand h1 span{color:var(--teal);}
  header nav{display:flex;gap:2px;margin-left:8px;}
  header nav button{background:none;border:none;color:var(--ink-on-dark-dim);font-family:var(--font-ui);font-size:13.5px;padding:7px 13px;border-radius:8px;cursor:pointer;transition:all var(--t-fast) var(--ease);}
  header nav button:hover{color:var(--ink-on-dark);background:rgba(255,255,255,.04);}
  header nav button.active{color:var(--teal);background:rgba(63,224,208,.10);font-weight:600;}
  .status{margin-left:auto;display:inline-flex;align-items:center;gap:7px;font-family:var(--font-mono);font-size:11px;color:var(--ink-on-dark-dim);}
  .status .dot{width:7px;height:7px;border-radius:50%;background:var(--amber);box-shadow:0 0 8px var(--amber-soft);}
  .auth-cluster{display:flex;gap:8px;}
  .auth-btn{background:rgba(255,255,255,.04);border:1px solid var(--line-dark);color:var(--ink-on-dark);font-family:var(--font-ui);font-size:12.5px;padding:7px 12px;border-radius:10px;cursor:pointer;transition:all var(--t-base) var(--ease);}
  .auth-btn:hover{border-color:var(--teal-soft);background:rgba(63,224,208,.08);color:var(--teal);}
  .signed-in-pill{display:none;align-items:center;gap:6px;font-family:var(--font-mono);font-size:11px;color:var(--teal);border:1px solid var(--teal-soft);background:rgba(63,224,208,.08);padding:6px 11px;border-radius:999px;}
  .settings-btn{background:rgba(255,255,255,.04);border:1px solid var(--line-dark);color:var(--ink-on-dark-dim);font-family:var(--font-mono);font-size:11px;padding:7px 11px;border-radius:10px;cursor:pointer;transition:all var(--t-base) var(--ease);}
  .settings-btn:hover{border-color:var(--teal-soft);color:var(--teal);}

  /* views */
  .view{display:none;flex:1;min-height:0;}
  .view.active{display:flex;}
  #view-library,#view-pricing,#view-docs{overflow:auto;}

  /* APP VIEW — split pane */
  .container{flex:1;display:flex;gap:14px;padding:14px 18px 18px;min-height:0;width:100%;}
  .panel-chat{width:360px;flex-shrink:0;display:flex;flex-direction:column;padding:14px;min-height:0;}
  .messages{flex:1;overflow:auto;display:flex;flex-direction:column;gap:10px;padding:2px;}
  .msg{max-width:92%;padding:10px 13px;border-radius:12px;font-size:13.5px;line-height:1.5;}
  .msg.assistant{align-self:flex-start;background:rgba(255,255,255,.30);color:var(--ink-on-metal);border:1px solid rgba(0,0,0,.06);}
  .msg.user{align-self:flex-end;background:rgba(63,224,208,.22);color:#06403a;border:1px solid var(--teal-soft);font-weight:600;}
  .msg.typing{align-self:flex-start;color:var(--ink-on-metal-dim);font-family:var(--font-mono);font-size:12px;}
  .msg.error{align-self:flex-start;background:rgba(255,106,61,.16);color:#7a2613;border:1px solid var(--ember-soft);}
  .input-area{display:flex;gap:8px;align-items:flex-end;margin-top:12px;padding-top:12px;border-top:1px solid rgba(0,0,0,.10);}
  #promptInput{flex:1;resize:none;max-height:120px;padding:11px 13px;border-radius:12px;border:1px solid rgba(0,0,0,.14);background:rgba(255,255,255,.55);color:var(--ink-on-metal);font-family:var(--font-ui);font-size:13.5px;}
  #promptInput::placeholder{color:var(--ink-on-metal-dim);}
  #promptInput:focus{outline:none;border-color:var(--teal);box-shadow:0 0 0 3px var(--teal-faint);}
  #sendBtn{flex-shrink:0;width:40px;height:40px;border-radius:11px;border:none;cursor:pointer;background:linear-gradient(135deg,var(--teal-bright),var(--teal));color:#04201d;display:grid;place-items:center;transition:all var(--t-base) var(--ease);}
  #sendBtn:hover{filter:brightness(1.06);transform:translateY(-1px);}
  #sendBtn svg{width:20px;height:20px;fill:currentColor;}

  .panel-preview{flex:1;display:flex;flex-direction:column;min-width:0;position:relative;border-radius:var(--r-lg);overflow:hidden;}
  .toolbar{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--line-dark);flex-shrink:0;background:rgba(7,11,18,.5);}
  .section-tag{font-family:var(--font-mono);font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--ink-on-dark-dim);}
  .toolbar-btn,.clear-btn{background:rgba(255,255,255,.04);border:1px solid var(--line-dark);color:var(--ink-on-dark-dim);font-family:var(--font-mono);font-size:10px;padding:4px 11px;border-radius:7px;cursor:pointer;transition:all var(--t-base) var(--ease);}
  .toolbar-btn:hover,.clear-btn:hover{border-color:var(--teal-soft);color:var(--teal);}
  .api-btn{border-color:var(--teal-soft);color:var(--teal);}
  .clear-btn{margin-left:auto;}
  .model-selector{display:inline-flex;gap:3px;align-items:center;}
  .model-opt{background:none;border:1px solid var(--line-dark);color:var(--ink-on-dark-dim);padding:3px 8px;border-radius:6px;cursor:pointer;font-size:10px;font-family:var(--font-mono);transition:all var(--t-base) var(--ease);white-space:nowrap;}
  .model-opt:hover{border-color:var(--teal-soft);color:var(--teal);}
  .model-opt.active{background:var(--teal);color:var(--base-dark,#04201d);border-color:var(--teal);}

  .preview-canvas{flex:1;overflow:auto;display:grid;background:var(--bg-void);-webkit-overflow-scrolling:touch;}
  .preview-stage{margin:auto;}
  iframe#preview{display:block;width:1280px;height:900px;border:none;background:#fff;border-radius:6px;transition:width .3s ease,height .3s ease;}
  iframe#preview.framed{box-shadow:0 0 0 1px var(--trace-dim,rgba(120,170,210,.16));}

  /* preview controls — silver pods + zoom + export, bottom-right */
  .preview-controls{position:absolute;right:16px;bottom:16px;z-index:6;display:flex;align-items:flex-end;gap:8px;}
  .preview-pod{position:relative;}
  .pod-trigger{display:inline-flex;align-items:center;gap:6px;color:var(--ink-on-metal);padding:7px 11px;border-radius:9px;cursor:pointer;font-family:var(--font-mono);font-size:11px;font-weight:700;
    border:1px solid var(--line-metal);
    background:linear-gradient(176deg,rgba(255,255,255,.6) 0%,rgba(255,255,255,0) 12%),linear-gradient(145deg,var(--metal-hi),var(--metal-2) 45%,var(--metal-4) 80%,var(--metal-1));
    box-shadow:var(--inset-metal),0 6px 16px rgba(0,0,0,.35);transition:filter var(--t-fast) var(--ease);}
  .pod-trigger:hover{filter:brightness(1.05);}
  .pod-caret{font-size:9px;opacity:.7;}
  .pod-menu{display:none;position:absolute;left:0;bottom:calc(100% + 6px);min-width:140px;padding:5px;flex-direction:column;gap:2px;
    background:rgba(10,14,18,.97);border:1px solid var(--line-dark);border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,.55);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);}
  .preview-pod.open .pod-menu{display:flex;}
  /* click-to-open only (no hover-open): trigger opens it, stays until select/outside-click — avoids the hover-gap race */
  .pod-item{background:none;border:none;color:var(--ink-on-dark-dim);text-align:left;padding:7px 10px;border-radius:6px;cursor:pointer;font-family:var(--font-mono);font-size:11px;transition:all var(--t-fast) var(--ease);}
  .pod-item:hover{background:rgba(63,224,208,.12);color:var(--teal);}
  .pod-item.active{color:var(--teal);font-weight:700;}
  .preview-zoom{display:inline-flex;align-items:center;gap:2px;padding:3px;border-radius:9px;border:1px solid var(--line-metal);
    background:linear-gradient(176deg,rgba(255,255,255,.6) 0%,rgba(255,255,255,0) 12%),linear-gradient(145deg,var(--metal-hi),var(--metal-2) 45%,var(--metal-4) 80%,var(--metal-1));box-shadow:var(--inset-metal),0 6px 16px rgba(0,0,0,.35);}
  .zoom-step{background:none;border:none;color:var(--ink-on-metal);cursor:pointer;width:26px;height:24px;font-size:15px;font-weight:700;border-radius:6px;line-height:1;}
  .zoom-step:hover{background:rgba(0,0,0,.10);}
  .zoom-val{background:none;border:none;color:var(--ink-on-metal);cursor:pointer;min-width:50px;height:24px;font-size:11px;font-weight:700;border-radius:6px;font-family:var(--font-mono);}
  .zoom-val:hover{background:rgba(0,0,0,.10);}

  /* toast (Slice 3 export feedback) */
  .copy-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--teal);color:#04201d;padding:9px 18px;border-radius:9px;font-family:var(--font-mono);font-size:12px;font-weight:700;z-index:2000;opacity:0;transition:opacity .3s ease;pointer-events:none;}
  .copy-toast.show{opacity:1;}
  /* header Export & Share pod — silver trigger, pops DOWN, right-aligned */
  .hdr-export .pod-trigger{padding:7px 14px;}
  .pod-down .pod-menu{top:calc(100% + 6px);bottom:auto;left:auto;right:0;}

  /* LIBRARY / PRICING / DOCS — glass pages */
  .page{max-width:1040px;margin:0 auto;padding:40px 6vw 60px;width:100%;}
  .page h2{font-size:clamp(24px,3.4vw,36px);font-weight:800;letter-spacing:-.6px;margin:10px 0 8px;}
  .subtitle{color:var(--ink-on-dark-dim);font-size:15px;line-height:1.6;margin:0 0 28px;max-width:60ch;}
  .search-bar{width:100%;max-width:420px;padding:12px 15px;border-radius:12px;border:1px solid var(--line-dark);background:rgba(4,8,14,.5);color:var(--ink-on-dark);font-family:var(--font-mono);font-size:13px;margin-bottom:18px;}
  .search-bar:focus{outline:none;border-color:var(--teal);box-shadow:0 0 0 3px var(--teal-faint);}
  .category-filters{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:22px;}
  .category-filters button{background:rgba(255,255,255,.04);border:1px solid var(--line-dark);color:var(--ink-on-dark-dim);padding:6px 13px;border-radius:999px;cursor:pointer;font-size:12px;font-family:var(--font-mono);transition:all var(--t-fast) var(--ease);}
  .category-filters button:hover{color:var(--teal);border-color:var(--teal-soft);}
  .category-filters button.active{background:var(--teal);color:#04201d;border-color:var(--teal);font-weight:700;}
  .skill-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;}
  .skill-card{position:relative;background:linear-gradient(160deg,var(--glazier-glass-1),var(--glazier-glass-2));border:1px solid var(--line-dark);border-radius:var(--r-lg);padding:18px;box-shadow:var(--inset-glass);transition:transform var(--t-base) var(--ease),border-color var(--t-base) var(--ease);}
  .skill-card:hover{transform:translateY(-2px);border-color:var(--teal-soft);}
  .skill-card .tag{font-family:var(--font-mono);font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:var(--teal);}
  .skill-card h3{margin:8px 0 6px;font-size:16px;font-weight:700;}
  .skill-card p{color:var(--ink-on-dark-dim);font-size:13px;line-height:1.5;margin:0 0 14px;}
  .skill-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;font-family:var(--font-mono);font-size:10px;color:var(--ink-on-dark-dim);}
  .use-btn{background:linear-gradient(135deg,var(--teal-bright),var(--teal));color:#04201d;border:none;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;font-family:var(--font-ui);}
  .use-btn:hover{filter:brightness(1.06);}

  .pricing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;}
  .pricing-card{background:linear-gradient(160deg,var(--glazier-glass-1),var(--glazier-glass-2));border:1px solid var(--line-dark);border-radius:var(--r-lg);padding:26px;box-shadow:var(--inset-glass);}
  .pricing-card.featured{border-color:var(--teal-soft);box-shadow:0 0 22px var(--teal-faint),var(--inset-glass);}
  .pricing-card h3{font-family:var(--font-mono);font-size:12px;letter-spacing:2px;color:var(--ink-on-dark-dim);margin:0 0 10px;}
  .pricing-card .price{font-size:34px;font-weight:900;letter-spacing:-1px;margin-bottom:16px;}
  .pricing-card .price span{font-size:13px;font-weight:500;color:var(--ink-on-dark-dim);}
  .pricing-card ul{list-style:none;padding:0;margin:0 0 20px;display:flex;flex-direction:column;gap:9px;}
  .pricing-card li{font-size:13px;color:var(--ink-on-dark);padding-left:22px;position:relative;}
  .pricing-card li::before{content:"✓";position:absolute;left:0;color:var(--teal);font-weight:800;}
  .cta-btn{width:100%;padding:12px;border-radius:12px;border:none;cursor:pointer;font-family:var(--font-ui);font-size:14px;font-weight:700;background:linear-gradient(135deg,var(--teal-bright),var(--teal));color:#04201d;}
  .cta-btn.secondary{background:rgba(255,255,255,.05);border:1px solid var(--line-dark);color:var(--ink-on-dark);}
  .cta-btn:hover{filter:brightness(1.05);}

  .docs-content h3{font-size:18px;font-weight:700;margin:26px 0 10px;}
  .step{display:flex;gap:14px;margin-bottom:12px;}
  .step-num{flex-shrink:0;width:30px;height:30px;border-radius:8px;display:grid;place-items:center;font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--ink-on-metal);
    border:1px solid var(--line-metal);background:linear-gradient(145deg,var(--metal-hi),var(--metal-3) 70%,var(--metal-1));box-shadow:var(--inset-metal);}
  .step-body{flex:1;}
  .step-body p{color:var(--ink-on-dark-dim);font-size:14px;line-height:1.6;margin:0;}
  .docs-content code{font-family:var(--font-mono);font-size:12.5px;background:rgba(63,224,208,.1);color:var(--teal);padding:2px 6px;border-radius:5px;}
  .docs-content pre{background:rgba(4,8,14,.6);border:1px solid var(--line-dark);border-radius:10px;padding:14px;overflow:auto;margin:10px 0;}
  .docs-content pre code{background:none;color:var(--ink-on-dark);padding:0;}
  .docs-content a{color:var(--teal);}
  .inline-api-btn{background:linear-gradient(135deg,var(--teal-bright),var(--teal));color:#04201d;border:none;padding:8px 16px;border-radius:10px;cursor:pointer;font-weight:700;font-family:var(--font-ui);margin-top:8px;}

  /* MODAL */
  .modal-overlay{position:fixed;inset:0;background:rgba(2,4,8,.8);display:flex;align-items:center;justify-content:center;z-index:1000;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);padding:20px;}
  .modal-overlay.hidden{display:none;}
  .modal{background:linear-gradient(160deg,#0e1a2b,#0a1320);border:1px solid var(--line-dark);border-radius:18px;padding:28px;max-width:460px;width:100%;max-height:90vh;overflow:auto;box-shadow:var(--shadow-card);}
  .modal h2{font-size:20px;font-weight:800;margin:0 0 16px;}
  .settings-section{margin-bottom:20px;padding-bottom:18px;border-bottom:1px solid var(--line-dark);}
  .settings-section p{font-size:13px;color:var(--ink-on-dark-dim);line-height:1.5;margin:8px 0 12px;}
  .settings-section a{color:var(--teal);}
  .modal input{width:100%;padding:11px 14px;border-radius:10px;border:1px solid var(--line-dark);background:rgba(4,8,14,.55);color:var(--ink-on-dark);font-family:var(--font-mono);font-size:12.5px;margin-bottom:9px;}
  .modal input:focus{outline:none;border-color:var(--teal);box-shadow:0 0 0 3px var(--teal-faint);}
  .btn-primary{width:100%;padding:11px;border-radius:11px;border:none;cursor:pointer;font-family:var(--font-ui);font-size:13.5px;font-weight:700;background:linear-gradient(135deg,var(--teal-bright),var(--teal));color:#04201d;}
  .btn-primary:hover{filter:brightness(1.05);}
  .btn-ghost{width:100%;padding:10px;border-radius:11px;border:1px solid var(--line-dark);background:none;color:var(--ink-on-dark-dim);cursor:pointer;font-family:var(--font-ui);font-size:13px;margin-top:6px;}
  .btn-ghost:hover{color:var(--ink-on-dark);border-color:var(--teal-soft);}
  .free-badge{font-family:var(--font-mono);font-size:11px;color:var(--amber);}
  .key-hint{font-family:var(--font-mono);font-size:10px;color:var(--ink-on-dark-dim);text-align:center;margin-top:12px;}

  /* Handoff.md slide-out */
  .handoff-trigger{position:absolute;left:16px;bottom:16px;z-index:6;cursor:pointer;font-family:var(--font-mono);font-size:11px;font-weight:700;padding:7px 11px;border-radius:9px;color:var(--ink-on-metal);border:1px solid var(--line-metal);background:linear-gradient(176deg,rgba(255,255,255,.6) 0%,rgba(255,255,255,0) 12%),linear-gradient(145deg,var(--metal-hi),var(--metal-2) 45%,var(--metal-4) 80%,var(--metal-1));box-shadow:var(--inset-metal),0 6px 16px rgba(0,0,0,.35);transition:filter var(--t-fast) var(--ease);}
  .handoff-trigger:hover{filter:brightness(1.05);}
  .handoff-overlay{position:absolute;inset:0;z-index:5;background:rgba(0,0,0,.3);display:none;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px);}
  .handoff-overlay.open{display:block;}
  .handoff-panel{position:absolute;bottom:0;left:50%;width:320px;max-height:70%;z-index:7;background:rgba(10,14,18,.97);border:1px solid var(--line-dark);border-radius:var(--r-lg) var(--r-lg) 0 0;box-shadow:var(--shadow-card);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);display:none;flex-direction:column;transform:translateX(calc(-50% + 100%));transition:transform .35s var(--ease);}
  .handoff-panel.open{display:flex;transform:translateX(-50%);}
  .handoff-panel-header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px;border-bottom:1px solid var(--line-dark);}
  .handoff-panel-title{font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:.5px;color:var(--ink-on-dark);}
  .handoff-close{background:none;border:none;color:var(--ink-on-dark-dim);font-size:20px;cursor:pointer;line-height:1;padding:0 4px;}
  .handoff-close:hover{color:var(--ink-on-dark);}
  .handoff-panel-body{padding:14px 16px 18px;overflow:auto;}
  .handoff-desc{font-size:13px;line-height:1.5;color:var(--ink-on-dark-dim);margin:0 0 16px;}
  .stack-select-group{margin-bottom:16px;}
  .stack-label{display:block;font-family:var(--font-mono);font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--ink-on-dark-dim);margin-bottom:6px;}
  .stack-select{position:relative;}
  .stack-current{display:flex;align-items:center;justify-content:space-between;width:100%;padding:10px 13px;border-radius:8px;border:1px solid var(--line-dark);background:rgba(255,255,255,.04);color:var(--ink-on-dark);font-family:var(--font-mono);font-size:12.5px;cursor:pointer;transition:border-color var(--t-fast) var(--ease);}
  .stack-current:hover{border-color:var(--teal-soft);}
  .stack-options{display:none;position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:10;padding:5px;background:rgba(10,14,18,.97);border:1px solid var(--line-dark);border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,.55);flex-direction:column;gap:2px;}
  .stack-options.open{display:flex;}
  .stack-opt{background:none;border:none;color:var(--ink-on-dark-dim);text-align:left;padding:7px 10px;border-radius:6px;cursor:pointer;font-family:var(--font-mono);font-size:11px;transition:all var(--t-fast) var(--ease);}
  .stack-opt:hover{background:rgba(63,224,208,.12);color:var(--teal);}
  .stack-opt.active{color:var(--teal);font-weight:700;}
  .handoff-gen-btn{width:100%;padding:12px;border-radius:10px;border:none;cursor:pointer;font-family:var(--font-ui);font-size:13px;font-weight:700;background:linear-gradient(135deg,var(--teal-bright),var(--teal));color:#04201d;transition:all var(--t-base) var(--ease);}
  .handoff-gen-btn:hover{filter:brightness(1.06);transform:translateY(-1px);}

  @media(max-width:820px){
    .container{flex-direction:column;}
    .panel-chat{width:100%;height:auto;max-height:42vh;}
    iframe#preview{width:100%;height:60vh;}
    .preview-controls{right:8px;bottom:8px;gap:4px;flex-wrap:wrap;justify-content:flex-end;}
    .pod-trigger,.zoom-step,.zoom-val{padding:5px 8px;font-size:10px;}
    .handoff-trigger{left:8px;bottom:8px;font-size:10px;padding:5px 8px;}
    /* mobile: handoff at top-left so bottom controls have full width */
    .handoff-trigger{left:8px;top:8px;bottom:auto;font-size:10px;padding:5px 8px;}
  }
  </style>
<style>
.ha-img-placeholder{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;background:#f4f4f5;border:1px dashed #d4d4d8;border-radius:8px;color:#71717a;font-size:12px;font-family:system-ui,sans-serif;min-height:80px;padding:16px;box-sizing:border-box;animation:ha-img-pulse 1.5s ease-in-out infinite}
.ha-img-placeholder.ha-failed{animation:none;opacity:.7}
@keyframes ha-img-pulse{0%,100%{opacity:1}50%{opacity:.5}}
@media(prefers-color-scheme:dark){.ha-img-placeholder{background:#27272a;border-color:#3f3f46;color:#a1a1aa}}
</style>
</head>
<body class="glz-body">
  <div class="bg"></div>
  <div class="app-root">

    <header>
      <div class="brand">
        <span class="badge glz-surface-metal"><span class="glz-node-dot"></span></span>
        <h1>LogicLemon<span>AI</span></h1>
        <nav id="headerNav">
          <button class="active" data-view="app">Studio</button>
          <button data-view="library">Library</button>
          <button data-view="pricing">Pricing</button>
          <button data-view="docs">Docs</button>
          <a href="/inspiration.html" target="_blank" style="text-decoration:none;"><button style="background:none;border:none;color:var(--ink-on-dark-dim);font-size:13px;padding:6px 10px;border-radius:8px;cursor:pointer;transition:color var(--t-fast);font-family:var(--font-ui);" onmouseover="this.style.color='var(--teal)'" onmouseout="this.style.color='var(--ink-on-dark-dim)'">Inspiration</button></a>
          <a href="/dashboard.html" target="_blank" style="text-decoration:none;"><button style="background:none;border:none;color:var(--ink-on-dark-dim);font-size:13px;padding:6px 10px;border-radius:8px;cursor:pointer;transition:color var(--t-fast);font-family:var(--font-ui);" onmouseover="this.style.color='var(--teal)'" onmouseout="this.style.color='var(--ink-on-dark-dim)'">Dashboard</button></a>
          <a href="/signin.html" style="text-decoration:none;"><button class="mobile-signin" style="background:none;border:none;color:var(--teal);font-size:13px;padding:6px 10px;border-radius:8px;cursor:pointer;font-family:var(--font-ui);font-weight:600;">Sign in</button></a>
        </nav>
      </div>
      <div class="status"><span class="dot" id="statusDot"></span> <span id="statusText">Ready</span></div>
      <span class="signed-in-pill" id="signedInPill" title="You're signed in">&#10003; Connected</span>
      <button class="settings-btn" id="configBtn" title="Settings &amp; API key" style="font-size:15px;padding:6px 9px;">&#9881;</button>
      <div class="preview-pod pod-down hdr-export" id="exportPod">
        <button class="pod-trigger" id="exportTrigger" type="button" aria-haspopup="true" aria-expanded="false" title="Export"><span>Export</span><span class="pod-caret" aria-hidden="true">&#9662;</span></button>
        <div class="pod-menu" id="exportMenu" role="menu">
          <button class="pod-item" type="button" role="menuitem" data-action="download">↓ Download HTML</button>
          <button class="pod-item" type="button" role="menuitem" data-action="copy">⎘ Copy HTML</button>
          <button class="pod-item" type="button" role="menuitem" data-action="desktop">⇄ Send to Desktop</button>
        </div>
      </div>
      <div class="preview-pod pod-down hdr-export" id="sharePod">
        <button class="pod-trigger" id="shareTrigger" type="button" aria-haspopup="true" aria-expanded="false" title="Share"><span>Share</span><span class="pod-caret" aria-hidden="true">&#9662;</span></button>
        <div class="pod-menu" id="shareMenu" role="menu">
          <button class="pod-item" type="button" role="menuitem" data-action="handoff">📋 Backend Handoff.md</button>
        </div>
      </div>
    </header>

    <!-- ===== STUDIO (APP) ===== -->
    <div class="view active" id="view-app">
      <div class="container">
        <div class="panel-chat glz-surface-metal">
          <div class="messages" id="messages">
            <div class="msg assistant">Describe the UI you want — I'll generate it live on the right.</div>
          </div>
          <div class="input-area">
            <textarea id="promptInput" rows="1" placeholder="Describe your UI… (e.g. 'a dark dashboard with a sidebar and a chart')" enterkeyhint="send"></textarea>
            <button id="sendBtn" title="Send"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
          </div>
        </div>
        <div class="panel-preview glz-surface-glass">
          <div class="toolbar">
            <span class="section-tag">Preview</span>
            <button class="toolbar-btn api-btn" id="appApiBtn">API</button>
            <button id="sendDesktopBtn" class="toolbar-btn" style="display:none;">Desktop</button>
            <button id="webhookerBtn" class="toolbar-btn" style="display:none;">Webhook</button>
            <span id="modelSelector" class="model-selector" style="display:none"></span>
            <button class="clear-btn" id="clearPreviewBtn">Clear</button>
          </div>
          <div class="preview-canvas" id="previewCanvas">
            <div class="preview-stage" id="previewStage">
              <iframe id="preview" sandbox="allow-scripts allow-same-origin" title="Live Preview"></iframe>
            </div>
          </div>
          <div class="preview-controls">
            <div class="preview-pod" id="devicePod">
              <button class="pod-trigger" id="deviceTrigger" type="button" aria-haspopup="true" aria-expanded="false" title="Device"><span id="deviceLabel">Laptop</span><span class="pod-caret" aria-hidden="true">&#9652;</span></button>
              <div class="pod-menu" id="deviceMenu" role="menu">
                <button class="pod-item" type="button" role="menuitem" data-device="mobile" data-w="390" data-h="800">Mobile</button>
                <button class="pod-item" type="button" role="menuitem" data-device="tablet" data-w="820" data-h="1180">Tablet</button>
                <button class="pod-item active" type="button" role="menuitem" data-device="laptop" data-w="1280" data-h="900">Laptop</button>
                <button class="pod-item" type="button" role="menuitem" data-device="desktop" data-w="1440" data-h="960">Desktop</button>
              </div>
            </div>
            <div class="preview-zoom" id="previewZoom">
              <button class="zoom-step" id="zoomOutBtn" type="button" aria-label="Zoom out">&minus;</button>
              <button class="zoom-val" id="zoomValue" type="button" title="Fit to width" aria-label="Fit to width">100%</button>
              <button class="zoom-step" id="zoomInBtn" type="button" aria-label="Zoom in">+</button>
          </div>
          <!-- Handoff.md silver trigger + slide-out panel -->
          <button class="handoff-trigger" id="handoffTrigger" type="button" title="Generate Backend Handoff">Handoff.md</button>
          <div class="handoff-overlay" id="handoffOverlay"></div>
          <div class="handoff-panel" id="handoffPanel">
            <div class="handoff-panel-header">
              <span class="handoff-panel-title">Backend Handoff.md</span>
              <button class="handoff-close" id="handoffClose" type="button" aria-label="Close">&times;</button>
            </div>
            <div class="handoff-panel-body">
              <p class="handoff-desc">Generate a portable backend-handoff specification from the current UI.</p>
              <div class="stack-select-group">
                <label class="stack-label">Target stack</label>
                <div class="stack-select" id="stackSelect">
                  <button class="stack-current" id="stackCurrent" type="button">Agnostic <span class="pod-caret">&#9662;</span></button>
                  <div class="stack-options" id="stackOptions">
                    <button class="stack-opt active" data-stack="agnostic">Agnostic</button>
                    <button class="stack-opt" data-stack="cloudflare">Cloudflare</button>
                    <button class="stack-opt" data-stack="node-express">Node-Express</button>
                    <button class="stack-opt" data-stack="supabase">Supabase</button>
                    <button class="stack-opt" data-stack="fastapi">FastAPI</button>
                    <button class="stack-opt" data-stack="nextjs">Next.js</button>
                    <button class="stack-opt" data-stack="firebase">Firebase</button>
                    <button class="stack-opt" data-stack="django">Django</button>
                    <button class="stack-opt" data-stack="rails">Rails</button>
                  </div>
                </div>
              </div>
              <button class="handoff-gen-btn" id="handoffGenBtn" type="button">Generate Handoff.md</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== LIBRARY ===== -->
    <div class="view" id="view-library">
      <div class="page">
        <span class="section-tag">SKILL_MODULE</span>
        <h2>Skills Library</h2>
        <p class="subtitle">Browse skills, templates, and design packages. Apply any skill to kickstart your next UI.</p>
        <input class="search-bar" id="librarySearch" placeholder="Search skills, templates, designs…" />
        <div class="category-filters" id="categoryFilters"></div>
        <div class="skill-grid" id="skillGrid"></div>
      </div>
    </div>

    <!-- ===== PRICING ===== -->
    <div class="view" id="view-pricing">
      <div class="page">
        <span class="section-tag">PLANS</span>
        <h2>Simple, transparent pricing</h2>
        <p class="subtitle">Start free. Upgrade when you need more power.</p>

        <div id="pricingCreditBar" style="display:none;max-width:480px;margin:0 auto 28px;text-align:center;padding:14px 18px;border-radius:14px;background:var(--glazier-glass-2);border:1px solid var(--line-dark);font-family:var(--font-mono);font-size:13px;color:var(--ink-on-dark-dim);">
          <span id="pricingCreditText">Loading balance...</span>
        </div>

        <div class="pricing-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;max-width:900px;margin:0 auto;">
          <div class="pricing-card" style="padding:22px;border-radius:var(--r-lg);border:1px solid var(--line-dark);background:var(--bg-raise);display:flex;flex-direction:column;gap:10px;">
            <h3 style="font-size:14px;letter-spacing:2px;font-weight:700;color:var(--metal-2);margin:0;">FREE</h3>
            <div class="price" style="font-size:32px;font-weight:800;color:var(--ink-on-dark);margin:4px 0;">$0</div>
            <ul style="list-style:none;padding:0;margin:0;font-size:13px;color:var(--ink-on-dark-dim);line-height:1.7;flex:1;">
              <li>3 AI generations / day</li>
              <li>Live sandbox preview</li>
              <li>Skills Library</li>
              <li>Mobile + Desktop</li>
            </ul>
            <button class="cta-btn secondary" id="pricingFreeBtn" style="width:100%;margin-top:8px;padding:12px;border-radius:10px;border:1px solid var(--line-dark);background:transparent;color:var(--ink-on-dark);font-family:var(--font-ui);font-weight:600;cursor:pointer;transition:all .15s;">Get Started</button>
          </div>

          <div class="pricing-card" style="padding:22px;border-radius:var(--r-lg);border:1px solid var(--teal-soft);background:var(--bg-raise);display:flex;flex-direction:column;gap:10px;position:relative;">
            <div style="position:absolute;top:-1px;right:16px;background:var(--teal);color:#04201d;font-size:11px;font-weight:700;padding:4px 10px;border-radius:0 0 8px 8px;font-family:var(--font-mono);letter-spacing:.5px;">POPULAR</div>
            <h3 style="font-size:14px;letter-spacing:2px;font-weight:700;color:var(--metal-2);margin:0;">STARTER</h3>
            <div class="price" style="font-size:32px;font-weight:800;color:var(--ink-on-dark);margin:4px 0;">$3<span style="font-size:14px;font-weight:400;color:var(--ink-on-dark-dim);"> — 3 credits</span></div>
            <ul style="list-style:none;padding:0;margin:0;font-size:13px;color:var(--ink-on-dark-dim);line-height:1.7;flex:1;">
              <li>Everything in Free</li>
              <li>Backend blueprint export</li>
              <li>Desktop sync</li>
              <li>Target stack handoff</li>
            </ul>
            <button class="cta-btn" id="pricingTestBtn" style="width:100%;margin-top:8px;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,var(--teal-bright),var(--teal));color:#04201d;font-family:var(--font-ui);font-weight:700;cursor:pointer;transition:all .15s;">Buy Starter</button>
          </div>

          <div class="pricing-card" style="padding:22px;border-radius:var(--r-lg);border:1px solid var(--line-dark);background:var(--bg-raise);display:flex;flex-direction:column;gap:10px;">
            <h3 style="font-size:14px;letter-spacing:2px;font-weight:700;color:var(--metal-2);margin:0;">CREDITS</h3>
            <div class="price" style="font-size:32px;font-weight:800;color:var(--ink-on-dark);margin:4px 0;">$5<span style="font-size:14px;font-weight:400;color:var(--ink-on-dark-dim);"> — 10 credits</span></div>
            <ul style="list-style:none;padding:0;margin:0;font-size:13px;color:var(--ink-on-dark-dim);line-height:1.7;flex:1;">
              <li>Everything in Starter</li>
              <li>Full SkillChain generation</li>
              <li>Webhook ingress</li>
              <li>7 edge models</li>
            </ul>
            <button class="cta-btn" id="pricingSmallBtn" style="width:100%;margin-top:8px;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,var(--teal-bright),var(--teal));color:#04201d;font-family:var(--font-ui);font-weight:700;cursor:pointer;transition:all .15s;">Buy Credits</button>
          </div>

          <div class="pricing-card" style="padding:22px;border-radius:var(--r-lg);border:1px solid var(--amber-soft);background:var(--bg-raise);display:flex;flex-direction:column;gap:10px;">
            <h3 style="font-size:14px;letter-spacing:2px;font-weight:700;color:var(--amber);margin:0;">PRO</h3>
            <div class="price" style="font-size:32px;font-weight:800;color:var(--ink-on-dark);margin:4px 0;">$12<span style="font-size:14px;font-weight:400;color:var(--ink-on-dark-dim);">/mo</span></div>
            <ul style="list-style:none;padding:0;margin:0;font-size:13px;color:var(--ink-on-dark-dim);line-height:1.7;flex:1;">
              <li>100 credits / month</li>
              <li>Unlimited webhook ingress</li>
              <li>Priority routing</li>
              <li>API access</li>
            </ul>
            <button class="cta-btn secondary" id="pricingProBtn" style="width:100%;margin-top:8px;padding:12px;border-radius:10px;border:1px solid var(--amber-soft);background:transparent;color:var(--amber);font-family:var(--font-ui);font-weight:600;cursor:pointer;transition:all .15s;">Subscribe</button>
          </div>
        </div>

        <p style="text-align:center;margin-top:28px;font-size:12px;color:var(--ink-on-dark-dim);font-family:var(--font-mono);">Secure payments via Stripe. No refunds, no lock-in. Cancel Pro anytime.</p>
      </div>
    </div>

    <!-- ===== DOCS ===== -->
    <div class="view" id="view-docs">
      <div class="page docs-content">
        <span class="section-tag">DOCS</span>
        <h2>Quickstart</h2>
        <p class="subtitle">Zero to your first live UI in under a minute.</p>
        <h3>0. Configure your API key</h3>
        <div class="step"><div class="step-num">0</div><div class="step-body"><p>Get a free <strong>OpenRouter key</strong> at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">openrouter.ai/keys</a>, then add it:</p><button class="inline-api-btn" id="docsApiBtn">Open API Settings</button></div></div>
        <h3>1. Generate your first UI</h3>
        <div class="step"><div class="step-num">1</div><div class="step-body"><p>On the <strong>Studio</strong> tab, type a prompt like <code>a dark dashboard with a sidebar and a chart</code> and press Enter.</p></div></div>
        <div class="step"><div class="step-num">2</div><div class="step-body"><p>Watch it render live. Switch device with the pod, zoom, then <strong>Export</strong> the HTML or the backend handoff.</p></div></div>
        <h3>2. Sync to desktop</h3>
        <div class="step"><div class="step-num">3</div><div class="step-body"><p>Run <code>node receiver.js</code> on your laptop, set the desktop IP in Settings, then <strong>Send to Desktop</strong>.</p></div></div>
        <h3>3. Webhook ingress</h3>
        <pre><code>POST /api/webhook
{ "prompt": "a landing page with a hero", "session": "my-session" }</code></pre>
        <p>The Worker processes it, broadcasts via SSE, and the studio renders it live.</p>
      </div>
    </div>

    <!-- ===== SETTINGS MODAL ===== -->
    <div class="modal-overlay hidden" id="keyModal">
      <div class="modal">
        <h2>Settings</h2>
        <div class="settings-section">
          <span class="section-tag">QUICK START</span>
          <p>New here? Generate UIs free — no key needed. <span class="free-badge" id="freeCountHint"></span></p>
          <button class="btn-primary" id="tryFreeBtn">&#10024; Try it free</button>
        </div>
        <div class="settings-section">
          <span class="section-tag">API KEY</span>
          <p>Add your own <strong>OpenRouter key</strong> (free at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">openrouter.ai/keys</a>) or a <strong>LogicLemonAI key</strong>.</p>
          <input type="password" id="keyInput" placeholder="sk-or-v1-…" spellcheck="false" autocomplete="off" />
          <div id="keyFeedback"></div>
          <button class="btn-primary" id="keyValidateBtn">Validate &amp; Save</button>
        </div>
        <div class="settings-section">
          <span class="section-tag">DEVICE SYNC · OPTIONAL</span>
          <p>Connect your Worker + desktop so builds sync and land in your IDE.</p>
          <input type="text" id="backendUrlInput" placeholder="Backend URL (https://… optional)" spellcheck="false" autocomplete="off" />
          <input type="text" id="workerUrlInput" placeholder="Worker URL (https://…) for cross-device sync" spellcheck="false" autocomplete="off" />
          <input type="text" id="desktopIpInput" placeholder="Desktop IP (e.g. 192.168.1.42)" spellcheck="false" autocomplete="off" />
          <input type="password" id="desktopKeyInput" placeholder="Desktop key (printed by receiver.js)" spellcheck="false" autocomplete="off" />
          <button class="btn-primary" id="saveConnBtn">Save connections</button>
          <div id="connFeedback"></div>
        </div>
        <div class="settings-section" id="creditsSection">
          <span class="section-tag">CREDITS &amp; PLAN</span>
          <p id="creditStatus">Loading your balance…</p>
          <div id="creditActions" style="display:none">
            <button class="btn-primary" id="buyTestBtn" style="margin-bottom:8px;font-size:12px;">Test $2 — 3 credits</button>
            <button class="btn-primary" id="buySmallBtn" style="margin-bottom:8px;">Buy 10 credits</button>
            <button class="btn-primary" id="buyLargeBtn" style="margin-bottom:8px;">Buy 50 credits</button>
            <button class="btn-ghost" id="subProBtn">Subscribe Pro — monthly</button>
          </div>
          <div id="creditFeedback"></div>
        </div>
        <button class="btn-ghost" id="keySkipBtn">Close</button>
        <div class="key-hint">Everything stays on this device. Never shared.</div>
      </div>
    </div>

  </div>
  <script src="client.js"></script>
<script>
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && window.parent !== window) {
    window.parent.postMessage({ type: 'close-fullscreen' }, '*');
  }
});
</script>
<!-- Inline: Share pod + Handoff.md slide-out -->
<script>
(function(){
  var sharePod = document.getElementById('sharePod');
  var shareTrigger = document.getElementById('shareTrigger');
  var shareMenu = document.getElementById('shareMenu');
  var handoffTrigger = document.getElementById('handoffTrigger');
  var handoffPanel = document.getElementById('handoffPanel');
  var handoffOverlay = document.getElementById('handoffOverlay');
  var handoffClose = document.getElementById('handoffClose');
  var stackCurrent = document.getElementById('stackCurrent');
  var stackOptions = document.getElementById('stackOptions');
  var handoffGenBtn = document.getElementById('handoffGenBtn');

  function closeSharePod(){ if(sharePod) sharePod.classList.remove('open'); }
  function closeHandoffPanel(){ if(handoffPanel) handoffPanel.classList.remove('open'); if(handoffOverlay) handoffOverlay.classList.remove('open'); }
  function openHandoffPanel(){ if(handoffPanel) handoffPanel.classList.add('open'); if(handoffOverlay) handoffOverlay.classList.add('open'); closeSharePod(); }

  if(shareTrigger) shareTrigger.addEventListener('click', function(e){ e.stopPropagation(); sharePod.classList.toggle('open'); });
  document.addEventListener('click', function(e){ if(sharePod && !sharePod.contains(e.target)) closeSharePod(); });
  if(handoffTrigger) handoffTrigger.addEventListener('click', function(e){ e.stopPropagation(); openHandoffPanel(); });
  if(handoffOverlay) handoffOverlay.addEventListener('click', closeHandoffPanel);
  if(handoffClose) handoffClose.addEventListener('click', closeHandoffPanel);
  if(stackCurrent) stackCurrent.addEventListener('click', function(e){ e.stopPropagation(); stackOptions.classList.toggle('open'); });
  document.addEventListener('click', function(e){ if(stackOptions && !stackOptions.contains(e.target)) stackOptions.classList.remove('open'); });
  if(stackOptions) stackOptions.addEventListener('click', function(e){
    var opt = e.target.closest('.stack-opt');
    if(!opt) return;
    stackOptions.querySelectorAll('.stack-opt').forEach(function(o){ o.classList.remove('active'); });
    opt.classList.add('active');
    stackCurrent.innerHTML = opt.textContent + ' <span class="pod-caret">&#9662;</span>';
    stackOptions.classList.remove('open');
  });
  if(handoffGenBtn) handoffGenBtn.addEventListener('click', function(){
    var api = window.WebhooksEmail;
    if(!api){ alert('Studio not ready. Try again.'); return; }
    var result = api.getLastResult();
    if(!result){ alert('Nothing to export — generate a UI first.'); return; }
    var stack = (stackOptions ? stackOptions.querySelector('.stack-opt.active') : null);
    var stackName = stack ? stack.getAttribute('data-stack') : 'agnostic';
    var stackLabel = stack ? stack.textContent : 'Agnostic';
    var htmlLen = (result.html || '').length;
    var cssLen = (result.css || '').length;
    var jsLen = (result.js || '').length;
    var totalLen = htmlLen + cssLen + jsLen;
    var now = new Date().toISOString().slice(0,19).replace('T',' ');
    var md = '# Implementation Handoff\\n\\n';
    md += '> Auto-generated by LogicLemonAI Studio \\u00B7 ' + now + '\\n';
    md += '> Target stack: **' + stackLabel + '**\\n\\n';
    md += '## Source Prompt\\n\\n';
    md += '\`\`\`\\n' + (window.lastPrompt || '(not recorded)') + '\\n\`\`\`\\n\\n';
    md += '## Generated Output Summary\\n\\n';
    md += '| Component | Size |\\n|-----------|------|\\n';
    md += '| HTML | ' + htmlLen + ' chars |\\n| CSS | ' + cssLen + ' chars |\\n| JS | ' + jsLen + ' chars |\\n| **Total** | **' + totalLen + ' chars** |\\n\\n';
    md += '## Target Stack\\n\\n';
    md += '- **Stack**: ' + stackLabel + '\\n';
    md += '- **Provider**: ' + (stackName === 'agnostic' ? 'Any' : stackLabel) + '\\n\\n';
    md += '## Architecture\\n\\n';
    md += '- **Rendering**: Client-side blob URL \\u2192 sandboxed iframe\\n';
    md += '- **Framework**: Glazier Kit design system (tokens.css + glazier.css)\\n';
    md += '- **Export**: Self-contained HTML with inline CSS/JS\\n\\n';
    md += '## Integration Instructions\\n\\n';
    md += '### Standalone HTML file\\n\\n';
    md += 'Save the downloaded HTML file as-is.\\n\\n';
    md += '\`\`\`bash\\npython3 -m http.server 8080\\n\`\`\`\\n\\n';
    md += '### Extract into a project\\n\\n';
    md += '\`\`\`\\nproject/\\n\\u2514\\u2500\\u2500 index.html    # HTML block\\n\\u2514\\u2500\\u2500 styles.css    # CSS block\\n\\u2514\\u2500\\u2500 app.js        # JS block\\n\`\`\`\\n\\n';
    md += '---\\n\\n## Generated HTML\\n\\n\`\`\`html\\n' + (result.html || '') + '\\n\`\`\`\\n\\n';
    md += '## Generated CSS\\n\\n\`\`\`css\\n' + (result.css || '') + '\\n\`\`\`\\n\\n';
    md += '## Generated JS\\n\\n\`\`\`javascript\\n' + (result.js || '') + '\\n\`\`\`\\n\\n';
    md += '---\\n\\n*Generated by [LogicLemonAI Studio](https://logiclemonai.workers.dev)*\\n';
    var blob = new Blob([md], {type:'text/markdown'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'HANDOFF-' + Date.now() + '.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 5000);
    closeHandoffPanel();
    var toast = document.querySelector('.copy-toast');
    if(toast){ toast.textContent = 'Handoff.md downloaded'; toast.classList.add('show'); clearTimeout(toast._timer); toast._timer = setTimeout(function(){ toast.classList.remove('show'); }, 2000); }
    else alert('Handoff.md downloaded');
  });
  /* Share pod handoff button — uses same logic but with the selected stack (or defaults to agnostic) */
  if(shareMenu) shareMenu.addEventListener('click', function(e){
    var btn = e.target.closest('.pod-item[data-action="handoff"]');
    if(!btn) return;
    e.stopPropagation();
    closeSharePod();
    /* Get current stack selection or default */
    var activeStack = stackOptions ? stackOptions.querySelector('.stack-opt.active') : null;
    if(activeStack) stackCurrent.innerHTML = activeStack.textContent + ' <span class="pod-caret">&#9662;</span>';
    handoffGenBtn.click();
  });
})();
</script>
<!-- broken-img-handler -->
<script>
(function(){
  if(window.__brokenImgHandler)return;
  window.__brokenImgHandler=true;
  var MAX=5,DELAYS=[2000,4000,8000,16000,32000];
  document.addEventListener('error',function(e){
    var img=e.target;
    if(!img||img.tagName!=='IMG')return;
    var liveSrc=img.getAttribute('src');
    var src=img.dataset.haOriginalSrc||liveSrc;
    if(!src)return;
    if(img.dataset.haOriginalSrc&&liveSrc&&liveSrc!==img.dataset.haOriginalSrc&&liveSrc.indexOf('_r=')<0){src=liveSrc;img.dataset.haOriginalSrc=src;img.dataset.haRetryCount='0'}
    else if(!img.dataset.haOriginalSrc){img.dataset.haOriginalSrc=src}
    var attempt=parseInt(img.dataset.haRetryCount||'0',10);
    if(img.dataset.haPhId){var old=document.getElementById(img.dataset.haPhId);if(old)old.remove()}
    var ph=document.createElement('div');
    ph.className='ha-img-placeholder'+(attempt>=MAX?' ha-failed':'');
    ph.id='ha-ph-'+Math.random().toString(36).slice(2,9);
    var w=img.getAttribute('width');var h=img.getAttribute('height');
    if(w)ph.style.width=w+(isNaN(Number(w))?'':'px');
    else if(img.style.width)ph.style.width=img.style.width;
    else if(img.width>1)ph.style.width=img.width+'px';
    if(h)ph.style.height=h+(isNaN(Number(h))?'':'px');
    else if(img.style.height)ph.style.height=img.style.height;
    else if(img.height>1)ph.style.height=img.height+'px';
    ph.textContent=attempt>=MAX?'Image unavailable':'Loading image\\u2026';
    img.dataset.haPhId=ph.id;
    if(img.dataset.haOrigDisplay==null)img.dataset.haOrigDisplay=img.style.display||'';
    img.style.display='none';
    img.insertAdjacentElement('afterend',ph);
    if(attempt<MAX){
      img.dataset.haRetryCount=String(attempt+1);
      setTimeout(function(){
        if(!img.isConnected)return;
        if(img.dataset.haOriginalSrc!==src)return;
        if(img.complete&&img.naturalWidth>0)return;
        var curSrc=img.getAttribute('src');
        if(curSrc&&curSrc.indexOf(src)!==0)return;
        var fresh=src+(src.indexOf('?')>=0?'&':'?')+'_r='+(attempt+1)+'_'+Date.now();
        img.src=fresh;
      },DELAYS[attempt]);
    }
  },true);
  document.addEventListener('load',function(e){
    var img=e.target;
    if(!img||img.tagName!=='IMG')return;
    if(img.dataset.haPhId){
      var ph=document.getElementById(img.dataset.haPhId);
      if(ph)ph.remove();
      delete img.dataset.haPhId;
      img.style.display=img.dataset.haOrigDisplay||'';
      delete img.dataset.haOrigDisplay;
      delete img.dataset.haOriginalSrc;
      delete img.dataset.haRetryCount;
    }
  },true);
})();
</script>
</body>
</html>
`,
};

ASSETS["landing.html"] = {
  contentType: "text/html",
  content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LogicLemonAI — build anywhere, bridge to production</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="tokens.css">
  <link rel="stylesheet" href="glazier.css">

  <!-- ===== PAGE ===== -->
  <style>
  html{scroll-behavior:smooth;}
  body{overflow-x:hidden;}
  .wrap{max-width:1140px;margin:0 auto;padding:0 6vw;}
  .bg{position:fixed;inset:0;z-index:0;pointer-events:none;
    background:radial-gradient(1100px 640px at 50% -8%,rgba(63,224,208,.09),transparent 60%),
    radial-gradient(820px 760px at 90% 8%,rgba(246,169,59,.07),transparent 58%),
    radial-gradient(900px 800px at 8% 108%,rgba(36,75,110,.30),transparent 60%),
    linear-gradient(180deg,var(--bg-base),var(--bg-void));}
  .bg::before{content:"";position:absolute;inset:0;
    background-image:linear-gradient(rgba(120,170,210,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(120,170,210,.045) 1px,transparent 1px);
    background-size:46px 46px;-webkit-mask-image:radial-gradient(circle at 50% 28%,#000 18%,transparent 72%);mask-image:radial-gradient(circle at 50% 28%,#000 18%,transparent 72%);}
  .page{position:relative;z-index:1;}

  header{display:flex;align-items:center;gap:18px;padding:18px 6vw;position:sticky;top:0;z-index:20;background:linear-gradient(180deg,rgba(7,11,18,.85),rgba(7,11,18,0));-webkit-backdrop-filter:blur(9px);backdrop-filter:blur(9px);}
  .brand{display:flex;align-items:center;gap:11px;font-weight:800;font-size:17px;letter-spacing:-.3px;}
  .brand .badge{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;}
  .brand .badge .glz-node-dot{width:8px;height:8px;}
  header nav{margin-left:auto;display:flex;gap:6px;align-items:center;}
  header nav a.link{color:var(--ink-on-dark-dim);text-decoration:none;font-size:14px;padding:8px 12px;border-radius:8px;transition:color var(--t-fast);}
  header nav a.link:hover{color:var(--teal);}
  @media(max-width:820px){header nav .link{display:none;}}

  .hero{padding:54px 0 36px;text-align:center;}
  .eyebrow{display:inline-flex;align-items:center;gap:10px;padding:7px 15px;border:1px solid var(--line-dark);border-radius:var(--r-pill);font-family:var(--font-mono);font-size:11px;letter-spacing:2px;color:var(--ink-on-dark-dim);background:rgba(255,255,255,.03);margin-bottom:26px;}
  .eyebrow b{color:var(--teal);font-weight:400;} .eyebrow .amx{color:var(--amber);}
  .hero h1{font-size:clamp(34px,6.2vw,68px);line-height:1.02;font-weight:900;letter-spacing:-1.5px;margin:0 auto 22px;max-width:15ch;}
  .hero h1 .accent{background:linear-gradient(120deg,var(--metal-hi),var(--metal-2) 60%,var(--metal-4));-webkit-background-clip:text;background-clip:text;color:transparent;}
  .hero .sub{max-width:62ch;margin:0 auto 30px;font-size:clamp(15px,2vw,18px);line-height:1.6;color:var(--ink-on-dark-dim);}
  .hero .sub strong{color:var(--ink-on-dark);font-weight:700;}
  .cta-row{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;}
  .trust{display:flex;gap:8px 24px;justify-content:center;flex-wrap:wrap;margin-top:28px;font-family:var(--font-mono);font-size:11.5px;color:var(--ink-on-dark-dim);}
  .trust span{display:inline-flex;align-items:center;gap:7px;}
  .trust .d{width:5px;height:5px;border-radius:50%;background:var(--teal);} .trust .d.a{background:var(--amber);} .trust .d.s{background:var(--metal-1);}

  .hero-viz{display:flex;align-items:center;justify-content:center;margin:52px auto 0;max-width:1000px;}
  .device{flex-shrink:0;padding:10px;}
  .phone{width:196px;height:316px;border-radius:34px;}
  .desktop{flex:1;min-width:0;max-width:580px;height:356px;border-radius:20px;}
  .screen{height:100%;border-radius:24px;background:linear-gradient(165deg,#0c1420,#070b12);border:1px solid rgba(0,0,0,.5);box-shadow:inset 0 2px 14px rgba(0,0,0,.6);padding:14px;overflow:hidden;position:relative;}
  .desktop .screen{border-radius:12px;}
  .scr-tag{font-family:var(--font-mono);font-size:10px;letter-spacing:1px;color:var(--ink-on-dark-dim);display:flex;align-items:center;gap:6px;margin-bottom:10px;}
  .live{margin-left:auto;display:inline-flex;align-items:center;gap:5px;color:var(--amber);} .live i{width:6px;height:6px;border-radius:50%;background:var(--amber);box-shadow:0 0 8px var(--amber-soft);}
  .bubble{background:rgba(4,8,14,.55);border:1px solid var(--line-dark);border-radius:11px;padding:9px 11px;font-size:11.5px;line-height:1.4;color:var(--ink-on-dark);margin-bottom:9px;}
  .bubble.me{border-color:var(--teal-soft);color:var(--teal);background:rgba(63,224,208,.07);}
  .mini-ui{display:flex;flex-direction:column;gap:7px;margin-top:4px;}
  .mini-ui .row{height:12px;border-radius:4px;background:linear-gradient(90deg,rgba(120,170,210,.22),rgba(120,170,210,.05));}
  .mini-ui .row.s{width:55%;} .mini-ui .chip{height:26px;width:88px;border-radius:7px;background:linear-gradient(135deg,var(--teal-bright),var(--teal));box-shadow:0 0 14px var(--teal-soft);}
  .browser-bar{display:flex;align-items:center;gap:6px;margin-bottom:12px;}
  .browser-bar i{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.16);display:block;} .browser-bar i:first-child{background:var(--ember);opacity:.7;}
  .browser-bar .url{margin-left:8px;flex:1;height:18px;border-radius:6px;background:rgba(4,8,14,.5);border:1px solid var(--line-dark);}
  .preview-grid{display:grid;grid-template-columns:118px 1fr;gap:12px;height:252px;}
  .preview-grid .side{display:flex;flex-direction:column;gap:8px;}
  .preview-grid .side .nav{height:11px;border-radius:3px;background:rgba(120,170,210,.16);} .preview-grid .side .nav.on{background:var(--teal);box-shadow:0 0 10px var(--teal-soft);width:80%;}
  .cards{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
  .pcard{border:1px solid var(--line-dark);border-radius:10px;background:rgba(8,14,22,.5);padding:12px;display:flex;flex-direction:column;gap:8px;}
  .pcard .big{font-size:20px;font-weight:800;color:var(--ink-on-dark);} .pcard.hot{border-color:var(--amber-soft);box-shadow:0 0 16px var(--amber-faint);} .pcard.hot .big{color:var(--amber);}
  .pcard .ln{height:8px;border-radius:3px;background:rgba(120,170,210,.18);} .pcard .ln.s{width:60%;}
  .bridge{position:relative;flex:1;min-width:60px;max-width:140px;height:120px;display:flex;align-items:center;}
  .bridge .lbl{position:absolute;top:50%;left:50%;transform:translate(-50%,-150%);font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:var(--teal);white-space:nowrap;}
  .packet{position:absolute;top:50%;left:0;width:11px;height:11px;border-radius:50%;margin-top:-5px;background:var(--teal-bright);box-shadow:0 0 10px var(--teal),0 0 20px var(--teal-soft);animation:travel 2.4s var(--ease) infinite;}
  @keyframes travel{0%{left:2%;opacity:0;}12%{opacity:1;}88%{opacity:1;}100%{left:98%;opacity:0;}}
  .viz-cap{font-family:var(--font-mono);font-size:11px;color:var(--ink-on-dark-dim);margin-top:18px;}
  @media(max-width:860px){.hero-viz{flex-direction:column;}.phone{width:180px;height:auto;min-height:240px;}.desktop{width:100%;max-width:440px;height:auto;min-height:280px;flex:none;}.bridge{width:120px;height:80px;transform:rotate(90deg);}}

  section.band{padding:72px 0;position:relative;}
  .sec-head{text-align:center;max-width:62ch;margin:0 auto 44px;}
  .sec-head h2{font-size:clamp(26px,3.6vw,40px);font-weight:800;letter-spacing:-.8px;margin:12px 0 12px;}
  .sec-head p{color:var(--ink-on-dark-dim);font-size:16px;line-height:1.6;margin:0;}

  .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px;}
  .step{padding:26px 22px;border-radius:var(--r-lg);}
  .step .n{display:inline-flex;align-items:center;justify-content:center;min-width:46px;height:28px;padding:0 10px;border-radius:8px;font-family:var(--font-mono);font-size:12px;font-weight:700;margin-bottom:16px;}
  .step h3{font-size:19px;font-weight:700;margin:0 0 8px;} .step p{color:var(--ink-on-dark-dim);font-size:14px;line-height:1.55;margin:0;}
  .step.w h3{color:var(--ink-on-dark);}

  .wedge2{display:grid;grid-template-columns:1.02fr .98fr;gap:42px;align-items:center;}
  .wedge2-copy h2{font-size:clamp(26px,3.6vw,38px);font-weight:800;letter-spacing:-.8px;margin:12px 0 16px;}
  .wedge2-copy h2 em{font-style:normal;color:var(--amber);}
  .wedge2-copy p{color:var(--ink-on-dark-dim);font-size:15.5px;line-height:1.65;margin:0 0 14px;}
  .wedge2-copy strong{color:var(--ink-on-dark);font-weight:700;} .wedge2-copy .tl{color:var(--teal);font-weight:600;}
  .ticks{list-style:none;padding:0;margin:18px 0 0;display:flex;flex-direction:column;gap:10px;}
  .ticks li{position:relative;padding-left:26px;font-size:14px;color:var(--ink-on-dark);}
  .ticks li::before{content:"\\2713";position:absolute;left:0;top:0;color:var(--teal);font-weight:800;}
  .handoff{padding:12px;border-radius:18px;}
  .handoff .doc{background:linear-gradient(165deg,#0c1420,#070b12);border:1px solid rgba(0,0,0,.5);border-radius:12px;box-shadow:inset 0 2px 14px rgba(0,0,0,.55);padding:18px;font-family:var(--font-mono);font-size:12.5px;line-height:1.5;}
  .hd-bar{display:flex;align-items:center;gap:9px;font-weight:700;color:var(--ink-on-dark);padding-bottom:11px;margin-bottom:11px;border-bottom:1px solid var(--line-dark);}
  .hd-sec{color:var(--teal);font-weight:700;margin:13px 0 5px;font-size:10.5px;letter-spacing:1px;}
  .hd-line{color:var(--ink-on-dark-dim);padding:3px 0;display:flex;align-items:center;gap:9px;}
  .m{display:inline-block;min-width:42px;text-align:center;padding:1px 6px;border-radius:5px;font-size:10px;font-weight:700;border:1px solid var(--teal-soft);}
  .m.get{background:rgba(63,224,208,.12);color:var(--teal);} .m.post{background:rgba(107,240,227,.16);color:var(--teal-bright);}
  .hd-wire{margin-top:9px;padding:10px 12px;border:1px dashed var(--amber-soft);border-radius:10px;color:var(--ink-on-dark);background:rgba(246,169,59,.07);display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
  .hd-wire .ar{color:var(--amber);} .hd-wire .el{color:var(--teal-bright);}
  @media(max-width:860px){.wedge2{grid-template-columns:1fr;gap:26px;}}

  .why{display:grid;grid-template-columns:1.1fr 1fr;gap:40px;align-items:center;}
  .why .pts{display:flex;flex-direction:column;gap:16px;}
  .pt{display:flex;gap:14px;align-items:flex-start;}
  .pt .ic{flex-shrink:0;width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:rgba(63,224,208,.1);border:1px solid var(--teal-soft);color:var(--teal);font-size:16px;}
  .pt h4{margin:2px 0 4px;font-size:16px;font-weight:700;} .pt p{margin:0;color:var(--ink-on-dark-dim);font-size:14px;line-height:1.5;}
  .why .vs{padding:26px;border-radius:var(--r-lg);}
  .vs .row{display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid var(--line-dark);font-size:14px;}
  .vs .row:last-child{border-bottom:none;}
  .vs .row .them{color:var(--ink-on-dark-dim);text-decoration:line-through;text-decoration-color:rgba(159,176,195,.4);}
  .vs .row .us{color:var(--teal);font-weight:700;margin-left:auto;}
  @media(max-width:860px){.why{grid-template-columns:1fr;gap:26px;}}

  .feat{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px;}
  .fcard{padding:22px;border-radius:var(--r-lg);}
  .fcard .ic{width:40px;height:40px;border-radius:11px;display:grid;place-items:center;background:rgba(63,224,208,.1);border:1px solid var(--teal-soft);color:var(--teal);margin-bottom:14px;font-size:17px;}
  .fcard h4{margin:0 0 6px;font-size:15.5px;font-weight:700;} .fcard p{margin:0;color:var(--ink-on-dark-dim);font-size:13px;line-height:1.5;}

  .final{text-align:center;padding:44px 28px;border-radius:24px;max-width:720px;margin:0 auto;overflow:hidden;position:relative;}
  .final h2{font-size:clamp(26px,4vw,38px);font-weight:900;letter-spacing:-.8px;margin:0 0 10px;}
  .final p{color:var(--ink-on-dark-dim);margin:0 0 26px;font-size:15.5px;}
  .capture{display:flex;gap:10px;max-width:440px;margin:0 auto;flex-wrap:wrap;}
  .capture .glz-field{flex:1;min-width:200px;}
  .final .fine{margin-top:14px;font-family:var(--font-mono);font-size:11px;color:var(--ink-on-dark-dim);}

  footer{padding:44px 6vw;border-top:1px solid var(--line-dark);margin-top:28px;display:flex;flex-wrap:wrap;gap:16px;align-items:center;color:var(--ink-on-dark-dim);font-size:13px;}
  footer .brand{font-size:15px;color:var(--ink-on-dark);}
  footer .by{font-family:var(--font-mono);font-size:11px;}
  footer nav{margin-left:auto;display:flex;gap:18px;}
  footer a{color:var(--ink-on-dark-dim);text-decoration:none;} footer a:hover{color:var(--teal);}
  </style>
</head>
<body class="glz-body">
  <div class="bg"></div>
  <div class="page">

    <header>
      <div class="brand">
        <span class="badge glz-surface-metal"><span class="glz-node-dot"></span></span>
        LogicLemonAI
      </div>
      <nav>
        <a class="link" href="#how">How it works</a>
        <a class="link" href="#ship">Backend</a>
        <a class="link" href="#why">Why</a>
        <a class="link" href="/inspiration.html">Inspiration</a>
        <a class="link" href="#studio">Studio</a>
        <a class="glz-btn" href="/signin.html">Sign in</a>
        <a class="glz-btn glz-btn-primary" href="/studio">Start building</a>
      </nav>
    </header>

    <!-- HERO -->
    <section class="hero wrap">
      <span class="eyebrow"><span class="amx">&#9670;</span> BUILD ANYWHERE <b>·</b> BRIDGE TO PRODUCTION</span>
      <h1>Vibe it on your phone.<br>It's on your <span class="accent">desktop</span> before you sit down.</h1>
      <p class="sub">LogicLemonAI turns plain English into live, working UI — from your phone or your desk. Then, at export, it hands you a <strong>portable backend blueprint</strong> to make it real in the stack you already use. No lock-in. No copy-paste. No mockup graveyard.</p>
      <div class="cta-row">
        <a class="glz-btn glz-btn-primary" href="/studio">Start building — free</a>
        <a class="glz-btn glz-btn-metal" href="#how">Watch the 20-sec demo</a>
      </div>
      <div class="trust">
        <span><span class="d s"></span> Build from any device</span>
        <span><span class="d a"></span> Portable backend blueprint</span>
        <span><span class="d"></span> Your keys · your stack</span>
      </div>

      <div class="hero-viz">
        <div class="device phone glz-surface-metal">
          <div class="screen">
            <div class="scr-tag"><span class="glz-node-dot" style="width:6px;height:6px;"></span> PHONE <span class="live"><i></i>LIVE</span></div>
            <div class="bubble me">build me a pricing page — 3 tiers, dark, teal accents</div>
            <div class="bubble">On it — rendering &#8595;</div>
            <div class="mini-ui"><div class="row"></div><div class="row s"></div><div class="chip"></div></div>
          </div>
        </div>

        <div class="bridge" aria-hidden="true">
          <span class="lbl">webhook &#8594;</span>
          <svg class="glz-electric-line" viewBox="0 0 140 30" preserveAspectRatio="none"><path d="M2,15 C 46,2 94,28 138,15"/></svg>
          <span class="packet"></span>
        </div>

        <div class="device desktop glz-surface-metal">
          <div class="screen">
            <div class="browser-bar"><i></i><i></i><i></i><span class="url"></span></div>
            <div class="preview-grid">
              <div class="side"><div class="nav on"></div><div class="nav"></div><div class="nav"></div><div class="nav"></div><div class="nav"></div></div>
              <div class="cards">
                <div class="pcard"><span class="big">$0</span><div class="ln"></div><div class="ln s"></div></div>
                <div class="pcard"><span class="big">$12</span><div class="ln"></div><div class="ln s"></div></div>
                <div class="pcard"><span class="big">$29</span><div class="ln"></div><div class="ln s"></div></div>
                <div class="pcard hot"><span class="big">Pro</span><div class="ln"></div><div class="ln s"></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p class="viz-cap">&#8593; silver-framed devices, one teal thread — your build crosses from phone to desk, live</p>
    </section>

    <!-- HOW IT WORKS -->
    <section class="band wrap" id="how">
      <div class="sec-head">
        <span class="glz-label-mono">two bridges · zero copy-paste</span>
        <h2>Most tools hand you a mockup and walk away.</h2>
        <p>LogicLemonAI carries your build across both bridges — to your desk, and into production.</p>
      </div>
      <div class="steps">
        <div class="step glz-surface-glass"><div class="n glz-surface-metal glz-text-readable">01</div><h3>Vibe it</h3><p>Phone or desk, plain English &#8594; live UI. Gemma builds it in your browser as you type.</p></div>
        <div class="step glz-surface-glass"><div class="n glz-surface-metal glz-text-readable">02</div><h3>Bridge to your desk</h3><p>One webhook fires the build to your endpoint — IDE, repo, CI, inbox. It's waiting when you sit down.</p></div>
        <div class="step w glz-surface-glass"><div class="n glz-surface-metal glz-text-readable">03</div><h3>Get the blueprint</h3><p>At export, a portable <span style="color:var(--amber);">backend spec</span> for that exact UI — data model, endpoints, wire-up.</p></div>
        <div class="step glz-surface-glass"><div class="n glz-surface-metal glz-text-readable">04</div><h3>Ship in your stack</h3><p>Implement it yourself or hand it to your AI agent. Your infra, your host, your call.</p></div>
      </div>
    </section>

    <!-- WEDGE #2: BACKEND-HANDOFF -->
    <section class="band wrap" id="ship">
      <div class="wedge2">
        <div class="wedge2-copy">
          <span class="glz-label-mono" style="color:var(--amber);">the second bridge · mockup &#8594; production</span>
          <h2>Beautiful UIs <em>die</em> without a backend. Yours won't.</h2>
          <p>Every other tool hands you a gorgeous mockup and leaves you at the cliff. At export, LogicLemonAI generates a <strong>portable backend blueprint</strong> for the exact UI you built — data model, endpoints, auth, and a <span class="tl">wire-up map</span> binding every control to the endpoint it needs.</p>
          <p>Stack-agnostic on principle: we tell you <strong>what</strong> to build, never lock you into <strong>where</strong>. Take it to your own infra, your IDE, or hand it straight to Cursor, Claude, or an MCP agent.</p>
          <ul class="ticks">
            <li>Tailored to your UI — not boilerplate</li>
            <li>Your stack, your host, your call</li>
            <li>Human- or agent-implementable</li>
          </ul>
        </div>
        <div class="wedge2-viz">
          <div class="handoff glz-surface-metal">
            <div class="doc">
              <div class="hd-bar"><span class="glz-node-dot"></span> backend-handoff.md</div>
              <div class="hd-sec">## DATA MODEL</div>
              <div class="hd-line">User · id, email, plan</div>
              <div class="hd-line">Project · id, ownerId, spec</div>
              <div class="hd-sec">## API ENDPOINTS</div>
              <div class="hd-line"><span class="m post">POST</span> /auth/session</div>
              <div class="hd-line"><span class="m get">GET</span> /projects</div>
              <div class="hd-line"><span class="m post">POST</span> /projects</div>
              <div class="hd-sec">## WIRE-UP MAP</div>
              <div class="hd-wire"><span class="el">#signupBtn</span> <span class="ar">&#8594;</span> POST /auth/session</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- WHY -->
    <section class="band wrap" id="why">
      <div class="sec-head"><span class="glz-label-mono">why logiclemonai</span><h2>Others lock you in. We bridge you out.</h2></div>
      <div class="why">
        <div class="pts">
          <div class="pt"><span class="ic">&#8644;</span><div><h4>Agnostic by design</h4><p>Your IDE, your repo, your host. We don't own your output or your deploy — we hand it to wherever you already work.</p></div></div>
          <div class="pt"><span class="ic">&#9671;</span><div><h4>Open models, your keys</h4><p>Powered by open-weight Gemma via OpenRouter. Bring your own key, swap models, keep your costs and your data yours.</p></div></div>
          <div class="pt"><span class="ic">&#8619;</span><div><h4>You own what you make</h4><p>Clean, framework-free HTML/CSS/JS plus a portable backend spec. Export it, fork it, walk away with it any time.</p></div></div>
        </div>
        <div class="vs glz-surface-glass">
          <div class="row"><span class="them">Locked to their host</span> <span class="us">Any stack &#10003;</span></div>
          <div class="row"><span class="them">Their model only</span> <span class="us">Your model &#10003;</span></div>
          <div class="row"><span class="them">Desktop to start</span> <span class="us">Start on mobile &#10003;</span></div>
          <div class="row"><span class="them">Mockup, no backend</span> <span class="us" style="color:var(--amber);">Portable blueprint &#10003;</span></div>
          <div class="row"><span class="them">Export = paywall</span> <span class="us">Own it free &#10003;</span></div>
        </div>
      </div>
    </section>

    <!-- STUDIO -->
    <section class="band wrap" id="studio">
      <div class="sec-head"><span class="glz-label-mono">not a toy</span><h2>A real studio — not a one-shot generator.</h2><p>The bridges get you moving. The studio is why you stay.</p></div>
      <div class="feat">
        <div class="fcard glz-surface-glass"><div class="ic">&#9733;</div><h4>SkillChain</h4><p>Architect &#8594; styler &#8594; engineer. Multiple passes for production-grade output, not a rushed guess.</p></div>
        <div class="fcard glz-surface-glass"><div class="ic">&#9889;</div><h4>Live + self-healing</h4><p>Renders instantly in a sandbox and repairs its own runtime errors automatically.</p></div>
        <div class="fcard glz-surface-glass"><div class="ic">&#9636;</div><h4>Skills &amp; Design library</h4><p>A curated, growing library of skills and design packages — the craft that makes output yours.</p></div>
        <div class="fcard glz-surface-glass"><div class="ic" style="background:rgba(246,169,59,.12);border-color:var(--amber-soft);color:var(--amber);">&#9004;</div><h4>Backend architect</h4><p>A SkillChain pass that writes the portable backend spec for what you built — endpoints, data, wire-up.</p></div>
      </div>
    </section>

    <!-- FINAL CTA -->
    <section class="band wrap" id="start">
      <div class="final glz-surface-glass">
        <svg class="glz-electric-line" viewBox="0 0 720 200" preserveAspectRatio="none" aria-hidden="true" style="opacity:.45;"><path class="glz-slow" d="M-20,40 C 200,120 520,-20 740,80"/><path class="glz-slow" d="M-20,150 C 240,80 500,180 740,120"/></svg>
        <div style="position:relative;z-index:2;">
          <h2>Start building. Keep what you make.</h2>
          <p>Free to vibe and render. Sign in only when you want to send it to your desktop, export the backend, or save it.</p>
          <form class="capture" onsubmit="return false;">
            <input class="glz-field" type="email" placeholder="you@studio.dev" aria-label="email">
            <button class="glz-btn glz-btn-primary" type="submit">Start free &#8594;</button>
          </form>
          <div class="fine">No card. No lock-in. Your email is never shared.</div>
        </div>
      </div>
    </section>

    <footer>
      <div class="brand"><span class="badge glz-surface-metal" style="width:26px;height:26px;border-radius:8px;"><span class="glz-node-dot" style="width:7px;height:7px;"></span></span> LogicLemonAI</div>
      <span class="by">build anywhere · bridge to production</span>
      <nav><a href="#how">How</a><a href="#ship">Backend</a><a href="#why">Why</a><a href="/inspiration.html">Inspiration</a><a href="#studio">Studio</a><a href="#start">Start</a></nav>
    </footer>

  </div>
</body>
</html>
`,
};

ASSETS["manifest.json"] = {
  contentType: "application/json",
  content: `{
  "name": "LogicLemonAI",
  "short_name": "LogicLemonAI",
  "description": "An AI design studio — vibe a UI on any device, then bridge it to production. Build anywhere, ship into your own stack.",
  "start_url": "/",
  "scope": "/",
  "id": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "#04060a",
  "theme_color": "#070b12",
  "categories": ["developer-tools", "productivity", "utilities"],
  "icons": [
    { "src": "/icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" },
    { "src": "/icon.svg", "sizes": "192x192", "type": "image/svg+xml", "purpose": "any" },
    { "src": "/icon.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "any" }
  ]
}
`,
};

ASSETS["signin.html"] = {
  contentType: "text/html",
  content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Node — LogicLemonAI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="tokens.css">
  <link rel="stylesheet" href="glazier.css">

  <!-- ===== PAGE (layout only) ===== -->
  <style>
  body{overflow-x:hidden;}
  .bg{position:fixed;inset:0;z-index:0;pointer-events:none;
    background:radial-gradient(1000px 600px at 50% -10%,rgba(63,224,208,.10),transparent 60%),
    radial-gradient(760px 680px at 88% 6%,rgba(246,169,59,.06),transparent 58%),
    radial-gradient(820px 720px at 10% 110%,rgba(36,75,110,.28),transparent 60%),
    linear-gradient(180deg,var(--bg-base),var(--bg-void));}
  .bg::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(120,170,210,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(120,170,210,.045) 1px,transparent 1px);background-size:46px 46px;-webkit-mask-image:radial-gradient(circle at 50% 40%,#000 22%,transparent 76%);mask-image:radial-gradient(circle at 50% 40%,#000 22%,transparent 76%);}
  .auth-wrap{position:relative;z-index:2;min-height:100vh;display:grid;place-items:center;padding:24px;}
  .stack{width:100%;max-width:418px;}
  .node{padding:11px;border-radius:26px;}
  .screen{background:linear-gradient(165deg,#0c1420,#070b12);border:1px solid rgba(0,0,0,.5);border-radius:18px;box-shadow:inset 0 2px 16px rgba(0,0,0,.6);padding:26px 26px 24px;color:var(--ink-on-dark);}
  .node-bar{display:flex;align-items:center;gap:10px;margin-bottom:22px;}
  .node-bar .ttl{font-family:var(--font-mono);font-weight:700;letter-spacing:2px;font-size:12px;color:var(--ink-on-dark);}
  .node-bar .meta{margin-left:auto;font-family:var(--font-mono);font-size:10px;letter-spacing:1px;color:var(--amber);display:inline-flex;align-items:center;gap:6px;}
  .node-bar .meta i{width:5px;height:5px;border-radius:50%;background:var(--amber);box-shadow:0 0 8px var(--amber-soft);}
  h1{font-size:23px;font-weight:800;margin:0 0 6px;letter-spacing:-.4px;
     color:var(--amber);
     background:linear-gradient(120deg,var(--ember),var(--amber));
     -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}
  .sub{color:var(--ink-on-dark-dim);font-size:13px;line-height:1.55;margin:0 0 22px;}
  .glz-btn + .glz-btn{margin-top:10px;}
  .glz-divider{margin:20px 0 14px;}
  .email-row{display:flex;gap:8px;}
  .email-row .glz-field{flex:1;}
  .email-row .glz-btn{flex-shrink:0;padding:13px 14px;font-size:12px;}
  .soon{font-family:var(--font-mono);font-size:10px;color:var(--ink-on-dark-dim);margin:8px 0 0;text-align:center;letter-spacing:.5px;}
  .security{display:flex;gap:8px;align-items:flex-start;margin:22px 0 0;font-size:11px;line-height:1.5;color:var(--ink-on-dark-dim);font-family:var(--font-mono);}
  .security svg{width:14px;height:14px;flex-shrink:0;margin-top:1px;color:var(--amber);}
  .cap{text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--ink-on-dark-dim);margin:18px 0 0;}
  .cap b{color:var(--teal);font-weight:400;}
  </style>
</head>
<body class="glz-body">
  <div class="bg"></div>
  <svg class="glz-electric-line" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style="z-index:1;">
    <path d="M-40,230 C 320,150 540,360 760,300 S 1180,180 1500,260"/>
    <path class="glz-slow" d="M-40,700 C 360,780 560,520 780,610 S 1180,760 1500,650"/>
  </svg>

  <main class="auth-wrap">
    <div class="stack">
      <section class="node glz-surface-metal" aria-label="Sign in">
        <div class="screen">
          <div class="node-bar">
            <span class="glz-node-dot" aria-hidden="true"></span>
            <span class="ttl">ACCESS NODE</span>
            <span class="meta"><i></i>SECURE · OAUTH</span>
          </div>

          <h1>Sign in to your studio</h1>
          <p class="sub">Authenticate to sync builds across devices, export backends, and protect your routing addresses.</p>

          <button class="glz-btn glz-btn-primary glz-btn-block" id="gh">
            <svg viewBox="0 0 24 24" fill="#04201d"><path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.3-1.8-1.3-1.8-1.1-.7 0-.7 0-.7 1.2 0 1.9 1.2 1.9 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2 0-.4-.5-1.6.2-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.7 18.3 5 18.3 5c.7 1.6.2 2.8.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z"/></svg>
            Continue with GitHub
          </button>
          <button class="glz-btn glz-btn-block" id="go">
            <svg viewBox="0 0 24 24"><path fill="#EA4335" d="M12 11v3.8h5.3c-.2 1.4-1.6 4-5.3 4a5.8 5.8 0 0 1 0-11.6c1.8 0 3 .8 3.7 1.4l2.5-2.4A9 9 0 1 0 12 21c5.2 0 8.6-3.6 8.6-8.7 0-.6 0-1-.2-1.3H12Z"/></svg>
            Continue with Google
          </button>

          <div class="glz-divider">EMAIL SIGN-IN · COMING SOON</div>
          <div class="email-row">
            <input class="glz-field" id="email" type="email" placeholder="you@studio.dev" autocomplete="email" spellcheck="false">
            <button class="glz-btn glz-btn-metal" id="notify">Notify me</button>
          </div>
          <p class="soon" id="notifyMsg">Magic-link sign-in is on the way — drop your email to be first.</p>

          <p class="security">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
            Your email is never shared or exposed. OAuth tokens are scoped read-only — exactly enough to identify you and protect your routing addresses.
          </p>
        </div>
      </section>
      <p class="cap">Backed by <b>GitHub</b> &amp; <b>Google</b> OAuth · part of LogicLemonAI</p>
    </div>
  </main>

  <script>
    function workerBase(){ return (localStorage.getItem('webhooks_email_worker') || window.location.origin).replace(/\\/+$/, ''); }
    function startOAuth(p){ window.location.href = workerBase() + '/api/auth/' + p + '?redirect=' + encodeURIComponent('/'); }
    document.getElementById('gh').onclick = function(){ startOAuth('github'); };
    document.getElementById('go').onclick = function(){ startOAuth('google'); };
    document.getElementById('notify').onclick = function(){
      var e = document.getElementById('email').value.trim();
      var msg = document.getElementById('notifyMsg');
      if (e && /.+@.+\\..+/.test(e)) { msg.textContent = '\\u2713 You are on the list — we will email when magic-link is live.'; msg.style.color = 'var(--teal)'; }
      else { msg.textContent = 'Enter a valid email to join the magic-link waitlist.'; msg.style.color = 'var(--amber)'; }
    };
  </script>
</body>
</html>
`,
};

ASSETS["tokens.css"] = {
  contentType: "text/css",
  content: `/* ============================================================================
   GLAZIER KIT · tokens.css   (v2 — hardened)
   Single source of truth. Pure CSS custom properties. No build, no dependency.
   v2 changes: added pre-alpha'd glass tokens so glazier.css needs NO color-mix().
   ============================================================================ */

:root {
  /* ---- Canvas (near-black → black) ---- */
  --bg-void:        #04060a;
  --bg-base:        #070b12;
  --bg-raise:       #0b111b;

  /* ---- Glazier blue (the glass) ---- */
  --glazier-1:      #16273d;
  --glazier-2:      #0d1726;
  --glazier-edge:   #2f5f86;
  --glazier-deep:   #0a2036;
  /* pre-alpha'd glass fills — replace color-mix() for full browser support */
  --glazier-glass-1: rgba(22, 39, 61, 0.78);   /* = #16273d @ 78% */
  --glazier-glass-2: rgba(13, 23, 38, 0.72);   /* = #0d1726 @ 72% */

  /* ---- Brushed metal (the silver) ---- */
  --metal-hi:       #eef2f6;
  --metal-1:        #d4dbe3;
  --metal-2:        #b9c2cc;
  --metal-3:        #9aa4b1;
  --metal-4:        #7e8a98;
  --metal-lo:       #6c7886;

  /* ---- Electric teal (accent / selection / glow) ---- */
  --teal:           #3fe0d0;
  --teal-bright:    #6bf0e3;
  --teal-ink:       #0a8f81;   /* deepened teal — legible on silver */
  --teal-soft:      rgba(63, 224, 208, 0.45);
  --teal-faint:     rgba(63, 224, 208, 0.14);

  /* ---- Warm accent (sparing counterpoint: red-ish → amber) ---- */
  --ember:          #ff6a3d;   /* red-ish */
  --amber:          #f6a93b;   /* amber */
  --warm-grad:      linear-gradient(135deg, #ff7a4d, #f6a93b);
  --ember-soft:     rgba(255, 106, 61, 0.40);
  --amber-soft:     rgba(246, 169, 59, 0.38);
  --amber-faint:    rgba(246, 169, 59, 0.12);

  /* ---- Text ---- */
  --ink-on-dark:    #e6edf5;
  --ink-on-dark-dim:#9fb0c3;
  --ink-on-metal:   #0a0e14;
  --ink-on-metal-dim:#262d37;   /* darker slate — high contrast on silver (no low-opacity grey) */

  /* ---- Hairlines & dividers ---- */
  --line-dark:      rgba(120, 170, 210, 0.16);
  --line-metal:     rgba(255, 255, 255, 0.5);

  /* ---- Blur ---- */
  --blur-glass:     blur(18px) saturate(140%);

  /* ---- Shadows (depth) ---- */
  --shadow-card:    0 24px 60px rgba(0, 0, 0, 0.55);
  --shadow-raise:   0 10px 30px rgba(0, 0, 0, 0.45);
  --inset-glass:    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  --inset-metal:    inset 0 1px 0 rgba(255, 255, 255, 0.85),
                    inset 0 -1px 2px rgba(0, 0, 0, 0.28);

  /* ---- Radii ---- */
  --r-sm: 8px;  --r-md: 14px;  --r-lg: 20px;  --r-pill: 999px;

  /* ---- Spacing scale ---- */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px;
  --sp-5: 24px; --sp-6: 32px; --sp-7: 48px; --sp-8: 64px;

  /* ---- Type ---- */
  --font-ui:   'Outfit', system-ui, -apple-system, sans-serif;
  --font-mono: 'Space Mono', ui-monospace, 'SF Mono', monospace;

  /* ---- Motion ---- */
  --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
  --t-fast: 0.15s;  --t-base: 0.3s;
}
`,
};

ASSETS["icon.svg"] = {
  contentType: "image/svg+xml",
  content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192" fill="none"><rect width="192" height="192" fill="#04060a" rx="32"/><path d="M96 48c-26.5 0-48 18.5-48 48 0 29.5 21.5 64 48 64s48-34.5 48-64c0-29.5-21.5-48-48-48zm-10 24c5.5 0 10 4.5 10 10s-4.5 10-10 10-10-4.5-10-10 4.5-10 10-10zm20 40c-5.5 0-10-4.5-10-10s4.5-10 10-10 10 4.5 10 10-4.5 10-10 10z" fill="#3fe0d0" stroke="#3fe0d0" stroke-width="2"/><circle cx="96" cy="96" r="8" fill="#ff6a3d"/><path d="M96 36v20M96 140v20M36 96h20M140 96h20" stroke="#3fe0d0" stroke-width="3" stroke-linecap="round" opacity="0.4"/></svg>`,
};

ASSETS["inspiration.html"] = {
  contentType: "text/html",
  content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LogicLemonAI — Inspiration</title>
  <link rel="manifest" href="manifest.json">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="tokens.css">
  <link rel="stylesheet" href="glazier.css">
  <style>
    html{scroll-behavior:smooth;}
    body{overflow-x:hidden;}
    .wrap{max-width:1140px;margin:0 auto;padding:0 6vw;}
    .bg{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(1100px 640px at 50% -8%,rgba(63,224,208,.09),transparent 60%),radial-gradient(820px 760px at 90% 8%,rgba(246,169,59,.07),transparent 58%),radial-gradient(900px 800px at 8% 108%,rgba(36,75,110,.30),transparent 60%),linear-gradient(180deg,var(--bg-base),var(--bg-void));}
    .bg::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(120,170,210,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(120,170,210,.045) 1px,transparent 1px);background-size:46px 46px;-webkit-mask-image:radial-gradient(circle at 50% 28%,#000 18%,transparent 72%);mask-image:radial-gradient(circle at 50% 28%,#000 18%,transparent 72%);}
    .page{position:relative;z-index:1;}

    header{display:flex;align-items:center;gap:18px;padding:18px 6vw;position:sticky;top:0;z-index:20;background:linear-gradient(180deg,rgba(7,11,18,.85),rgba(7,11,18,0));-webkit-backdrop-filter:blur(9px);backdrop-filter:blur(9px);}
    .brand{display:flex;align-items:center;gap:11px;font-weight:800;font-size:17px;letter-spacing:-.3px;}
    .brand .badge{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;}
    .brand .badge .glz-node-dot{width:8px;height:8px;}
    header nav{margin-left:auto;display:flex;gap:6px;align-items:center;}
    header nav a.link{color:var(--ink-on-dark-dim);text-decoration:none;font-size:14px;padding:8px 12px;border-radius:8px;transition:color var(--t-fast);}
    header nav a.link:hover{color:var(--teal);}
    header nav a.link.active{color:var(--teal);font-weight:600;}
    @media(max-width:820px){header nav .link{display:none;}}

    .hero{padding:48px 0 20px;text-align:center;}
    .hero h1{font-size:clamp(32px,5.5vw,60px);line-height:1.05;font-weight:900;letter-spacing:-1.5px;margin:0 auto 18px;max-width:16ch;}
    .hero h1 .accent{background:linear-gradient(120deg,var(--metal-hi),var(--metal-2) 60%,var(--metal-4));-webkit-background-clip:text;background-clip:text;color:transparent;}
    .hero .sub{max-width:58ch;margin:0 auto 28px;font-size:clamp(15px,2vw,18px);line-height:1.55;color:var(--ink-on-dark-dim);}
    .search-bar{max-width:520px;margin:0 auto 32px;position:relative;}
    .search-bar input{width:100%;padding:14px 18px 14px 44px;border-radius:var(--r-pill);border:1px solid var(--line-dark);background:rgba(255,255,255,.04);color:var(--ink-on-dark);font-family:var(--font-ui);font-size:15px;outline:none;transition:border-color var(--t-fast);}
    .search-bar input:focus{border-color:var(--teal-soft);}
    .search-bar::before{content:"\\2315";position:absolute;left:17px;top:50%;transform:translateY(-50%);font-size:18px;color:var(--ink-on-dark-dim);pointer-events:none;}

    .insp-tabs{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:32px;}
    .tab-btn{padding:8px 16px;border-radius:var(--r-pill);border:1px solid var(--line-dark);background:rgba(255,255,255,.03);color:var(--ink-on-dark-dim);font-size:13px;font-family:var(--font-ui);cursor:pointer;transition:all var(--t-fast);}
    .tab-btn:hover{border-color:var(--teal-soft);color:var(--ink-on-dark);}
    .tab-btn.on{background:var(--teal);color:#04201d;font-weight:700;border-color:var(--teal);}

    .section{margin-bottom:56px;}
    .sec-head{margin-bottom:24px;}
    .sec-head h2{font-size:clamp(22px,3vw,30px);font-weight:800;letter-spacing:-.5px;margin:0 0 6px;}
    .sec-head p{color:var(--ink-on-dark-dim);font-size:15px;line-height:1.5;margin:0;}
    .prompt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;}

    .prompt-card{border:1px solid var(--line-dark);border-radius:var(--r-md);background:rgba(8,14,22,.55);padding:16px;transition:all var(--t-base);cursor:pointer;position:relative;overflow:hidden;}
    .prompt-card:hover{border-color:var(--teal-soft);background:rgba(63,224,208,.04);transform:translateY(-2px);box-shadow:0 12px 30px rgba(0,0,0,.3);}
    .prompt-card .tag{display:inline-flex;align-items:center;gap:5px;font-family:var(--font-mono);font-size:10px;letter-spacing:1px;color:var(--amber);margin-bottom:10px;}
    .prompt-card h3{font-size:16px;font-weight:700;margin:0 0 8px;letter-spacing:-.3px;}
    .prompt-card p{font-size:13px;color:var(--ink-on-dark-dim);line-height:1.5;margin:0 0 14px;max-height:58px;overflow:hidden;}
    .prompt-card .meta{display:flex;align-items:center;gap:10px;font-family:var(--font-mono);font-size:11px;color:var(--ink-on-dark-dim);}
    .prompt-card .meta span{display:inline-flex;align-items:center;gap:4px;}
    .prompt-card .launch{position:absolute;bottom:12px;right:12px;width:32px;height:32px;border-radius:50%;border:1px solid var(--teal-soft);background:var(--teal);color:#04201d;display:grid;place-items:center;font-size:16px;opacity:0;transition:all var(--t-base);}
    .prompt-card:hover .launch{opacity:1;}

    .featured{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px;}
    .feat-card{border:1px solid var(--line-dark);border-radius:var(--r-md);overflow:hidden;transition:all var(--t-base);cursor:pointer;}
    .feat-card:hover{border-color:var(--teal-soft);transform:translateY(-2px);box-shadow:0 12px 30px rgba(0,0,0,.3);}
    .feat-card .thumb{height:180px;background:linear-gradient(165deg,#0c1420,#070b12);display:grid;place-items:center;position:relative;overflow:hidden;}
    .feat-card .thumb .mini-frame{width:80%;height:80%;border:1px solid var(--line-dark);border-radius:8px;position:relative;overflow:hidden;}
    .feat-card .thumb .mini-bar{height:18px;border-bottom:1px solid var(--line-dark);display:flex;align-items:center;gap:4px;padding:0 6px;}
    .feat-card .thumb .mini-bar i{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.12);}
    .feat-card .thumb .mini-bar i:first-child{background:var(--ember);opacity:.5;}
    .feat-card .thumb .mini-body{padding:8px;display:flex;flex-direction:column;gap:5px;}
    .feat-card .thumb .mini-row{height:7px;border-radius:3px;background:rgba(120,170,210,.15);}
    .feat-card .thumb .mini-row.w{width:60%;}
    .feat-card .thumb .mini-row.c{width:40%;background:rgba(63,224,208,.3);}
    .feat-card .thumb .mini-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;}
    .feat-card .thumb .mini-grid .b{height:40px;border-radius:4px;background:rgba(120,170,210,.08);}
    .feat-card .info{padding:14px;}
    .feat-card .info h3{font-size:15px;font-weight:700;margin:0 0 6px;}
    .feat-card .info p{font-size:13px;color:var(--ink-on-dark-dim);margin:0 0 10px;}
    .feat-card .info .tags{display:flex;gap:6px;flex-wrap:wrap;}
    .feat-card .info .tags span{font-size:10px;padding:3px 8px;border-radius:4px;border:1px solid var(--line-dark);color:var(--ink-on-dark-dim);font-family:var(--font-mono);}

    .trend{display:flex;gap:10px;overflow-x:auto;padding:4px 0 20px;scrollbar-width:thin;scrollbar-color:var(--glazier-edge) transparent;}
    .trend::-webkit-scrollbar{height:3px;}
    .trend::-webkit-scrollbar-thumb{background:var(--glazier-edge);border-radius:3px;}
    .trend-card{flex-shrink:0;width:240px;border:1px solid var(--line-dark);border-radius:var(--r-md);background:rgba(8,14,22,.55);padding:14px;transition:all var(--t-base);cursor:pointer;}
    .trend-card:hover{border-color:var(--teal-soft);}
    .trend-card .trend-num{font-family:var(--font-mono);font-size:12px;color:var(--amber);margin-bottom:8px;}
    .trend-card h3{font-size:14px;font-weight:700;margin:0 0 8px;}
    .trend-card p{font-size:12px;color:var(--ink-on-dark-dim);line-height:1.45;margin:0 0 12px;}
    .trend-card .trend-meta{display:flex;align-items:center;justify-content:space-between;font-family:var(--font-mono);font-size:10px;color:var(--ink-on-dark-dim);}

    .cta-section{padding:48px 0;text-align:center;border-top:1px solid var(--line-dark);margin-top:16px;}
    .cta-section h2{font-size:clamp(26px,4vw,38px);font-weight:900;letter-spacing:-1px;margin:0 auto 14px;}
    .cta-section p{max-width:48ch;margin:0 auto 20px;color:var(--ink-on-dark-dim);font-size:15px;}

    @media(max-width:640px){
      .prompt-grid{grid-template-columns:1fr;}
      .featured{grid-template-columns:1fr;}
    }
  </style>
</head>
<body class="glz-body">
  <div class="bg"></div>
  <div class="page">
    <header>
      <div class="brand">
        <span class="badge glz-surface-metal"><span class="glz-node-dot"></span></span>
        LogicLemonAI
      </div>
      <nav>
        <a class="link" href="/">Home</a>
        <a class="link active" href="/inspiration.html">Inspiration</a>
        <a class="link" href="/studio">Studio</a>
        <a class="link" href="/signin.html">Sign in</a>
      </nav>
    </header>

    <div class="wrap">
      <section class="hero">
        <h1>What will you <span class="accent">build?</span></h1>
        <p class="sub">Curated prompts, trending interfaces, and hand-picked skills. Click any card to launch it in the Studio.</p>
        <div class="search-bar">
          <input type="text" id="searchInput" placeholder="Search prompts, interfaces, skills..." />
        </div>
        <div class="insp-tabs" id="tabs">
          <button class="tab-btn on" data-tab="all">All</button>
          <button class="tab-btn" data-tab="dashboards">Dashboards</button>
          <button class="tab-btn" data-tab="landing">Landing Pages</button>
          <button class="tab-btn" data-tab="forms">Forms & Onboarding</button>
          <button class="tab-btn" data-tab="data">Data & Tables</button>
          <button class="tab-btn" data-tab="creative">Creative</button>
        </div>
      </section>

      <!-- Featured Prompts -->
      <section class="section" id="sec-prompts">
        <div class="sec-head">
          <h2>Featured Prompts</h2>
          <p>Click any prompt to launch it in the Studio. One click, zero friction.</p>
        </div>
        <div class="prompt-grid" id="promptGrid"></div>
      </section>

      <!-- Featured Interfaces -->
      <section class="section" id="sec-interfaces">
        <div class="sec-head">
          <h2>Featured Interfaces</h2>
          <p>Ready-to-build interface concepts. Preview and adapt.</p>
        </div>
        <div class="featured" id="featuredGrid"></div>
      </section>

      <!-- Trending Now -->
      <section class="section" id="sec-trending">
        <div class="sec-head">
          <h2>Trending Now</h2>
          <p>What the community is building right now.</p>
        </div>
        <div class="trend" id="trendingGrid"></div>
      </section>

      <section class="cta-section">
        <h2>Ready to build?</h2>
        <p>Every prompt works. Every interface ships. Click any card above to launch in Studio.</p>
        <a href="/studio" class="glz-btn glz-btn-primary">Open Studio</a>
      </section>
    </div>
  </div>

  <script>
    const PROMPTS = [
      {id:'p1', title:'Analytics Dashboard', text:'A dark analytics dashboard with a sidebar, four KPI cards, a line chart, a bar chart, and a data table with sortable columns. Teal accents, clean typography, mobile responsive.', category:'dashboards', tags:['dashboard','analytics','chart'], difficulty:'Medium', uses:124},
      {id:'p2', title:'SaaS Pricing Page', text:'A pricing page with three tiers: Starter, Pro, and Enterprise. Each card shows features, price, and a CTA button. Toggle between monthly and annual. Dark theme with teal accents.', category:'landing', tags:['pricing','landing','saas'], difficulty:'Easy', uses:89},
      {id:'p3', title:'Multi-Step Onboarding Wizard', text:'A step-by-step onboarding wizard with a progress bar, form validation, and animated transitions. Three steps: profile, preferences, confirmation. Glass-morphism aesthetic.', category:'forms', tags:['onboarding','form','wizard'], difficulty:'Medium', uses:67},
      {id:'p4', title:'Real-Time Data Table', text:'A data table with server-side pagination, search, sort, and filter. Row selection with bulk actions. Empty state with illustration. Dark theme, teal accent for selected rows.', category:'data', tags:['table','data','admin'], difficulty:'Hard', uses:156},
      {id:'p5', title:'Portfolio / Creative Agency', text:'A creative agency landing page with a hero section, featured work grid, client testimonials, and a contact form. Full-width hero with parallax effect. Typography-heavy, minimal color.', category:'landing', tags:['portfolio','creative','landing'], difficulty:'Medium', uses:98},
      {id:'p6', title:'Kanban Board', text:'A drag-and-drop kanban board with three columns: To Do, In Progress, Done. Cards with labels, assignees, and due dates. Add/edit/delete cards. Dark background, colorful labels.', category:'creative', tags:['kanban','project-management','board'], difficulty:'Hard', uses:203},
      {id:'p7', title:'Login / Signup Modal', text:'A clean authentication modal with email/password fields, social login buttons (GitHub, Google), and a forgot password link. Toggle between login and signup with a smooth slide animation.', category:'forms', tags:['auth','modal','login'], difficulty:'Easy', uses:312},
      {id:'p8', title:'E-Commerce Product Grid', text:'A product grid with filter sidebar, sort dropdown, and product cards with hover zoom, price, rating, and add-to-cart button. Responsive, 3-column desktop, 2-column tablet, 1-column mobile.', category:'data', tags:['e-commerce','product','grid'], difficulty:'Medium', uses:145},
      {id:'p9', title:'AI Chat Interface', text:'A chat interface with a message list, input bar with send button, typing indicator, and message bubbles. User messages on right, assistant on left. Dark mode with teal accent. Auto-scroll to bottom.', category:'creative', tags:['chat','messaging','ai'], difficulty:'Easy', uses:278},
      {id:'p10', title:'Settings Panel', text:'A comprehensive settings panel with tabs: Profile, Account, Notifications, Appearance, Billing. Each tab has relevant forms, toggles, and dropdowns. Dark theme, glass sidebar, clean inputs.', category:'dashboards', tags:['settings','admin','panel'], difficulty:'Medium', uses:87},
      {id:'p11', title:'Event Calendar', text:'A monthly calendar view with day cells, event indicators, and a day-detail slide-out panel. Click a day to add events. Drag to reschedule. Dark theme, amber accent for events.', category:'creative', tags:['calendar','events','date'], difficulty:'Medium', uses:56},
      {id:'p12', title:'API Documentation Page', text:'An interactive API docs page with endpoint navigation, code examples in a dark code block, copy button, and response schema accordion. Three-column layout: nav, content, code examples.', category:'data', tags:['docs','api','documentation'], difficulty:'Medium', uses:134},
    ];

    const INTERFACES = [
      {id:'i1', title:'Dark SaaS Dashboard', desc:'Full analytics suite with charts, KPIs, and a sidebar. Perfect for a B2B product launch.', tags:['dashboard','saas','analytics']},
      {id:'i2', title:'Crypto Exchange UI', desc:'Order book, candlestick chart, and portfolio balance. Real-time feel, dark theme.', tags:['fintech','crypto','trading']},
      {id:'i3', title:'Music Player App', desc:'Album art, waveform visualization, playlist, and controls. Immersive dark aesthetic.', tags:['media','music','creative']},
      {id:'i4', title:'Social Feed', desc:'Card-based feed with likes, comments, shares, and a composer. Story row at top. Mobile-first.', tags:['social','feed','mobile']},
    ];

    const TRENDING = [
      {id:'t1', rank:'#1', title:'AI Code Review Assistant', desc:'An interface where you paste code and get inline review comments with severity badges.', source:'3h ago', views:482},
      {id:'t2', rank:'#2', title:'Notion-style Notes App', desc:'A block-based note editor with slash commands, drag-to-reorder, and nested pages.', source:'6h ago', views:356},
      {id:'t3', rank:'#3', title:'Restaurant Menu Builder', desc:'Interactive menu builder with category tabs, add-to-cart, and checkout flow. Mobile-first.', source:'12h ago', views:291},
      {id:'t4', rank:'#4', title:'Fitness Tracker', desc:'Workout logger with progress charts, streak counter, and achievement badges. Dark mode.', source:'1d ago', views:234},
      {id:'t5', rank:'#5', title:'Travel Booking Flow', desc:'Multi-step booking wizard: search, filters, results, detail, checkout. Map integration.', source:'1d ago', views:198},
    ];

    function renderPrompts(filter){
      const grid = document.getElementById('promptGrid');
      const filtered = filter === 'all' ? PROMPTS : PROMPTS.filter(p => p.category === filter);
      const search = document.getElementById('searchInput').value.toLowerCase();
      const final = search ? filtered.filter(p => p.title.toLowerCase().includes(search) || p.text.toLowerCase().includes(search) || p.tags.some(t => t.toLowerCase().includes(search))) : filtered;
      grid.innerHTML = final.map(p => \`
        <div class="prompt-card" data-prompt="\${p.text.replace(/"/g, '&quot;')}">
          <div class="tag">\${p.category.toUpperCase()}</div>
          <h3>\${p.title}</h3>
          <p>\${p.text}</p>
          <div class="meta">
            <span><span style="color:var(--teal)">&#9679;</span> \${p.difficulty}</span>
            <span>\${p.uses} uses</span>
          </div>
          <div class="launch">&#8599;</div>
        </div>
      \`).join('');
      document.querySelectorAll('.prompt-card').forEach(card => {
        card.addEventListener('click', () => {
          const prompt = card.getAttribute('data-prompt');
          window.location.href = '/studio?prompt=' + encodeURIComponent(prompt);
        });
      });
    }

    function renderInterfaces(){
      const grid = document.getElementById('featuredGrid');
      grid.innerHTML = INTERFACES.map(i => \`
        <div class="feat-card" data-prompt="\${i.desc.replace(/"/g, '&quot;')}">
          <div class="thumb">
            <div class="mini-frame">
              <div class="mini-bar"><i></i><i></i><i></i></div>
              <div class="mini-body">
                <div class="mini-row"></div>
                <div class="mini-row w"></div>
                <div class="mini-grid"><div class="b"></div><div class="b"></div></div>
                <div class="mini-row c"></div>
                <div class="mini-row w"></div>
              </div>
            </div>
          </div>
          <div class="info">
            <h3>\${i.title}</h3>
            <p>\${i.desc}</p>
            <div class="tags">\${i.tags.map(t => \`<span>\${t}</span>\`).join('')}</div>
          </div>
        </div>
      \`).join('');
      document.querySelectorAll('.feat-card').forEach(card => {
        card.addEventListener('click', () => {
          const prompt = card.getAttribute('data-prompt');
          window.location.href = '/studio?prompt=' + encodeURIComponent(prompt);
        });
      });
    }

    function renderTrending(){
      const grid = document.getElementById('trendingGrid');
      grid.innerHTML = TRENDING.map(t => \`
        <div class="trend-card" data-prompt="\${t.desc.replace(/"/g, '&quot;')}">
          <div class="trend-num">\${t.rank}</div>
          <h3>\${t.title}</h3>
          <p>\${t.desc}</p>
          <div class="trend-meta">
            <span>\${t.source}</span>
            <span>\${t.views} views</span>
          </div>
        </div>
      \`).join('');
      document.querySelectorAll('.trend-card').forEach(card => {
        card.addEventListener('click', () => {
          const prompt = card.getAttribute('data-prompt');
          window.location.href = '/studio?prompt=' + encodeURIComponent(prompt);
        });
      });
    }

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        renderPrompts(btn.getAttribute('data-tab'));
      });
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', () => {
      const activeTab = document.querySelector('.tab-btn.on').getAttribute('data-tab');
      renderPrompts(activeTab);
    });

    renderPrompts('all');
    renderInterfaces();
    renderTrending();
  </script>
</body>
</html>
`,
};

async function serveAsset(path) {
  let filename = path.replace(/^\//, "").replace(/^assets\//, "");
  if (!filename) filename = "index.html";
  const asset = ASSETS[filename];
  if (!asset) return null;
  const isHtml = asset.contentType === "text/html";
  return new Response(asset.content, {
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": isHtml ? "no-cache" : "public, max-age=3600",
    },
  });
}

// Export for the worker to use
export { serveAsset };

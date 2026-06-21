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

  function detectProvider(key) {
    if (!key) return '';
    if (key.startsWith('wek_')) return 'proxy';
    if (key.startsWith('sk-ant-')) return 'anthropic';
    if (key.startsWith('sk-or-')) return 'openrouter';
    if (key.startsWith('sk-')) return 'openai';
    if (key.startsWith('AIza')) return 'google';
    return 'openrouter';
  }

  const PROVIDER_CONFIG = {
    openrouter: { baseURL: 'https://openrouter.ai/api/v1', label: 'OpenRouter' },
    openai:     { baseURL: 'https://api.openai.com/v1',     label: 'OpenAI' },
    anthropic:  { baseURL: 'https://api.anthropic.com/v1',  label: 'Anthropic' },
    google:     { baseURL: 'https://generativelanguage.googleapis.com/v1beta', label: 'Google Gemini' },
  };

  const MODELS_BY_PROVIDER = {
    openrouter: MODELS,
    openai: [
      { id: 'gpt-4o',               name: 'GPT-4o',         desc: 'Best all-round' },
      { id: 'gpt-4o-mini',          name: 'GPT-4o Mini',    desc: 'Fast & cheap' },
      { id: 'gpt-4.1',              name: 'GPT-4.1',        desc: 'Latest GPT-4' },
      { id: 'o3-mini',              name: 'o3-mini',        desc: 'Reasoning model' },
    ],
    anthropic: [
      { id: 'claude-sonnet-4-20250514',      name: 'Claude Sonnet 4',   desc: 'Best balance' },
      { id: 'claude-3-5-sonnet-20241022',    name: 'Claude 3.5 Sonnet', desc: 'Previous gen' },
      { id: 'claude-3-5-haiku-20241022',     name: 'Claude 3.5 Haiku',  desc: 'Fast & cheap' },
    ],
    google: [
      { id: 'gemini-2.5-flash',      name: 'Gemini 2.5 Flash', desc: 'Fast, default' },
      { id: 'gemini-2.5-pro',        name: 'Gemini 2.5 Pro',   desc: 'Highest quality' },
    ],
  };

  const CONFIG = {
    model: MODELS[0].id,
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: '',
    provider: '',
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
      CONFIG.provider = detectProvider(stored);
      if (CONFIG.provider && CONFIG.provider !== 'proxy') {
        var pCfg = PROVIDER_CONFIG[CONFIG.provider];
        if (pCfg) CONFIG.baseURL = pCfg.baseURL;
      }
      return true;
    }
    return false;
  }

  function modelsForProvider(provider) {
    return MODELS_BY_PROVIDER[provider] || MODELS;
  }

  function activeModels() {
    return modelsForProvider(CONFIG.provider || 'openrouter');
  }

  function saveApiKey(key) {
    CONFIG.apiKey = key;
    localStorage.setItem(STORAGE_KEY, key);
    setFreeRemaining(0);
    CONFIG.provider = detectProvider(key);
    if (CONFIG.provider === 'proxy') {
      CONFIG.isProxyMode = true;
      CONFIG.proxyEndpoint = localStorage.getItem('webhooks_email_proxy') || workerBase();
      showModelSelector(true);
    } else {
      CONFIG.isProxyMode = false;
      CONFIG.proxyEndpoint = '';
      var pCfg = PROVIDER_CONFIG[CONFIG.provider];
      CONFIG.baseURL = pCfg ? pCfg.baseURL : 'https://openrouter.ai/api/v1';
      // switch to first model for this provider if current isn't in its list
      var pModels = modelsForProvider(CONFIG.provider);
      if (!pModels.some(function(m) { return m.id === CONFIG.model; })) {
        CONFIG.model = pModels[0].id;
      }
      showModelSelector(pModels.length > 1);
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
    if (activeModels().some(m => m.id === modelId)) {
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
    var pModels = activeModels();
    pModels.forEach(m => {
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
        if (m.id !== pModels[0].id) {
          addMessage('Switched to ' + m.name + ' (' + m.desc + ')', 'assistant');
        }
      });
      container.appendChild(opt);
    });
  }

  async function validateApiKey(key) {
    var prov = detectProvider(key);
    if (prov === 'proxy') {
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
    if (prov === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': 'Bearer ' + key },
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error('Invalid OpenAI API key');
        throw new Error('OpenAI validation failed: ' + res.status);
      }
      return { label: 'OpenAI' };
    }
    if (prov === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }),
      });
      if (res.status === 401 || res.status === 403) throw new Error('Invalid Anthropic API key');
      if (res.status === 400) return { label: 'Anthropic' };
      throw new Error('Anthropic validation failed: ' + res.status);
    }
    if (prov === 'google') {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + key);
      if (!res.ok) throw new Error('Invalid Google Gemini API key');
      return { label: 'Google Gemini' };
    }
    // OpenRouter (default)
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
      var provLabel = PROVIDER_CONFIG[CONFIG.provider] ? PROVIDER_CONFIG[CONFIG.provider].label : '';
      text.textContent = provLabel ? provLabel + ' Connected' : 'Gemma-4 Ready';
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

    return callProviderAPI(messages, signal);
  }

  async function callProviderAPI(messages, signal) {
    var prov = CONFIG.provider || 'openrouter';

    if (prov === 'anthropic') {
      // Extract system message for Anthropic's separate system field
      var systemMsg = '';
      var chatMessages = messages.filter(function(m) {
        if (m.role === 'system') { systemMsg += m.content + '\n'; return false; }
        return true;
      });
      var body = { model: CONFIG.model, max_tokens: 8192, messages: chatMessages };
      if (systemMsg.trim()) body.system = systemMsg.trim();
      const res = await fetch(CONFIG.baseURL + '/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CONFIG.apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify(body),
        signal: signal,
      });
      if (!res.ok) {
        var errBody = await res.text();
        throw new Error('Anthropic: ' + res.status + ' ' + errBody);
      }
      var raw = await res.json();
      var content = '';
      if (raw.content && Array.isArray(raw.content)) {
        raw.content.forEach(function(block) { if (block.type === 'text') content += block.text; });
      }
      return parseJSON(content);
    }

    if (prov === 'google') {
      // Convert messages to Gemini format
      var geminiContents = [];
      messages.forEach(function(m) {
        var role = m.role === 'assistant' ? 'model' : 'user';
        geminiContents.push({ role: role, parts: [{ text: m.content }] });
      });
      var modelId = CONFIG.model;
      var url = CONFIG.baseURL + '/models/' + modelId + ':generateContent?key=' + CONFIG.apiKey;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: geminiContents, generationConfig: { temperature: 0.7, maxOutputTokens: 8192 } }),
        signal: signal,
      });
      if (!res.ok) {
        var errBody = await res.text();
        throw new Error('Gemini: ' + res.status + ' ' + errBody);
      }
      var raw = await res.json();
      var content = '';
      if (raw.candidates && raw.candidates[0] && raw.candidates[0].content) {
        raw.candidates[0].content.parts.forEach(function(p) { if (p.text) content += p.text; });
      }
      return parseJSON(content);
    }

    // OpenAI-compatible (OpenRouter, OpenAI direct)
    var headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + CONFIG.apiKey,
    };
    var body = { model: CONFIG.model, messages: messages };
    if (prov === 'openrouter') {
      headers['HTTP-Referer'] = CONFIG.siteURL;
      headers['X-Title'] = CONFIG.siteName;
      body.extra_body = { reasoning: { enabled: true } };
    }
    const res = await fetch(CONFIG.baseURL + '/chat/completions', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
      signal: signal,
    });
    if (!res.ok) {
      var errBody = await res.text();
      if (res.status === 429) throw new Error('Rate limited (429) — try again in a moment or rotate your API key.');
      throw new Error(res.status + ': ' + errBody);
    }
    var raw = await res.json();
    var content = raw.choices?.[0]?.message?.content || '';
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

  var VIBE_EXPANSIONS = [
    {keywords:['dashboard','analytics','kpi','metrics','chart'], prompt:'Build a dark analytics dashboard with a fixed 240px left sidebar (nav items: Overview, Analytics, Reports, Settings with teal active indicator), a top header bar with a search input and user avatar, and four KPI metric cards in a 2x2 grid (Total Revenue $284.5k, Active Users 12,847, Conversion Rate 3.24%, Avg Session 4m 32s). Below the KPIs, place a full-width line chart showing 30 days of revenue with a gradient fill under the line (teal color). Below the chart, add a full-width data table with sortable column headers and striped rows. Use dark background #070b12, card surfaces #0f1724, text #e8edf5. Responsive: on mobile the sidebar collapses to hamburger, KPIs stack. Use system-ui sans-serif. All content realistic sample data.'},
    {keywords:['landing','hero','marketing','page'], prompt:'Build a dark creative landing page with a full-viewport hero section with a large bold headline (56px, 900 weight), a subheadline in muted text, and two CTA buttons (teal filled and outlined). Below the hero, a feature grid of 6 cards in a 2x3 grid showing different capabilities with icons. Add a testimonials section with horizontal scrolling cards containing quotes, author names, and titles. Finally, a contact section with a form (name, email, message) and a teal submit button. Use dark background #070b12, surfaces #0f1724, teal accent #3fe0d0, system-ui font. Responsive layout. All content realistic sample data.'},
    {keywords:['chat','messaging','ai','assistant'], prompt:'Build a full-featured dark AI chat interface. Layout: header bar with "AI Assistant" title and a "New Chat" button. Scrollable message list with user messages right-aligned teal bubbles, assistant messages left-aligned dark bubbles with support for code blocks with copy button and bullet lists. Typing indicator with three animated teal dots. Input area with multi-line textarea (max 4 rows) and teal send button. Include 6 sample messages. Use dark background #070b12, system-ui font, auto-scroll to bottom. Mobile responsive.'},
    {keywords:['pricing','saas','tiers','plan'], prompt:'Build a dark SaaS pricing page with three tier cards (Starter $29/mo, Pro $79/mo, Enterprise Custom) side by side. Monthly/annual toggle that shows 20% discount on annual with a "Save 20%" badge. Each card: tier name, price, bullet feature list with teal checkmarks, CTA button. Middle Pro card elevated with teal border glow and "Most Popular" badge. FAQ section with 4 expandable accordion items below. Use #070b12 background, #0f1724 cards, teal #3fe0d0 accent. System-ui font. Realistic sample data.'},
    {keywords:['login','signin','signup','auth','modal','form'], prompt:'Build a sleek dark authentication modal (centered, max-width 420px, glass-morphism card with backdrop-filter: blur(16px)) on a dimmed overlay. Tab toggle at top to switch between Login and Signup with sliding teal underline indicator. Login: email, password with show/hide toggle, "Remember me" checkbox, teal "Sign In" button. Signup: name, email, password with strength bar, confirm password, terms checkbox, teal "Create Account" button. Divider with GitHub and Google social buttons. Smooth slide/fade transitions. Use dark theme #070b12, teal #3fe0d0 focus glow on inputs. System-ui font.'},
    {keywords:['ecommerce','product','shop','store','grid'], prompt:'Build a dark e-commerce product listing page. Left sidebar with category checkboxes (8 categories), price range slider, and "Clear Filters". Top header with result count, sort dropdown, and grid/list toggle. Product cards in 3-column grid with: image area, sale badge in amber, product name, price with strikethrough discount in teal, 5-star rating, and "Add to Cart" button. Pagination at bottom. Cards have hover zoom effect. Use #070b12 background, #0f1724 cards, teal #3fe0d0 accent. Responsive 3/2/1 columns.'},
    {keywords:['kanban','board','project','task'], prompt:'Build a dark kanban board with three columns: "To Do" (amber header), "In Progress" (teal header), "Done" (green header). Each column has a semi-transparent dark background #0f1724, count badge, and 4-6 task cards. Cards have: priority label (Urgent red, High orange, Medium amber, Low gray), task title, 2-line description, assignee avatars, date badge, and tag label. Subtle hover effects. Header with board title "Sprint 24", "Add Card" button, filter dropdown. Activity feed below with 5 recent actions. Responsive. Use system-ui font.'},
    {keywords:['settings','profile','account','preferences'], prompt:'Build a comprehensive dark settings page with sidebar tab navigation (Profile, Account, Notifications, Appearance, Billing) with teal active indicator. Profile: avatar upload, name, email (verified badge), bio, save button. Account: username, 2FA toggle, delete account in red. Notifications: 6 toggle switches for email and push alerts. Appearance: dark/light theme preview cards, font size slider, accent color picker (6 presets). Billing: current plan card, payment method, billing history table. Use #070b12 background, #0f1724 surfaces, teal #3fe0d0. System-ui font.'},
    {keywords:['portfolio','creative','agency'], prompt:'Build a creative agency portfolio page. Full-viewport hero with "We build digital experiences" headline (56px, 900 weight), subheadline, two CTAs (teal filled + outlined), animated gradient mesh background. "Selected Work" grid of 6 project cards with gradient thumbnails, title, category tag, hover lift effect. Client testimonials horizontal scroll section with quote cards. Contact section with form (name, email, message) and teal submit button. Dark #070b12 background, system-ui font. Responsive.'},
    {keywords:['calendar','events','schedule'], prompt:'Build a dark monthly calendar. Top nav with month label, left/right arrows, "Today" button. 7-column grid for day names. Day cells with number (current day teal circle), past/future dimmed. Event dots (teal meetings, amber deadlines, purple personal). Click day shows right slide-out panel with event list and "Add Event". Upcoming events horizontal list below. Use #070b12 background, #0f1724 surfaces, teal #3fe0d0. System-ui font. Responsive.'},
    {keywords:['docs','api','documentation','reference'], prompt:'Build a dark API documentation page with three-column layout. Left sidebar (260px): API logo, endpoint search, collapsible groups (Authentication, Users, Projects, Webhooks, Analytics). Center: breadcrumb, endpoint name, HTTP method badge (GET teal, POST amber, DELETE red, PUT blue), description, "Try It" button, code example tabs (cURL, Python, JS, Ruby) with syntax coloring and copy button, response accordion. Right sidebar: Parameters table, Responses section with status code cards. Dark #070b12, monospace for code. Realistic sample REST API data.'},
    {keywords:['music','player','media','audio'], prompt:'Build a dark music player interface. Left sidebar with logo, library nav (Playlists, Artists, Albums, Songs, Podcasts), "Create Playlist" button. Center: album art (gradient square with play overlay), track list (8 songs with title, artist, album, duration, heart icon). Bottom: persistent player bar with thumbnail, title, playback controls (shuffle, prev, play/pause, next, repeat), seek bar, volume slider, queue toggle. Teal play button. Use dark gradient #0f0f1a, glass surfaces with backdrop-filter: blur(20px). Responsive.'},
    {keywords:['breakfree','vanilla','standalone','nodeps','clean','bare'], prompt:'SkillChain BREAK FREE mode. Generate a complete standalone UI with ZERO external dependencies — no npm packages, no CDN links, no frameworks (no React, no Vue, no Tailwind, no Bootstrap), no build tools, no package.json. Pure semantic HTML5, handcrafted vanilla CSS (no preprocessors), and plain JavaScript (no TypeScript compilation, no JSX). Everything self-contained in a single HTML file with inline <style> and <script>. Use the provided design tokens for colors (dark backgrounds, teal accents). The output must work when opened directly from disk (file:// protocol) — no server needed. This is deliberately minimal and dependency-free so it NEVER breaks due to version changes or config issues.'},
  ];

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

  function expandVibe(input) {
    var w = input.toLowerCase().split(/\s+/).filter(Boolean);
    if (w.length > 15) return input;
    var matched = null;
    for (var i = 0; i < VIBE_EXPANSIONS.length; i++) {
      var e = VIBE_EXPANSIONS[i];
      for (var j = 0; j < e.keywords.length; j++) {
        if (input.toLowerCase().indexOf(e.keywords[j]) !== -1) { matched = e; break; }
      }
      if (matched) break;
    }
    if (matched) return matched.prompt;
    return 'Build a complete, polished, responsive dark-themed UI page for: ' + input + '. Include appropriate layout, navigation, content sections, and interactive elements suited to the description. Use a dark background with teal accents.';
  }

  async function sendPrompt(prompt) {
    if (!prompt.trim()) return;
    if (!CONFIG.apiKey && getFreeRemaining() <= 0) {
      addMessage('You are out of free generations. Add a free OpenRouter key in Settings (the API button) for unlimited use.', 'error');
      showKeyModal();
      return;
    }

    var originalPrompt = prompt;
    prompt = expandVibe(prompt);

    dom.sendBtn.disabled = true;
    abortController = new AbortController();
    var wasExpanded = prompt !== originalPrompt;
    addMessage(wasExpanded ? '\u2726 Expanded: ' + prompt : prompt, 'user');
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
  window.addEventListener('resize', function() {
    if (zoomMode === 'fit') fitToWidth();
    // Re-evaluate auto-device when crossing 900px boundary
    var wasMobile = document.body.classList.contains('auto-mobile');
    var isMobile = window.innerWidth < 900;
    if (isMobile && !wasMobile) {
      document.body.classList.add('auto-mobile');
      setDevice('mobile');
    } else if (!isMobile && wasMobile) {
      document.body.classList.remove('auto-mobile');
      // Only revert if user didn't manually select mobile
      if (currentDevice === 'mobile' || currentDevice === 'tablet') setDevice('laptop');
    }
  });

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
  if (window.innerWidth < 900) { document.body.classList.add('auto-mobile'); setDevice('mobile'); }

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

  const EXPORT_ACTIONS = {
    download: downloadHTML,
    copy: copyHTML,
    desktop: sendToDesktop,
    handoff: function(){ if(window.openHandoffPanel) window.openHandoffPanel(); },
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
          var prov = detectProvider(key);
          var provLabel = PROVIDER_CONFIG[prov] ? PROVIDER_CONFIG[prov].label : 'OpenRouter';
          var label = info.label || info.name || provLabel;
          feedback.className = 'key-success';
          feedback.textContent = 'Connected as ' + label + '.';
          populateModelSelector();
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

    // Inspiration prompt (?prompt=...): auto-send when landing from inspiration page
    const promptParam = new URLSearchParams(window.location.search).get('prompt');
    if (promptParam) {
      const p = new URLSearchParams(window.location.search);
      p.delete('prompt');
      const qs = p.toString();
      const clean = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
      window.history.replaceState({}, document.title, clean);
      setTimeout(function(){
        dom.promptInput.value = promptParam;
        dom.promptInput.style.height = 'auto';
        sendPrompt(promptParam);
      }, 100);
    }

    const savedDesktopKey = localStorage.getItem('webhooks_email_desktop_key');
    if (savedDesktopKey) desktopKey = savedDesktopKey;
    const savedIp = localStorage.getItem('webhooks_email_desktop_ip');
    if (savedIp) setDesktopIP(savedIp);
    refreshFreeStatus();
    refreshAuthUI();

    // Chat collapse/expand (mobile only — starts collapsed)
    var chatPanel = document.querySelector('.panel-chat');
    var previewCanvas = document.getElementById('previewCanvas');
    var isMobileLayout = function(){ return window.innerWidth < 900; };
    if (isMobileLayout()) {
      if(chatPanel) chatPanel.classList.add('collapsed');
    }
    // These are defined unconditionally but only used on mobile
    window.collapseChat = function(){ if(chatPanel && isMobileLayout()) chatPanel.classList.add('collapsed'); };
    window.expandChat = function(){ if(chatPanel && isMobileLayout()) chatPanel.classList.remove('collapsed'); };
    if(chatPanel) chatPanel.addEventListener('click', function(e){ if(chatPanel.classList.contains('collapsed')) window.expandChat(); });
    if(dom.promptInput) dom.promptInput.addEventListener('focus', function(){ if(isMobileLayout()) window.expandChat(); });
    if(previewCanvas) previewCanvas.addEventListener('click', function(){ if(isMobileLayout()) window.collapseChat(); });
    // Expand only for user messages and assistant responses, not system/error
    var origAddMsg = addMessage;
    addMessage = function(txt, role){
      origAddMsg(txt, role);
      if(isMobileLayout() && (role === 'user' || role === 'assistant')) window.expandChat();
    };
    // Vibe chips: tap to auto-fill and send (works on all screen sizes)
    var vibeChips = document.getElementById('vibeChips');
    if (vibeChips) {
      vibeChips.addEventListener('click', function(e){
        var chip = e.target.closest('.vibe-chip');
        if (!chip) return;
        var vibe = chip.dataset.vibe;
        if (!vibe) return;
        var vibePrompts = {
          dashboard:'dark analytics dashboard with KPI cards, line chart, data table, and sidebar navigation in teal on black',
          landing:'SaaS landing page with gradient hero, feature grid with glass cards, pricing tier table, and neon teal CTA',
          chat:'AI chat interface with streaming message bubbles, dark sidebar conversation list, and voice input button',
          pricing:'three-tier SaaS pricing page with feature comparison table, annual/monthly toggle, and hover-lift cards',
          auth:'login and signup modal with social auth buttons, glass card form, and animated background pattern',
          ecommerce:'dark e-commerce product grid with filter sidebar, cart drawer, and hover-zoom product cards',
          kanban:'project kanban board with draggable columns, task cards with avatars, and progress indicators',
          settings:'settings panel with sidebar tab navigation, toggle switches, slider controls, and danger zone',
          portfolio:'developer portfolio with full-bleed project grid, gradient hero, skills section, and contact form',
          calendar:'dark monthly calendar with event dots, day-view slide panel, and upcoming events list',
          docs:'API docs page with three-column layout, collapsible sidebar, HTTP method badges, and code samples',
          music:'dark music player with album art, playlist sidebar, track list, and bottom persistent player bar',
          breakfree:'break free from dependency hell — generate standalone vanilla HTML/CSS/JS with zero frameworks, zero npm, zero CDN, zero build tools'
        };
        dom.promptInput.value = vibePrompts[vibe] || vibe;
        dom.promptInput.style.height = 'auto';
        if(isMobileLayout()) window.expandChat();
        sendPrompt(dom.promptInput.value);
      });
    }
    // Mic button: speech-to-text via Web Speech API
    var micBtn = document.getElementById('micBtn');
    if (micBtn && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      var recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = true;
      var recording = false;
      micBtn.addEventListener('click', function(e){
        e.stopPropagation();
        if (recording) {
          recognition.stop();
          return;
        }
        try {
          recognition.start();
          recording = true;
          micBtn.classList.add('recording');
          micBtn.title = 'Stop recording';
        } catch(err) { recording = false; }
      });
      recognition.onresult = function(e){
        var transcript = '';
        for (var i = e.resultIndex; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript;
        }
        dom.promptInput.value = transcript;
        dom.promptInput.style.height = 'auto';
      };
      recognition.onend = function(){
        recording = false;
        micBtn.classList.remove('recording');
        micBtn.title = 'Voice input';
        if (dom.promptInput.value.trim() && isMobileLayout()) window.expandChat();
      };
      recognition.onerror = function(){
        recording = false;
        micBtn.classList.remove('recording');
        micBtn.title = 'Voice input';
      };
    } else if (micBtn) {
      micBtn.style.display = 'none';
    }

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
    generateHandoff: function(){ if(window.generateHandoffDoc) window.generateHandoffDoc(); },
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

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
    workerURL: '',
    proxyEndpoint: '',
    siteURL: window.location.origin || 'https://webhooks.email',
    siteName: 'webhooks.email',
    isProxyMode: false,
  };

  const dom = {
    messages: document.getElementById('messages'),
    promptInput: document.getElementById('promptInput'),
    sendBtn: document.getElementById('sendBtn'),
    preview: document.getElementById('preview'),
    deviceBtns: document.querySelectorAll('.device-btn'),
    clearBtn: document.getElementById('clearPreviewBtn'),
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

  let abortController = null;
  let lastResult = null;
  let lastPrompt = '';
  let desktopURL = '';
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
    if (key.startsWith('wek_')) {
      CONFIG.isProxyMode = true;
      CONFIG.proxyEndpoint = localStorage.getItem('webhooks_email_proxy') || '';
      showModelSelector(true);
    } else {
      CONFIG.isProxyMode = false;
      CONFIG.proxyEndpoint = '';
      showModelSelector(false);
    }
    updateStatus('connected');
  }

  function clearApiKey() {
    CONFIG.apiKey = '';
    CONFIG.isProxyMode = false;
    CONFIG.proxyEndpoint = '';
    localStorage.removeItem(STORAGE_KEY);
    showModelSelector(false);
    updateStatus('disconnected');
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
        throw new Error('Set your webhooks.email backend URL first via WebhooksEmail.setProxyEndpoint()');
      }
      const res = await fetch(proxyURL.replace(/\/+$/, '') + '/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      });
      if (!res.ok) throw new Error('Backend validation failed: ' + res.status);
      const data = await res.json();
      if (!data.valid) throw new Error('Invalid webhooks.email key');
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
    CONFIG.workerURL = url.replace(/\/+$/, '');
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

  function setDesktopIP(ip) {
    desktopURL = ip.startsWith('http') ? ip : 'http://' + ip;
    desktopURL = desktopURL.replace(/\/+$/, '') + ':3000';
    const btn = document.getElementById('sendDesktopBtn');
    if (btn) btn.style.display = desktopURL ? 'inline-flex' : 'none';
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

  async function callGemma(messages, { signal } = {}) {
    if (!CONFIG.apiKey) {
      throw new Error('API key not set. Call WebhooksEmail.setApiKey() with your OpenRouter key.');
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
    if (CONFIG.isProxyMode) {
      showStatus('Generating via webhooks.email...');
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
    if (!CONFIG.apiKey) {
      addMessage('API key not set. Call WebhooksEmail.setApiKey() with your OpenRouter key.', 'error');
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

  let eventSource = null;

  function connectStream() {
    if (!CONFIG.workerURL) return;
    disconnectStream();
    const sessionId = localStorage.getItem('webhooks_session') || 'default';
    eventSource = new EventSource(CONFIG.workerURL + '/api/stream?session=' + sessionId);
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
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

  dom.deviceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      dom.deviceBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      dom.preview.classList.toggle('mobile', btn.dataset.device === 'mobile');
    });
  });

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
      addMessage('Set the desktop IP first: WebhooksEmail.setDesktopIP("192.168.x.x")', 'error');
      return;
    }
    const fullDoc = buildFullDoc(lastResult);
    const msg = addMessage('Sending to desktop…', 'typing');
    try {
      const res = await fetch(desktopURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'wek_desktop_sync_key_change_me',
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

    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', showKeyModal);
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

    if (!loadApiKey()) {
      showKeyModal();
    } else {
      updateStatus('connected');
    }
  });

  window.WebhooksEmail = {
    setApiKey,
    setBaseURL,
    setProxyEndpoint,
    setWorkerURL,
    setDesktopIP,
    setModel,
    getSelectedModel,
    sendPrompt,
    sendToDesktop,
    createWebhookEndpoint,
    connectStream,
    disconnectStream,
    validateApiKey,
    loadApiKey,
    saveApiKey,
    clearApiKey,
    showKeyModal,
    hideKeyModal,
    getLastResult: () => lastResult,
    getModels: () => MODELS,
    getSkills: () => Object.keys(SKILLS),
  };
})();

/**
 * DevIQ — js/ai.js
 * ─────────────────────────────────────────────────────────────
 *  Universal AI router. Supports Anthropic, OpenAI, Gemini,
 *  and Groq. Auto-selects best available model per task type.
 *  Falls back gracefully if a model fails.
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ══════════════════════════════════════════════════════════════
   MODEL REGISTRY
   Each provider's best model + endpoint + header format
══════════════════════════════════════════════════════════════ */
const MODELS = {
  anthropic: {
    name    : 'Claude Sonnet 4',
    model   : 'claude-sonnet-4-5',
    endpoint: 'https://api.anthropic.com/v1/messages',
    keyField: 'ANTHROPIC_API_KEY',
    badge   : '🟣',
  },
  openai: {
    name    : 'GPT-4o',
    model   : 'gpt-4o',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    keyField: 'OPENAI_API_KEY',
    badge   : '🟢',
  },
  gemini: {
    name    : 'Gemini 1.5 Flash',
    model   : 'gemini-1.5-flash',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    keyField: 'GEMINI_API_KEY',
    badge   : '🔵',
  },
  groq: {
    name    : 'Llama 3.3 70B',
    model   : 'llama-3.3-70b-versatile',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    keyField: 'GROQ_API_KEY',
    badge   : '🟠',
  },
};

/* ══════════════════════════════════════════════════════════════
   TASK → PROVIDER PREFERENCE
   Best model per task type, in priority order.
   Falls back to next available if key missing or call fails.
══════════════════════════════════════════════════════════════ */
const TASK_PRIORITY = {
  deep_analysis : ['anthropic', 'openai', 'gemini', 'groq'],
  resume        : ['openai', 'anthropic', 'gemini', 'groq'],
  interview     : ['anthropic', 'openai', 'gemini', 'groq'],
  fast          : ['groq', 'gemini', 'anthropic', 'openai'],
  general       : ['anthropic', 'openai', 'gemini', 'groq'],
};

/* ══════════════════════════════════════════════════════════════
   PROVIDER AVAILABILITY
══════════════════════════════════════════════════════════════ */

/** Returns list of available provider IDs based on configured keys */
function availableProviders() {
  const cfg = window.DEVIQ_CONFIG || {};
  return Object.entries(MODELS)
    .filter(([, m]) => !!cfg[m.keyField])
    .map(([id]) => id);
}

/** Returns the best available provider for a task */
function pickProvider(taskType) {
  const cfg       = window.DEVIQ_CONFIG || {};
  const available = availableProviders();
  if (!available.length) throw new Error('No AI key configured. Open js/config.js and add at least one API key.');

  // If proxy is set, always use it (any model)
  if (cfg.PROXY_URL) return 'proxy';

  const priority = TASK_PRIORITY[taskType] || TASK_PRIORITY.general;
  const chosen   = priority.find(p => available.includes(p));
  return chosen || available[0];
}

/** Returns human-readable provider status for the terminal */
function getProviderStatus() {
  const cfg       = window.DEVIQ_CONFIG || {};
  const available = availableProviders();
  return {
    available,
    count   : available.length,
    names   : available.map(p => `${MODELS[p].badge} ${MODELS[p].name}`).join(', '),
    hasProxy: !!cfg.PROXY_URL,
  };
}

/* ══════════════════════════════════════════════════════════════
   INDIVIDUAL PROVIDER CALLERS
══════════════════════════════════════════════════════════════ */

async function callAnthropic(prompt, maxTokens) {
  const cfg = window.DEVIQ_CONFIG || {};
  const res = await fetch(MODELS.anthropic.endpoint, {
    method : 'POST',
    headers: {
      'Content-Type'     : 'application/json',
      'x-api-key'        : cfg.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model     : MODELS.anthropic.model,
      max_tokens: maxTokens,
      messages  : [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`Anthropic: ${e.error?.message || res.status}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

async function callOpenAI(prompt, maxTokens) {
  const cfg = window.DEVIQ_CONFIG || {};
  const res = await fetch(MODELS.openai.endpoint, {
    method : 'POST',
    headers: {
      'Content-Type' : 'application/json',
      'Authorization': `Bearer ${cfg.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model     : MODELS.openai.model,
      max_tokens: maxTokens,
      messages  : [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`OpenAI: ${e.error?.message || res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGemini(prompt, maxTokens) {
  const cfg = window.DEVIQ_CONFIG || {};
  const url = `${MODELS.gemini.endpoint}?key=${cfg.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({
      contents         : [{ parts: [{ text: prompt }] }],
      generationConfig : { maxOutputTokens: maxTokens },
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`Gemini: ${e.error?.message || res.status}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callGroq(prompt, maxTokens) {
  const cfg = window.DEVIQ_CONFIG || {};
  const res = await fetch(MODELS.groq.endpoint, {
    method : 'POST',
    headers: {
      'Content-Type' : 'application/json',
      'Authorization': `Bearer ${cfg.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model     : MODELS.groq.model,
      max_tokens: maxTokens,
      messages  : [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`Groq: ${e.error?.message || res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callProxy(prompt, maxTokens) {
  const cfg = window.DEVIQ_CONFIG || {};
  const res = await fetch(cfg.PROXY_URL, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({
      model     : 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      messages  : [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`Proxy: ${e.error || res.status}`);
  }
  const data = await res.json();
  return data.text || data.content?.[0]?.text || '';
}

/* ══════════════════════════════════════════════════════════════
   MAIN ROUTER — callAI(prompt, taskType, maxTokens)
   Tries providers in priority order, falls back on failure.
══════════════════════════════════════════════════════════════ */

const CALLER_MAP = {
  anthropic: callAnthropic,
  openai   : callOpenAI,
  gemini   : callGemini,
  groq     : callGroq,
  proxy    : callProxy,
};

/**
 * Universal AI caller with automatic fallback.
 * @param {string} prompt     - The prompt to send
 * @param {string} taskType   - 'deep_analysis' | 'resume' | 'interview' | 'fast' | 'general'
 * @param {number} maxTokens  - Max tokens to generate (default 2000)
 * @returns {Promise<{text: string, provider: string, model: string}>}
 */
async function callAI(prompt, taskType = 'general', maxTokens = 4000) {
  const cfg       = window.DEVIQ_CONFIG || {};
  const available = availableProviders();

  if (!available.length && !cfg.PROXY_URL) {
    throw new Error('No AI key found. Open js/config.js and add at least one API key.');
  }

  // Use proxy if configured
  if (cfg.PROXY_URL) {
    const text = await callProxy(prompt, maxTokens);
    return { text, provider: 'proxy', model: 'server-side' };
  }

  // Try providers in priority order, fall back on error
  const priority = TASK_PRIORITY[taskType] || TASK_PRIORITY.general;
  const queue    = priority.filter(p => available.includes(p));

  let lastError;
  for (const providerId of queue) {
    try {
      const caller = CALLER_MAP[providerId];
      const text   = await caller(prompt, maxTokens);
      if (!text) throw new Error('Empty response');
      return {
        text,
        provider : providerId,
        model    : MODELS[providerId].name,
        badge    : MODELS[providerId].badge,
      };
    } catch (err) {
      console.warn(`[DevIQ] ${providerId} failed: ${err.message}. Trying next…`);
      lastError = err;
    }
  }

  throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
}

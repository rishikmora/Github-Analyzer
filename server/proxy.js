/**
 * DevIQ — server/proxy.js
 * ─────────────────────────────────────────────────────────────
 *  Multi-model backend proxy. Keeps ALL API keys server-side.
 *  Supports Anthropic, OpenAI, Gemini, and Groq.
 *
 *  Setup:
 *    1. cp .env.example .env  →  fill in whichever keys you have
 *    2. npm install
 *    3. node server/proxy.js
 *    4. In js/config.js set PROXY_URL: 'http://localhost:3001/api/chat'
 *       and leave all AI keys as ''
 * ─────────────────────────────────────────────────────────────
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '2mb' }));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));

/* ── Provider configs ─────────────────────────────────────── */
const PROVIDERS = {
  anthropic: {
    endpoint: 'https://api.anthropic.com/v1/messages',
    envKey  : 'ANTHROPIC_API_KEY',
    buildHeaders: (key) => ({
      'Content-Type'     : 'application/json',
      'x-api-key'        : key,
      'anthropic-version': '2023-06-01',
    }),
    buildBody: (model, maxTokens, messages) => ({
      model, max_tokens: maxTokens, messages,
    }),
    extractText: (data) => data.content?.[0]?.text || '',
  },
  openai: {
    endpoint: 'https://api.openai.com/v1/chat/completions',
    envKey  : 'OPENAI_API_KEY',
    buildHeaders: (key) => ({
      'Content-Type' : 'application/json',
      'Authorization': `Bearer ${key}`,
    }),
    buildBody: (model, maxTokens, messages) => ({
      model: model || 'gpt-4o', max_tokens: maxTokens, messages,
    }),
    extractText: (data) => data.choices?.[0]?.message?.content || '',
  },
  gemini: {
    endpoint: null, // built dynamically with key
    envKey  : 'GEMINI_API_KEY',
    buildHeaders: (_key) => ({ 'Content-Type': 'application/json' }),
    buildBody: (_model, maxTokens, messages) => ({
      contents        : [{ parts: [{ text: messages[messages.length - 1].content }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
    extractText: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || '',
  },
  groq: {
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    envKey  : 'GROQ_API_KEY',
    buildHeaders: (key) => ({
      'Content-Type' : 'application/json',
      'Authorization': `Bearer ${key}`,
    }),
    buildBody: (model, maxTokens, messages) => ({
      model: model || 'llama-3.3-70b-versatile', max_tokens: maxTokens, messages,
    }),
    extractText: (data) => data.choices?.[0]?.message?.content || '',
  },
};

/* Task → provider priority order (mirrors ai.js) */
const TASK_PRIORITY = {
  deep_analysis : ['anthropic', 'openai', 'gemini', 'groq'],
  resume        : ['openai', 'anthropic', 'gemini', 'groq'],
  interview     : ['anthropic', 'openai', 'gemini', 'groq'],
  fast          : ['groq', 'gemini', 'anthropic', 'openai'],
  general       : ['anthropic', 'openai', 'gemini', 'groq'],
};

function availableProviders() {
  return Object.entries(PROVIDERS)
    .filter(([, p]) => !!process.env[p.envKey])
    .map(([id]) => id);
}

async function callProvider(providerId, model, maxTokens, messages) {
  const p   = PROVIDERS[providerId];
  const key = process.env[p.envKey];
  if (!key) throw new Error(`${providerId}: key not set`);

  // Gemini endpoint needs key in URL
  const endpoint = providerId === 'gemini'
    ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`
    : p.endpoint;

  const res = await fetch(endpoint, {
    method : 'POST',
    headers: p.buildHeaders(key),
    body   : JSON.stringify(p.buildBody(model, maxTokens, messages)),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`${providerId} API error ${res.status}: ${JSON.stringify(err).slice(0, 200)}`);
  }

  const data = await res.json();
  const text = p.extractText(data);
  if (!text) throw new Error(`${providerId}: empty response`);
  return { text, provider: providerId };
}

/* ── Health check ─────────────────────────────────────────── */
app.get('/health', (_req, res) => {
  const available = availableProviders();
  res.json({
    status   : 'ok',
    providers: available,
    timestamp: new Date().toISOString(),
  });
});

/* ── AI proxy endpoint ────────────────────────────────────── */
app.post('/api/chat', async (req, res) => {
  const { model, max_tokens = 2000, messages, task_type = 'general' } = req.body;

  const available = availableProviders();
  if (!available.length) {
    return res.status(500).json({ error: 'No AI API keys configured on server.' });
  }

  const priority = TASK_PRIORITY[task_type] || TASK_PRIORITY.general;
  const queue    = priority.filter(p => available.includes(p));

  let lastError;
  for (const providerId of queue) {
    try {
      const { text, provider } = await callProvider(providerId, model, max_tokens, messages);
      return res.json({ text, provider });
    } catch (err) {
      console.warn(`[proxy] ${providerId} failed: ${err.message}`);
      lastError = err;
    }
  }

  res.status(502).json({ error: `All providers failed. Last: ${lastError?.message}` });
});

/* ── Serve static files ───────────────────────────────────── */
app.use(express.static(path.join(__dirname, '..')));

/* ── Start ────────────────────────────────────────────────── */
app.listen(PORT, () => {
  const available = availableProviders();
  console.log(`\n  ╔══════════════════════════════════════════╗`);
  console.log(`  ║     DevIQ Proxy  —  localhost:${PORT}      ║`);
  console.log(`  ╚══════════════════════════════════════════╝`);
  console.log(`\n  Available AI providers: ${available.join(', ') || 'NONE — add keys to .env'}`);
  console.log(`  Health:  GET  http://localhost:${PORT}/health`);
  console.log(`  AI:      POST http://localhost:${PORT}/api/chat`);
  console.log(`  App:     http://localhost:${PORT}\n`);
});

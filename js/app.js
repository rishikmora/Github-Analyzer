/**
 * DevIQ — js/app.js
 * Main orchestrator. Uses ai.js (multi-model router) and
 * enrichment.js (npm, GraphQL, Serper, WakaTime) to build
 * the richest possible analysis from whatever keys are configured.
 */

'use strict';

/* ══════════════════════════════════════════════════════════════
   APP STATE
══════════════════════════════════════════════════════════════ */
window._deviqMode  = 'faang';
window._deviqUser  = null;
window._deviqRepos = null;

/* ══════════════════════════════════════════════════════════════
   TAB SYSTEM
══════════════════════════════════════════════════════════════ */
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelector(`.tab-btn[data-tab="${name}"]`)?.classList.add('active');
  document.getElementById(`panel-${name}`)?.classList.add('active');
  setTimeout(animateBars, 50);
}

/* ══════════════════════════════════════════════════════════════
   MODE SELECTOR
══════════════════════════════════════════════════════════════ */
function setMode(el) {
  document.querySelectorAll('.mode-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  window._deviqMode = el.dataset.mode;
}

/* ══════════════════════════════════════════════════════════════
   TERMINAL HELPERS
══════════════════════════════════════════════════════════════ */
function termClear() {
  document.getElementById('termBody').innerHTML = '';
  setProgress(0);
}

function termLine(prefix, agent, text, cls = 'term-run') {
  const body = document.getElementById('termBody');
  const div  = document.createElement('div');
  div.className = 'terminal-line';
  div.innerHTML =
    `<span class="term-prefix">${prefix}</span>` +
    `<span class="term-agent ${cls}">[${agent}]</span>&nbsp;` +
    `<span class="term-text">${text}</span>`;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
}

function setProgress(pct) {
  const bar = document.getElementById('termProgress');
  if (bar) bar.style.width = pct + '%';
}

function buildAgentGrid() {
  return AGENTS_META.map(a => `
    <div class="agent-card pending" id="ag-${a.id}">
      <div class="agent-card-name"><i class="ti ${a.icon}" style="font-size:10px"></i> ${a.name}</div>
      <div class="agent-card-status">
        <span class="agent-dot pending" id="ad-${a.id}"></span>
        <span style="font-size:10px;color:var(--t3)" id="as-${a.id}">waiting</span>
      </div>
    </div>`).join('');
}

function setAgentState(id, state, msg) {
  const card   = document.getElementById(`ag-${id}`);
  const dot    = document.getElementById(`ad-${id}`);
  const status = document.getElementById(`as-${id}`);
  if (!card) return;
  card.className      = `agent-card ${state}`;
  dot.className       = `agent-dot ${state}`;
  if (status) status.textContent = msg || state;
}

/* ══════════════════════════════════════════════════════════════
   PROVIDER STATUS DISPLAY
══════════════════════════════════════════════════════════════ */
function showProviderStatus() {
  const status = getProviderStatus();
  if (status.hasProxy) {
    termLine('✓', 'MODELS', 'Backend proxy configured — key stays server-side.', 'term-ok');
  } else if (status.count === 0) {
    termLine('⚠', 'MODELS', 'No AI keys found. Open js/config.js and add at least one.', 'term-warn');
  } else if (status.count === 1) {
    termLine('>', 'MODELS', `Using: ${status.names}`, 'term-run');
  } else {
    termLine('>', 'MODELS', `${status.count} AI models available: ${status.names}`, 'term-ok');
    termLine('>', 'ROUTER', 'Multi-model routing enabled — agents auto-assigned to best model.', 'term-run');
  }
}

/* ══════════════════════════════════════════════════════════════
   MAIN ANALYSIS PIPELINE
══════════════════════════════════════════════════════════════ */
async function startAnalysis() {
  const input    = document.getElementById('ghInput');
  const username = (input?.value || '').trim().replace(/^@/, '');
  if (!username) { input?.focus(); return; }

  const btn = document.getElementById('analyzeBtn');
  btn.disabled = true;

  document.getElementById('errorPanel').classList.remove('visible');
  document.getElementById('results').style.display  = 'none';
  document.getElementById('results').classList.remove('visible');

  const term = document.getElementById('terminal');
  term.classList.add('visible');
  termClear();
  document.getElementById('agentGrid').innerHTML = buildAgentGrid();

  try {
    // ── Phase 1: System init ──────────────────────────────────
    termLine('$', 'SYSTEM', 'Initializing DevIQ multi-agent intelligence pipeline…');
    showProviderStatus();
    setProgress(5);
    await delay(200);

    // ── Phase 2: GitHub REST ──────────────────────────────────
    termLine('>', 'FETCH', `Requesting GitHub profile for @${username}…`);
    const { user, repos, events } = await fetchGitHubProfile(username);
    termLine('✓', 'FETCH', `Profile loaded — ${repos.length} repositories found.`, 'term-ok');
    setProgress(15);

    const nonFork  = repos.filter(r => !r.fork);
    const topRepos = [...nonFork].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 8);
    const langs    = detectLanguages(repos);
    const archs    = detectArchitecturePatterns(nonFork);
    const stars    = nonFork.reduce((s, r) => s + r.stargazers_count, 0);

    window._deviqUser  = user;
    window._deviqRepos = nonFork;

    termLine('>', 'ARCH',  `Detected patterns: ${archs.slice(0, 4).join(', ')}${archs.length > 4 ? '…' : ''}`);
    termLine('>', 'LANGS', `Top languages: ${langs.slice(0, 4).map(l => l.lang).join(', ')}`);
    setProgress(22);

    // ── Phase 3: Enrichment (parallel) ───────────────────────
    termLine('>', 'ENRICH', 'Running enrichment pipeline in parallel…');
    const techNames = langs.map(l => l.lang);

    const cfg = window.DEVIQ_CONFIG || {};
    const enrichmentPromise = runEnrichment(username, techNames);

    // Show what's being fetched
    if (cfg.ENABLE_NPM_ENRICHMENT)
      termLine('>', 'NPM',     `Checking npm registry for @${username}…`);
    if (cfg.ENABLE_GRAPHQL_GITHUB && cfg.GITHUB_TOKEN)
      termLine('>', 'GRAPHQL', 'Fetching contribution graph via GitHub GraphQL…');
    if (cfg.ENABLE_WEB_SEARCH && cfg.SERPER_API_KEY)
      termLine('>', 'SEARCH',  `Fetching job market data for ${techNames.slice(0,3).join(', ')}…`);

    setProgress(30);

    // ── Phase 4: Agent stagger display ───────────────────────
    const agentIds = ['arch','code','security','career','recruiter','docs','scale'];
    agentIds.forEach((id, i) => {
      setTimeout(() => {
        const meta     = AGENTS_META.find(a => a.id === id);
        const provider = pickProvider(id === 'recruiter' ? 'general' : id === 'code' ? 'deep_analysis' : 'deep_analysis');
        const model    = provider !== 'proxy' && window.MODELS?.[provider]
          ? ` [${window.MODELS[provider].badge} ${window.MODELS[provider].name}]`
          : '';
        termLine('>', meta.name.toUpperCase(), `Analyzing…${model}`);
        setAgentState(id, 'running', 'analyzing…');
      }, i * 260);
    });

    setProgress(38);

    // Wait for enrichment to finish
    const enrichment = await enrichmentPromise;
    setProgress(45);

    if (enrichment._hasData) {
      enrichment._sources.forEach(s => termLine('✓', 'ENRICH', s, 'term-ok'));
    } else {
      termLine('>', 'ENRICH', 'No enrichment data available — proceeding with GitHub data only.');
    }

    // ── Phase 5: AI Analysis ──────────────────────────────────
    await delay(agentIds.length * 260 + 100);
    termLine('>', 'AI', 'Sending to AI analysis engine…');
    setProgress(50);

    const prompt = buildAnalysisPrompt(user, nonFork, langs, archs, window._deviqMode, enrichment);
    const { text, provider, model, badge } = await callAI(prompt, 'deep_analysis', 2500);

    termLine('✓', 'AI', `Analysis complete via ${badge || ''}${model || provider}.`, 'term-ok');
    setProgress(80);

    const analysis = parseJSON(text);

    // ── Phase 6: Finalize agents ──────────────────────────────
    const keyMap = {
      arch:'architect', code:'codeReviewer', security:'securityReviewer',
      career:'careerMentor', recruiter:'recruiter', docs:'docsReviewer', scale:'scalabilityAnalyst'
    };
    agentIds.forEach(id => {
      const sc = analysis.agents?.[keyMap[id]]?.score || 70;
      setAgentState(id, 'done', `score: ${sc}/100`);
      termLine('✓', AGENTS_META.find(a => a.id === id).name.toUpperCase(), `Score: ${sc}/100`, 'term-ok');
    });

    setProgress(95);
    termLine('✓', 'PIPELINE', 'All agents done. Rendering report…', 'term-ok');
    await delay(350);
    setProgress(100);
    await delay(300);

    term.classList.remove('visible');

    // Attach enrichment to analysis for render use
    analysis._enrichment = enrichment;
    renderAll(user, nonFork, topRepos, langs, archs, stars, analysis);

  } catch (err) {
    term.classList.remove('visible');
    const ep = document.getElementById('errorPanel');
    ep.textContent = '⚠ ' + (err.message || 'Unknown error. Please try again.');
    ep.classList.add('visible');
    console.error('[DevIQ]', err);
  } finally {
    btn.disabled = false;
  }
}

/* ══════════════════════════════════════════════════════════════
   EVENT WIRING
══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('analyzeBtn')?.addEventListener('click', startAnalysis);
  document.getElementById('ghInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') startAnalysis();
  });
  document.querySelectorAll('.mode-pill').forEach(pill => {
    pill.addEventListener('click', () => setMode(pill));
  });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
});

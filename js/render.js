/**
 * DevIQ — render.js
 * All DOM rendering: profile hero, overview, agents, repos,
 * career, resume, interview, security, semantic search.
 */

'use strict';

let radarChartInst = null;

/* ══════════════════════════════════════════════════════════════
   MASTER RENDER
══════════════════════════════════════════════════════════════ */

function renderAll(user, repos, topRepos, langs, archs, stars, a) {
  document.getElementById('results').style.display = 'block';
  document.getElementById('results').classList.add('visible');

  renderProfileHero(user, repos, stars, a);
  renderOverview(repos, langs, archs, stars, a);
  renderAgentsPanel(a);
  renderReposPanel(topRepos, archs, a);
  renderCareerPanel(a);
  renderResumePanel(a);
  renderInterviewPanel(a);
  renderSecurityPanel(repos, a);
  renderSearchPanel(repos, a);

  document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(animateBars, 200);
}

/* ══════════════════════════════════════════════════════════════
   PROFILE HERO
══════════════════════════════════════════════════════════════ */

function renderProfileHero(user, repos, stars, a) {
  const techColors = ['#6366f1','#22d3ee','#10b981','#f59e0b','#a78bfa','#ec4899'];
  const chips = (a.topTechs || []).map((t, i) =>
    `<span class="tech-chip" style="background:${techColors[i % techColors.length]}18;border-color:${techColors[i % techColors.length]}33;color:${techColors[i % techColors.length]}">${t}</span>`
  ).join('');

  const readinessColor = {
    'Beginner':         'var(--danger)',
    'Portfolio-level':  'var(--nova)',
    'Production-grade': 'var(--pulse)',
    'Enterprise-grade': 'var(--electric-l)',
  }[a.productionReadiness] || 'var(--t2)';

  document.getElementById('profileHero').innerHTML = `
    <div class="profile-hero mb15">
      <div class="profile-hero-inner">
        <div class="profile-avatar-wrap">
          <div class="profile-avatar-ring"></div>
          <img class="profile-avatar" src="${user.avatar_url}" alt="${user.login}"
               onerror="this.src='https://github.com/identicons/${user.login}.png'"/>
        </div>
        <div class="profile-main">
          <div class="profile-name">${user.name || user.login}</div>
          <div class="profile-handle">@${user.login} · ${a.maturityLevel || 'Developer'}</div>
          ${user.bio ? `<div class="profile-bio">${user.bio}</div>` : ''}
          <div class="profile-stats">
            <div class="pstat"><div class="pstat-num">${user.followers.toLocaleString()}</div><div class="pstat-lbl">followers</div></div>
            <div class="pstat"><div class="pstat-num">${user.public_repos}</div><div class="pstat-lbl">repos</div></div>
            <div class="pstat"><div class="pstat-num">${stars.toLocaleString()}</div><div class="pstat-lbl">stars</div></div>
            <div class="pstat"><div class="pstat-num">${repos.length}</div><div class="pstat-lbl">original</div></div>
          </div>
          <div class="tech-strip">${chips}</div>
          ${user.location ? `<div style="font-size:11px;color:var(--t3);margin-top:8px;font-family:var(--font-mono)"><i class="ti ti-map-pin"></i> ${user.location}</div>` : ''}
          ${user.blog   ? `<div style="font-size:11px;margin-top:4px"><a href="${user.blog.startsWith('http') ? user.blog : 'https://' + user.blog}" target="_blank" style="color:var(--electric-l);font-family:var(--font-mono)"><i class="ti ti-world"></i> ${user.blog}</a></div>` : ''}
        </div>
        <div class="score-column">
          <div class="score-badge">
            <div class="score-badge-val" style="color:${scoreColor(a.engineeringIQ || 50)}">${a.engineeringIQ || '—'}</div>
            <div class="score-badge-lbl">Eng IQ</div>
            <div class="score-badge-sub">${a.iqGrade || ''}</div>
          </div>
          <div class="score-badge">
            <div class="score-badge-val" style="color:${scoreColor(a.overallScore || 50)}">${a.overallScore || '—'}</div>
            <div class="score-badge-lbl">Score</div>
            <span class="readiness-badge" style="background:${readinessColor}18;border:1px solid ${readinessColor}33;color:${readinessColor}">
              ${a.productionReadiness || ''}
            </span>
          </div>
          <div class="score-badge" style="background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(34,211,238,0.05))">
            <div class="score-badge-val" style="color:var(--electric-l)">P${a.benchmarkPercentile || 50}</div>
            <div class="score-badge-lbl">Percentile</div>
            <div class="score-badge-sub">${a.bestRoleFit || ''}</div>
          </div>
        </div>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════════════════
   OVERVIEW TAB
══════════════════════════════════════════════════════════════ */

function renderOverview(repos, langs, archs, stars, a) {
  const dims = [
    { label: 'Architecture',  val: a.architectureScore  || 50 },
    { label: 'Code Quality',  val: a.codeQualityScore   || 50 },
    { label: 'Deployment',    val: a.deploymentScore    || 50 },
    { label: 'Community',     val: a.communityScore     || 50 },
    { label: 'Documentation', val: a.documentationScore || 50 },
    { label: 'AI Readiness',  val: a.aiReadinessScore   || 50 },
  ];
  const dimTiles = dims.map(d => `
    <div class="metric-tile">
      <div class="metric-val" style="color:${scoreColor(d.val)}">${d.val}</div>
      <div class="metric-lbl">${d.label}</div>
    </div>`).join('');

  const archColors = ['rgba(99,102,241,0.15)','rgba(34,211,238,0.12)','rgba(16,185,129,0.12)',
    'rgba(245,158,11,0.12)','rgba(167,139,250,0.12)','rgba(236,72,153,0.12)'];
  const archBadges = archs.map((p, i) => `
    <span class="arch-badge" style="background:${archColors[i % archColors.length]};border-color:rgba(255,255,255,0.08);color:var(--t1)">
      <i class="ti ti-circuit-diode" style="font-size:10px"></i>${p}
    </span>`).join('');

  const totalLC = langs.reduce((s, l) => s + l.count, 0);
  const barColors = ['#6366f1','#22d3ee','#10b981','#f59e0b','#a78bfa','#ec4899','#f43f5e','#64748b'];
  const langBars = langs.map((l, i) => {
    const pct = Math.round(l.count / totalLC * 100);
    return `<div class="skill-row-wrap">
      <div class="skill-row-hdr">
        <span class="skill-row-name">${l.lang}</span>
        <span class="skill-row-val">${pct}%</span>
      </div>
      <div class="bar-track">
        <div class="bar-fill" style="background:${barColors[i % barColors.length]}" data-target="${pct}"></div>
      </div>
    </div>`;
  }).join('');

  const userScore = a.overallScore || 50;
  const benchRows = BENCHMARKS.map(b => `
    <div class="bench-item">
      <div class="bench-rank">—</div>
      <div class="bench-name" style="color:${userScore >= b.score ? 'var(--t2)' : 'var(--t3)'}">${b.name}</div>
      <div class="bench-bar-wrap"><div class="bar-track"><div class="bar-fill" style="background:${b.color}" data-target="${b.score}"></div></div></div>
      <div class="bench-score" style="color:${b.color}">${b.score}</div>
    </div>`).join('') + `
    <div class="bench-item" style="border-top:1px solid var(--b2);margin-top:4px;padding-top:8px">
      <div class="bench-rank" style="color:var(--electric-l)">YOU</div>
      <div class="bench-name" style="color:var(--electric-l);font-weight:500">@${window._deviqUser?.login || 'You'}</div>
      <div class="bench-bar-wrap"><div class="bar-track"><div class="bar-fill" style="background:var(--electric-l)" data-target="${userScore}"></div></div></div>
      <div class="bench-score" style="color:var(--electric-l)">${userScore}</div>
    </div>`;

  const strHTML = (a.strengths || []).map(s => `
    <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:8px">
      <span style="color:var(--pulse);font-size:11px;margin-top:2px;flex-shrink:0">▲</span>
      <span class="text-sm text-muted">${s}</span>
    </div>`).join('');
  const weakHTML = (a.weaknesses || []).map(w => `
    <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:8px">
      <span style="color:var(--nova);font-size:11px;margin-top:2px;flex-shrink:0">▼</span>
      <span class="text-sm text-muted">${w}</span>
    </div>`).join('');

  const tlHTML = (a.timelineEvents || []).map((ev, i, arr) => `
    <div class="tl-item">
      <div class="tl-dot-wrap">
        <div class="tl-dot" style="background:${i === 0 ? 'var(--pulse)' : i === arr.length - 1 ? 'var(--electric-l)' : 'var(--t4)'}"></div>
        ${i < arr.length - 1 ? '<div class="tl-tail"></div>' : ''}
      </div>
      <div class="tl-body">
        <div class="tl-year">${ev.year || ''}</div>
        <div class="tl-text">${ev.text || ''}</div>
      </div>
    </div>`).join('');

  document.getElementById('panel-overview').innerHTML = `
    ${sectionHdr('Score Breakdown', '6 dimensions')}
    <div class="grid-3 mb1">${dimTiles}</div>

    <div class="grid-2">
      <div class="card">
        <div class="card-hdr"><i class="ti ti-chart-radar"></i>Engineering Radar</div>
        <div class="radar-wrap"><canvas id="radarChart" role="img" aria-label="Engineering skills radar chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-hdr"><i class="ti ti-code"></i>Language Distribution</div>
        ${langBars}
      </div>
    </div>

    ${sectionHdr('Architecture Intelligence', 'repo scan')}
    <div class="card mb1">
      <div class="card-hdr"><i class="ti ti-topology-star"></i>Pattern Analysis</div>
      <p class="text-sm text-muted" style="line-height:1.7;margin-bottom:1rem">${a.architectureSummary || ''}</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:1rem">${archBadges}</div>
      <div class="grid-2" style="gap:1rem;margin-bottom:0">
        <div>
          <div class="card-hdr" style="margin-bottom:8px"><i class="ti ti-trending-up"></i>Strengths</div>
          ${strHTML}
        </div>
        <div>
          <div class="card-hdr" style="margin-bottom:8px"><i class="ti ti-alert-triangle"></i>Gaps to address</div>
          ${weakHTML}
        </div>
      </div>
    </div>

    ${sectionHdr('Benchmark Analysis', 'vs elite engineers')}
    <div class="card mb1">
      <div class="card-hdr"><i class="ti ti-trophy"></i>Where You Stand</div>
      <p class="text-sm text-muted" style="margin-bottom:1rem">
        Score <strong style="color:var(--electric-l)">${userScore}</strong> places you in the
        <strong style="color:var(--electric-l)">top ${100 - (a.benchmarkPercentile || 50)}%</strong> of active developers.
        ${a.careerPath || ''}
      </p>
      ${benchRows}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-hdr"><i class="ti ti-user-star"></i>Developer Persona</div>
        <div class="persona-card">
          <span class="persona-glyph">${a.personalityGlyph || '👾'}</span>
          <div class="persona-type">${a.personalityType || ''}</div>
          <div class="persona-desc">${a.personalityDesc || ''}</div>
        </div>
      </div>
      <div class="card">
        <div class="card-hdr"><i class="ti ti-timeline"></i>Developer Timeline</div>
        ${tlHTML}
        ${a.hiddenGem ? `<div class="gem-box"><div class="gem-hdr"><i class="ti ti-diamond"></i>Hidden Gem</div><div class="gem-text">${a.hiddenGem}</div></div>` : ''}
      </div>
    </div>`;

  // Build radar chart
  if (radarChartInst) { radarChartInst.destroy(); radarChartInst = null; }
  const ctx = document.getElementById('radarChart');
  if (ctx) {
    radarChartInst = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Architecture', 'Code Quality', 'Deployment', 'Community', 'Docs', 'AI Ready'],
        datasets: [{
          label: 'Score',
          data: [a.architectureScore || 50, a.codeQualityScore || 50, a.deploymentScore || 50,
                 a.communityScore || 50, a.documentationScore || 50, a.aiReadinessScore || 50],
          backgroundColor: 'rgba(99,102,241,0.12)',
          borderColor: 'rgba(99,102,241,0.8)',
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#a5b4fc',
          borderWidth: 1.5,
          pointRadius: 4,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          r: {
            min: 0, max: 100,
            ticks: { display: false },
            grid: { color: 'rgba(255,255,255,0.04)' },
            pointLabels: { font: { size: 9, family: 'JetBrains Mono, monospace' }, color: 'rgba(144,144,176,0.8)' },
            angleLines: { color: 'rgba(255,255,255,0.04)' },
          }
        }
      }
    });
  }
}

/* ══════════════════════════════════════════════════════════════
   AGENTS TAB
══════════════════════════════════════════════════════════════ */

function renderAgentsPanel(a) {
  const agConfig = [
    { key: 'recruiter',          label: 'Recruiter Agent',         icon: 'ti-briefcase',    color: 'var(--electric-l)' },
    { key: 'architect',          label: 'Architecture Reviewer',   icon: 'ti-topology-star',color: 'var(--plasma)'     },
    { key: 'codeReviewer',       label: 'Code Quality Inspector',  icon: 'ti-code',         color: 'var(--pulse)'      },
    { key: 'securityReviewer',   label: 'Security Scanner',        icon: 'ti-shield-lock',  color: 'var(--danger)'     },
    { key: 'careerMentor',       label: 'Career Mentor',           icon: 'ti-map',          color: 'var(--violet)'     },
    { key: 'docsReviewer',       label: 'Documentation Reviewer',  icon: 'ti-book',         color: 'var(--nova)'       },
    { key: 'scalabilityAnalyst', label: 'Scalability Analyst',     icon: 'ti-server',       color: 'var(--pink)'       },
  ];

  const cards = agConfig.map(ag => {
    const data = a.agents?.[ag.key] || {};
    const sc   = data.score || 70;
    const tags = (data.tags || []).map(t =>
      `<span class="av-tag" style="background:${ag.color}18;border-color:${ag.color}33;color:${ag.color}">${t}</span>`
    ).join('');
    return `<div class="agent-verdict">
      <div class="av-header">
        <div class="av-icon" style="background:${ag.color}18;border:1px solid ${ag.color}22">
          <i class="ti ${ag.icon}" style="color:${ag.color}"></i>
        </div>
        <div>
          <div class="av-name">${ag.label}</div>
          <div class="av-role">ai agent · deviq platform</div>
        </div>
        <div class="av-score" style="color:${scoreColor(sc)}">${sc}</div>
      </div>
      <div class="av-body">${data.verdict || 'No verdict available.'}</div>
      <div class="av-tags">${tags}</div>
    </div>`;
  }).join('');

  const scores = agConfig.map(ag => a.agents?.[ag.key]?.score || 70);
  const avg    = Math.round(scores.reduce((s, n) => s + n, 0) / scores.length);

  document.getElementById('panel-agents').innerHTML = `
    ${sectionHdr('Multi-Agent AI System', '7 specialized agents')}
    <div class="card mb1" style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">
      <div style="flex:1">
        <div class="card-hdr"><i class="ti ti-brain"></i>Aggregate Intelligence Score</div>
        <p class="text-sm text-muted">All 7 agents completed independent analysis. Scores aggregated via weighted ensemble.</p>
      </div>
      <div style="text-align:center;flex-shrink:0">
        <div style="font-family:var(--font-display);font-size:3rem;font-weight:700;color:${scoreColor(avg)};line-height:1">${avg}</div>
        <div style="font-family:var(--font-mono);font-size:9px;color:var(--t3);text-transform:uppercase;letter-spacing:0.15em">aggregate</div>
      </div>
    </div>
    ${cards}`;
}

/* ══════════════════════════════════════════════════════════════
   REPOS TAB
══════════════════════════════════════════════════════════════ */

function renderReposPanel(topRepos, archs, a) {
  const repoCards = topRepos.map(r => {
    const lc = LANG_COLORS[r.language] || '#888';
    const topics = (r.topics || []).slice(0, 3).map(t =>
      `<span class="repo-chip" style="background:rgba(99,102,241,0.1);color:var(--electric-l)">#${t}</span>`
    ).join('');
    return `<div class="repo-card">
      <div class="repo-card-top">
        <div class="repo-card-name"><i class="ti ti-git-branch" style="font-size:11px"></i> ${r.name}</div>
        <div class="repo-stars"><i class="ti ti-star" style="font-size:10px"></i>${r.stargazers_count}</div>
      </div>
      <div class="repo-desc">${(r.description || 'No description').slice(0, 120)}</div>
      <div class="repo-chips">
        ${r.language ? `<span class="repo-chip" style="background:${lc}22;color:${lc}">${r.language}</span>` : ''}
        <span class="repo-chip" style="background:var(--nebula);color:var(--t3)"><i class="ti ti-git-fork" style="font-size:9px"></i> ${r.forks_count}</span>
        ${r.homepage ? `<a href="${r.homepage.startsWith('http') ? r.homepage : 'https://' + r.homepage}" target="_blank" class="repo-chip" style="background:rgba(16,185,129,0.1);color:var(--pulse);text-decoration:none"><i class="ti ti-world" style="font-size:9px"></i> live</a>` : ''}
        ${topics}
      </div>
      ${r.updated_at ? `<div style="font-family:var(--font-mono);font-size:9px;color:var(--t4);margin-top:6px">updated ${new Date(r.updated_at).toLocaleDateString()}</div>` : ''}
    </div>`;
  }).join('');

  const archColors = ['rgba(99,102,241,0.15)','rgba(34,211,238,0.12)','rgba(16,185,129,0.12)',
    'rgba(245,158,11,0.12)','rgba(167,139,250,0.12)'];
  const archBadges = archs.map((p, i) =>
    `<span class="arch-badge" style="background:${archColors[i % archColors.length]};border-color:rgba(255,255,255,0.08);color:var(--t1)"><i class="ti ti-circuit-diode" style="font-size:9px"></i>${p}</span>`
  ).join('');

  const ossRecs = (a.openSourceRecs || []).map(rec => `
    <div style="display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid var(--b1)">
      <i class="ti ti-git-pull-request" style="color:var(--electric-l);font-size:13px;flex-shrink:0"></i>
      <span class="text-sm text-muted">${rec}</span>
    </div>`).join('');

  document.getElementById('panel-repos').innerHTML = `
    ${sectionHdr('Top Repositories', 'by stars')}
    <div class="grid-2 mb1">${repoCards}</div>
    ${sectionHdr('Architecture Patterns Detected')}
    <div class="card mb1">
      <div class="card-hdr"><i class="ti ti-topology-star"></i>Repository Intelligence Engine</div>
      <p class="text-sm text-muted" style="margin-bottom:1rem">${a.architectureSummary || ''}</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${archBadges}</div>
    </div>
    ${sectionHdr('OSS Contribution Recommendations')}
    <div class="card">
      <div class="card-hdr"><i class="ti ti-world"></i>Projects Matched to Your Stack</div>
      ${ossRecs}
    </div>`;
}

/* ══════════════════════════════════════════════════════════════
   CAREER TAB
══════════════════════════════════════════════════════════════ */

function renderCareerPanel(a) {
  const steps   = a.roadmapSteps || [];
  const rmHTML  = steps.map((s, i) => `
    <div class="rm-step">
      <div class="rm-left">
        <div class="rm-dot rm-dot-${s.status || 'todo'}">${s.status === 'done' ? '✓' : i + 1}</div>
        ${i < steps.length - 1 ? '<div class="rm-line"></div>' : ''}
      </div>
      <div class="rm-content">
        <div class="rm-title" style="color:${s.status === 'done' ? 'var(--pulse)' : s.status === 'current' ? 'var(--electric-l)' : 'var(--t1)'}">${s.title || ''}</div>
        <div class="rm-desc">${s.desc || ''}</div>
      </div>
    </div>`).join('');

  const roleDims = [
    { label: 'FAANG Readiness',    score: a.agents?.architect?.score || 50,          desc: 'System design & scalability'   },
    { label: 'Startup Fit',         score: a.agents?.codeReviewer?.score || 50,       desc: 'Execution & versatility'       },
    { label: 'OSS Contributor',     score: a.agents?.docsReviewer?.score || 50,       desc: 'Documentation & collaboration' },
    { label: 'ML/AI Readiness',     score: a.aiReadinessScore || 50,                  desc: 'AI/ML system proficiency'      },
    { label: 'Backend Specialist',  score: a.agents?.scalabilityAnalyst?.score || 50, desc: 'Infrastructure & scale'        },
    { label: 'Career Momentum',     score: a.communityScore || 50,                    desc: 'Community & visibility'        },
  ];
  const roleBars = roleDims.map(rd => `
    <div class="skill-row-wrap">
      <div class="skill-row-hdr">
        <span class="skill-row-name">${rd.label}</span>
        <span class="skill-row-val">${rd.score}</span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="background:${scoreColor(rd.score)}" data-target="${rd.score}"></div></div>
      <div style="font-size:10px;color:var(--t4);margin-top:2px">${rd.desc}</div>
    </div>`).join('');

  document.getElementById('panel-career').innerHTML = `
    ${sectionHdr('Career Roadmap')}
    <div class="card mb1">
      <div class="card-hdr"><i class="ti ti-map"></i>Personalised Career Engine</div>
      <p class="text-sm text-muted" style="margin-bottom:1.25rem;font-family:var(--font-mono);font-size:11px;line-height:1.6;border-left:2px solid var(--electric-d);padding-left:10px">${a.careerPath || ''}</p>
      <div class="roadmap">${rmHTML}</div>
    </div>
    ${sectionHdr('Role Readiness Matrix')}
    <div class="card mb1">
      <div class="card-hdr"><i class="ti ti-chart-bar"></i>Career Fit by Role Type</div>
      <p class="text-sm text-muted" style="margin-bottom:1rem">Best fit: <strong style="color:var(--electric-l)">${a.bestRoleFit || 'Software Engineer'}</strong></p>
      ${roleBars}
    </div>
    ${sectionHdr('Career Mentor Agent')}
    <div class="agent-verdict" style="border-left-color:var(--violet)">
      <div class="av-header">
        <div class="av-icon" style="background:rgba(167,139,250,0.1);border:1px solid rgba(167,139,250,0.2)"><i class="ti ti-map" style="color:var(--violet)"></i></div>
        <div><div class="av-name">Career Mentor Agent</div><div class="av-role">personalized career intelligence</div></div>
        <div class="av-score" style="color:var(--violet)">${a.agents?.careerMentor?.score || 70}</div>
      </div>
      <div class="av-body">${a.agents?.careerMentor?.verdict || ''}</div>
    </div>`;
}

/* ══════════════════════════════════════════════════════════════
   RESUME TAB
══════════════════════════════════════════════════════════════ */

function renderResumePanel(a) {
  const bullets = (a.resumeBullets || []).map(rb => `
    <div class="bullet-item" onclick="copyText(this.querySelector('.bullet-text').textContent)">
      <div class="bullet-repo"><i class="ti ti-git-commit"></i> ${rb.repo || 'project'}</div>
      <div class="bullet-text">${rb.bullet || ''}</div>
      <button class="copy-btn" onclick="event.stopPropagation();copyText(this.parentElement.querySelector('.bullet-text').textContent)">copy</button>
    </div>`).join('');

  const modeLabel = { faang:'FAANG', startup:'startup', opensource:'open source', ml:'ML/AI' }[window._deviqMode] || 'target';

  document.getElementById('panel-resume').innerHTML = `
    ${sectionHdr('AI Resume Bullet Generator', 'click to copy')}
    <div class="card mb1" style="background:rgba(99,102,241,0.05);border-color:rgba(99,102,241,0.15)">
      <div class="card-hdr"><i class="ti ti-bulb"></i>Optimized for ${modeLabel} recruiters</div>
      <p class="text-sm text-muted">Click any bullet to copy. Replace placeholder metrics with your real numbers for maximum impact.</p>
    </div>
    ${bullets}
    ${sectionHdr('Profile Summary')}
    <div class="card">
      <div class="card-hdr"><i class="ti ti-file-description"></i>Copy for your resume header</div>
      <div class="bullet-item" onclick="copyText(this.querySelector('.bullet-text').textContent)">
        <div class="bullet-repo"><i class="ti ti-user"></i> professional summary</div>
        <div class="bullet-text">${a.personalityType || 'Software Engineer'} with expertise in ${(a.topTechs || []).slice(0, 3).join(', ')}. ${(a.architectureSummary || '').split('.')[0] || ''}.</div>
        <button class="copy-btn" onclick="event.stopPropagation();copyText(this.parentElement.querySelector('.bullet-text').textContent)">copy</button>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════════════════
   INTERVIEW TAB
══════════════════════════════════════════════════════════════ */

function renderInterviewPanel(a) {
  const qs = (a.interviewQuestions || []).map(q => `
    <div class="iq-item">
      <div class="iq-q">${q.q || ''}</div>
      ${q.followUp ? `<div style="font-size:11px;color:var(--t3);font-family:var(--font-mono);margin-bottom:8px;padding-left:10px;border-left:1px solid var(--b2)">↳ ${q.followUp}</div>` : ''}
      <div class="iq-footer">
        <span class="diff-pill diff-${q.difficulty || 'medium'}">${(q.difficulty || 'medium').toUpperCase()}</span>
        <span class="iq-topic">${q.topic || ''}</span>
      </div>
    </div>`).join('');

  document.getElementById('panel-interview').innerHTML = `
    ${sectionHdr('AI Interview Simulator', 'from your stack')}
    <div class="card mb1" style="background:rgba(34,211,238,0.03);border-color:rgba(34,211,238,0.1)">
      <div class="card-hdr"><i class="ti ti-brain"></i>Personalized to your repositories</div>
      <p class="text-sm text-muted">Questions generated from your actual tech stack. Each includes a follow-up to simulate real interview depth-testing.</p>
    </div>
    ${qs}
    ${sectionHdr('System Design Round')}
    <div class="card">
      <div class="card-hdr"><i class="ti ti-sitemap"></i>Architecture-level for ${a.maturityLevel || 'your level'}</div>
      <div class="iq-item" style="border:none;padding:0;background:transparent">
        <div class="iq-q">Design a system similar to one of your top projects at 10× scale. Walk through your database schema, API design, caching strategy, horizontal scaling approach, and failure handling.</div>
        <div style="font-size:11px;color:var(--t3);font-family:var(--font-mono);margin-bottom:8px;padding-left:10px;border-left:1px solid var(--b2)">↳ How would you handle data consistency across distributed nodes?</div>
        <div class="iq-footer"><span class="diff-pill diff-hard">HARD</span><span class="iq-topic">System Design · Architecture</span></div>
      </div>
    </div>`;
}

/* ══════════════════════════════════════════════════════════════
   SECURITY TAB
══════════════════════════════════════════════════════════════ */

function renderSecurityPanel(repos, a) {
  const nonFork = repos.filter(r => !r.fork);
  const checks  = [...runSecurityScan(nonFork), ...(a.securityChecks || [])].slice(0, 7);
  const iconMap = { ok: 'circle-check', warn: 'alert-triangle', bad: 'circle-x' };

  const secHTML = checks.map(c => `
    <div class="sec-item">
      <div class="sec-badge sec-${c.status || 'warn'}"><i class="ti ti-${iconMap[c.status] || 'alert-triangle'}"></i></div>
      <div class="sec-body">
        <div class="sec-title">${c.title || ''}</div>
        <div class="sec-desc">${c.desc || ''}</div>
      </div>
    </div>`).join('');

  const agData  = a.agents?.securityReviewer || {};
  const actions = [
    'Enable GitHub Dependabot for automated vulnerability alerts',
    'Add GitHub Secret Scanning and push protection to all repositories',
    'Configure branch protection: require PR reviews and status checks',
    'Add a SECURITY.md with responsible disclosure policy',
    'Add .env.example files and document all required variables',
    'Set up CodeQL analysis for static security scanning in CI/CD',
    'Implement SAST in your pipeline using tools like Semgrep or Bandit',
  ];

  document.getElementById('panel-security').innerHTML = `
    ${sectionHdr('Security & Best Practices', 'automated + AI')}
    <div class="card mb1">
      <div class="card-hdr"><i class="ti ti-shield"></i>Automated Security Scan</div>
      ${secHTML}
    </div>
    ${sectionHdr('AI Security Agent Verdict')}
    <div class="agent-verdict" style="border-left-color:var(--danger)">
      <div class="av-header">
        <div class="av-icon" style="background:rgba(244,63,94,0.1);border:1px solid rgba(244,63,94,0.2)"><i class="ti ti-shield-lock" style="color:var(--danger)"></i></div>
        <div><div class="av-name">Security Reviewer Agent</div><div class="av-role">automated security intelligence</div></div>
        <div class="av-score" style="color:${scoreColor(agData.score || 70)}">${agData.score || 70}</div>
      </div>
      <div class="av-body">${agData.verdict || 'No security verdict available.'}</div>
      <div class="av-tags">${(agData.tags || []).map(t => `<span class="av-tag" style="background:rgba(244,63,94,0.1);border-color:rgba(244,63,94,0.2);color:var(--danger)">${t}</span>`).join('')}</div>
    </div>
    ${sectionHdr('Hardening Checklist')}
    <div class="card">
      <div class="card-hdr"><i class="ti ti-list-check"></i>Action Items</div>
      ${actions.map(item => `
        <div style="display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--b1)">
          <i class="ti ti-arrow-right" style="color:var(--electric-l);font-size:12px;flex-shrink:0;margin-top:2px"></i>
          <span class="text-sm text-muted">${item}</span>
        </div>`).join('')}
    </div>`;
}

/* ══════════════════════════════════════════════════════════════
   SEMANTIC SEARCH TAB
══════════════════════════════════════════════════════════════ */

function renderSearchPanel(repos, a) {
  const quickTerms = ['authentication', 'machine learning', 'REST API', 'Docker', 'data pipeline', 'React frontend'];

  document.getElementById('panel-search').innerHTML = `
    ${sectionHdr('Semantic Repository Search')}
    <div class="card mb1" style="background:rgba(99,102,241,0.05);border-color:rgba(99,102,241,0.15)">
      <div class="card-hdr"><i class="ti ti-search"></i>Natural Language Repository Intelligence</div>
      <p class="text-sm text-muted" style="margin-bottom:1rem">Search repositories using natural language. Powered by keyword extraction and relevance scoring.</p>
      <div style="display:flex;gap:8px">
        <input id="semanticInput" type="text" class="semantic-input" placeholder="e.g. find JWT authentication projects"/>
        <button class="semantic-btn" onclick="doSemanticSearch()"><i class="ti ti-search"></i> Search</button>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
        ${quickTerms.map(q => `<button class="mode-pill" onclick="quickSearch('${q}')">${q}</button>`).join('')}
      </div>
    </div>
    <div id="searchResults"></div>
    ${sectionHdr('AI Repository Intelligence')}
    <div class="card">
      <div class="card-hdr"><i class="ti ti-sparkles"></i>Architecture Summary</div>
      <p class="text-sm text-muted" style="line-height:1.7">${a.architectureSummary || ''}</p>
      ${a.hiddenGem ? `<div class="gem-box"><div class="gem-hdr"><i class="ti ti-diamond"></i>Hidden Gem Repository</div><div class="gem-text">${a.hiddenGem}</div></div>` : ''}
    </div>`;
}

/* ── Semantic search execution ───────────────────────────────── */
function quickSearch(q) {
  document.getElementById('semanticInput').value = q;
  doSemanticSearch();
}

function doSemanticSearch() {
  const q = document.getElementById('semanticInput')?.value.trim();
  if (!q || !window._deviqRepos) return;

  const results  = semanticSearch(window._deviqRepos, q);
  const container = document.getElementById('searchResults');

  if (!results.length) {
    container.innerHTML = `<div class="text-sm text-muted" style="text-align:center;padding:2rem">No repositories match "<em>${q}</em>"</div>`;
    return;
  }

  container.innerHTML = results.map(r => `
    <div class="search-result">
      <div class="sr-header">
        <div class="sr-name"><i class="ti ti-git-branch" style="font-size:10px"></i> ${r.name}</div>
        <div class="sr-score">${r.relevance}% match</div>
      </div>
      <div class="sr-snippet">${r.description || (r.topics || []).join(', ') || 'No description'}</div>
      <div style="display:flex;gap:5px;margin-top:6px;flex-wrap:wrap">
        ${r.language ? `<span class="repo-chip" style="background:var(--nebula);color:var(--t2)">${r.language}</span>` : ''}
        ${(r.topics || []).slice(0, 3).map(t => `<span class="repo-chip" style="background:rgba(99,102,241,0.1);color:var(--electric-l)">#${t}</span>`).join('')}
      </div>
    </div>`).join('');
}

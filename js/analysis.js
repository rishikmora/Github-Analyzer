/**
 * DevIQ — analysis.js
 * Data processing: architecture detection, security scanning,
 * language parsing, benchmark data, semantic search, and prompt building.
 */

'use strict';

/* ══════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════ */

const AGENTS_META = [
  { id: 'arch',     name: 'Architecture Reviewer',   icon: 'ti-topology-star' },
  { id: 'code',     name: 'Code Quality Inspector',  icon: 'ti-code'          },
  { id: 'security', name: 'Security Scanner',         icon: 'ti-shield'        },
  { id: 'career',   name: 'Career Mentor',            icon: 'ti-map'           },
  { id: 'recruiter',name: 'Recruiter Agent',          icon: 'ti-briefcase'     },
  { id: 'docs',     name: 'Documentation Reviewer',   icon: 'ti-book'          },
  { id: 'scale',    name: 'Scalability Analyst',      icon: 'ti-server'        },
];

const BENCHMARKS = [
  { name: 'Top 1% Open Source Engineers',  score: 97, color: 'var(--violet)'     },
  { name: 'Senior FAANG Engineers',        score: 91, color: 'var(--electric-l)' },
  { name: 'Mid-level Backend Engineers',   score: 74, color: 'var(--plasma)'     },
  { name: 'Avg Active GitHub Developer',   score: 58, color: 'var(--pulse)'      },
  { name: 'Avg CS Graduate Portfolio',     score: 42, color: 'var(--nova)'       },
];

const LANG_COLORS = {
  JavaScript: '#f7df1e', TypeScript: '#3178c6', Python:  '#3572A5',
  Go:         '#00ADD8', Rust:       '#dea584', Java:    '#b07219',
  'C++':      '#f34b7d', C:          '#555555', Ruby:    '#701516',
  PHP:        '#4F5D95', Swift:      '#F05138', Kotlin:  '#A97BFF',
  Dart:       '#00B4AB', 'C#':       '#178600', Scala:   '#c22d40',
  Shell:      '#89e051', HTML:       '#e34c26', CSS:     '#563d7c',
  Vue:        '#41b883', Svelte:     '#ff3e00',
};

const RECRUITER_CONTEXT = {
  faang:      'FAANG/Big Tech recruiter. Prioritise: system design, scalability, algorithms, data structures, testing, CI/CD, clean architecture, production engineering.',
  startup:    'Startup CTO. Prioritise: shipping velocity, full-stack breadth, product intuition, lean execution, versatility, ownership mindset.',
  opensource: 'Open Source Maintainer. Prioritise: documentation quality, code readability, contribution culture, testing, licensing, community engagement.',
  ml:         'ML/AI Hiring Manager. Prioritise: ML/AI project depth, Python proficiency, data pipelines, model training and deployment, research background.',
};

/* ══════════════════════════════════════════════════════════════
   LANGUAGE DETECTION
══════════════════════════════════════════════════════════════ */

function detectLanguages(repos) {
  const map = {};
  repos.filter(r => !r.fork).forEach(r => {
    if (r.language) map[r.language] = (map[r.language] || 0) + 1;
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lang, count]) => ({ lang, count }));
}

/* ══════════════════════════════════════════════════════════════
   ARCHITECTURE PATTERN DETECTION (Simulated AST / Repo Intel)
══════════════════════════════════════════════════════════════ */

function detectArchitecturePatterns(repos) {
  const combined = repos
    .map(r => `${r.name} ${r.description || ''} ${(r.topics || []).join(' ')}`)
    .join(' ')
    .toLowerCase();

  const patterns = [
    { label: 'Microservices',    regex: /microservice|service.mesh|api.gateway/ },
    { label: 'MVC',              regex: /mvc|controller|model.view/             },
    { label: 'REST API',         regex: /rest|restful|express|fastapi|flask/    },
    { label: 'GraphQL',          regex: /graphql|apollo/                        },
    { label: 'Event-Driven',     regex: /event|queue|kafka|rabbitmq|pubsub|bus/ },
    { label: 'Containerized',    regex: /docker|container|kubernetes|k8s|helm/  },
    { label: 'ML Pipeline',      regex: /ml|neural|model|pytorch|tensorflow|sklearn|hugging/ },
    { label: 'Auth Systems',     regex: /auth|jwt|oauth|session|passport/       },
    { label: 'Caching Layer',    regex: /redis|cache|memcache/                  },
    { label: 'CI/CD',            regex: /ci|cd|github.action|workflow|pipeline/ },
    { label: 'Testing',          regex: /test|spec|jest|pytest|mocha|vitest/    },
    { label: 'Cloud Deploy',     regex: /deploy|heroku|aws|gcp|vercel|netlify|azure/ },
    { label: 'Real-time',        regex: /websocket|socket\.io|realtime|sse/     },
    { label: 'Database Design',  regex: /orm|prisma|mongoose|sequelize|postgres|mysql|mongo/ },
  ];

  const found = patterns.filter(p => p.regex.test(combined)).map(p => p.label);
  return found.length ? found : ['General Purpose'];
}

/* ══════════════════════════════════════════════════════════════
   SECURITY SCAN
══════════════════════════════════════════════════════════════ */

function runSecurityScan(repos) {
  const combined = repos
    .map(r => `${r.name} ${r.description || ''} ${(r.topics || []).join(' ')}`)
    .join(' ')
    .toLowerCase();

  return [
    {
      title: 'Secret Exposure Risk',
      desc: /\.env|secret|api.key|token/i.test(combined)
        ? 'Potential env/key references in repo metadata. Verify no secrets committed. Enable GitHub Secret Scanning.'
        : 'No obvious secret references in public metadata. Use GitHub Secret Scanning for deep analysis.',
      status: /\.env|secret|api.key/i.test(combined) ? 'warn' : 'ok',
    },
    {
      title: 'Authentication Patterns',
      desc: /auth|jwt|oauth|session|password/i.test(combined)
        ? 'Auth-related repos detected. Ensure JWT expiry, refresh token rotation, HTTPS enforcement, and PKCE for OAuth.'
        : 'No explicit auth repos found. Authentication may be handled by a third-party service.',
      status: /auth|jwt|oauth/i.test(combined) ? 'ok' : 'warn',
    },
    {
      title: 'Dependency Security',
      desc: repos.some(r => r.language === 'JavaScript' || r.language === 'TypeScript')
        ? 'JS/TS projects detected. Run `npm audit` regularly. Enable GitHub Dependabot for automated CVE alerts.'
        : 'Non-JS stack detected. Configure package-manager vulnerability scanning (e.g. Safety for Python, cargo-audit for Rust).',
      status: 'warn',
    },
    {
      title: 'Environment Management',
      desc: /docker|config|dotenv/.test(combined)
        ? 'Container/config tooling detected. Verify .env files are in .gitignore and .env.example is documented.'
        : 'No explicit env management. Add .env.example and document all required environment variables.',
      status: /docker|config/.test(combined) ? 'ok' : 'warn',
    },
    {
      title: 'HTTPS & Deployment Security',
      desc: repos.filter(r => r.homepage).length > 0
        ? `${repos.filter(r => r.homepage).length} deployed project(s) found. Verify HTTPS, CORS policies, CSP headers, and rate limiting.`
        : 'No deployed project homepages detected. When deploying, enforce HTTPS and implement security headers.',
      status: 'ok',
    },
    {
      title: 'Branch Protection',
      desc: 'Enable branch protection rules on main/master: require PR reviews, status checks, and signed commits. Use CODEOWNERS for sensitive paths.',
      status: 'warn',
    },
  ];
}

/* ══════════════════════════════════════════════════════════════
   SEMANTIC SEARCH
══════════════════════════════════════════════════════════════ */

function semanticSearch(repos, query) {
  if (!query.trim()) return [];
  const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);

  return repos
    .filter(r => !r.fork)
    .map(r => {
      const text = `${r.name} ${r.description || ''} ${(r.topics || []).join(' ')} ${r.language || ''}`.toLowerCase();
      const hits  = keywords.filter(k => text.includes(k)).length;
      const score = Math.round((hits / keywords.length) * 100);
      return { ...r, relevance: score };
    })
    .filter(r => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 6);
}

/* ══════════════════════════════════════════════════════════════
   CLAUDE PROMPT BUILDER
══════════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════════════
   CLAUDE PROMPT BUILDER — enrichment-aware
══════════════════════════════════════════════════════════════ */

function buildAnalysisPrompt(user, repos, langs, archs, mode, enrichment) {
  const repoSummary = repos.slice(0, 15).map(r =>
    `${r.name}(${r.language||'?'},\u2605${r.stargazers_count},topics:[${(r.topics||[]).join(',')}],desc:${(r.description||'none').slice(0,70)})`
  ).join(' | ');
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);

  // Build enrichment context block
  const lines = [];
  if (enrichment) {
    const { npm, graphql, wakatime, market } = enrichment;
    if (npm && npm.count) {
      lines.push(`npm packages published: ${npm.count} (${npm.totalDownloads.toLocaleString()} monthly downloads)`);
      lines.push(`npm package names: ${npm.packages.slice(0,3).map(p=>p.name).join(', ')}`);
    }
    if (graphql) {
      lines.push(`GitHub GraphQL: ${graphql.totalCommits} commits, ${graphql.totalPRs} PRs merged, ${graphql.totalReviews} code reviews`);
      lines.push(`Contribution streak: ${graphql.currentStreak} days current, ${graphql.longestStreak} days longest`);
      lines.push(`Annual contributions: ${graphql.totalContribs}`);
      if (graphql.isSponsored) lines.push('Is a GitHub Sponsor recipient');
      if (graphql.mergedPRs && graphql.mergedPRs.length)
        lines.push(`Recent merged PRs: ${graphql.mergedPRs.slice(0,2).map(p=>p.title).join(' | ')}`);
    }
    if (wakatime) {
      lines.push(`WakaTime this week: ${wakatime.totalHours}h total, ${wakatime.dailyAvg}h/day avg`);
      lines.push(`Actual coding time: ${wakatime.topLanguages.map(l=>`${l.name} ${l.percent}%`).join(', ')}`);
    }
    if (market && market.jobResults && market.jobResults[0]) {
      lines.push(`Job market context: ${(market.jobResults[0].snippet||'').slice(0,150)}`);
    }
  }
  const enrichCtx = lines.length ? `\n\nENRICHMENT DATA (use to improve score accuracy):\n${lines.join('\n')}` : '';

  return `You are a world-class developer intelligence system running 7 specialized AI agents simultaneously.
Analyze this GitHub developer and return ONLY valid JSON — no markdown, no backticks, no explanation.

PROFILE DATA:
Username: ${user.login} | Name: ${user.name||'N/A'} | Bio: ${user.bio||'N/A'}
Location: ${user.location||'N/A'} | Company: ${user.company||'N/A'}
Followers: ${user.followers} | Repos: ${user.public_repos} | Created: ${user.created_at}
Top languages: ${langs.map(l=>l.lang).join(', ')} | Total stars: ${totalStars}
Detected patterns: ${archs.join(', ')}
Repositories: ${repoSummary}
Recruiter mode: ${RECRUITER_CONTEXT[mode]||RECRUITER_CONTEXT.faang}${enrichCtx}

Return this EXACT JSON schema (all fields required):
{
  "engineeringIQ": <int 40-99>,
  "iqGrade": "<2-4 word level>",
  "overallScore": <int 1-100>,
  "productionReadiness": "<Beginner|Portfolio-level|Production-grade|Enterprise-grade>",
  "architectureScore": <1-100>,
  "codeQualityScore": <1-100>,
  "deploymentScore": <1-100>,
  "communityScore": <1-100>,
  "documentationScore": <1-100>,
  "aiReadinessScore": <1-100>,
  "personalityType": "<3-4 word archetype>",
  "personalityGlyph": "<single emoji>",
  "personalityDesc": "<2 sentences>",
  "architectureSummary": "<3 sentences on architecture quality>",
  "strengths": ["<strength>","<strength>","<strength>","<strength>"],
  "weaknesses": ["<gap>","<gap>","<gap>"],
  "topTechs": ["<tech1>","<tech2>","<tech3>","<tech4>","<tech5>","<tech6>"],
  "agents": {
    "recruiter":          { "verdict": "<4 sentences>", "score": <1-100>, "tags": ["<tag>","<tag>","<tag>"] },
    "architect":          { "verdict": "<3 sentences>", "score": <1-100>, "tags": ["<tag>","<tag>"] },
    "codeReviewer":       { "verdict": "<3 sentences>", "score": <1-100>, "tags": ["<tag>","<tag>"] },
    "securityReviewer":   { "verdict": "<3 sentences>", "score": <1-100>, "tags": ["<tag>","<tag>"] },
    "careerMentor":       { "verdict": "<3 sentences>", "score": <1-100>, "tags": ["<tag>","<tag>"] },
    "docsReviewer":       { "verdict": "<2 sentences>", "score": <1-100>, "tags": ["<tag>"] },
    "scalabilityAnalyst": { "verdict": "<3 sentences>", "score": <1-100>, "tags": ["<tag>","<tag>"] }
  },
  "resumeBullets": [
    { "repo": "<name>", "bullet": "<action-verb bullet with metrics>" },
    { "repo": "<name>", "bullet": "<bullet>" },
    { "repo": "<name>", "bullet": "<bullet>" },
    { "repo": "<name>", "bullet": "<bullet>" }
  ],
  "interviewQuestions": [
    { "q": "<question from their stack>", "topic": "<topic>", "difficulty": "easy",   "followUp": "<follow-up>" },
    { "q": "<question>",                  "topic": "<topic>", "difficulty": "medium", "followUp": "<follow-up>" },
    { "q": "<question>",                  "topic": "<topic>", "difficulty": "hard",   "followUp": "<follow-up>" },
    { "q": "<system design question>",    "topic": "System Design", "difficulty": "hard", "followUp": "<follow-up>" }
  ],
  "roadmapSteps": [
    { "title": "<current mastery>",  "desc": "<what they excel at>",       "status": "done"    },
    { "title": "<immediate action>", "desc": "<concrete step right now>",   "status": "current" },
    { "title": "<3-month goal>",     "desc": "<3-month target>",            "status": "todo"    },
    { "title": "<6-month target>",   "desc": "<ambitious 6-month target>",  "status": "todo"    },
    { "title": "<1-year vision>",    "desc": "<where execution leads>",     "status": "todo"    }
  ],
  "securityChecks": [
    { "title": "<check>", "desc": "<finding>", "status": "<ok|warn|bad>" },
    { "title": "<check>", "desc": "<finding>", "status": "<ok|warn|bad>" }
  ],
  "timelineEvents": [
    { "year": "<year>", "text": "<milestone>" },
    { "year": "<year>", "text": "<milestone>" },
    { "year": "<year>", "text": "<milestone>" },
    { "year": "<year>", "text": "<current/predicted milestone>" }
  ],
  "hiddenGem": "<repo — why impressive but underrated>",
  "careerPath": "<1 sentence career arc>",
  "benchmarkPercentile": <int 1-99>,
  "maturityLevel": "<Junior|Mid-level|Senior|Staff|Principal>",
  "bestRoleFit": "<specific job title>",
  "openSourceRecs": ["<OSS project>","<project>","<project>"]
}`;
}

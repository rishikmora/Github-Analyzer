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

  return `You are a developer intelligence AI. Analyze this GitHub profile.
Return ONLY a raw JSON object. No markdown. No backticks. No explanation. Start your response with { and end with }.

PROFILE:
User: ${user.login} | Name: ${user.name||'N/A'} | Bio: ${user.bio||'N/A'}
Location: ${user.location||'N/A'} | Company: ${user.company||'N/A'}
Followers: ${user.followers} | Public repos: ${user.public_repos} | Joined: ${user.created_at}
Languages: ${langs.map(l=>l.lang).join(', ')} | Stars: ${totalStars}
Patterns: ${archs.join(', ')}
Repos: ${repoSummary}
Mode: ${RECRUITER_CONTEXT[mode]||RECRUITER_CONTEXT.faang}${enrichCtx}

RESPOND WITH THIS JSON (replace every placeholder with real values):
{"engineeringIQ":75,"iqGrade":"Mid-level Engineer","overallScore":72,"productionReadiness":"Portfolio-level","architectureScore":70,"codeQualityScore":68,"deploymentScore":60,"communityScore":65,"documentationScore":55,"aiReadinessScore":58,"personalityType":"Full-Stack Builder","personalityGlyph":"⚡","personalityDesc":"Two sentences about coding style.","architectureSummary":"Three sentences about architecture.","strengths":["strength one","strength two","strength three","strength four"],"weaknesses":["gap one","gap two","gap three"],"topTechs":["Tech1","Tech2","Tech3","Tech4","Tech5","Tech6"],"agents":{"recruiter":{"verdict":"Four sentences from recruiter.","score":72,"tags":["tag1","tag2","tag3"]},"architect":{"verdict":"Three sentences on architecture.","score":70,"tags":["tag1","tag2"]},"codeReviewer":{"verdict":"Three sentences on code quality.","score":68,"tags":["tag1","tag2"]},"securityReviewer":{"verdict":"Three sentences on security.","score":65,"tags":["tag1","tag2"]},"careerMentor":{"verdict":"Three sentences on career.","score":74,"tags":["tag1","tag2"]},"docsReviewer":{"verdict":"Two sentences on docs.","score":55,"tags":["tag1"]},"scalabilityAnalyst":{"verdict":"Three sentences on scaling.","score":62,"tags":["tag1","tag2"]}},"resumeBullets":[{"repo":"repo-name","bullet":"Strong action verb bullet with impact metric."},{"repo":"repo-name","bullet":"Strong action verb bullet."},{"repo":"repo-name","bullet":"Strong action verb bullet."},{"repo":"repo-name","bullet":"Strong action verb bullet."}],"interviewQuestions":[{"q":"Specific technical question from their stack?","topic":"topic","difficulty":"easy","followUp":"Follow-up question?"},{"q":"Medium difficulty question?","topic":"topic","difficulty":"medium","followUp":"Follow-up?"},{"q":"Hard technical question?","topic":"topic","difficulty":"hard","followUp":"Follow-up?"},{"q":"System design question?","topic":"System Design","difficulty":"hard","followUp":"Follow-up?"}],"roadmapSteps":[{"title":"Current strength","desc":"What they already do well.","status":"done"},{"title":"Immediate action","desc":"Concrete step to take now.","status":"current"},{"title":"3-month goal","desc":"Target in 3 months.","status":"todo"},{"title":"6-month target","desc":"Ambitious 6-month target.","status":"todo"},{"title":"1-year vision","desc":"Where great execution leads.","status":"todo"}],"securityChecks":[{"title":"Check name","desc":"Finding and recommendation.","status":"ok"},{"title":"Check name","desc":"Finding.","status":"warn"}],"timelineEvents":[{"year":"2021","text":"Started coding journey."},{"year":"2022","text":"Built first serious project."},{"year":"2023","text":"Expanded tech stack."},{"year":"2024","text":"Current focus area."}],"hiddenGem":"repo-name — why it is impressive despite low stars.","careerPath":"One sentence predicted career arc.","benchmarkPercentile":45,"maturityLevel":"Mid-level","bestRoleFit":"Full-Stack Developer","openSourceRecs":["project one","project two","project three"]}

Now replace ALL placeholder values above with REAL analysis of the profile data provided. Keep the exact same JSON structure and keys.`;
}

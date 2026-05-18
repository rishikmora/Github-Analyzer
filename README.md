<div align="center">

<br/>

```
██████╗ ███████╗██╗   ██╗██╗ ██████╗
██╔══██╗██╔════╝██║   ██║██║██╔═══██╗
██║  ██║█████╗  ██║   ██║██║██║   ██║
██║  ██║██╔══╝  ╚██╗ ██╔╝██║██║▄▄ ██║
██████╔╝███████╗ ╚████╔╝ ██║╚██████╔╝
╚═════╝ ╚══════╝  ╚═══╝  ╚═╝ ╚══▀▀═╝
```

### **GitHub Developer Intelligence Platform**
*7-agent AI system that decodes your engineering DNA*

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-6366f1.svg?style=for-the-badge)](LICENSE)
[![Powered by Claude](https://img.shields.io/badge/Powered%20by-Claude%20Sonnet%204-22d3ee.svg?style=for-the-badge)](https://anthropic.com)
[![GitHub API](https://img.shields.io/badge/GitHub-REST%20API%20v3-10b981.svg?style=for-the-badge)](https://docs.github.com/en/rest)
[![Zero Dependencies](https://img.shields.io/badge/Frontend-Zero%20Dependencies-f59e0b.svg?style=for-the-badge)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-a78bfa.svg?style=for-the-badge)](CONTRIBUTING.md)

<br/>

> Drop a GitHub username → get a **production-grade AI intelligence report** in seconds.
> Architecture patterns, engineering IQ, career roadmap, security audit, resume bullets, interview questions — all in one platform.

<br/>

[**Live Demo**](#) · [**Quick Start**](#-quick-start) · [**Features**](#-features) · [**Architecture**](#-architecture) · [**API Security**](#-api-key-security-no-leaks)

<br/>

---

</div>

## ✦ What is DevIQ?

DevIQ is an **AI-powered developer intelligence platform** that runs **7 specialized AI agents** in parallel to analyze any GitHub profile. It goes far beyond star counts and commit graphs — it detects architecture patterns, evaluates engineering maturity, generates recruiter-ready resume bullets, and predicts career trajectories.

Built as a showcase of real **multi-agent AI engineering**, **production-grade frontend architecture**, and **zero-key-exposure security patterns**.

<br/>

## ◈ Features

### 🤖 7-Agent AI System

| Agent | Role | Output |
|---|---|---|
| **Recruiter Agent** | Evaluates from FAANG / Startup / OSS / ML lens | Hiring verdict + scores |
| **Architecture Reviewer** | Detects design patterns, modularity, coupling | Architecture score + patterns |
| **Code Quality Inspector** | Analyzes naming, complexity, abstraction | Quality score + insights |
| **Security Scanner** | Scans for exposed secrets, auth patterns, dep risks | Security audit + hardening plan |
| **Career Mentor** | Maps trajectory, gaps, next moves | Roadmap + role readiness matrix |
| **Documentation Reviewer** | Evaluates README quality, code comments | Docs score + recommendations |
| **Scalability Analyst** | Assesses deployment, infra, scaling readiness | Maturity level + action items |

### 📊 Intelligence Dashboard (8 Tabs)

- **Overview** — Radar chart, 6-dimension scores, architecture patterns, benchmark vs elite engineers
- **AI Agents** — All 7 agent verdicts with individual scores and tags
- **Repositories** — Repo cards with live language detection + OSS recommendations
- **Career** — Visual roadmap, role readiness matrix, career arc prediction
- **Resume** — Click-to-copy AI-generated achievement bullets for target role
- **Interview** — Stack-specific questions with follow-ups and difficulty ratings
- **Security** — Automated scan + AI security verdict + hardening checklist
- **Semantic Search** — Natural language repository search with relevance scoring

### 🏗️ Engineering Features
- **Architecture Detection** — Identifies MVC, microservices, event-driven, REST, GraphQL, CI/CD, and 10+ patterns
- **Engineering IQ Score** — 40–99 scaled score with maturity grade
- **Benchmark Engine** — Compares against FAANG engineers, OSS maintainers, CS graduates
- **Streaming Terminal** — Real-time pipeline log with agent status grid
- **4 Recruiter Modes** — Different scoring lens per mode

<br/>

## ⚡ Quick Start

### Option A — Local (Simplest, 2 minutes)

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/deviq.git
cd deviq

# 2. Configure your API key (this file is gitignored — safe)
cp .env.example .env

# 3. Open js/config.js and add your key
#    ANTHROPIC_API_KEY: 'sk-ant-...'

# 4. Open index.html in your browser
open index.html   # macOS
xdg-open index.html  # Linux
```

Get your API key at [console.anthropic.com](https://console.anthropic.com) — takes 30 seconds.

---

### Option B — Backend Proxy (Recommended for sharing / deploying)

The proxy keeps your API key **entirely server-side**. The browser never sees it.

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# 3. Start the proxy
npm start
# → DevIQ proxy running at http://localhost:3001

# 4. Configure frontend to use proxy
# In js/config.js:
#   ANTHROPIC_API_KEY: '',       ← leave empty
#   PROXY_URL: 'http://localhost:3001/api/chat'

# 5. Open index.html (or serve it)
npx serve . -p 8080
```

<br/>

## 🔐 API Key Security — No Leaks

This is the most important section. **Your API key is never exposed** when following this guide.

### How it works

```
┌─────────────────────────────────────────────────────────────┐
│                  OPTION A  (Local only)                     │
│                                                             │
│  js/config.js  ──→  listed in .gitignore  ──→  never pushed │
│                                                             │
│  Key stays on YOUR machine. Safe for personal use.          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               OPTION B  (Proxy / Deployment)                │
│                                                             │
│  Browser → POST /api/chat → server/proxy.js                 │
│                              ↓                              │
│                    Reads from .env (server only)            │
│                              ↓                              │
│                    Calls api.anthropic.com                  │
│                                                             │
│  Key NEVER leaves the server. Safe to deploy publicly.      │
└─────────────────────────────────────────────────────────────┘
```

### Checklist

- [x] `.env` is in `.gitignore` — never committed
- [x] `js/config.js` is in `.gitignore` — never committed  
- [x] Proxy injects key server-side only
- [x] No key in HTML, CSS, or any tracked file
- [x] `.env.example` has placeholder values only
- [ ] **You:** Never paste your real key into a file you plan to commit

### If you accidentally committed a key

```bash
# Rotate immediately at console.anthropic.com/settings/keys
# Then remove from git history:
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch js/config.js" \
  --prune-empty --tag-name-filter cat -- --all
```

<br/>

## 🗂️ Project Structure

```
deviq/
│
├── index.html              # Entry point — no keys, no inline scripts
│
├── css/
│   ├── base.css            # Design tokens, reset, layout, hero, search
│   ├── components.css      # Terminal, cards, tabs, profile hero, toast
│   └── panels.css          # All 8 tab panel styles
│
├── js/
│   ├── config.js           # ← YOUR KEY GOES HERE (gitignored)
│   ├── utils.js            # Shared helpers: score colors, copy, toast, JSON
│   ├── github.js           # GitHub REST API calls
│   ├── claude.js           # Anthropic API wrapper (direct + proxy)
│   ├── analysis.js         # Architecture detection, security scan, prompt builder
│   ├── render.js           # All DOM rendering for every tab
│   └── app.js              # Main orchestrator: pipeline, terminal, events
│
├── server/
│   └── proxy.js            # Express proxy — keeps key server-side
│
├── .env.example            # Template — copy to .env and fill in keys
├── .gitignore              # Ensures .env and config.js are never committed
├── package.json            # npm scripts + proxy dependencies
└── README.md               # This file
```

<br/>

## 🏛️ Architecture

### Frontend Module System

```
index.html
 └── loads scripts in order:
      config.js   → window.DEVIQ_CONFIG (key/proxy URL)
      utils.js    → shared helpers
      github.js   → fetchGitHubProfile()
      claude.js   → callClaude()
      analysis.js → detectArchitecturePatterns(), buildAnalysisPrompt(), ...
      render.js   → renderAll(), renderOverview(), ...
      app.js      → startAnalysis(), event wiring
```

### Analysis Pipeline

```
User enters username
        │
        ▼
┌──────────────────┐
│  GitHub API      │  Parallel: user + repos + events
│  (github.js)     │  Rate limit: 60/hr (5000/hr with token)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Local Analysis  │  Architecture patterns, language detection
│  (analysis.js)   │  Security scan, semantic indexing
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Claude Sonnet 4 │  Single optimized prompt simulating 7 agents
│  (claude.js)     │  Returns structured JSON with all agent outputs
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Render Engine   │  8 tabs rendered from parsed JSON
│  (render.js)     │  Radar chart, bars, cards, roadmap
└──────────────────┘
```

### AI Agent Output Schema

```json
{
  "engineeringIQ": 78,
  "overallScore": 81,
  "productionReadiness": "Production-grade",
  "agents": {
    "recruiter":         { "verdict": "...", "score": 82, "tags": [] },
    "architect":         { "verdict": "...", "score": 79, "tags": [] },
    "codeReviewer":      { "verdict": "...", "score": 75, "tags": [] },
    "securityReviewer":  { "verdict": "...", "score": 68, "tags": [] },
    "careerMentor":      { "verdict": "...", "score": 80, "tags": [] },
    "docsReviewer":      { "verdict": "...", "score": 65, "tags": [] },
    "scalabilityAnalyst":{ "verdict": "...", "score": 72, "tags": [] }
  },
  "resumeBullets": [],
  "interviewQuestions": [],
  "roadmapSteps": [],
  "...": "40+ fields total"
}
```

<br/>

## 🎨 Design System

Built with a custom **Deep Space Noir** design language:

| Token | Value | Usage |
|---|---|---|
| `--void` | `#04040a` | Page background |
| `--electric` | `#6366f1` | Primary accent (indigo) |
| `--plasma` | `#22d3ee` | Secondary accent (cyan) |
| `--pulse` | `#10b981` | Success / high score |
| `--nova` | `#f59e0b` | Warning / medium score |
| `--danger` | `#f43f5e` | Error / low score |
| `--font-display` | Clash Display | Headlines |
| `--font-body` | Satoshi | Body text |
| `--font-mono` | JetBrains Mono | Code, labels, data |

<br/>

## ⚙️ Configuration Reference

**`js/config.js`** — Full options:

```js
window.DEVIQ_CONFIG = {
  ANTHROPIC_API_KEY: '',          // Direct browser key (gitignored)
  GITHUB_TOKEN:      '',          // Optional: raises rate limit to 5000/hr
  PROXY_URL:         null,        // 'http://localhost:3001/api/chat' for proxy
  MODEL:             'claude-sonnet-4-5',
  MAX_TOKENS:        2500,
};
```

**`.env`** — For proxy mode:

```env
ANTHROPIC_API_KEY=sk-ant-...
GITHUB_TOKEN=ghp_...          # Optional
PORT=3001                      # Optional, default 3001
ALLOWED_ORIGIN=https://yourdomain.com  # Optional, for CORS restriction
```

<br/>

## 🚀 Deployment

### Vercel / Netlify (Static — Option A)

```bash
# Just deploy the repo — static files only
# Set js/config.js in .gitignore and configure key locally
# DO NOT deploy with your API key in config.js
```

### Railway / Render / Fly.io (With Proxy — Option B)

```bash
# Set environment variable ANTHROPIC_API_KEY in your platform dashboard
# Deploy the full repo including server/proxy.js
# Set start command: node server/proxy.js
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["node", "server/proxy.js"]
```

```bash
docker build -t deviq .
docker run -p 3001:3001 -e ANTHROPIC_API_KEY=sk-ant-... deviq
```

<br/>

## 🛠️ Development

```bash
# Install proxy dependencies
npm install

# Run proxy with auto-reload (Node 18+)
npm run dev

# Serve frontend on a local HTTP server
npm run serve
```

No build step. No bundler. No framework. Pure HTML/CSS/JS.

<br/>

## 📈 Roadmap

- [ ] **Supabase backend** — Save reports, user history, public profiles
- [ ] **Real AST parsing** — Tree-sitter integration for actual code analysis
- [ ] **Vector semantic search** — Embeddings + pgvector for true semantic search
- [ ] **GitHub Battle Mode** — Side-by-side developer comparison
- [ ] **Voice interview mode** — Web Speech API integration
- [ ] **AI-generated PRs** — Suggest README/CI/Docker improvements
- [ ] **Trending tech engine** — Stack Overflow + npm download trends
- [ ] **Chrome extension** — Analyze any GitHub profile inline

<br/>

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first.

1. Fork the repo
2. Create your branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Ensure no API keys are in tracked files: `git diff --staged | grep -i "sk-ant"`
5. Commit: `git commit -m 'feat: add your feature'`
6. Push: `git push origin feat/your-feature`
7. Open a pull request

<br/>

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

<br/>

---

<div align="center">

Built with [Claude Sonnet 4](https://anthropic.com) · [GitHub REST API](https://docs.github.com/en/rest) · [Chart.js](https://chartjs.org) · [Tabler Icons](https://tabler.io/icons)

<br/>

**If this helped you land an internship or impress a recruiter, drop a ⭐**

</div>

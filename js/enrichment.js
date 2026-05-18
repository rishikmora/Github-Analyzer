/**
 * DevIQ — js/enrichment.js
 * ─────────────────────────────────────────────────────────────
 *  Extra data enrichment beyond basic GitHub REST API.
 *  Each function is independently optional — runs only if
 *  the required key or feature flag is enabled.
 *
 *  Sources:
 *    npm Registry     — free, no key needed
 *    GitHub GraphQL   — needs GITHUB_TOKEN
 *    Serper Search    — needs SERPER_API_KEY
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ══════════════════════════════════════════════════════════════
   NPM REGISTRY — free, no key needed
   Check if user has published npm packages
══════════════════════════════════════════════════════════════ */

/**
 * Fetch npm packages published by the GitHub username.
 * Uses npm public registry — no auth required.
 * @param {string} username
 * @returns {Promise<{packages: Array, totalDownloads: number}>}
 */
async function fetchNpmData(username) {
  const cfg = window.DEVIQ_CONFIG || {};
  if (!cfg.ENABLE_NPM_ENRICHMENT) return null;

  try {
    const res = await fetch(
      `https://registry.npmjs.org/-/v1/search?text=author:${username}&size=10`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const packages = (data.objects || []).map(p => ({
      name       : p.package.name,
      description: p.package.description || '',
      version    : p.package.version,
      downloads  : p.downloads?.monthly || 0,
      keywords   : p.package.keywords || [],
      links      : p.package.links || {},
    }));

    const totalDownloads = packages.reduce((s, p) => s + p.downloads, 0);

    return { packages, totalDownloads, count: packages.length };
  } catch {
    return null;
  }
}

/* ══════════════════════════════════════════════════════════════
   GITHUB GRAPHQL — needs GITHUB_TOKEN
   Richer data: pinned repos, contribution graph, PR quality
══════════════════════════════════════════════════════════════ */

/**
 * Fetch enriched GitHub data via GraphQL API.
 * Requires GITHUB_TOKEN in config.
 * @param {string} username
 * @returns {Promise<Object|null>}
 */
async function fetchGitHubGraphQL(username) {
  const cfg = window.DEVIQ_CONFIG || {};
  if (!cfg.ENABLE_GRAPHQL_GITHUB || !cfg.GITHUB_TOKEN) return null;

  const query = `
    query($login: String!) {
      user(login: $login) {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              name
              description
              stargazerCount
              forkCount
              primaryLanguage { name }
              repositoryTopics(first: 5) {
                nodes { topic { name } }
              }
              defaultBranchRef {
                target {
                  ... on Commit {
                    history(first: 1) {
                      totalCount
                    }
                  }
                }
              }
            }
          }
        }
        contributionsCollection {
          totalCommitContributions
          totalPullRequestContributions
          totalPullRequestReviewContributions
          totalIssueContributions
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
              }
            }
          }
        }
        pullRequests(first: 5, states: MERGED, orderBy: {field: UPDATED_AT, direction: DESC}) {
          totalCount
          nodes {
            title
            mergedAt
            additions
            deletions
            repository { nameWithOwner }
          }
        }
        repositories(first: 5, orderBy: {field: STARGAZERS, direction: DESC}, isFork: false) {
          nodes {
            name
            stargazerCount
            hasWikiEnabled
            hasIssuesEnabled
            licenseInfo { name }
            defaultBranchRef { name }
          }
        }
        followers  { totalCount }
        following  { totalCount }
        sponsorshipsAsMaintainer { totalCount }
      }
    }
  `;

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method : 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'Authorization': `Bearer ${cfg.GITHUB_TOKEN}`,
      },
      body: JSON.stringify({ query, variables: { login: username } }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (json.errors) return null;

    const u    = json.data?.user;
    const cc   = u?.contributionsCollection;
    const days = cc?.contributionCalendar?.weeks
      ?.flatMap(w => w.contributionDays) || [];

    // Compute consistency streak
    let streak = 0, maxStreak = 0, cur = 0;
    days.slice().reverse().forEach(d => {
      if (d.contributionCount > 0) { cur++; maxStreak = Math.max(maxStreak, cur); }
      else { if (streak === 0) streak = cur; cur = 0; }
    });

    return {
      pinnedRepos   : u?.pinnedItems?.nodes || [],
      totalCommits  : cc?.totalCommitContributions || 0,
      totalPRs      : cc?.totalPullRequestContributions || 0,
      totalReviews  : cc?.totalPullRequestReviewContributions || 0,
      totalIssues   : cc?.totalIssueContributions || 0,
      totalContribs : cc?.contributionCalendar?.totalContributions || 0,
      currentStreak : streak || cur,
      longestStreak : maxStreak,
      mergedPRs     : u?.pullRequests?.nodes || [],
      totalMergedPRs: u?.pullRequests?.totalCount || 0,
      isSponsored   : (u?.sponsorshipsAsMaintainer?.totalCount || 0) > 0,
      topReposMeta  : u?.repositories?.nodes || [],
    };
  } catch {
    return null;
  }
}

/* ══════════════════════════════════════════════════════════════
   SERPER WEB SEARCH — needs SERPER_API_KEY
   Job market demand + trending tech for detected stack
══════════════════════════════════════════════════════════════ */

/**
 * Search for job market demand for a set of technologies.
 * @param {string[]} techs - Array of technology names
 * @returns {Promise<Array<{tech, jobCount, trend, snippet}>>}
 */
async function fetchTechMarketData(techs) {
  const cfg = window.DEVIQ_CONFIG || {};
  if (!cfg.ENABLE_WEB_SEARCH || !cfg.SERPER_API_KEY || !techs?.length) return null;

  try {
    // Search for top 3 techs to avoid burning quota
    const topTechs = techs.slice(0, 3);
    const query    = `${topTechs.join(' OR ')} developer jobs 2025 demand salary`;

    const res = await fetch('https://google.serper.dev/search', {
      method : 'POST',
      headers: {
        'X-API-KEY'   : cfg.SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 5 }),
    });

    if (!res.ok) return null;
    const data = await res.json();

    const results = (data.organic || []).slice(0, 4).map(r => ({
      title  : r.title,
      snippet: r.snippet,
      link   : r.link,
    }));

    // Also fetch trending tech news
    const trendRes = await fetch('https://google.serper.dev/search', {
      method : 'POST',
      headers: {
        'X-API-KEY'   : cfg.SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: `${topTechs[0]} developer trend 2025`, num: 3 }),
    });

    const trendData  = trendRes.ok ? await trendRes.json() : {};
    const trendItems = (trendData.organic || []).slice(0, 2).map(r => ({
      title  : r.title,
      snippet: r.snippet,
    }));

    return { jobResults: results, trendResults: trendItems, query };
  } catch {
    return null;
  }
}

/* ══════════════════════════════════════════════════════════════
   WAKATIME — needs public WakaTime username (from bio/readme)
   Coding time stats if user has public WakaTime profile
══════════════════════════════════════════════════════════════ */

/**
 * Attempt to fetch public WakaTime stats for a username.
 * Only works if user has made their WakaTime profile public.
 * @param {string} username
 * @returns {Promise<Object|null>}
 */
async function fetchWakaTimeData(username) {
  try {
    const res = await fetch(
      `https://wakatime.com/api/v1/users/${username}/stats/last_7_days`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const d    = data.data;
    return {
      totalHours   : Math.round((d?.total_seconds || 0) / 3600),
      dailyAvg     : Math.round((d?.daily_average || 0) / 3600 * 10) / 10,
      topLanguages : (d?.languages || []).slice(0, 5).map(l => ({
        name   : l.name,
        percent: Math.round(l.percent),
        hours  : Math.round(l.total_seconds / 3600),
      })),
      topEditors   : (d?.editors || []).slice(0, 3).map(e => e.name),
      bestDay      : d?.best_day ? {
        date : d.best_day.date,
        hours: Math.round(d.best_day.total_seconds / 3600),
      } : null,
    };
  } catch {
    return null;
  }
}

/* ══════════════════════════════════════════════════════════════
   MASTER ENRICHMENT RUNNER
   Runs all enrichment sources in parallel, returns combined data
══════════════════════════════════════════════════════════════ */

/**
 * Run all enrichment sources in parallel for a GitHub user.
 * Gracefully handles failures — each source is independent.
 * @param {string} username
 * @param {string[]} techs - Detected technologies
 * @returns {Promise<EnrichmentData>}
 */
async function runEnrichment(username, techs) {
  const [npm, graphql, market, wakatime] = await Promise.allSettled([
    fetchNpmData(username),
    fetchGitHubGraphQL(username),
    fetchTechMarketData(techs),
    fetchWakaTimeData(username),
  ]);

  const result = {
    npm      : npm.status      === 'fulfilled' ? npm.value      : null,
    graphql  : graphql.status  === 'fulfilled' ? graphql.value  : null,
    market   : market.status   === 'fulfilled' ? market.value   : null,
    wakatime : wakatime.status === 'fulfilled' ? wakatime.value : null,
  };

  // Build enrichment summary for terminal display
  const sources = [];
  if (result.npm?.count)       sources.push(`npm: ${result.npm.count} packages (${result.npm.totalDownloads.toLocaleString()} monthly downloads)`);
  if (result.graphql?.totalCommits) sources.push(`GraphQL: ${result.graphql.totalCommits} commits, ${result.graphql.totalPRs} PRs, streak: ${result.graphql.currentStreak} days`);
  if (result.market)           sources.push(`Market: job demand data for ${techs.slice(0, 3).join(', ')}`);
  if (result.wakatime)         sources.push(`WakaTime: ${result.wakatime.totalHours}h coded this week`);

  result._sources = sources;
  result._hasData = sources.length > 0;

  return result;
}

/**
 * DevIQ — github.js
 * All GitHub REST API interactions.
 */

'use strict';

const GITHUB_API = 'https://api.github.com';

function githubHeaders() {
  const cfg = window.DEVIQ_CONFIG || {};
  const headers = { 'Accept': 'application/vnd.github.v3+json' };
  if (cfg.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${cfg.GITHUB_TOKEN}`;
  }
  return headers;
}

/**
 * Fetch all data needed for analysis in parallel.
 * @param {string} username
 * @returns {Promise<{user, repos, events}>}
 */
async function fetchGitHubProfile(username) {
  const H = githubHeaders();

  const [userRes, reposRes, eventsRes] = await Promise.all([
    fetch(`${GITHUB_API}/users/${username}`,                                       { headers: H }),
    fetch(`${GITHUB_API}/users/${username}/repos?sort=updated&per_page=30`,        { headers: H }),
    fetch(`${GITHUB_API}/users/${username}/events/public?per_page=30`,             { headers: H }),
  ]);

  if (!userRes.ok) {
    if (userRes.status === 404) throw new Error(`GitHub user "${username}" not found.`);
    if (userRes.status === 403) throw new Error('GitHub API rate limit hit. Add a GITHUB_TOKEN in js/config.js to increase the limit to 5,000 req/hr.');
    throw new Error(`GitHub API error (${userRes.status}). Please try again.`);
  }

  const user   = await userRes.json();
  const repos  = reposRes.ok  ? await reposRes.json()  : [];
  const events = eventsRes.ok ? await eventsRes.json() : [];

  return { user, repos, events };
}

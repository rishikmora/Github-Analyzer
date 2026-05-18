/**
 * DevIQ — js/supabase.js
 * Saves every analysis result to Supabase deviq_analyses table.
 * Uses the Supabase REST API directly — no SDK needed.
 */

'use strict';

const SUPABASE_URL     = 'https://ddfuezctljrcbauiizlb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZnVlemN0bGpyY2JhdWlpemxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5OTc2NDAsImV4cCI6MjA5NDU3MzY0MH0.ZKJIYu3Qz86p2hW8XclpRZROF8pmY1LiSIEJYt2x6nw';

/**
 * Save a completed DevIQ analysis to Supabase.
 * Maps every field from the analysis output into the table.
 *
 * @param {Object} user       - GitHub user object
 * @param {Array}  repos      - Non-forked repos array
 * @param {Array}  langs      - Detected languages [{lang, count}]
 * @param {Array}  archs      - Detected architecture patterns
 * @param {Object} analysis   - Full AI analysis JSON
 * @param {Object} aiResult   - {provider, model} from callAI
 * @param {string} mode       - Recruiter mode
 * @returns {Promise<{id: string}|null>}
 */
async function saveAnalysisToSupabase(user, repos, langs, archs, analysis, aiResult, mode) {
  try {
    const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
    const enrichment = analysis._enrichment || {};

    const row = {

      // ── GitHub Profile ──────────────────────────────────────
      github_username      : user.login,
      github_name          : user.name          || null,
      github_bio           : user.bio           || null,
      github_location      : user.location      || null,
      github_company       : user.company       || null,
      github_avatar_url    : user.avatar_url    || null,
      github_followers     : user.followers     || 0,
      github_following     : user.following     || 0,
      github_public_repos  : user.public_repos  || 0,
      github_total_stars   : totalStars,
      github_account_created: user.created_at   || null,

      // ── Analysis Config ─────────────────────────────────────
      recruiter_mode   : mode                   || 'faang',
      ai_provider_used : aiResult?.provider     || null,
      ai_model_used    : aiResult?.model        || null,

      // ── Core Scores ─────────────────────────────────────────
      engineering_iq       : analysis.engineeringIQ       || null,
      iq_grade             : analysis.iqGrade             || null,
      overall_score        : analysis.overallScore        || null,
      production_readiness : analysis.productionReadiness || null,
      maturity_level       : analysis.maturityLevel       || null,
      benchmark_percentile : analysis.benchmarkPercentile || null,
      best_role_fit        : analysis.bestRoleFit         || null,

      // ── Dimension Scores ────────────────────────────────────
      score_architecture  : analysis.architectureScore  || null,
      score_code_quality  : analysis.codeQualityScore   || null,
      score_deployment    : analysis.deploymentScore    || null,
      score_community     : analysis.communityScore     || null,
      score_documentation : analysis.documentationScore || null,
      score_ai_readiness  : analysis.aiReadinessScore   || null,

      // ── Agent Scores ────────────────────────────────────────
      agent_score_recruiter         : analysis.agents?.recruiter?.score          || null,
      agent_score_architect         : analysis.agents?.architect?.score          || null,
      agent_score_code_reviewer     : analysis.agents?.codeReviewer?.score       || null,
      agent_score_security_reviewer : analysis.agents?.securityReviewer?.score   || null,
      agent_score_career_mentor     : analysis.agents?.careerMentor?.score       || null,
      agent_score_docs_reviewer     : analysis.agents?.docsReviewer?.score       || null,
      agent_score_scalability       : analysis.agents?.scalabilityAnalyst?.score || null,

      // ── Detected Tech & Patterns ────────────────────────────
      top_technologies     : analysis.topTechs            || [],
      architecture_patterns: archs                        || [],
      top_languages        : langs.map(l => l.lang)       || [],

      // ── Personality ─────────────────────────────────────────
      personality_type  : analysis.personalityType  || null,
      personality_glyph : analysis.personalityGlyph || null,
      personality_desc  : analysis.personalityDesc  || null,

      // ── Career ──────────────────────────────────────────────
      career_path      : analysis.careerPath      || null,
      hidden_gem_repo  : analysis.hiddenGem       || null,
      open_source_recs : analysis.openSourceRecs  || [],

      // ── Enrichment ──────────────────────────────────────────
      npm_packages_count   : enrichment.npm?.count              || 0,
      npm_total_downloads  : enrichment.npm?.totalDownloads     || 0,
      npm_package_names    : enrichment.npm?.packages?.map(p => p.name) || [],
      github_total_commits : enrichment.graphql?.totalCommits   || 0,
      github_total_prs     : enrichment.graphql?.totalPRs       || 0,
      github_streak_current: enrichment.graphql?.currentStreak  || 0,
      github_streak_longest: enrichment.graphql?.longestStreak  || 0,
      wakatime_hours_week  : enrichment.wakatime?.totalHours    || 0,
      is_github_sponsored  : enrichment.graphql?.isSponsored    || false,

      // ── Full JSON Blobs ─────────────────────────────────────
      full_analysis_json       : analysis,
      agent_verdicts_json      : analysis.agents             || null,
      resume_bullets_json      : analysis.resumeBullets      || null,
      interview_questions_json : analysis.interviewQuestions || null,
      roadmap_steps_json       : analysis.roadmapSteps       || null,
      security_checks_json     : analysis.securityChecks     || null,
      timeline_events_json     : analysis.timelineEvents     || null,
      enrichment_json          : enrichment._hasData ? enrichment : null,
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/deviq_analyses`, {
      method : 'POST',
      headers: {
        'Content-Type' : 'application/json',
        'apikey'       : SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer'       : 'return=representation',
      },
      body: JSON.stringify(row),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[DevIQ Supabase] Save failed:', err);
      return null;
    }

    const saved = await res.json();
    const id = saved?.[0]?.id || saved?.id || null;
    console.log('[DevIQ Supabase] Saved analysis:', id);
    return { id };

  } catch (err) {
    // Non-fatal — saving to DB should never break the UI
    console.error('[DevIQ Supabase] Error:', err.message);
    return null;
  }
}

/**
 * Fetch the last N analyses for a GitHub username.
 * Useful for showing history or "you've been analyzed X times".
 * @param {string} username
 * @param {number} limit
 */
async function getAnalysisHistory(username, limit = 5) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/deviq_analyses`
      + `?github_username=eq.${encodeURIComponent(username)}`
      + `&order=created_at.desc`
      + `&limit=${limit}`
      + `&select=id,created_at,overall_score,engineering_iq,recruiter_mode,production_readiness,ai_provider_used`;

    const res = await fetch(url, {
      headers: {
        'apikey'       : SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Fetch global leaderboard — top N profiles by overall_score.
 * @param {number} limit
 */
async function getLeaderboard(limit = 10) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/deviq_analyses`
      + `?order=overall_score.desc`
      + `&limit=${limit}`
      + `&select=github_username,github_name,github_avatar_url,overall_score,engineering_iq,maturity_level,top_technologies,created_at`;

    const res = await fetch(url, {
      headers: {
        'apikey'       : SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * DevIQ — js/supabase.js
 * Saves every analysis to Supabase deviq_analyses table.
 * Uses Supabase REST API directly — no SDK needed.
 */

'use strict';

const SUPABASE_URL      = 'https://ddfuezctljrcbauiizlb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkZnVlemN0bGpyY2JhdWlpemxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5OTc2NDAsImV4cCI6MjA5NDU3MzY0MH0.ZKJIYu3Qz86p2hW8XclpRZROF8pmY1LiSIEJYt2x6nw';

/* ── Helpers ───────────────────────────────────────────────── */

// Safely clamp a number between 0-100, return null if invalid
function safeScore(val) {
  const n = parseInt(val, 10);
  if (isNaN(n)) return null;
  return Math.max(0, Math.min(100, n));
}

// Return string or null — never undefined
function safeStr(val) {
  if (val === null || val === undefined || val === '') return null;
  return String(val).slice(0, 2000); // cap length for safety
}

// Return array of strings or empty array
function safeArr(val) {
  if (!Array.isArray(val)) return [];
  return val.filter(Boolean).map(String);
}

// Normalize production_readiness to exact DB values
function normalizeReadiness(val) {
  if (!val) return null;
  const v = String(val).toLowerCase().replace(/[-_]/g, ' ').trim();
  if (v.includes('enterprise')) return 'Enterprise-grade';
  if (v.includes('production'))  return 'Production-grade';
  if (v.includes('portfolio'))   return 'Portfolio-level';
  if (v.includes('beginner'))    return 'Beginner';
  return null; // unknown value — store null rather than fail
}

// Normalize maturity level
function normalizeMaturity(val) {
  if (!val) return null;
  const v = String(val).toLowerCase().trim();
  if (v.includes('principal')) return 'Principal';
  if (v.includes('staff'))     return 'Staff';
  if (v.includes('senior'))    return 'Senior';
  if (v.includes('mid'))       return 'Mid-level';
  if (v.includes('junior'))    return 'Junior';
  return null;
}

// Normalize recruiter mode
function normalizeMode(val) {
  const valid = ['faang', 'startup', 'opensource', 'ml'];
  const v = String(val || '').toLowerCase().trim();
  return valid.includes(v) ? v : 'faang';
}

/* ── Main save function ────────────────────────────────────── */

async function saveAnalysisToSupabase(user, repos, langs, archs, analysis, aiResult, mode) {
  try {
    const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
    const enrichment = analysis._enrichment || {};
    const a          = analysis;

    // Build the row — every value sanitized
    const row = {

      // GitHub Profile
      github_username      : safeStr(user.login),
      github_name          : safeStr(user.name),
      github_bio           : safeStr(user.bio),
      github_location      : safeStr(user.location),
      github_company       : safeStr(user.company),
      github_avatar_url    : safeStr(user.avatar_url),
      github_followers     : parseInt(user.followers)    || 0,
      github_following     : parseInt(user.following)    || 0,
      github_public_repos  : parseInt(user.public_repos) || 0,
      github_total_stars   : totalStars,
      github_account_created: user.created_at || null,

      // Analysis Config
      recruiter_mode   : normalizeMode(mode),
      ai_provider_used : safeStr(aiResult?.provider),
      ai_model_used    : safeStr(aiResult?.model),

      // Core Scores
      engineering_iq       : safeScore(a.engineeringIQ),
      iq_grade             : safeStr(a.iqGrade),
      overall_score        : safeScore(a.overallScore),
      production_readiness : normalizeReadiness(a.productionReadiness),
      maturity_level       : normalizeMaturity(a.maturityLevel),
      benchmark_percentile : safeScore(a.benchmarkPercentile),
      best_role_fit        : safeStr(a.bestRoleFit),

      // Dimension Scores
      score_architecture  : safeScore(a.architectureScore),
      score_code_quality  : safeScore(a.codeQualityScore),
      score_deployment    : safeScore(a.deploymentScore),
      score_community     : safeScore(a.communityScore),
      score_documentation : safeScore(a.documentationScore),
      score_ai_readiness  : safeScore(a.aiReadinessScore),

      // Agent Scores
      agent_score_recruiter         : safeScore(a.agents?.recruiter?.score),
      agent_score_architect         : safeScore(a.agents?.architect?.score),
      agent_score_code_reviewer     : safeScore(a.agents?.codeReviewer?.score),
      agent_score_security_reviewer : safeScore(a.agents?.securityReviewer?.score),
      agent_score_career_mentor     : safeScore(a.agents?.careerMentor?.score),
      agent_score_docs_reviewer     : safeScore(a.agents?.docsReviewer?.score),
      agent_score_scalability       : safeScore(a.agents?.scalabilityAnalyst?.score),

      // Tech & Patterns
      top_technologies      : safeArr(a.topTechs),
      architecture_patterns : safeArr(archs),
      top_languages         : safeArr(langs.map(l => l.lang)),

      // Personality
      personality_type  : safeStr(a.personalityType),
      personality_glyph : safeStr(a.personalityGlyph),
      personality_desc  : safeStr(a.personalityDesc),

      // Career
      career_path      : safeStr(a.careerPath),
      hidden_gem_repo  : safeStr(a.hiddenGem),
      open_source_recs : safeArr(a.openSourceRecs),

      // Enrichment
      npm_packages_count    : parseInt(enrichment.npm?.count)              || 0,
      npm_total_downloads   : parseInt(enrichment.npm?.totalDownloads)     || 0,
      npm_package_names     : safeArr(enrichment.npm?.packages?.map(p => p.name)),
      github_total_commits  : parseInt(enrichment.graphql?.totalCommits)   || 0,
      github_total_prs      : parseInt(enrichment.graphql?.totalPRs)       || 0,
      github_streak_current : parseInt(enrichment.graphql?.currentStreak)  || 0,
      github_streak_longest : parseInt(enrichment.graphql?.longestStreak)  || 0,
      wakatime_hours_week   : parseFloat(enrichment.wakatime?.totalHours)  || 0,
      is_github_sponsored   : Boolean(enrichment.graphql?.isSponsored),

      // Full JSON blobs — strip _enrichment to avoid circular issues
      full_analysis_json       : stripMeta(a),
      agent_verdicts_json      : a.agents             || null,
      resume_bullets_json      : a.resumeBullets      || null,
      interview_questions_json : a.interviewQuestions || null,
      roadmap_steps_json       : a.roadmapSteps       || null,
      security_checks_json     : a.securityChecks     || null,
      timeline_events_json     : a.timelineEvents     || null,
      enrichment_json          : enrichment._hasData ? stripMeta(enrichment) : null,
    };

    console.log('[DevIQ Supabase] Saving row for:', row.github_username);

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

    // Always read the response body for debugging
    const responseText = await res.text();

    if (!res.ok) {
      console.error('[DevIQ Supabase] HTTP', res.status, '—', responseText);
      // Show the actual error in UI so user knows what happened
      showToast(`⚠ DB save failed: ${res.status} — check console (F12)`);
      return null;
    }

    let saved;
    try { saved = JSON.parse(responseText); } catch { saved = []; }

    const id = Array.isArray(saved) ? saved[0]?.id : saved?.id;
    console.log('[DevIQ Supabase] ✓ Saved. Row ID:', id);
    return { id };

  } catch (err) {
    console.error('[DevIQ Supabase] Exception:', err.message, err);
    showToast('⚠ DB save error — check console (F12)');
    return null;
  }
}

// Remove internal meta keys before storing JSON
function stripMeta(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = { ...obj };
  delete clean._enrichment;
  delete clean._sources;
  delete clean._hasData;
  return clean;
}

/* ── History & Leaderboard ─────────────────────────────────── */

async function getAnalysisHistory(username, limit = 5) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/deviq_analyses`
      + `?github_username=eq.${encodeURIComponent(username)}`
      + `&order=created_at.desc`
      + `&limit=${limit}`
      + `&select=id,created_at,overall_score,engineering_iq,recruiter_mode,production_readiness`;
    const res = await fetch(url, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    });
    return res.ok ? await res.json() : [];
  } catch { return []; }
}

async function getLeaderboard(limit = 10) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/deviq_analyses`
      + `?order=overall_score.desc`
      + `&limit=${limit}`
      + `&select=github_username,github_name,github_avatar_url,overall_score,engineering_iq,maturity_level,top_technologies,created_at`;
    const res = await fetch(url, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
    });
    return res.ok ? await res.json() : [];
  } catch { return []; }
}

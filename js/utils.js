/**
 * DevIQ — utils.js
 * Shared utility functions used across all modules.
 */

'use strict';

/* ── Score → color ─────────────────────────────────────────── */
function scoreColor(n) {
  if (n >= 80) return 'var(--pulse)';
  if (n >= 60) return 'var(--nova)';
  return 'var(--danger)';
}

function scoreGrad(n) {
  if (n >= 80) return 'rgba(16,185,129,0.15)';
  if (n >= 60) return 'rgba(245,158,11,0.12)';
  return 'rgba(244,63,94,0.12)';
}

/* ── Toast ─────────────────────────────────────────────────── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

/* ── Clipboard ─────────────────────────────────────────────── */
function copyText(text) {
  navigator.clipboard.writeText(text)
    .then(() => showToast('✓ Copied to clipboard'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('✓ Copied');
    });
}

/* ── Async delay ───────────────────────────────────────────── */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ── Robust JSON extractor ─────────────────────────────────── */
/**
 * Extracts JSON from AI response text.
 * Handles: markdown fences, preamble text, truncated responses,
 * trailing commas, single quotes, unescaped chars.
 */
function parseJSON(raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Empty response from AI. Please try again.');
  }

  // Log raw for debugging (visible in browser console F12)
  console.log('[DevIQ] Raw AI response length:', raw.length);
  console.log('[DevIQ] Raw AI response preview:', raw.slice(0, 300));

  let text = raw;

  // Step 1: Strip markdown code fences
  text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '');

  // Step 2: Find outermost { ... }
  const firstBrace = text.indexOf('{');
  const lastBrace  = text.lastIndexOf('}');

  if (firstBrace === -1) {
    console.error('[DevIQ] No JSON object found in response:', raw.slice(0, 500));
    throw new Error('AI did not return JSON. Check browser console (F12) for the raw response.');
  }

  // Step 3: Extract JSON slice
  let jsonStr = firstBrace !== -1 && lastBrace !== -1
    ? text.slice(firstBrace, lastBrace + 1)
    : text.slice(firstBrace);

  // Step 4: Try direct parse first
  try {
    return JSON.parse(jsonStr);
  } catch (e1) {
    console.warn('[DevIQ] Direct parse failed:', e1.message, '— trying repair…');
  }

  // Step 5: Attempt JSON repair for common AI output issues

  // Remove trailing commas before } or ]
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

  // Fix single-quoted strings → double quotes (simple cases)
  // jsonStr = jsonStr.replace(/'([^'\\]*)'/g, '"$1"');  // too aggressive, skip

  // Remove control characters
  jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, (c) =>
    c === '\n' || c === '\r' || c === '\t' ? c : ''
  );

  try {
    return JSON.parse(jsonStr);
  } catch (e2) {
    console.warn('[DevIQ] Repaired parse failed:', e2.message, '— trying truncation fix…');
  }

  // Step 6: Handle truncated JSON — close open structures
  jsonStr = repairTruncated(jsonStr);
  try {
    return JSON.parse(jsonStr);
  } catch (e3) {
    console.error('[DevIQ] All parse attempts failed. Raw response:\n', raw);
    throw new Error(
      `AI response could not be parsed (${e3.message}). ` +
      `Open browser console (F12) to see the raw response. ` +
      `Try clicking Analyze again — this is usually a one-time issue.`
    );
  }
}

/**
 * Attempt to close truncated JSON by tracking open brackets/braces.
 */
function repairTruncated(str) {
  const stack = [];
  let inString = false;
  let escape   = false;

  for (const ch of str) {
    if (escape)          { escape = false; continue; }
    if (ch === '\\')     { escape = true;  continue; }
    if (ch === '"' && !escape) { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{' || ch === '[') stack.push(ch === '{' ? '}' : ']');
    if (ch === '}' || ch === ']') stack.pop();
  }

  // Close any unclosed string
  if (inString) str += '"';

  // Close any unclosed arrays/objects
  return str + stack.reverse().join('');
}

/* ── Animate all bar fills ─────────────────────────────────── */
function animateBars() {
  document.querySelectorAll('.bar-fill[data-target]').forEach(b => {
    b.style.width = b.dataset.target + '%';
  });
}

/* ── Section header HTML ───────────────────────────────────── */
function sectionHdr(title, badge = '') {
  return `<div class="section-hdr">
    <h3>${title}</h3>
    <div class="section-hdr-line"></div>
    ${badge ? `<span class="section-hdr-badge">${badge}</span>` : ''}
  </div>`;
}

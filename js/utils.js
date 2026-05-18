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

/* ── JSON extractor ────────────────────────────────────────── */
function parseJSON(raw) {
  try {
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end   = cleaned.lastIndexOf('}');
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (e) {
    throw new Error('Failed to parse AI response. Please try again.');
  }
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

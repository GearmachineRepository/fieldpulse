// ═══════════════════════════════════════════
// date.js — Server-side date helpers
// Centralises the toLocaleDateString('en-CA')
// calls scattered across route handlers
// ═══════════════════════════════════════════

// ── YYYY-MM-DD in local time (avoids UTC off-by-one) ──
export function getLocalDate() {
  return new Date().toLocaleDateString('en-CA')
}

// ── Resolve a workDate from a request body/query, falling back to today ──
export function resolveWorkDate(value) {
  return value || getLocalDate()
}

// ── Derive the day-of-week (0–6) from a YYYY-MM-DD string ──
export function dowFromDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').getDay()
}
// ═══════════════════════════════════════════
// Date Utilities (client-side)
// ═══════════════════════════════════════════

/**
 * Returns a time-based greeting string.
 * e.g. "Good morning", "Good afternoon", "Good evening"
 */
export function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Returns today's date as a human-readable string.
 * e.g. "Monday, June 15"
 */
export function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Returns today's date as "Jun 15, 2025" — used to match
 * the date format stored in spray log records.
 */
export function getTodayShort() {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Returns today's date as YYYY-MM-DD (local time, not UTC).
 */
export function getLocalDate() {
  return new Date().toLocaleDateString('en-CA')
}

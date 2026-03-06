// ═══════════════════════════════════════════
// Date Utilities (server-side)
// ═══════════════════════════════════════════

/**
 * Returns today's date as YYYY-MM-DD in local time.
 * Using 'en-CA' locale avoids the UTC off-by-one that
 * toISOString().slice(0,10) causes near midnight.
 */
export function getLocalDate() {
  return new Date().toLocaleDateString('en-CA')
}

/**
 * Returns the provided value or today's local date as fallback.
 * @param {string|undefined} value
 */
export function resolveWorkDate(value) {
  return value || getLocalDate()
}

/**
 * Returns the day-of-week (0 = Sunday … 6 = Saturday) from a
 * YYYY-MM-DD string, treating it as local noon to avoid DST edge cases.
 * @param {string} dateStr  e.g. '2025-06-15'
 */
export function dowFromDate(dateStr) {
  return new Date(`${dateStr}T12:00:00`).getDay()
}

/**
 * Formats a JS Date (or date string) to a human-readable short date.
 * e.g. "Jun 15, 2025"
 * @param {Date|string} date
 */
export function formatShortDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Formats a JS Date (or date string) to a human-readable time.
 * e.g. "2:34 PM"
 * @param {Date|string} date
 */
export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

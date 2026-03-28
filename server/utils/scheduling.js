// ═══════════════════════════════════════════
// Scheduling Utilities — Shared helpers for
// route stops and service plan visit calculation
// ═══════════════════════════════════════════

/**
 * Finds an active exception (skip or pause) matching a given date.
 * Used by both route stop scheduling and service plan visit calculation.
 *
 * @param {Array} exceptions  Array of { type, dateStart, dateEnd, ... }
 * @param {string} dateStr    YYYY-MM-DD to check against
 * @returns {object|null}     The matching exception, or null
 */
export function findException(exceptions, dateStr) {
  for (const ex of exceptions) {
    const exStart = (ex.dateStart || '').split('T')[0]
    const exEnd = (ex.dateEnd || '').split('T')[0]
    if (ex.type === 'skip' && exStart === dateStr) return ex
    if (ex.type === 'pause' && exStart <= dateStr && (!exEnd || exEnd >= dateStr)) return ex
  }
  return null
}

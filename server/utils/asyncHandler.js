// ═══════════════════════════════════════════
// asyncHandler — Wraps async route handlers
//
// Catches rejected promises and forwards them
// to Express's error middleware, removing the
// need for try/catch in every route handler.
// ═══════════════════════════════════════════

/**
 * Wraps an async Express route handler so rejected promises
 * are automatically forwarded to the error middleware via next().
 *
 * @param {Function} fn  Async (req, res, next) => Promise<void>
 * @returns {Function}   Express-compatible middleware
 *
 * @example
 * // Before:
 * router.get('/', async (req, res) => {
 *   try { ... } catch (e) { res.status(500).json({ error: 'Server error' }) }
 * })
 *
 * // After:
 * router.get('/', asyncHandler(async (req, res) => {
 *   // just write the happy path — errors bubble to errorHandler
 * }))
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

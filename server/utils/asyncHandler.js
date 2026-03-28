// ═══════════════════════════════════════════
// asyncHandler — Wraps async route handlers
//
// Catches rejected promises and forwards them
// to Express's error middleware via next().
// ═══════════════════════════════════════════

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

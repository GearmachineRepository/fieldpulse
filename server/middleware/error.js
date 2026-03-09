// ═══════════════════════════════════════════
// Error Middleware — 404 + global error handler
// Mount LAST in server/index.js
// ═══════════════════════════════════════════

import { logger } from '../utils/logger.js'

/** Catches any unmatched route and returns a clean 404. */
export function notFound(req, res) {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` })
}

/**
 * Global error handler.
 * Express identifies this as an error handler via the 4-argument signature.
 *
 * - AppError (isOperational): sends the message + status to the client
 * - CORS / Multer errors: maps to the correct HTTP status
 * - Unknown errors: logs the full stack, returns a generic 500
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // ── Operational errors from our own code ──
  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      error: err.message,
      ...(err.code && { code: err.code }),
    })
  }

  // ── Known middleware errors ──
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message })
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large — max 15 MB' })
  }
  if (err.message?.includes('not allowed')) {
    return res.status(400).json({ error: err.message })
  }

  // ── Unexpected / programmer errors ──
  logger.error({ err, method: req.method, path: req.path }, 'Unhandled error')
  res.status(500).json({ error: 'Internal server error' })
}

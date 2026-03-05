// ═══════════════════════════════════════════
// Error Middleware — 404 + Global error handler
// Mount LAST in server/index.js
// ═══════════════════════════════════════════

/**
 * 404 handler — catches any unmatched route.
 */
export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` })
}

/**
 * Global error handler — catches anything passed to next(err).
 * Express identifies this as an error handler because it has 4 arguments.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // CORS errors from our origin check
  if (err.message?.startsWith('CORS:')) {
    return res.status(403).json({ error: err.message })
  }

  // Multer file type/size errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large — max 15 MB' })
  }
  if (err.message?.includes('not allowed')) {
    return res.status(400).json({ error: err.message })
  }

  // Unexpected errors
  console.error('[FieldPulse Error]', err)
  res.status(500).json({ error: 'Internal server error' })
}

// ═══════════════════════════════════════════
// AppError — Structured operational errors
//
// Throw these for known, expected failures
// (bad input, not found, unauthorized, etc.)
// The global error handler treats these as safe
// to send directly to the client.
//
// Programmer errors (bugs) should remain plain
// Error objects — the handler logs them and
// returns a generic 500.
// ═══════════════════════════════════════════

/**
 * Application-level error with an HTTP status and machine-readable code.
 *
 * @extends Error
 * @example
 * throw new AppError('Chemical not found', 404, 'NOT_FOUND')
 * throw new AppError('firstName and lastName are required', 400)
 */
export class AppError extends Error {
  /**
   * @param {string}  message    Human-readable description
   * @param {number}  statusCode HTTP status (default 500)
   * @param {string}  [code]     Machine-readable code for the frontend
   */
  constructor(message, statusCode = 500, code = undefined) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true // safe to show to client
    Error.captureStackTrace(this, this.constructor)
  }
}

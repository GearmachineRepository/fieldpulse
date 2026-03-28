// ═══════════════════════════════════════════
// AppError — Structured operational errors
//
// Operational errors (bad input, not found, etc.)
// are safe to send to the client. Programmer errors
// remain plain Errors and produce a generic 500.
// ═══════════════════════════════════════════

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

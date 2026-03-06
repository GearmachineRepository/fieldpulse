// ═══════════════════════════════════════════
// Validation Middleware
// Lightweight validators — no external deps
// ═══════════════════════════════════════════

/**
 * Returns middleware that validates req.body against a schema.
 *
 * Schema shape:
 *   { fieldName: { required?: bool, type?: 'string'|'number'|'boolean'|'array', maxLength?: number } }
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const errors = []
    const body = req.body || {}

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field]

      if (rules.required && (value == null || (typeof value === 'string' && !value.trim()))) {
        errors.push(`${field} is required`)
        continue
      }
      if (value == null) continue

      if (rules.type === 'string'  && typeof value !== 'string')                      errors.push(`${field} must be a string`)
      if (rules.type === 'number'  && typeof value !== 'number' && isNaN(Number(value))) errors.push(`${field} must be a number`)
      if (rules.type === 'boolean' && typeof value !== 'boolean')                     errors.push(`${field} must be a boolean`)
      if (rules.type === 'array'   && !Array.isArray(value))                          errors.push(`${field} must be an array`)
      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push(`${field} exceeds max length of ${rules.maxLength}`)
      }
    }

    if (errors.length > 0) return res.status(400).json({ error: errors.join(', ') })
    next()
  }
}

/** Validates that :id is a positive integer, and coerces it on req.params. */
export function validateIdParam(req, res, next) {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id) || id < 1) return res.status(400).json({ error: 'Invalid ID' })
  req.params.id = id
  next()
}

/** Guards dynamic DB names against SQL injection in CREATE DATABASE statements. */
export function isSafeDbName(name) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)
}

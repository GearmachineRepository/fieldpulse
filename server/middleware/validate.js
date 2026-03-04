// ═══════════════════════════════════════════
// Input Validation Helpers
// Lightweight validators — no external deps
// ═══════════════════════════════════════════

// Returns a middleware that checks req.body against a schema object.
// Schema format: { fieldName: { required?: bool, type?: string, maxLength?: number } }
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

      // Skip further checks if value is absent and not required
      if (value == null) continue

      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} must be a string`)
      }
      if (rules.type === 'number' && typeof value !== 'number' && isNaN(Number(value))) {
        errors.push(`${field} must be a number`)
      }
      if (rules.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${field} must be a boolean`)
      }
      if (rules.type === 'array' && !Array.isArray(value)) {
        errors.push(`${field} must be an array`)
      }
      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push(`${field} exceeds max length of ${rules.maxLength}`)
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') })
    }
    next()
  }
}

// Validate that :id param is a positive integer
export function validateIdParam(req, res, next) {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'Invalid ID' })
  }
  req.params.id = id
  next()
}

// Sanitize a database name — only allows alphanumeric + underscore
export function isSafeDbName(name) {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)
}
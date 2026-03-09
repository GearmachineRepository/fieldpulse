// ═══════════════════════════════════════════
// Validation Middleware
// Lightweight validators — no external deps
// ═══════════════════════════════════════════

/**
 * Returns middleware that validates req.body against a schema.
 *
 * Schema shape:
 *   { fieldName: { required?: bool, type?: 'string'|'number'|'boolean'|'array', maxLength?: number } }
 *
 * @param {Record<string, {required?: boolean, type?: string, maxLength?: number}>} schema
 * @returns {import('express').RequestHandler}
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

/**
 * Parses a query-string value as an integer, clamped to [min, max].
 * Returns the default if the value is missing or not a number.
 *
 * Use this to prevent unbounded LIMIT or OFFSET values.
 *
 * @param {string|undefined} raw  The raw query-string value
 * @param {number} defaultVal     Fallback if raw is missing/NaN
 * @param {number} [min=1]        Floor
 * @param {number} [max=500]      Ceiling
 * @returns {number}
 *
 * @example
 * const limit = sanitizeQueryInt(req.query.limit, 50, 1, 500)
 */
export function sanitizeQueryInt(raw, defaultVal, min = 1, max = 500) {
  const n = parseInt(raw, 10)
  if (isNaN(n)) return defaultVal
  return Math.max(min, Math.min(max, n))
}

/**
 * Builds a SET clause dynamically, skipping null/undefined values.
 * Useful for PATCH-style updates where not every field is provided.
 *
 * @param {Record<string, unknown>} fields  Column-name → value map
 * @param {number} [startIndex=1]           Starting $N index
 * @returns {{ setClause: string, values: unknown[], nextIndex: number }}
 *
 * @example
 * const { setClause, values, nextIndex } = buildSetClause({
 *   first_name: 'Carlos', last_name: 'Martinez', phone: null
 * })
 * // setClause = "first_name = $1, last_name = $2"
 * // values = ['Carlos', 'Martinez']
 * // nextIndex = 3
 */
export function buildSetClause(fields, startIndex = 1) {
  const parts = []
  const values = []
  let idx = startIndex

  for (const [col, val] of Object.entries(fields)) {
    if (val === undefined) continue // skip undefined, allow null
    parts.push(`${col} = $${idx}`)
    values.push(val)
    idx++
  }

  return { setClause: parts.join(', '), values, nextIndex: idx }
}

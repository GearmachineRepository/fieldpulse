// ═══════════════════════════════════════════
// Auth Middleware — JWT token verification
// ═══════════════════════════════════════════

import jwt from 'jsonwebtoken'

// Warn loudly at startup if running with the default secret
const SECRET = process.env.JWT_SECRET
if (!SECRET || SECRET === 'fieldpulse-change-me-in-production') {
  console.warn('\n  ⚠  WARNING: JWT_SECRET is not set (or is using the default).')
  console.warn('     Set a strong secret in your .env file before going to production.\n')
}

const EFFECTIVE_SECRET = SECRET || 'fieldpulse-change-me-in-production'
const TOKEN_EXPIRY = '12h'

/**
 * Generate a signed JWT for an authenticated user/vehicle/employee.
 * @param {object} payload
 */
export function signToken(payload) {
  return jwt.sign(payload, EFFECTIVE_SECRET, { expiresIn: TOKEN_EXPIRY })
}

/**
 * Express middleware — rejects requests without a valid Bearer token.
 * Attaches the decoded payload to req.user on success.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const token = header.slice(7)
    req.user = jwt.verify(token, EFFECTIVE_SECRET)
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired — please sign in again' })
    }
    return res.status(401).json({ error: 'Invalid token' })
  }
}

/**
 * Express middleware — only allows admin or owner roles.
 * Must be used after requireAuth.
 */
export function requireAdmin(req, res, next) {
  const role = req.user?.role
  if (role !== 'admin' && role !== 'owner') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

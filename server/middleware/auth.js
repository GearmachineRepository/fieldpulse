// ═══════════════════════════════════════════
// Auth Middleware — JWT verification
// ═══════════════════════════════════════════

import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET
if (!SECRET || SECRET === 'fieldpulse-change-me-in-production') {
  console.warn('\n  ⚠  WARNING: JWT_SECRET is not set or is using the insecure default.')
  console.warn('     Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"')
  console.warn('     Then set JWT_SECRET in your .env file.\n')
}
const EFFECTIVE_SECRET = SECRET || 'fieldpulse-change-me-in-production'
const TOKEN_EXPIRY = '12h'

/** Signs a JWT with the given payload. */
export function signToken(payload) {
  return jwt.sign(payload, EFFECTIVE_SECRET, { expiresIn: TOKEN_EXPIRY })
}

/**
 * Rejects requests without a valid Bearer token.
 * Attaches the decoded payload to req.user.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  try {
    req.user = jwt.verify(header.slice(7), EFFECTIVE_SECRET)
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired — please sign in again' })
    }
    return res.status(401).json({ error: 'Invalid token' })
  }
}

/**
 * Allows only admin or owner roles.
 * Must be used after requireAuth.
 */
export function requireAdmin(req, res, next) {
  const role = req.user?.role
  if (role !== 'admin' && role !== 'owner') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}

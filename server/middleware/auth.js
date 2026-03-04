// ═══════════════════════════════════════════
// Auth Middleware — JWT token verification
// ═══════════════════════════════════════════

import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'fieldpulse-change-me-in-production'
const TOKEN_EXPIRY = '12h'

// Generate a JWT for an authenticated user
export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_EXPIRY })
}

// Express middleware — rejects requests without a valid token
export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const token = header.slice(7)
    req.user = jwt.verify(token, SECRET)
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired — please sign in again' })
    }
    return res.status(401).json({ error: 'Invalid token' })
  }
}

// Optional: only allow admin-role users
export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  next()
}
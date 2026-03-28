// ═══════════════════════════════════════════
// Auth Middleware — Dual-token verification
//
// Supports two token types:
//   1. Supabase JWTs (admin users) — verified via supabase.auth.getUser()
//   2. Legacy custom JWTs (employee/vehicle) — verified via jsonwebtoken
// ═══════════════════════════════════════════

import jwt from 'jsonwebtoken'
import supabase from '../lib/supabase.js'
import db from '../db.js'
import { logger } from '../utils/logger.js'

const DEFAULT_SECRET = 'crupoint-change-me-in-production'
const SECRET = process.env.JWT_SECRET

if (process.env.NODE_ENV === 'production' && (!SECRET || SECRET === DEFAULT_SECRET)) {
  logger.fatal(
    'JWT_SECRET is not set or is using the insecure default. Refusing to start in production.',
  )
  process.exit(1)
}

if (!SECRET || SECRET === DEFAULT_SECRET) {
  logger.warn('JWT_SECRET is not set or is using the insecure default.')
}

const EFFECTIVE_SECRET = SECRET || DEFAULT_SECRET
const TOKEN_EXPIRY = '12h'

/** Signs a legacy JWT (used for employee/vehicle tokens only). */
export function signToken(payload) {
  return jwt.sign(payload, EFFECTIVE_SECRET, { expiresIn: TOKEN_EXPIRY })
}

/**
 * Verifies a Supabase JWT and resolves the linked admin record.
 * Returns the req.user object or null if not a valid Supabase token.
 */
async function verifySupabaseToken(token) {
  if (!supabase) return null

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)
  if (error || !user) return null

  const r = await db.query(
    'SELECT id, name, email, role, org_id FROM admins WHERE supabase_uid = $1 AND active = true',
    [user.id],
  )
  if (!r.rows.length) return null

  return {
    type: 'admin',
    adminId: r.rows[0].id,
    role: r.rows[0].role,
    orgId: r.rows[0].org_id,
    supabaseUid: user.id,
  }
}

/**
 * Rejects requests without a valid Bearer token.
 * Tries Supabase verification first, falls back to legacy JWT.
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  const token = header.slice(7)

  // 1. Try Supabase token (admin users)
  try {
    const supabaseUser = await verifySupabaseToken(token)
    if (supabaseUser) {
      req.user = supabaseUser
      return next()
    }
  } catch (err) {
    logger.debug({ err }, 'Supabase token check failed, trying legacy JWT')
  }

  // 2. Fall back to legacy JWT (employee/vehicle tokens)
  try {
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

// ═══════════════════════════════════════════
// Auth Routes — login + token issuance
//
// Endpoints:
//   POST /api/auth/login          — Email + password via Supabase Auth
//   POST /api/auth/crew-login     — Employee PIN (field app)
//   GET  /api/auth/me             — Session restore
//   POST /api/auth/forgot-password — Send password reset email
//   POST /api/auth/reset-password  — Set new password with token
//
// Legacy (kept for backward compat):
//   POST /api/auth/admin-pin   — Admin PIN login
//   POST /api/auth/verify-pin  — Vehicle PIN login
// ═══════════════════════════════════════════

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import db from '../db.js'
import supabase from '../lib/supabase.js'
import { signToken, requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { logger } from '../utils/logger.js'

const router = Router()

const INVALID_CREDS = { error: 'Invalid credentials' }

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts — try again in 15 minutes' },
})

// ═══════════════════════════════════════════
// Signup — Create account via Supabase Auth
// ═══════════════════════════════════════════

/** @route POST /api/auth/signup — Create new account */
router.post('/signup',
  authLimiter,
  validateBody({
    name: { required: true, type: 'string', maxLength: 100 },
    email: { required: true, type: 'string', maxLength: 255 },
    password: { required: true, type: 'string' },
  }),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body

    if (!supabase) {
      return res.status(500).json({ error: 'Signup is not available' })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    // Check if email already exists in admins table
    const existing = await db.query(
      'SELECT id FROM admins WHERE LOWER(email) = LOWER($1)',
      [email.trim()]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: { name: name.trim() },
    })

    if (authError) {
      logger.error({ err: authError }, 'Supabase signup failed')
      if (authError.message?.includes('already been registered')) {
        return res.status(409).json({ error: 'An account with this email already exists' })
      }
      return res.status(400).json({ error: authError.message })
    }

    // Create admin record with 14-day trial
    const trialDays = 14
    const r = await db.query(
      `INSERT INTO admins (name, email, role, pin_hash, supabase_uid, trial_ends_at)
       VALUES ($1, $2, 'owner', '', $3, NOW() + INTERVAL '${trialDays} days')
       RETURNING id, name, email, role`,
      [name.trim(), email.trim(), authData.user.id]
    )

    const admin = r.rows[0]

    // Sign them in immediately
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      logger.error({ err: signInError }, 'Post-signup sign-in failed')
      return res.status(500).json({ error: 'Account created but sign-in failed. Please try logging in.' })
    }

    res.json({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token: signInData.session.access_token,
    })
  })
)

// ═══════════════════════════════════════════
// Admin Login — via Supabase Auth
// ═══════════════════════════════════════════

/** @route POST /api/auth/login — Email + password login */
router.post('/login',
  authLimiter,
  validateBody({
    email: { required: true, type: 'string' },
    password: { required: true, type: 'string' },
  }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body

    // Verify admin exists in our database first
    const r = await db.query(
      'SELECT id, name, email, role, supabase_uid FROM admins WHERE LOWER(email) = LOWER($1) AND active = true',
      [email.trim()]
    )

    if (!r.rows.length) {
      return res.status(401).json(INVALID_CREDS)
    }

    const admin = r.rows[0]

    // Authenticate via Supabase Auth
    if (supabase && admin.supabase_uid) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        logger.debug({ err: error }, 'Supabase auth failed')
        return res.status(401).json(INVALID_CREDS)
      }

      return res.json({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token: data.session.access_token,
      })
    }

    // Fallback: legacy bcrypt login (for admins not yet migrated to Supabase Auth)
    if (!admin.supabase_uid) {
      const adminWithHash = await db.query(
        'SELECT password_hash FROM admins WHERE id = $1',
        [admin.id]
      )
      const hash = adminWithHash.rows[0]?.password_hash
      if (!hash || !(await bcrypt.compare(password, hash))) {
        return res.status(401).json(INVALID_CREDS)
      }

      const token = signToken({ type: 'admin', adminId: admin.id, role: admin.role })
      return res.json({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token,
      })
    }

    return res.status(401).json(INVALID_CREDS)
  })
)

// ═══════════════════════════════════════════
// Forgot Password — sends reset email via Supabase
// ═══════════════════════════════════════════

/** @route POST /api/auth/forgot-password */
router.post('/forgot-password',
  authLimiter,
  validateBody({ email: { required: true, type: 'string' } }),
  asyncHandler(async (req, res) => {
    const { email } = req.body

    // Always return success to prevent email enumeration
    if (!supabase) {
      return res.json({ success: true })
    }

    // Only send reset if admin exists
    const r = await db.query(
      'SELECT id FROM admins WHERE LOWER(email) = LOWER($1) AND active = true AND supabase_uid IS NOT NULL',
      [email.trim()]
    )

    if (r.rows.length > 0) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${process.env.ALLOWED_ORIGINS?.split(',')[0] || 'http://localhost:5173'}/reset-password`,
      })
      if (error) {
        logger.error({ err: error }, 'Failed to send password reset email')
      }
    }

    res.json({ success: true })
  })
)

// ═══════════════════════════════════════════
// Reset Password — set new password with Supabase token
// ═══════════════════════════════════════════

/** @route POST /api/auth/reset-password */
router.post('/reset-password',
  validateBody({
    accessToken: { required: true, type: 'string' },
    password: { required: true, type: 'string' },
  }),
  asyncHandler(async (req, res) => {
    const { accessToken, password } = req.body

    if (!supabase) {
      return res.status(500).json({ error: 'Password reset not available' })
    }

    // Verify the token and get the user
    const { data: { user }, error: verifyError } = await supabase.auth.getUser(accessToken)
    if (verifyError || !user) {
      return res.status(400).json({ error: 'Invalid or expired reset link' })
    }

    // Update the password
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password })
    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ success: true })
  })
)

// ═══════════════════════════════════════════
// Crew Login (Field App — PIN-based)
// ═══════════════════════════════════════════

/** @route POST /api/auth/crew-login — Employee PIN login */
router.post('/crew-login',
  authLimiter,
  validateBody({ employeeId: { required: true }, pin: { required: true, type: 'string' } }),
  asyncHandler(async (req, res) => {
    const { employeeId, pin } = req.body
    const r = await db.query(
      `SELECT e.id, e.first_name, e.last_name, e.license_number, e.cert_number,
              e.pin_hash, e.is_crew_lead, e.default_crew_id,
              c.name AS crew_name, c.lead_name,
              v.id AS vehicle_id, v.name AS vehicle_name
       FROM employees e
       LEFT JOIN crews c ON c.id = e.default_crew_id
       LEFT JOIN vehicles v ON v.crew_name = c.name AND v.active = true
       WHERE e.id = $1 AND e.active = true`,
      [employeeId]
    )
    if (!r.rows.length) return res.status(401).json(INVALID_CREDS)

    const emp = r.rows[0]
    if (!emp.pin_hash || !(await bcrypt.compare(pin, emp.pin_hash))) {
      return res.status(401).json(INVALID_CREDS)
    }

    const token = signToken({
      type: 'employee',
      employeeId: emp.id,
      crewName: emp.crew_name,
      isCrewLead: emp.is_crew_lead,
    })

    res.json({
      employee: {
        id: emp.id, firstName: emp.first_name, lastName: emp.last_name,
        license: emp.license_number, certNumber: emp.cert_number,
        isCrewLead: emp.is_crew_lead,
      },
      crew: emp.default_crew_id
        ? { id: emp.default_crew_id, name: emp.crew_name }
        : null,
      vehicle: emp.vehicle_id
        ? { id: emp.vehicle_id, name: emp.vehicle_name }
        : null,
      token,
    })
  })
)

// ═══════════════════════════════════════════
// Session Restore
// ═══════════════════════════════════════════

/** @route GET /api/auth/me — Rebuild session from token */
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const { type, adminId, employeeId } = req.user

  if (type === 'admin') {
    const r = await db.query(
      'SELECT id, name, email, role FROM admins WHERE id = $1 AND active = true',
      [adminId]
    )
    if (!r.rows.length) return res.status(401).json({ error: 'Account not found' })
    return res.json({ type: 'admin', admin: r.rows[0] })
  }

  if (type === 'employee') {
    const r = await db.query(
      `SELECT e.id, e.first_name, e.last_name, e.license_number, e.cert_number,
              e.is_crew_lead, e.default_crew_id,
              c.name AS crew_name,
              v.id AS vehicle_id, v.name AS vehicle_name
       FROM employees e
       LEFT JOIN crews c ON c.id = e.default_crew_id
       LEFT JOIN vehicles v ON v.crew_name = c.name AND v.active = true
       WHERE e.id = $1 AND e.active = true`,
      [employeeId]
    )
    if (!r.rows.length) return res.status(401).json({ error: 'Account not found' })
    const emp = r.rows[0]
    return res.json({
      type: 'employee',
      employee: {
        id: emp.id, firstName: emp.first_name, lastName: emp.last_name,
        license: emp.license_number, certNumber: emp.cert_number,
        isCrewLead: emp.is_crew_lead,
      },
      crew: emp.default_crew_id ? { id: emp.default_crew_id, name: emp.crew_name } : null,
      vehicle: emp.vehicle_id ? { id: emp.vehicle_id, name: emp.vehicle_name } : null,
    })
  }

  return res.status(400).json({ error: 'Unknown token type' })
}))

// ═══════════════════════════════════════════
// Legacy PIN endpoints (keep for now)
// ═══════════════════════════════════════════

/** @route POST /api/auth/verify-pin — Vehicle PIN login */
router.post('/verify-pin',
  authLimiter,
  validateBody({ vehicleId: { required: true }, pin: { required: true, type: 'string' } }),
  asyncHandler(async (req, res) => {
    const { vehicleId, pin } = req.body
    const r = await db.query(
      'SELECT id, name, crew_name, pin_hash FROM vehicles WHERE id = $1 AND active = true',
      [vehicleId]
    )
    if (!r.rows.length || !(await bcrypt.compare(pin, r.rows[0].pin_hash))) {
      return res.status(401).json(INVALID_CREDS)
    }
    const v = r.rows[0]
    const token = signToken({ type: 'vehicle', vehicleId: v.id, crewName: v.crew_name })
    res.json({ id: v.id, name: v.name, crewName: v.crew_name, token })
  })
)

/** @route POST /api/auth/admin-pin — Legacy admin PIN login */
router.post('/admin-pin',
  authLimiter,
  validateBody({ adminId: { required: true }, pin: { required: true, type: 'string' } }),
  asyncHandler(async (req, res) => {
    const { adminId, pin } = req.body
    const r = await db.query(
      'SELECT id, name, email, role, pin_hash FROM admins WHERE id = $1 AND active = true',
      [adminId]
    )
    if (!r.rows.length || !(await bcrypt.compare(pin, r.rows[0].pin_hash))) {
      return res.status(401).json(INVALID_CREDS)
    }
    const a = r.rows[0]
    const token = signToken({ type: 'admin', adminId: a.id, role: a.role })
    res.json({ id: a.id, name: a.name, email: a.email, role: a.role, token })
  })
)

export default router

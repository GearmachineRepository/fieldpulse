// ═══════════════════════════════════════════
// Auth Routes — login + token issuance
//
// Endpoints:
//   POST /api/auth/login       — Email + password (admin dashboard)
//   POST /api/auth/crew-login  — Employee PIN (field app)
//   GET  /api/auth/me          — Session restore
//
// Legacy (kept for backward compat):
//   POST /api/auth/admin-pin   — Admin PIN login
//   POST /api/auth/verify-pin  — Vehicle PIN login
// ═══════════════════════════════════════════

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import db from '../db.js'
import { signToken, requireAuth } from '../middleware/auth.js'
import { validateBody } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'

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
// NEW: Email + Password Login (Admin Dashboard)
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

    const r = await db.query(
      'SELECT id, name, email, role, password_hash FROM admins WHERE LOWER(email) = LOWER($1) AND active = true',
      [email.trim()]
    )

    if (!r.rows.length || !r.rows[0].password_hash) {
      return res.status(401).json(INVALID_CREDS)
    }

    const admin = r.rows[0]
    const valid = await bcrypt.compare(password, admin.password_hash)
    if (!valid) {
      return res.status(401).json(INVALID_CREDS)
    }

    const token = signToken({ type: 'admin', adminId: admin.id, role: admin.role })
    res.json({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token,
    })
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

// ═══════════════════════════════════════════
// Certification Routes
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateIdParam } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/AppError.js'
import { getOrgId } from '../utils/db.js'

const router = Router()

// ─────────────────────────────────────────
// Certifications
// ─────────────────────────────────────────

/** @route GET /api/certifications — List all certs for org (with employee name) */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const r = await db.query(
    `SELECT c.*, e.first_name, e.last_name,
            ct.name AS type_name
     FROM certifications c
     LEFT JOIN employees e ON e.id = c.employee_id
     LEFT JOIN certification_types ct ON ct.id = c.certification_type_id
     WHERE c.org_id = $1
     ORDER BY c.expiry_date ASC NULLS LAST`,
    [orgId]
  )
  res.json(r.rows)
}))

/** @route GET /api/certifications/expiring — Certs expiring within N days */
router.get('/expiring', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const days = parseInt(req.query.days) || 30
  const r = await db.query(
    `SELECT c.*, e.first_name, e.last_name,
            ct.name AS type_name
     FROM certifications c
     LEFT JOIN employees e ON e.id = c.employee_id
     LEFT JOIN certification_types ct ON ct.id = c.certification_type_id
     WHERE c.org_id = $1
       AND c.expiry_date IS NOT NULL
       AND c.expiry_date <= CURRENT_DATE + $2 * INTERVAL '1 day'
       AND c.expiry_date >= CURRENT_DATE
     ORDER BY c.expiry_date ASC`,
    [orgId, days]
  )
  res.json(r.rows)
}))

/** @route GET /api/certifications/employee/:employeeId — Certs for a specific employee */
router.get('/employee/:employeeId', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const { employeeId } = req.params
  const r = await db.query(
    `SELECT c.*, ct.name AS type_name
     FROM certifications c
     LEFT JOIN certification_types ct ON ct.id = c.certification_type_id
     WHERE c.org_id = $1 AND c.employee_id = $2
     ORDER BY c.expiry_date ASC NULLS LAST`,
    [orgId, employeeId]
  )
  res.json(r.rows)
}))

/** @route POST /api/certifications — Create cert */
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const { employeeId, certificationTypeId, name, issuingAuthority, certNumber, issuedDate, expiryDate, status, notes } = req.body

  if (!employeeId || !name) {
    throw new AppError('employeeId and name are required', 400)
  }

  const r = await db.query(
    `INSERT INTO certifications
       (org_id, employee_id, certification_type_id, name, issuing_authority, cert_number, issued_date, expiry_date, status, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [orgId, employeeId, certificationTypeId || null, name, issuingAuthority || null,
     certNumber || null, issuedDate || null, expiryDate || null, status || 'active', notes || null]
  )
  res.json(r.rows[0])
}))

/** @route PUT /api/certifications/:id — Update cert */
router.put('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const { certificationTypeId, name, issuingAuthority, certNumber, issuedDate, expiryDate, status, notes } = req.body

  if (!name) {
    throw new AppError('name is required', 400)
  }

  await db.query(
    `UPDATE certifications
     SET certification_type_id = $1, name = $2, issuing_authority = $3, cert_number = $4,
         issued_date = $5, expiry_date = $6, status = $7, notes = $8, updated_at = now()
     WHERE id = $9 AND org_id = $10`,
    [certificationTypeId || null, name, issuingAuthority || null, certNumber || null,
     issuedDate || null, expiryDate || null, status || 'active', notes || null,
     req.params.id, orgId]
  )
  res.json({ success: true })
}))

/** @route DELETE /api/certifications/:id — Delete cert */
router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  await db.query('DELETE FROM certifications WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
  res.json({ success: true })
}))

// ─────────────────────────────────────────
// Certification Types
// ─────────────────────────────────────────

/** @route GET /api/certification-types — List cert types for org */
router.get('/types', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const r = await db.query(
    'SELECT * FROM certification_types WHERE org_id = $1 AND active = true ORDER BY name',
    [orgId]
  )
  res.json(r.rows)
}))

/** @route POST /api/certification-types — Create cert type */
router.post('/types', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const { name, description, validityMonths } = req.body

  if (!name) {
    throw new AppError('name is required', 400)
  }

  const r = await db.query(
    `INSERT INTO certification_types (org_id, name, description, validity_months)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [orgId, name, description || null, validityMonths || null]
  )
  res.json(r.rows[0])
}))

/** @route PUT /api/certification-types/:id — Update cert type */
router.put('/types/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const { name, description, validityMonths } = req.body

  if (!name) {
    throw new AppError('name is required', 400)
  }

  await db.query(
    `UPDATE certification_types SET name = $1, description = $2, validity_months = $3
     WHERE id = $4 AND org_id = $5`,
    [name, description || null, validityMonths || null, req.params.id, orgId]
  )
  res.json({ success: true })
}))

/** @route DELETE /api/certification-types/:id — Soft-delete cert type */
router.delete('/types/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  await db.query('UPDATE certification_types SET active = false WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
  res.json({ success: true })
}))

export default router

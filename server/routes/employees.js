// ═══════════════════════════════════════════
// Employee Routes
// ═══════════════════════════════════════════

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateIdParam, buildSetClause } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/AppError.js'
import { getOrgId } from '../utils/db.js'

export default function employeeRoutes(upload, uploadToStorage) {
  const router = Router()

  /** @route GET /api/employees — List all active employees with crew names */
  router.get('/', requireAuth, asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const r = await db.query(
      `SELECT e.*, c.name AS crew_name,
              CASE WHEN e.pin_hash IS NOT NULL THEN true ELSE false END AS has_pin
       FROM employees e LEFT JOIN crews c ON c.id = e.default_crew_id
       WHERE e.active = true AND e.org_id = $1 ORDER BY e.last_name, e.first_name`,
      [orgId]
    )
    res.json(r.rows.map(row => ({ ...row, cert_number: row.cert_number || null })))
  }))

  /** @route POST /api/employees — Create employee (multipart for photo) */
  router.post('/', requireAuth, upload.single('photo'), uploadToStorage, asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { firstName, lastName, phone, licenseNumber, certNumber, defaultCrewId, pin, isCrewLead } = req.body

    if (!firstName || !lastName) {
      throw new AppError('firstName and lastName are required', 400)
    }

    const photoFilename = req.file ? req.file.filename : null
    const pinHash = pin ? await bcrypt.hash(pin, 10) : null

    const r = await db.query(
      `INSERT INTO employees (first_name, last_name, phone, license_number, cert_number, photo_filename, pin_hash, is_crew_lead, default_crew_id, org_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [firstName, lastName, phone || null, licenseNumber || null, certNumber || null,
       photoFilename, pinHash, isCrewLead === 'true' || isCrewLead === true, defaultCrewId || null, orgId]
    )
    res.json(r.rows[0])
  }))

  /**
   * @route PUT /api/employees/:id — Update employee
   *
   * Uses buildSetClause to dynamically construct the SET clause,
   * collapsing the previous four-branch if/else into one query.
   * Only columns with non-undefined values are updated.
   */
  router.put('/:id', requireAuth, validateIdParam, upload.single('photo'), uploadToStorage, asyncHandler(async (req, res) => {
    const { firstName, lastName, phone, licenseNumber, certNumber, defaultCrewId, pin, isCrewLead } = req.body

    // Build the column → value map, skipping fields that weren't sent
    const fields = {
      first_name: firstName,
      last_name: lastName,
      phone: phone !== undefined ? (phone || null) : undefined,
      license_number: licenseNumber !== undefined ? (licenseNumber || null) : undefined,
      cert_number: certNumber !== undefined ? (certNumber || null) : undefined,
      is_crew_lead: isCrewLead !== undefined ? (isCrewLead === 'true' || isCrewLead === true) : undefined,
      default_crew_id: defaultCrewId !== undefined ? (defaultCrewId || null) : undefined,
    }

    // Only include photo if a new file was uploaded
    if (req.file) {
      fields.photo_filename = req.file.filename
    }

    // Only hash + include PIN if a new one was provided
    if (pin) {
      fields.pin_hash = await bcrypt.hash(pin, 10)
    }

    const { setClause, values, nextIndex } = buildSetClause(fields)

    if (!setClause) {
      throw new AppError('No fields to update', 400)
    }

    const orgId = getOrgId(req)
    values.push(req.params.id)
    values.push(orgId)
    await db.query(`UPDATE employees SET ${setClause} WHERE id = $${nextIndex} AND org_id = $${nextIndex + 1}`, values)
    res.json({ success: true })
  }))

  /** @route DELETE /api/employees/:id — Soft-delete employee */
  router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    await db.query('UPDATE employees SET active = false WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
    res.json({ success: true })
  }))

  return router
}

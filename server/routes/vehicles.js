// ═══════════════════════════════════════════
// Vehicle Routes
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOrgId } from '../utils/db.js'

const router = Router()

/** @route GET /api/vehicles — List all active vehicles */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const r = await db.query(
    'SELECT id, name, crew_name, license_plate, vin, make_model, year, truck_number FROM vehicles WHERE active = true AND org_id = $1 ORDER BY name',
    [orgId]
  )
  res.json(r.rows)
}))

/** @route POST /api/vehicles — Create vehicle */
router.post('/',
  requireAuth,
  validateBody({ name: { required: true, type: 'string', maxLength: 100 } }),
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { name, crewName, licensePlate, vin, makeModel, year, truckNumber } = req.body
    const r = await db.query(
      `INSERT INTO vehicles (name, crew_name, license_plate, vin, make_model, year, truck_number, org_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, name, crew_name`,
      [name, crewName || null, licensePlate || null, vin || null,
       makeModel || null, year ? parseInt(year) : null, truckNumber || null, orgId]
    )
    res.json(r.rows[0])
  })
)

/** @route PUT /api/vehicles/:id — Update vehicle */
router.put('/:id',
  requireAuth,
  validateIdParam,
  validateBody({ name: { required: true, type: 'string', maxLength: 100 } }),
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { name, crewName, licensePlate, vin, makeModel, year, truckNumber } = req.body
    await db.query(
      `UPDATE vehicles
       SET name=$1, crew_name=$2, license_plate=$3, vin=$4, make_model=$5, year=$6, truck_number=$7
       WHERE id=$8 AND org_id=$9`,
      [name, crewName || null, licensePlate || null, vin || null,
       makeModel || null, year ? parseInt(year) : null, truckNumber || null, req.params.id, orgId]
    )
    res.json({ success: true })
  })
)

/** @route DELETE /api/vehicles/:id — Soft-delete vehicle */
router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  await db.query('UPDATE vehicles SET active = false WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
  res.json({ success: true })
}))

export default router

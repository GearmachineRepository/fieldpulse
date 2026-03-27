// ═══════════════════════════════════════════
// Crew Routes
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOrgId } from '../utils/db.js'

const router = Router()

/** @route GET /api/crews/login-tiles — Public, needed by login screen */
router.get('/login-tiles', asyncHandler(async (req, res) => {
  const crews = await db.query('SELECT id, name, lead_name FROM crews WHERE active = true ORDER BY name')
  const employees = await db.query(
    `SELECT e.id, e.first_name, e.last_name, e.default_crew_id, e.photo_filename, e.is_crew_lead,
            CASE WHEN e.pin_hash IS NOT NULL THEN true ELSE false END AS has_pin
     FROM employees e WHERE e.active = true ORDER BY e.is_crew_lead DESC, e.last_name, e.first_name`
  )
  const vehicles = await db.query(
    `SELECT v.id, v.name, v.crew_name, c.id AS crew_id
     FROM vehicles v LEFT JOIN crews c ON c.name = v.crew_name
     WHERE v.active = true ORDER BY v.name`
  )
  res.json({
    crews: crews.rows.map(c => ({
      ...c,
      employees: employees.rows.filter(e => e.default_crew_id === c.id),
      vehicle: vehicles.rows.find(v => v.crew_id === c.id) || null,
    })),
    unassigned: employees.rows.filter(e => !e.default_crew_id),
  })
}))

/** @route GET /api/crews — List all active crews (auth required) */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const r = await db.query('SELECT id, name, lead_name FROM crews WHERE active = true AND org_id = $1 ORDER BY name', [orgId])
  res.json(r.rows)
}))

/** @route POST /api/crews — Create crew */
router.post('/',
  requireAuth,
  validateBody({ name: { required: true, type: 'string', maxLength: 100 } }),
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { name, leadName } = req.body
    const r = await db.query('INSERT INTO crews (name, lead_name, org_id) VALUES ($1, $2, $3) RETURNING *', [name, leadName, orgId])
    res.json(r.rows[0])
  })
)

/** @route PUT /api/crews/:id — Update crew (partial update) */
router.put('/:id',
  requireAuth,
  validateIdParam,
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { name, leadName } = req.body

    // Build SET clause dynamically for partial updates
    const sets = []
    const params = []
    if (name !== undefined) {
      params.push(name)
      sets.push(`name = $${params.length}`)
    }
    if (leadName !== undefined) {
      params.push(leadName)
      sets.push(`lead_name = $${params.length}`)
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    params.push(req.params.id, orgId)
    await db.query(
      `UPDATE crews SET ${sets.join(', ')} WHERE id = $${params.length - 1} AND org_id = $${params.length}`,
      params
    )
    res.json({ success: true })
  })
)

/** @route DELETE /api/crews/:id — Soft-delete crew */
router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  await db.query('UPDATE crews SET active = false WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
  res.json({ success: true })
}))

export default router

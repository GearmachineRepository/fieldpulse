// ═══════════════════════════════════════════
// Crew Routes
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'

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
  const r = await db.query('SELECT id, name, lead_name FROM crews WHERE active = true ORDER BY name')
  res.json(r.rows)
}))

/** @route POST /api/crews — Create crew */
router.post('/',
  requireAuth,
  validateBody({ name: { required: true, type: 'string', maxLength: 100 } }),
  asyncHandler(async (req, res) => {
    const { name, leadName } = req.body
    const r = await db.query('INSERT INTO crews (name, lead_name) VALUES ($1, $2) RETURNING *', [name, leadName])
    res.json(r.rows[0])
  })
)

/** @route PUT /api/crews/:id — Update crew */
router.put('/:id',
  requireAuth,
  validateIdParam,
  validateBody({ name: { required: true, type: 'string', maxLength: 100 } }),
  asyncHandler(async (req, res) => {
    const { name, leadName } = req.body
    await db.query('UPDATE crews SET name = $1, lead_name = $2 WHERE id = $3', [name, leadName, req.params.id])
    res.json({ success: true })
  })
)

/** @route DELETE /api/crews/:id — Soft-delete crew */
router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  await db.query('UPDATE crews SET active = false WHERE id = $1', [req.params.id])
  res.json({ success: true })
}))

export default router

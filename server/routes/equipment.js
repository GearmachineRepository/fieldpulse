// ═══════════════════════════════════════════
// Equipment Routes
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOrgId } from '../utils/db.js'

const router = Router()

/** @route GET /api/equipment — List all active equipment */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const r = await db.query('SELECT * FROM equipment WHERE active = true AND org_id = $1 ORDER BY name', [orgId])
  res.json(r.rows)
}))

/** @route POST /api/equipment — Create equipment */
router.post('/',
  requireAuth,
  validateBody({ name: { required: true, type: 'string', maxLength: 200 } }),
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { name, type } = req.body
    const r = await db.query('INSERT INTO equipment (name, type, org_id) VALUES ($1, $2, $3) RETURNING *', [name, type, orgId])
    res.json(r.rows[0])
  })
)

/** @route PUT /api/equipment/:id — Update equipment */
router.put('/:id',
  requireAuth,
  validateIdParam,
  validateBody({ name: { required: true, type: 'string', maxLength: 200 } }),
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { name, type } = req.body
    await db.query('UPDATE equipment SET name = $1, type = $2 WHERE id = $3 AND org_id = $4', [name, type, req.params.id, orgId])
    res.json({ success: true })
  })
)

/** @route DELETE /api/equipment/:id — Soft-delete equipment */
router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  await db.query('UPDATE equipment SET active = false WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
  res.json({ success: true })
}))

export default router

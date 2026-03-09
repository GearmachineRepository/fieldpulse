// ═══════════════════════════════════════════
// Equipment Routes
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/AppError.js'

const router = Router()

/** @route GET /api/equipment — List all active equipment */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const r = await db.query('SELECT * FROM equipment WHERE active = true ORDER BY name')
  res.json(r.rows)
}))

/** @route POST /api/equipment — Create equipment */
router.post('/',
  requireAuth,
  validateBody({ name: { required: true, type: 'string', maxLength: 200 } }),
  asyncHandler(async (req, res) => {
    const { name, type } = req.body
    const r = await db.query('INSERT INTO equipment (name, type) VALUES ($1, $2) RETURNING *', [name, type])
    res.json(r.rows[0])
  })
)

/** @route PUT /api/equipment/:id — Update equipment */
router.put('/:id',
  requireAuth,
  validateIdParam,
  validateBody({ name: { required: true, type: 'string', maxLength: 200 } }),
  asyncHandler(async (req, res) => {
    const { name, type } = req.body
    await db.query('UPDATE equipment SET name = $1, type = $2 WHERE id = $3', [name, type, req.params.id])
    res.json({ success: true })
  })
)

/** @route DELETE /api/equipment/:id — Soft-delete equipment */
router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  await db.query('UPDATE equipment SET active = false WHERE id = $1', [req.params.id])
  res.json({ success: true })
}))

export default router

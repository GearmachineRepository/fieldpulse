// ═══════════════════════════════════════════
// Account Groups Routes — CRUD
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

/** @route GET /api/account-groups — List all active groups */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const r = await db.query(
    'SELECT * FROM account_groups WHERE active = true ORDER BY name'
  )
  res.json(r.rows)
}))

/** @route POST /api/account-groups — Create group */
router.post('/',
  requireAuth,
  validateBody({ name: { required: true, type: 'string', maxLength: 100 } }),
  asyncHandler(async (req, res) => {
    const { name, color } = req.body
    const r = await db.query(
      'INSERT INTO account_groups (name, color) VALUES ($1, $2) RETURNING *',
      [name, color || '#475569']
    )
    res.json(r.rows[0])
  })
)

/** @route PUT /api/account-groups/:id — Update group */
router.put('/:id',
  requireAuth,
  validateIdParam,
  validateBody({ name: { required: true, type: 'string', maxLength: 100 } }),
  asyncHandler(async (req, res) => {
    const { name, color } = req.body
    await db.query(
      'UPDATE account_groups SET name = $1, color = $2 WHERE id = $3',
      [name, color || '#475569', req.params.id]
    )
    res.json({ success: true })
  })
)

/** @route DELETE /api/account-groups/:id — Soft-delete group */
router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  await db.query('UPDATE account_groups SET active = false WHERE id = $1', [req.params.id])
  // Unlink accounts from this group
  await db.query('UPDATE accounts SET group_id = NULL WHERE group_id = $1', [req.params.id])
  res.json({ success: true })
}))

export default router

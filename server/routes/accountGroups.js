// ═══════════════════════════════════════════
// Account Groups Routes — CRUD
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOrgId } from '../utils/db.js'

const router = Router()

/** @route GET /api/account-groups — List all active groups */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const r = await db.query(
    'SELECT * FROM account_groups WHERE active = true AND org_id = $1 ORDER BY name',
    [orgId]
  )
  res.json(r.rows)
}))

/** @route POST /api/account-groups — Create group */
router.post('/',
  requireAuth,
  validateBody({ name: { required: true, type: 'string', maxLength: 100 } }),
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { name, color } = req.body
    const r = await db.query(
      'INSERT INTO account_groups (name, color, org_id) VALUES ($1, $2, $3) RETURNING *',
      [name, color || '#475569', orgId]
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
    const orgId = getOrgId(req)
    const { name, color } = req.body
    await db.query(
      'UPDATE account_groups SET name = $1, color = $2 WHERE id = $3 AND org_id = $4',
      [name, color || '#475569', req.params.id, orgId]
    )
    res.json({ success: true })
  })
)

/** @route DELETE /api/account-groups/:id — Soft-delete group */
router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  await db.query('UPDATE account_groups SET active = false WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
  await db.query('UPDATE accounts SET group_id = NULL WHERE group_id = $1 AND org_id = $2', [req.params.id, orgId])
  res.json({ success: true })
}))

export default router

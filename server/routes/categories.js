// ═══════════════════════════════════════════
// Categories Routes — Shared, org-scoped categories
// Supports multiple scopes: sds, equipment, documents, etc.
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOrgId } from '../utils/db.js'

const router = Router()

/** @route GET /api/categories?scope=sds — List active categories for a scope */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const { scope } = req.query
  if (!scope) return res.status(400).json({ error: 'scope query param required' })

  const r = await db.query(
    `SELECT id, scope, name, color, sort_order
     FROM categories
     WHERE org_id = $1 AND scope = $2 AND active = true
     ORDER BY sort_order ASC, name ASC`,
    [orgId, scope]
  )
  res.json(r.rows)
}))

/** @route POST /api/categories — Create a category */
router.post('/',
  requireAuth,
  validateBody({
    scope: { required: true, type: 'string', maxLength: 50 },
    name:  { required: true, type: 'string', maxLength: 100 },
  }),
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { scope, name, color } = req.body

    // Get next sort_order
    const maxR = await db.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM categories WHERE org_id = $1 AND scope = $2',
      [orgId, scope]
    )
    const sortOrder = maxR.rows[0].next

    const r = await db.query(
      `INSERT INTO categories (org_id, scope, name, color, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, scope, name, color, sort_order`,
      [orgId, scope, name.trim(), color || '#475569', sortOrder]
    )
    res.json(r.rows[0])
  })
)

/** @route PUT /api/categories/:id — Rename / recolor a category */
router.put('/:id',
  requireAuth,
  validateIdParam,
  validateBody({ name: { required: true, type: 'string', maxLength: 100 } }),
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { name, color } = req.body
    await db.query(
      `UPDATE categories SET name = $1, color = COALESCE($2, color)
       WHERE id = $3 AND org_id = $4`,
      [name.trim(), color || null, req.params.id, orgId]
    )
    res.json({ success: true })
  })
)

/** @route PATCH /api/categories/reorder — Bulk update sort_order */
router.patch('/reorder',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { ids } = req.body
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'ids array required' })

    for (let i = 0; i < ids.length; i++) {
      await db.query(
        'UPDATE categories SET sort_order = $1 WHERE id = $2 AND org_id = $3',
        [i + 1, ids[i], orgId]
      )
    }
    res.json({ success: true })
  })
)

/** @route DELETE /api/categories/:id — Soft-delete */
router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  await db.query(
    'UPDATE categories SET active = false WHERE id = $1 AND org_id = $2',
    [req.params.id, orgId]
  )
  res.json({ success: true })
}))

export default router

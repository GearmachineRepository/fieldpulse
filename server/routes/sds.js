// ═══════════════════════════════════════════
// SDS Routes — Safety Data Sheet management
// Uses chemicals table
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateIdParam } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOrgId } from '../utils/db.js'

const router = Router()

/** @route GET /api/sds — List all SDS entries for org */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const r = await db.query(
    `SELECT id, name, type, epa, active_ingredient, signal_word,
            restricted, sds_url, label_url, active, created_at
     FROM chemicals
     WHERE org_id = $1
     ORDER BY name`,
    [orgId]
  )
  res.json(r.rows)
}))

/** @route POST /api/sds — Create SDS entry */
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const b = req.body
  if (!b.name || !b.name.trim()) {
    return res.status(400).json({ error: 'name is required' })
  }
  const r = await db.query(
    `INSERT INTO chemicals
       (name, type, epa, active_ingredient, signal_word, restricted, sds_url, label_url, org_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [b.name.trim(), b.type || null, b.epa || null, b.active_ingredient || null,
     b.signal_word || null, b.restricted || false, b.sds_url || null,
     b.label_url || null, orgId]
  )
  res.json(r.rows[0])
}))

/** @route PUT /api/sds/:id — Update SDS entry */
router.put('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const b = req.body
  if (!b.name || !b.name.trim()) {
    return res.status(400).json({ error: 'name is required' })
  }
  const r = await db.query(
    `UPDATE chemicals
     SET name = $1, type = $2, epa = $3, active_ingredient = $4,
         signal_word = $5, restricted = $6, sds_url = $7, label_url = $8
     WHERE id = $9 AND org_id = $10
     RETURNING *`,
    [b.name.trim(), b.type || null, b.epa || null, b.active_ingredient || null,
     b.signal_word || null, b.restricted || false, b.sds_url || null,
     b.label_url || null, req.params.id, orgId]
  )
  if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' })
  res.json(r.rows[0])
}))

/** @route DELETE /api/sds/:id — Soft-delete SDS entry (consistent with chemicals route) */
router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  await db.query('UPDATE chemicals SET active = false WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
  res.json({ success: true })
}))

export default router

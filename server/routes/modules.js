// ═══════════════════════════════════════════
// Modules Routes — Per-org module toggle
//
// GET  /api/modules       → list module states for this org
// PUT  /api/modules/:key  → toggle a module on/off
//
// If no row exists for a module_key, it's treated as
// disabled. The static registry in modules.js defines
// which modules are AVAILABLE — this table tracks which
// are ENABLED per tenant.
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOrgId } from '../utils/db.js'

const router = Router()

/** @route GET /api/modules — List module states for this org */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const r = await db.query(
    `SELECT module_key, enabled, config, enabled_at
     FROM modules
     WHERE org_id = $1
     ORDER BY module_key`,
    [orgId]
  )
  res.json(r.rows)
}))

/** @route PUT /api/modules/:key — Toggle a module on/off */
router.put('/:key', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const { key } = req.params
  const { enabled } = req.body

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'enabled (boolean) is required' })
  }

  // Upsert: insert if no row exists, update if it does
  const r = await db.query(
    `INSERT INTO modules (org_id, module_key, enabled, enabled_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (org_id, module_key)
     DO UPDATE SET enabled = $3, enabled_at = $4
     RETURNING module_key, enabled, config, enabled_at`,
    [orgId, key, enabled, enabled ? new Date().toISOString() : null]
  )

  res.json(r.rows[0])
}))

export default router

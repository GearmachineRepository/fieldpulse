// ═══════════════════════════════════════════
// Dashboard Pins Routes
// Manages which cards appear on the dashboard
// Server-side seeding: first GET auto-creates defaults
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOrgId } from '../utils/db.js'

const router = Router()

const DEFAULT_PINS = [
  { card_key: 'crew_activity', position: 1 },
  { card_key: 'active_projects', position: 2 },
  { card_key: 'compliance_alerts', position: 3 },
  { card_key: 'quick_actions', position: 4 },
]

/** @route GET /api/dashboard-pins — Get pins (auto-seed if none) */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)

  let r = await db.query(
    `SELECT id, card_key, position FROM dashboard_pins
     WHERE org_id = $1
     ORDER BY position`,
    [orgId]
  )

  // Server-side seeding: if no pins, create defaults
  if (r.rows.length === 0) {
    for (const pin of DEFAULT_PINS) {
      await db.query(
        `INSERT INTO dashboard_pins (org_id, card_key, position)
         VALUES ($1, $2, $3)`,
        [orgId, pin.card_key, pin.position]
      )
    }
    r = await db.query(
      `SELECT id, card_key, position FROM dashboard_pins
       WHERE org_id = $1
       ORDER BY position`,
      [orgId]
    )
  }

  res.json(r.rows)
}))

/** @route PUT /api/dashboard-pins — Replace all pins */
router.put('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const { pins } = req.body

  if (!Array.isArray(pins)) {
    return res.status(400).json({ error: 'pins must be an array' })
  }

  // Delete existing and re-insert
  await db.query('DELETE FROM dashboard_pins WHERE org_id = $1', [orgId])

  for (const pin of pins) {
    if (!pin.card_key) continue
    await db.query(
      `INSERT INTO dashboard_pins (org_id, card_key, position)
       VALUES ($1, $2, $3)`,
      [orgId, pin.card_key, pin.position || 0]
    )
  }

  const r = await db.query(
    `SELECT id, card_key, position FROM dashboard_pins
     WHERE org_id = $1
     ORDER BY position`,
    [orgId]
  )

  res.json(r.rows)
}))

export default router

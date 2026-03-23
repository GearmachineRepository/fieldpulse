// ═══════════════════════════════════════════
// Organization Routes
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOrgId } from '../utils/db.js'

const router = Router()

/** @route GET /api/organization — Get current org details */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const r = await db.query(
    'SELECT id, name, phone, address, city, state, zip FROM organizations WHERE id = $1',
    [orgId]
  )
  if (r.rows.length === 0) {
    return res.status(404).json({ error: 'Organization not found' })
  }
  res.json(r.rows[0])
}))

/** @route PUT /api/organization — Update org details */
router.put('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const { name, phone, address, city, state, zip } = req.body

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Company name is required' })
  }

  await db.query(
    `UPDATE organizations
     SET name = $1, phone = $2, address = $3, city = $4, state = $5, zip = $6
     WHERE id = $7`,
    [name.trim(), phone?.trim() || null, address?.trim() || null, city?.trim() || null, state?.trim() || null, zip?.trim() || null, orgId]
  )
  res.json({ success: true })
}))

export default router

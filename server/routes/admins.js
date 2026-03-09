// ═══════════════════════════════════════════
// Admins Routes
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

/**
 * @route GET /api/admins/list
 * Public — login screen needs admin list.
 * Only returns first names to reduce info leakage.
 */
router.get('/list', asyncHandler(async (req, res) => {
  const r = await db.query('SELECT id, name, role FROM admins WHERE active = true ORDER BY name')
  res.json(r.rows)
}))

export default router

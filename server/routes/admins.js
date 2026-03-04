// ═══════════════════════════════════════════
// Admins Routes
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'

const router = Router()

// Public — login screen needs admin list
router.get('/list', async (req, res) => {
  try {
    const r = await db.query('SELECT id, name, role FROM admins WHERE active = true ORDER BY name')
    res.json(r.rows)
  } catch (e) {
    console.error('admins/list error:', e)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
// ═══════════════════════════════════════════
// Equipment Routes
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam } from '../middleware/validate.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM equipment WHERE active = true ORDER BY name')
    res.json(r.rows)
  } catch (e) {
    console.error('GET /equipment error:', e)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/',
  requireAuth,
  validateBody({ name: { required: true, type: 'string', maxLength: 200 } }),
  async (req, res) => {
    try {
      const { name, type } = req.body
      const r = await db.query('INSERT INTO equipment (name, type) VALUES ($1, $2) RETURNING *', [name, type])
      res.json(r.rows[0])
    } catch (e) {
      console.error('POST /equipment error:', e)
      res.status(500).json({ error: 'Failed' })
    }
  }
)

router.put('/:id', requireAuth, validateIdParam, async (req, res) => {
  try {
    const { name, type } = req.body
    await db.query('UPDATE equipment SET name = $1, type = $2 WHERE id = $3', [name, type, req.params.id])
    res.json({ success: true })
  } catch (e) {
    console.error('PUT /equipment error:', e)
    res.status(500).json({ error: 'Failed' })
  }
})

router.delete('/:id', requireAuth, validateIdParam, async (req, res) => {
  try {
    await db.query('UPDATE equipment SET active = false WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (e) {
    console.error('DELETE /equipment error:', e)
    res.status(500).json({ error: 'Failed' })
  }
})

export default router
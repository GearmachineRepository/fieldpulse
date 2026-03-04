// ═══════════════════════════════════════════
// Chemical Routes
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam } from '../middleware/validate.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM chemicals WHERE active = true ORDER BY name')
    res.json(r.rows.map(row => ({
      id: row.id, name: row.name, type: row.type, epa: row.epa,
      ai: row.active_ingredient, signal: row.signal_word,
      restricted: row.restricted, sdsUrl: row.sds_url, labelUrl: row.label_url,
      wxRestrictions: {
        temp: row.wx_temp, humidity: row.wx_humidity,
        windSpeed: row.wx_wind, conditions: row.wx_conditions,
      },
    })))
  } catch (e) {
    console.error('GET /chemicals error:', e)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/',
  requireAuth,
  validateBody({ name: { required: true, type: 'string', maxLength: 200 } }),
  async (req, res) => {
    try {
      const b = req.body
      const r = await db.query(
        `INSERT INTO chemicals (name, type, epa, active_ingredient, signal_word, restricted,
         sds_url, label_url, wx_temp, wx_humidity, wx_wind, wx_conditions)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
        [b.name, b.type, b.epa, b.ai, b.signal || 'CAUTION', b.restricted || false,
         b.sdsUrl, b.labelUrl,
         b.wxTemp ? JSON.stringify(b.wxTemp) : null,
         b.wxHumidity ? JSON.stringify(b.wxHumidity) : null,
         b.wxWind ? JSON.stringify(b.wxWind) : null,
         b.wxConditions ? JSON.stringify(b.wxConditions) : null]
      )
      res.json({ id: r.rows[0].id })
    } catch (e) {
      console.error('POST /chemicals error:', e)
      res.status(500).json({ error: 'Failed' })
    }
  }
)

router.put('/:id', requireAuth, validateIdParam, async (req, res) => {
  try {
    const b = req.body
    await db.query(
      `UPDATE chemicals SET name=$1, type=$2, epa=$3, active_ingredient=$4, signal_word=$5,
       restricted=$6, sds_url=$7, label_url=$8, wx_temp=$9, wx_humidity=$10, wx_wind=$11, wx_conditions=$12
       WHERE id=$13`,
      [b.name, b.type, b.epa, b.ai, b.signal, b.restricted, b.sdsUrl, b.labelUrl,
       b.wxTemp ? JSON.stringify(b.wxTemp) : null,
       b.wxHumidity ? JSON.stringify(b.wxHumidity) : null,
       b.wxWind ? JSON.stringify(b.wxWind) : null,
       b.wxConditions ? JSON.stringify(b.wxConditions) : null,
       req.params.id]
    )
    res.json({ success: true })
  } catch (e) {
    console.error('PUT /chemicals error:', e)
    res.status(500).json({ error: 'Failed' })
  }
})

router.delete('/:id', requireAuth, validateIdParam, async (req, res) => {
  try {
    await db.query('UPDATE chemicals SET active = false WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (e) {
    console.error('DELETE /chemicals error:', e)
    res.status(500).json({ error: 'Failed' })
  }
})

export default router
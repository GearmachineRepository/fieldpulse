// ═══════════════════════════════════════════
// Chemical Routes
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOrgId } from '../utils/db.js'

const router = Router()

/** @route GET /api/chemicals — List all active chemicals */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const r = await db.query('SELECT * FROM chemicals WHERE active = true AND org_id = $1 ORDER BY name', [orgId])
  res.json(r.rows.map(row => ({
    id: row.id, name: row.name, type: row.type, epa: row.epa,
    ai: row.active_ingredient, signal: row.signal_word,
    restricted: row.restricted, sdsUrl: row.sds_url, labelUrl: row.label_url,
    wxRestrictions: {
      temp: row.wx_temp, humidity: row.wx_humidity,
      windSpeed: row.wx_wind, conditions: row.wx_conditions,
    },
  })))
}))

/** Helper: extract weather restriction JSON fields from request body */
function wxJsonOrNull(val) {
  return val ? JSON.stringify(val) : null
}

/** @route POST /api/chemicals — Create chemical */
router.post('/',
  requireAuth,
  validateBody({ name: { required: true, type: 'string', maxLength: 200 } }),
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const b = req.body
    const r = await db.query(
      `INSERT INTO chemicals (name, type, epa, active_ingredient, signal_word, restricted,
       sds_url, label_url, wx_temp, wx_humidity, wx_wind, wx_conditions, org_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [b.name, b.type, b.epa, b.ai, b.signal || 'CAUTION', b.restricted || false,
       b.sdsUrl, b.labelUrl,
       wxJsonOrNull(b.wxTemp), wxJsonOrNull(b.wxHumidity),
       wxJsonOrNull(b.wxWind), wxJsonOrNull(b.wxConditions), orgId]
    )
    res.json({ id: r.rows[0].id })
  })
)

/** @route PUT /api/chemicals/:id — Update chemical */
router.put('/:id',
  requireAuth,
  validateIdParam,
  validateBody({ name: { required: true, type: 'string', maxLength: 200 } }),
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const b = req.body
    await db.query(
      `UPDATE chemicals SET name=$1, type=$2, epa=$3, active_ingredient=$4, signal_word=$5,
       restricted=$6, sds_url=$7, label_url=$8, wx_temp=$9, wx_humidity=$10, wx_wind=$11, wx_conditions=$12
       WHERE id=$13 AND org_id=$14`,
      [b.name, b.type, b.epa, b.ai, b.signal, b.restricted, b.sdsUrl, b.labelUrl,
       wxJsonOrNull(b.wxTemp), wxJsonOrNull(b.wxHumidity),
       wxJsonOrNull(b.wxWind), wxJsonOrNull(b.wxConditions), req.params.id, orgId]
    )
    res.json({ success: true })
  })
)

/** @route DELETE /api/chemicals/:id — Soft-delete chemical */
router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  await db.query('UPDATE chemicals SET active = false WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
  res.json({ success: true })
}))

export default router

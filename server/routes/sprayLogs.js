// ═══════════════════════════════════════════
// Spray Log Routes
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam, sanitizeQueryInt } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { withTransaction } from '../utils/db.js'
import { SPRAY_LOG_DEFAULT_LIMIT, SPRAY_LOG_MAX_LIMIT } from '../constants/index.js'

export default function sprayLogRoutes(upload, uploadToStorage) {
  const router = Router()

  /**
   * @route POST /api/spray-logs — Create a spray log with products and crew members.
   * Uses withTransaction() so BEGIN/COMMIT/ROLLBACK and client.release() are automatic.
   */
  router.post('/',
    requireAuth,
    validateBody({
      crewLead: { required: true, type: 'string' },
      license: { required: true, type: 'string' },
      property: { required: true, type: 'string' },
      products: { required: true, type: 'array' },
    }),
    asyncHandler(async (req, res) => {
      const b = req.body

      const result = await withTransaction(async (client) => {
        const logR = await client.query(
          `INSERT INTO spray_logs
           (vehicle_id, crew_name, crew_lead, license, property, location,
            equipment_id, equipment_name, total_mix_vol, target_pest, notes,
            wx_temp, wx_humidity, wx_wind_speed, wx_wind_dir, wx_conditions)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
           RETURNING id, created_at`,
          [b.vehicleId, b.crewName, b.crewLead, b.license, b.property, b.location,
           b.equipmentId, b.equipmentName, b.totalMixVol, b.targetPest, b.notes,
           b.weather.temp, b.weather.humidity, b.weather.windSpeed, b.weather.windDir, b.weather.conditions]
        )

        const logId = logR.rows[0].id

        for (const p of b.products) {
          await client.query(
            'INSERT INTO spray_log_products (spray_log_id, chemical_id, chemical_name, epa, amount) VALUES ($1,$2,$3,$4,$5)',
            [logId, p.chemicalId || null, p.name, p.epa, p.amount]
          )
        }

        if (b.crewMembers?.length > 0) {
          for (const m of b.crewMembers) {
            await client.query(
              'INSERT INTO spray_log_members (spray_log_id, employee_id, employee_name) VALUES ($1,$2,$3)',
              [logId, m.id, m.name]
            )
          }
        }

        return { id: logId, createdAt: logR.rows[0].created_at }
      })

      res.json(result)
    })
  )

  /** @route POST /api/spray-logs/:id/photos — Upload photos to a spray log */
  router.post('/:id/photos', requireAuth, validateIdParam, upload.array('photos', 10), uploadToStorage, asyncHandler(async (req, res) => {
    const saved = []
    for (const f of req.files) {
      const r = await db.query(
        `INSERT INTO spray_log_photos (spray_log_id, filename, original_name, mime_type, size_bytes)
         VALUES ($1,$2,$3,$4,$5) RETURNING id, filename, original_name`,
        [req.params.id, f.filename, f.originalname, f.mimetype, f.size]
      )
      saved.push(r.rows[0])
    }
    res.json(saved)
  }))

  /** @route GET /api/spray-logs — List spray logs with optional filters */
  router.get('/', requireAuth, asyncHandler(async (req, res) => {
    const { vehicleId, crewName, start, end } = req.query
    const limit = sanitizeQueryInt(req.query.limit, SPRAY_LOG_DEFAULT_LIMIT, 1, SPRAY_LOG_MAX_LIMIT)
    const where = []
    const params = []

    if (vehicleId) { params.push(vehicleId); where.push(`sl.vehicle_id = $${params.length}`) }
    if (crewName) { params.push(crewName); where.push(`sl.crew_name = $${params.length}`) }
    if (start) { params.push(start); where.push(`sl.created_at >= $${params.length}::date`) }
    if (end) { params.push(end); where.push(`sl.created_at < ($${params.length}::date + interval '1 day')`) }

    const whereStr = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''
    params.push(limit)

    const result = await db.query(`
      SELECT sl.*,
        COALESCE((SELECT json_agg(json_build_object('id',slp.id,'chemicalName',slp.chemical_name,'epa',slp.epa,'amount',slp.amount))
          FROM spray_log_products slp WHERE slp.spray_log_id = sl.id), '[]') AS products,
        COALESCE((SELECT json_agg(json_build_object('id',ph.id,'filename',ph.filename,'originalName',ph.original_name))
          FROM spray_log_photos ph WHERE ph.spray_log_id = sl.id), '[]') AS photos,
        COALESCE((SELECT json_agg(json_build_object('id',sm.id,'employeeId',sm.employee_id,'name',sm.employee_name))
          FROM spray_log_members sm WHERE sm.spray_log_id = sl.id), '[]') AS members
      FROM spray_logs sl ${whereStr}
      ORDER BY sl.created_at DESC
      LIMIT $${params.length}`, params)

    res.json(result.rows.map(row => ({
      id: row.id, crewName: row.crew_name, crewLead: row.crew_lead, license: row.license,
      property: row.property, location: row.location, equipment: row.equipment_name,
      totalMixVol: row.total_mix_vol, targetPest: row.target_pest, notes: row.notes,
      date: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date(row.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      weather: {
        temp: row.wx_temp, humidity: row.wx_humidity, windSpeed: row.wx_wind_speed,
        windDir: row.wx_wind_dir, conditions: row.wx_conditions,
      },
      products: (row.products || []).filter(p => p.id !== null).map(p => ({ name: p.chemicalName, epa: p.epa, ozConcentrate: p.amount })),
      photos: (row.photos || []).filter(p => p.id !== null),
      members: (row.members || []).filter(m => m.id !== null),
      status: 'synced',
    })))
  }))

  /** @route DELETE /api/spray-logs/:id — Hard-delete a spray log (cascades) */
  router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    await db.query('DELETE FROM spray_logs WHERE id = $1', [req.params.id])
    res.json({ success: true })
  }))

  return router
}
// ═══════════════════════════════════════════
// Route Routes — Admin management + Crew daily workflow
// Static paths before /:id to prevent Express mis-matching.
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam } from '../middleware/validate.js'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function routeRoutes(upload) {
  const router = Router()

  // ═══════════════════════════════════════════
  // STATIC PATHS FIRST
  // ═══════════════════════════════════════════

  // ── Admin: Work log (all completions with filters) ──
  router.get('/completions/log', requireAuth, async (req, res) => {
    try {
      const { start, end, crewId, routeId, limit = 200 } = req.query
      const where = []
      const params = []

      if (start) { params.push(start); where.push(`rc.work_date >= $${params.length}`) }
      if (end) { params.push(end); where.push(`rc.work_date <= $${params.length}`) }
      if (crewId) { params.push(crewId); where.push(`r.crew_id = $${params.length}`) }
      if (routeId) { params.push(routeId); where.push(`rc.route_id = $${params.length}`) }

      const whereStr = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''
      params.push(limit)

      const result = await db.query(`
        SELECT rc.*,
          r.name AS route_name, r.color AS route_color, r.crew_id,
          c.name AS crew_name,
          a.name AS account_name, a.address AS account_address, a.city AS account_city,
          COALESCE((SELECT json_agg(json_build_object('id', fn.id, 'filename', fn.filename, 'originalName', fn.original_name, 'noteText', fn.note_text))
            FROM field_notes fn WHERE fn.route_completion_id = rc.id), '[]') AS field_notes
        FROM route_completions rc
        JOIN routes r ON r.id = rc.route_id
        LEFT JOIN crews c ON c.id = r.crew_id
        JOIN route_stops rs ON rs.id = rc.route_stop_id
        JOIN accounts a ON a.id = rs.account_id
        ${whereStr}
        ORDER BY rc.work_date DESC, rc.completed_at DESC
        LIMIT $${params.length}
      `, params)

      res.json(result.rows.map(row => ({
        id: row.id,
        routeId: row.route_id,
        routeName: row.route_name,
        routeColor: row.route_color,
        crewId: row.crew_id,
        crewName: row.crew_name,
        accountName: row.account_name,
        accountAddress: row.account_address,
        accountCity: row.account_city,
        completedByName: row.completed_by_name,
        workDate: row.work_date,
        completedAt: row.completed_at,
        status: row.status,
        notes: row.notes,
        timeSpentMinutes: row.time_spent_minutes,
        latitude: row.latitude,
        longitude: row.longitude,
        fieldNotes: (row.field_notes || []).filter(fn => fn.id !== null),
      })))
    } catch (e) {
      console.error('GET /routes/completions/log error:', e)
      res.status(500).json({ error: 'Server error' })
    }
  })

  router.get('/schedule/week', requireAuth, async (req, res) => {
    try {
      const result = await db.query(`
        SELECT r.id, r.name, r.day_of_week, r.color, r.crew_id, c.name AS crew_name,
          (SELECT COUNT(*) FROM route_stops rs WHERE rs.route_id = r.id AND rs.active = true) AS stop_count
        FROM routes r LEFT JOIN crews c ON c.id = r.crew_id WHERE r.active = true
        ORDER BY r.day_of_week ASC NULLS LAST, c.name ASC, r.name ASC
      `)
      const schedule = {}
      for (let d = 0; d < 7; d++) schedule[d] = { day: d, dayName: DAY_NAMES[d], routes: [] }
      schedule['unscheduled'] = { day: null, dayName: 'Unscheduled', routes: [] }
      for (const row of result.rows) {
        const key = row.day_of_week !== null ? row.day_of_week : 'unscheduled'
        schedule[key].routes.push({ id: row.id, name: row.name, color: row.color, crewId: row.crew_id, crewName: row.crew_name, stopCount: parseInt(row.stop_count) })
      }
      res.json(Object.values(schedule))
    } catch (e) { console.error('GET /routes/schedule/week error:', e); res.status(500).json({ error: 'Server error' }) }
  })

  router.get('/schedule/daily-progress', requireAuth, async (req, res) => {
    try {
      const date = req.query.date || new Date().toLocaleDateString('en-CA')
      const dayOfWeek = new Date(date + 'T12:00:00').getDay()
      const result = await db.query(`
        SELECT r.id, r.name, r.color, r.crew_id, c.name AS crew_name,
          (SELECT COUNT(*) FROM route_stops rs WHERE rs.route_id = r.id AND rs.active = true) AS total_stops,
          (SELECT COUNT(*) FROM route_completions rc JOIN route_stops rs2 ON rs2.id = rc.route_stop_id
           WHERE rc.route_id = r.id AND rc.work_date = $1 AND rc.status = 'complete') AS completed_stops
        FROM routes r LEFT JOIN crews c ON c.id = r.crew_id
        WHERE r.active = true AND r.day_of_week = $2
        ORDER BY c.name ASC, r.name ASC
      `, [date, dayOfWeek])
      res.json(result.rows.map(row => ({
        id: row.id, name: row.name, color: row.color, crewId: row.crew_id, crewName: row.crew_name,
        totalStops: parseInt(row.total_stops), completedStops: parseInt(row.completed_stops),
      })))
    } catch (e) { console.error('GET /routes/schedule/daily-progress error:', e); res.status(500).json({ error: 'Server error' }) }
  })

  router.get('/crew/:crewId', requireAuth, async (req, res) => {
    try {
      const crewId = parseInt(req.params.crewId, 10)
      if (isNaN(crewId) || crewId < 1) return res.status(400).json({ error: 'Invalid crew ID' })
      const result = await db.query(`
        SELECT r.*, (SELECT COUNT(*) FROM route_stops rs WHERE rs.route_id = r.id AND rs.active = true) AS stop_count,
          (SELECT COALESCE(SUM(rs.estimated_minutes), 0) FROM route_stops rs WHERE rs.route_id = r.id AND rs.active = true) AS total_minutes
        FROM routes r WHERE r.crew_id = $1 AND r.active = true
        ORDER BY r.day_of_week ASC NULLS LAST, r.name ASC
      `, [crewId])
      res.json(result.rows.map(formatRoute))
    } catch (e) { console.error('GET /routes/crew/:crewId error:', e); res.status(500).json({ error: 'Server error' }) }
  })

  router.post('/completions', requireAuth,
    validateBody({ routeStopId: { required: true, type: 'number' }, routeId: { required: true, type: 'number' }, completedByName: { required: true, type: 'string' } }),
    async (req, res) => {
      try {
        const { routeStopId, routeId, completedById, completedByName, status, notes, latitude, longitude, workDate, timeSpentMinutes } = req.body
        const date = workDate || new Date().toLocaleDateString('en-CA')
        const result = await db.query(
          `INSERT INTO route_completions (route_stop_id, route_id, completed_by_id, completed_by_name, work_date, completed_at, status, notes, latitude, longitude, time_spent_minutes)
           VALUES ($1,$2,$3,$4,$5,NOW(),$6,$7,$8,$9,$10)
           ON CONFLICT (route_stop_id, work_date) DO UPDATE SET
             status = $6, notes = $7, latitude = $8, longitude = $9, completed_at = NOW(), completed_by_id = $3, completed_by_name = $4, time_spent_minutes = $10
           RETURNING *`,
          [routeStopId, routeId, completedById || null, completedByName, date, status || 'complete', notes || null, latitude || null, longitude || null, timeSpentMinutes || null])
        res.json(formatCompletion(result.rows[0]))
      } catch (e) { console.error('POST /routes/completions error:', e); res.status(500).json({ error: 'Failed to save completion' }) }
    })

  router.delete('/completions/:completionId', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.completionId, 10)
      if (isNaN(id) || id < 1) return res.status(400).json({ error: 'Invalid ID' })
      await db.query('DELETE FROM field_notes WHERE route_completion_id = $1', [id])
      await db.query('DELETE FROM route_completions WHERE id = $1', [id])
      res.json({ success: true })
    } catch (e) { console.error('DELETE /routes/completions/:id error:', e); res.status(500).json({ error: 'Failed to undo' }) }
  })

  router.post('/completions/:completionId/photos', requireAuth, upload.array('photos', 10), async (req, res) => {
    try {
      const completionId = parseInt(req.params.completionId, 10)
      if (isNaN(completionId) || completionId < 1) return res.status(400).json({ error: 'Invalid ID' })
      const saved = []
      for (const f of req.files) {
        const r = await db.query(
          `INSERT INTO field_notes (route_completion_id, filename, original_name, mime_type, size_bytes, note_text)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, filename, original_name, note_text`,
          [completionId, f.filename, f.originalname, f.mimetype, f.size, req.body.noteText || null])
        saved.push(r.rows[0])
      }
      res.json(saved)
    } catch (e) { console.error('POST /routes/completions/:id/photos error:', e); res.status(500).json({ error: 'Upload failed' }) }
  })

  // ═══════════════════════════════════════════
  // PARAMETERIZED PATHS
  // ═══════════════════════════════════════════

  router.get('/', requireAuth, async (req, res) => {
    try {
      const { crewId, dayOfWeek } = req.query
      const where = ['r.active = true']; const params = []
      if (crewId) { params.push(crewId); where.push(`r.crew_id = $${params.length}`) }
      if (dayOfWeek !== undefined) { params.push(dayOfWeek); where.push(`r.day_of_week = $${params.length}`) }
      const result = await db.query(`
        SELECT r.*, c.name AS crew_name,
          (SELECT COUNT(*) FROM route_stops rs WHERE rs.route_id = r.id AND rs.active = true) AS stop_count,
          (SELECT COALESCE(SUM(rs.estimated_minutes), 0) FROM route_stops rs WHERE rs.route_id = r.id AND rs.active = true) AS total_minutes
        FROM routes r LEFT JOIN crews c ON c.id = r.crew_id WHERE ${where.join(' AND ')}
        ORDER BY r.day_of_week ASC NULLS LAST, r.name ASC
      `, params)
      res.json(result.rows.map(formatRoute))
    } catch (e) { console.error('GET /routes error:', e); res.status(500).json({ error: 'Server error' }) }
  })

  router.post('/', requireAuth, validateBody({ name: { required: true, type: 'string', maxLength: 200 } }), async (req, res) => {
    try {
      const { name, crewId, dayOfWeek, color, notes } = req.body
      const result = await db.query('INSERT INTO routes (name, crew_id, day_of_week, color, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *',
        [name, crewId || null, dayOfWeek !== undefined ? dayOfWeek : null, color || '#2D7A3A', notes || null])
      res.json(formatRoute(result.rows[0]))
    } catch (e) { console.error('POST /routes error:', e); res.status(500).json({ error: 'Failed to create route' }) }
  })

  router.get('/:id', requireAuth, validateIdParam, async (req, res) => {
    try {
      const routeR = await db.query('SELECT r.*, c.name AS crew_name FROM routes r LEFT JOIN crews c ON c.id = r.crew_id WHERE r.id = $1 AND r.active = true', [req.params.id])
      if (routeR.rows.length === 0) return res.status(404).json({ error: 'Route not found' })
      const stopsR = await db.query(`
        SELECT rs.*, a.name AS account_name, a.address, a.city, a.state, a.zip,
          a.latitude, a.longitude, a.contact_name, a.contact_phone, a.notes AS account_notes
        FROM route_stops rs JOIN accounts a ON a.id = rs.account_id
        WHERE rs.route_id = $1 AND rs.active = true ORDER BY rs.stop_order ASC
      `, [req.params.id])
      const route = formatRoute(routeR.rows[0])
      route.stops = stopsR.rows.map(formatStop)
      res.json(route)
    } catch (e) { console.error('GET /routes/:id error:', e); res.status(500).json({ error: 'Server error' }) }
  })

  router.put('/:id', requireAuth, validateIdParam, async (req, res) => {
    try {
      const { name, crewId, dayOfWeek, color, notes } = req.body
      await db.query('UPDATE routes SET name=$1, crew_id=$2, day_of_week=$3, color=$4, notes=$5 WHERE id=$6',
        [name, crewId || null, dayOfWeek !== undefined ? dayOfWeek : null, color || '#2D7A3A', notes || null, req.params.id])
      res.json({ success: true })
    } catch (e) { console.error('PUT /routes/:id error:', e); res.status(500).json({ error: 'Failed to update' }) }
  })

  router.delete('/:id', requireAuth, validateIdParam, async (req, res) => {
    try { await db.query('UPDATE routes SET active = false WHERE id = $1', [req.params.id]); res.json({ success: true }) }
    catch (e) { console.error('DELETE /routes/:id error:', e); res.status(500).json({ error: 'Failed to delete' }) }
  })

  router.get('/:id/day/:date', requireAuth, validateIdParam, async (req, res) => {
    try {
      const routeR = await db.query('SELECT r.*, c.name AS crew_name FROM routes r LEFT JOIN crews c ON c.id = r.crew_id WHERE r.id = $1 AND r.active = true', [req.params.id])
      if (routeR.rows.length === 0) return res.status(404).json({ error: 'Route not found' })
      const stopsR = await db.query(`
        SELECT rs.*, a.name AS account_name, a.address, a.city, a.state, a.zip,
          a.latitude, a.longitude, a.contact_name, a.contact_phone, a.notes AS account_notes,
          rc.id AS completion_id, rc.status AS completion_status, rc.completed_at,
          rc.completed_by_name, rc.notes AS completion_notes, rc.time_spent_minutes,
          (SELECT json_agg(json_build_object('id', fn.id, 'filename', fn.filename, 'originalName', fn.original_name, 'noteText', fn.note_text))
           FROM field_notes fn WHERE fn.route_completion_id = rc.id) AS field_notes
        FROM route_stops rs JOIN accounts a ON a.id = rs.account_id
        LEFT JOIN route_completions rc ON rc.route_stop_id = rs.id AND rc.work_date = $2
        WHERE rs.route_id = $1 AND rs.active = true ORDER BY rs.stop_order ASC
      `, [req.params.id, req.params.date])
      const route = formatRoute(routeR.rows[0])
      route.stops = stopsR.rows.map(row => ({
        ...formatStop(row),
        completion: row.completion_id ? {
          id: row.completion_id, status: row.completion_status, completedAt: row.completed_at,
          completedByName: row.completed_by_name, notes: row.completion_notes, timeSpentMinutes: row.time_spent_minutes,
          fieldNotes: (row.field_notes || []).filter(fn => fn.id !== null),
        } : null,
      }))
      route.progress = { completed: route.stops.filter(s => s.completion).length, total: route.stops.length }
      res.json(route)
    } catch (e) { console.error('GET /routes/:id/day/:date error:', e); res.status(500).json({ error: 'Server error' }) }
  })

  router.post('/:id/stops', requireAuth, validateIdParam, validateBody({ accountId: { required: true, type: 'number' } }), async (req, res) => {
    try {
      const { accountId, estimatedMinutes, notes } = req.body
      const maxR = await db.query('SELECT COALESCE(MAX(stop_order), -1) + 1 AS next_order FROM route_stops WHERE route_id = $1 AND active = true', [req.params.id])
      const result = await db.query(
        `INSERT INTO route_stops (route_id, account_id, stop_order, estimated_minutes, notes) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (route_id, account_id) DO UPDATE SET active = true, stop_order = $3, estimated_minutes = $4, notes = $5 RETURNING *`,
        [req.params.id, accountId, maxR.rows[0].next_order, estimatedMinutes || 30, notes || null])
      res.json(result.rows[0])
    } catch (e) { console.error('POST /routes/:id/stops error:', e); res.status(500).json({ error: 'Failed to add stop' }) }
  })

  router.put('/:id/stops/:stopId', requireAuth, validateIdParam, async (req, res) => {
    try {
      const stopId = parseInt(req.params.stopId, 10)
      if (isNaN(stopId) || stopId < 1) return res.status(400).json({ error: 'Invalid stop ID' })
      await db.query('UPDATE route_stops SET estimated_minutes = $1, notes = $2 WHERE id = $3 AND route_id = $4', [req.body.estimatedMinutes || 30, req.body.notes || null, stopId, req.params.id])
      res.json({ success: true })
    } catch (e) { console.error('PUT /routes/:id/stops/:stopId error:', e); res.status(500).json({ error: 'Failed to update stop' }) }
  })

  router.delete('/:id/stops/:stopId', requireAuth, validateIdParam, async (req, res) => {
    try {
      const stopId = parseInt(req.params.stopId, 10)
      if (isNaN(stopId) || stopId < 1) return res.status(400).json({ error: 'Invalid stop ID' })
      await db.query('UPDATE route_stops SET active = false WHERE id = $1 AND route_id = $2', [stopId, req.params.id])
      res.json({ success: true })
    } catch (e) { console.error('DELETE /routes/:id/stops/:stopId error:', e); res.status(500).json({ error: 'Failed to remove stop' }) }
  })

  router.put('/:id/stops-order', requireAuth, validateIdParam, async (req, res) => {
    try {
      const { stopIds } = req.body
      if (!Array.isArray(stopIds)) return res.status(400).json({ error: 'stopIds must be an array' })
      const client = await db.connect()
      try {
        await client.query('BEGIN')
        for (let i = 0; i < stopIds.length; i++) await client.query('UPDATE route_stops SET stop_order = $1 WHERE id = $2 AND route_id = $3', [i, stopIds[i], req.params.id])
        await client.query('COMMIT'); res.json({ success: true })
      } catch (e) { await client.query('ROLLBACK'); throw e }
      finally { client.release() }
    } catch (e) { console.error('PUT /routes/:id/stops-order error:', e); res.status(500).json({ error: 'Failed to reorder' }) }
  })

  return router
}

function formatRoute(row) {
  return { id: row.id, name: row.name, crewId: row.crew_id, crewName: row.crew_name || null,
    dayOfWeek: row.day_of_week, dayName: row.day_of_week !== null ? DAY_NAMES[row.day_of_week] : null,
    color: row.color, notes: row.notes, stopCount: row.stop_count ? parseInt(row.stop_count) : 0,
    totalMinutes: row.total_minutes ? parseInt(row.total_minutes) : 0, createdAt: row.created_at }
}
function formatStop(row) {
  return { id: row.id, routeId: row.route_id, accountId: row.account_id, stopOrder: row.stop_order,
    estimatedMinutes: row.estimated_minutes, notes: row.notes,
    account: { name: row.account_name, address: row.address, city: row.city, state: row.state, zip: row.zip,
      latitude: row.latitude, longitude: row.longitude, contactName: row.contact_name, contactPhone: row.contact_phone, notes: row.account_notes } }
}
function formatCompletion(row) {
  return { id: row.id, routeStopId: row.route_stop_id, routeId: row.route_id, completedById: row.completed_by_id,
    completedByName: row.completed_by_name, workDate: row.work_date, completedAt: row.completed_at,
    status: row.status, notes: row.notes, latitude: row.latitude, longitude: row.longitude, timeSpentMinutes: row.time_spent_minutes }
}
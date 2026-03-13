// ═══════════════════════════════════════════
// Route Routes — Admin management + Crew daily workflow
// Frequency/recurrence lives on route_stops.
// Static paths before /:id to prevent Express mis-matching.
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam, sanitizeQueryInt } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function routeRoutes(upload) {
  const router = Router()

  // ═══════════════════════════════════════════
  // STATIC PATHS FIRST
  // ═══════════════════════════════════════════

  // ── Admin: Work log (all completions with filters) ──
  router.get('/completions/log', requireAuth, asyncHandler(async (req, res) => {
    const { start, end, crewId, routeId } = req.query
    const limit = sanitizeQueryInt(req.query.limit, 200, 1, 500)
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
      id: row.id, routeId: row.route_id, routeName: row.route_name, routeColor: row.route_color,
      crewId: row.crew_id, crewName: row.crew_name, accountName: row.account_name,
      accountAddress: row.account_address, accountCity: row.account_city,
      completedByName: row.completed_by_name, workDate: row.work_date, completedAt: row.completed_at,
      status: row.status, notes: row.notes, timeSpentMinutes: row.time_spent_minutes,
      latitude: row.latitude, longitude: row.longitude,
      fieldNotes: (row.field_notes || []).filter(fn => fn.id !== null),
    })))
  }))

  router.get('/schedule/week', requireAuth, asyncHandler(async (req, res) => {
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
  }))

  router.get('/schedule/daily-progress', requireAuth, asyncHandler(async (req, res) => {
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
  }))

  // ── Calculated visits for a date range (frequency-aware) ──
  router.get('/schedule/visits', requireAuth, asyncHandler(async (req, res) => {
    const { start, end, crewId } = req.query
    if (!start || !end) return res.status(400).json({ error: 'start and end required' })

    // Get all active routes with their stops + exceptions
    const routesR = await db.query(`
      SELECT r.id AS route_id, r.name AS route_name, r.color AS route_color,
        r.day_of_week, r.crew_id, c.name AS crew_name,
        rs.id AS stop_id, rs.account_id, rs.stop_order,
        rs.frequency, rs.interval_weeks, rs.season_start, rs.season_end,
        rs.service_status, rs.start_date AS stop_start_date, rs.end_date AS stop_end_date,
        a.name AS account_name, a.address, a.city,
        a.estimated_minutes AS account_estimated_minutes,
        COALESCE((SELECT json_agg(json_build_object(
          'id', se.id, 'type', se.exception_type, 'dateStart', se.date_start,
          'dateEnd', se.date_end, 'reason', se.reason
        )) FROM stop_exceptions se WHERE se.route_stop_id = rs.id), '[]') AS exceptions
      FROM routes r
      JOIN route_stops rs ON rs.route_id = r.id AND rs.active = true
      JOIN accounts a ON a.id = rs.account_id
      LEFT JOIN crews c ON c.id = r.crew_id
      WHERE r.active = true AND r.day_of_week IS NOT NULL
      ORDER BY r.day_of_week, rs.stop_order
    `)

    let rows = routesR.rows
    if (crewId) rows = rows.filter(r => r.crew_id && String(r.crew_id) === String(crewId))

    const startDate = new Date(start + 'T12:00:00')
    const endDate = new Date(end + 'T12:00:00')
    const visits = []

    // Walk each day in the range
    const current = new Date(startDate)
    while (current <= endDate) {
      const dateStr = current.toLocaleDateString('en-CA')
      const dow = current.getDay()

      // Get stops for routes assigned to this day of week
      const dayStops = rows.filter(r => r.day_of_week === dow)

      for (const stop of dayStops) {
        if (stop.service_status === 'canceled') continue
        if (stop.service_status === 'paused') continue

        // Date range check
        const stopStart = stop.stop_start_date ? new Date(stop.stop_start_date + 'T12:00:00') : new Date('2000-01-01')
        const stopEnd = stop.stop_end_date ? new Date(stop.stop_end_date + 'T12:00:00') : new Date('2099-12-31')
        if (current < stopStart || current > stopEnd) continue

        // Seasonal check
        if (stop.season_start && stop.season_end) {
          const md = `${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`
          if (stop.season_start <= stop.season_end) {
            if (md < stop.season_start || md > stop.season_end) continue
          } else {
            if (md < stop.season_start && md > stop.season_end) continue
          }
        }

        // Frequency check
        const interval = stop.interval_weeks || 1
        if (interval > 1) {
          const epoch = stop.stop_start_date ? new Date(stop.stop_start_date + 'T12:00:00') : new Date('2024-01-01T12:00:00')
          const msPerWeek = 7 * 24 * 60 * 60 * 1000
          const weeksSinceEpoch = Math.floor((current.getTime() - epoch.getTime()) / msPerWeek)
          if (weeksSinceEpoch % interval !== 0) continue
        }

        // Exception check
        const exceptions = (stop.exceptions || []).filter(e => e.id !== null)
        const exception = findException(exceptions, dateStr)

        visits.push({
          stopId: stop.stop_id,
          routeId: stop.route_id,
          routeName: stop.route_name,
          routeColor: stop.route_color,
          accountId: stop.account_id,
          accountName: stop.account_name,
          accountAddress: stop.address,
          accountCity: stop.city,
          estimatedMinutes: stop.account_estimated_minutes || 30,
          date: dateStr,
          dayOfWeek: dow,
          dayName: DAY_NAMES[dow],
          frequency: stop.frequency,
          intervalWeeks: stop.interval_weeks,
          status: exception ? (exception.type === 'skip' ? 'skipped' : 'paused') : 'scheduled',
          exceptionReason: exception?.reason || null,
        })
      }

      current.setDate(current.getDate() + 1)
    }

    visits.sort((a, b) => a.date.localeCompare(b.date) || a.routeName.localeCompare(b.routeName) || a.accountName.localeCompare(b.accountName))
    res.json(visits)
  }))

  router.get('/crew/:crewId', requireAuth, asyncHandler(async (req, res) => {
    const crewId = parseInt(req.params.crewId, 10)
    if (isNaN(crewId) || crewId < 1) return res.status(400).json({ error: 'Invalid crew ID' })
    const result = await db.query(`
      SELECT r.*, (SELECT COUNT(*) FROM route_stops rs WHERE rs.route_id = r.id AND rs.active = true) AS stop_count,
        (SELECT COALESCE(SUM(rs.estimated_minutes), 0) FROM route_stops rs WHERE rs.route_id = r.id AND rs.active = true) AS total_minutes
      FROM routes r WHERE r.crew_id = $1 AND r.active = true
      ORDER BY r.day_of_week ASC NULLS LAST, r.name ASC
    `, [crewId])
    res.json(result.rows.map(formatRoute))
  }))

  router.post('/completions', requireAuth,
    validateBody({ routeStopId: { required: true, type: 'number' }, routeId: { required: true, type: 'number' }, completedByName: { required: true, type: 'string' } }),
    asyncHandler(async (req, res) => {
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
    }))

  router.delete('/completions/:completionId', requireAuth, asyncHandler(async (req, res) => {
    const id = parseInt(req.params.completionId, 10)
    if (isNaN(id) || id < 1) return res.status(400).json({ error: 'Invalid ID' })
    await db.query('DELETE FROM field_notes WHERE route_completion_id = $1', [id])
    await db.query('DELETE FROM route_completions WHERE id = $1', [id])
    res.json({ success: true })
  }))

  router.post('/completions/:completionId/photos', requireAuth, upload.array('photos', 10), asyncHandler(async (req, res) => {
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
  }))

  // ═══════════════════════════════════════════
  // PARAMETERIZED PATHS
  // ═══════════════════════════════════════════

  router.get('/', requireAuth, asyncHandler(async (req, res) => {
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
  }))

  router.post('/', requireAuth, validateBody({ name: { required: true, type: 'string', maxLength: 200 } }), asyncHandler(async (req, res) => {
    const { name, crewId, dayOfWeek, color, notes } = req.body
    const result = await db.query('INSERT INTO routes (name, crew_id, day_of_week, color, notes) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, crewId || null, dayOfWeek !== undefined ? dayOfWeek : null, color || '#2D7A3A', notes || null])
    res.json(formatRoute(result.rows[0]))
  }))

  router.get('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    const routeR = await db.query('SELECT r.*, c.name AS crew_name FROM routes r LEFT JOIN crews c ON c.id = r.crew_id WHERE r.id = $1 AND r.active = true', [req.params.id])
    if (routeR.rows.length === 0) return res.status(404).json({ error: 'Route not found' })
    const stopsR = await db.query(`
      SELECT rs.*, a.name AS account_name, a.address, a.city, a.state, a.zip,
        a.latitude, a.longitude, a.contact_name, a.contact_phone, a.notes AS account_notes,
        a.estimated_minutes AS account_estimated_minutes
      FROM route_stops rs JOIN accounts a ON a.id = rs.account_id
      WHERE rs.route_id = $1 AND rs.active = true ORDER BY rs.stop_order ASC
    `, [req.params.id])
    const route = formatRoute(routeR.rows[0])
    route.stops = stopsR.rows.map(formatStop)
    res.json(route)
  }))

  router.put('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    const { name, crewId, dayOfWeek, color, notes } = req.body
    await db.query('UPDATE routes SET name=$1, crew_id=$2, day_of_week=$3, color=$4, notes=$5 WHERE id=$6',
      [name, crewId || null, dayOfWeek !== undefined ? dayOfWeek : null, color || '#2D7A3A', notes || null, req.params.id])
    res.json({ success: true })
  }))

  router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    await db.query('UPDATE routes SET active = false WHERE id = $1', [req.params.id])
    res.json({ success: true })
  }))

  router.get('/:id/day/:date', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    const routeR = await db.query('SELECT r.*, c.name AS crew_name FROM routes r LEFT JOIN crews c ON c.id = r.crew_id WHERE r.id = $1 AND r.active = true', [req.params.id])
    if (routeR.rows.length === 0) return res.status(404).json({ error: 'Route not found' })
    const stopsR = await db.query(`
      SELECT rs.*, a.name AS account_name, a.address, a.city, a.state, a.zip,
        a.latitude, a.longitude, a.contact_name, a.contact_phone, a.notes AS account_notes,
        a.estimated_minutes AS account_estimated_minutes,
        rc.id AS completion_id, rc.status AS completion_status, rc.completed_at,
        rc.completed_by_name, rc.notes AS completion_notes, rc.time_spent_minutes,
        (SELECT json_agg(json_build_object('id', fn.id, 'filename', fn.filename, 'originalName', fn.original_name, 'noteText', fn.note_text))
         FROM field_notes fn WHERE fn.route_completion_id = rc.id) AS field_notes
      FROM route_stops rs JOIN accounts a ON a.id = rs.account_id
      LEFT JOIN route_completions rc ON rc.route_stop_id = rs.id AND rc.work_date = $2
      WHERE rs.route_id = $1 AND rs.active = true ORDER BY rs.stop_order ASC
    `, [req.params.id, req.params.date])
    const route = formatRoute(routeR.rows[0])

    // Filter stops by frequency for this specific date
    const dateObj = new Date(req.params.date + 'T12:00:00')
    route.stops = stopsR.rows.map(row => ({
      ...formatStop(row),
      completion: row.completion_id ? {
        id: row.completion_id, status: row.completion_status, completedAt: row.completed_at,
        completedByName: row.completed_by_name, notes: row.completion_notes, timeSpentMinutes: row.time_spent_minutes,
        fieldNotes: (row.field_notes || []).filter(fn => fn.id !== null),
      } : null,
    })).filter(stop => isStopDueOnDate(stop, dateObj, req.params.date))

    route.progress = { completed: route.stops.filter(s => s.completion).length, total: route.stops.length }
    res.json(route)
  }))

  // ── Stop CRUD ──
  router.post('/:id/stops', requireAuth, validateIdParam, validateBody({ accountId: { required: true, type: 'number' } }), asyncHandler(async (req, res) => {
    const { accountId, estimatedMinutes, notes, frequency, intervalWeeks, seasonStart, seasonEnd } = req.body
    const maxR = await db.query('SELECT COALESCE(MAX(stop_order), -1) + 1 AS next_order FROM route_stops WHERE route_id = $1 AND active = true', [req.params.id])
    const result = await db.query(
      `INSERT INTO route_stops (route_id, account_id, stop_order, estimated_minutes, notes, frequency, interval_weeks, season_start, season_end)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (route_id, account_id) DO UPDATE SET active = true, stop_order = $3, estimated_minutes = $4, notes = $5,
         frequency = $6, interval_weeks = $7, season_start = $8, season_end = $9
       RETURNING *`,
      [req.params.id, accountId, maxR.rows[0].next_order, estimatedMinutes || 30, notes || null,
       frequency || 'weekly', intervalWeeks || 1, seasonStart || null, seasonEnd || null])
    res.json(result.rows[0])
  }))

  router.put('/:id/stops/:stopId', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    const stopId = parseInt(req.params.stopId, 10)
    if (isNaN(stopId) || stopId < 1) return res.status(400).json({ error: 'Invalid stop ID' })
    const { estimatedMinutes, notes, frequency, intervalWeeks, seasonStart, seasonEnd, serviceStatus, startDate, endDate } = req.body
    await db.query(
      `UPDATE route_stops SET estimated_minutes = COALESCE($1, estimated_minutes), notes = $2,
       frequency = COALESCE($3, frequency), interval_weeks = COALESCE($4, interval_weeks),
       season_start = $5, season_end = $6, service_status = COALESCE($7, service_status),
       start_date = COALESCE($8, start_date), end_date = $9
       WHERE id = $10 AND route_id = $11`,
      [estimatedMinutes || null, notes !== undefined ? notes : null,
       frequency || null, intervalWeeks || null,
       seasonStart || null, seasonEnd || null, serviceStatus || null,
       startDate || null, endDate || null,
       stopId, req.params.id])
    res.json({ success: true })
  }))

  router.delete('/:id/stops/:stopId', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    const stopId = parseInt(req.params.stopId, 10)
    if (isNaN(stopId) || stopId < 1) return res.status(400).json({ error: 'Invalid stop ID' })
    await db.query('UPDATE route_stops SET active = false WHERE id = $1 AND route_id = $2', [stopId, req.params.id])
    res.json({ success: true })
  }))

  router.put('/:id/stops-order', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    const { stopIds } = req.body
    if (!Array.isArray(stopIds)) return res.status(400).json({ error: 'stopIds must be an array' })
    const client = await db.connect()
    try {
      await client.query('BEGIN')
      for (let i = 0; i < stopIds.length; i++) await client.query('UPDATE route_stops SET stop_order = $1 WHERE id = $2 AND route_id = $3', [i, stopIds[i], req.params.id])
      await client.query('COMMIT'); res.json({ success: true })
    } catch (e) { await client.query('ROLLBACK'); throw e }
    finally { client.release() }
  }))

  // ── Stop Exceptions (skip / pause) ──
  router.post('/:id/stops/:stopId/exceptions', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    const stopId = parseInt(req.params.stopId, 10)
    if (isNaN(stopId) || stopId < 1) return res.status(400).json({ error: 'Invalid stop ID' })
    const { exceptionType, dateStart, dateEnd, reason } = req.body
    if (!exceptionType || !dateStart) return res.status(400).json({ error: 'exceptionType and dateStart required' })
    const result = await db.query(
      `INSERT INTO stop_exceptions (route_stop_id, exception_type, date_start, date_end, reason)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [stopId, exceptionType, dateStart, dateEnd || null, reason || null])
    res.json({ id: result.rows[0].id, type: result.rows[0].exception_type,
      dateStart: result.rows[0].date_start, dateEnd: result.rows[0].date_end, reason: result.rows[0].reason })
  }))

  router.delete('/:id/stops/:stopId/exceptions/:exceptionId', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    const exId = parseInt(req.params.exceptionId, 10)
    if (isNaN(exId) || exId < 1) return res.status(400).json({ error: 'Invalid exception ID' })
    await db.query('DELETE FROM stop_exceptions WHERE id = $1 AND route_stop_id = $2', [exId, req.params.stopId])
    res.json({ success: true })
  }))

  return router
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function isStopDueOnDate(stop, dateObj, dateStr) {
  // Status check
  if (stop.serviceStatus === 'canceled' || stop.serviceStatus === 'paused') return false

  // Date range check
  if (stop.startDate) {
    const sd = new Date(stop.startDate + 'T12:00:00')
    if (dateObj < sd) return false
  }
  if (stop.endDate) {
    const ed = new Date(stop.endDate + 'T12:00:00')
    if (dateObj > ed) return false
  }

  // Seasonal check
  if (stop.seasonStart && stop.seasonEnd) {
    const md = `${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
    if (stop.seasonStart <= stop.seasonEnd) {
      if (md < stop.seasonStart || md > stop.seasonEnd) return false
    } else {
      if (md < stop.seasonStart && md > stop.seasonEnd) return false
    }
  }

  // Frequency / interval check
  const interval = stop.intervalWeeks || 1
  if (interval > 1) {
    const epoch = stop.startDate ? new Date(stop.startDate + 'T12:00:00') : new Date('2024-01-01T12:00:00')
    const msPerWeek = 7 * 24 * 60 * 60 * 1000
    const weeksSinceEpoch = Math.floor((dateObj.getTime() - epoch.getTime()) / msPerWeek)
    if (weeksSinceEpoch % interval !== 0) return false
  }

  return true
}

function findException(exceptions, dateStr) {
  for (const ex of exceptions) {
    const exStart = (ex.dateStart || '').split('T')[0]
    const exEnd = (ex.dateEnd || '').split('T')[0]
    if (ex.type === 'skip' && exStart === dateStr) return ex
    if (ex.type === 'pause' && exStart <= dateStr && (!exEnd || exEnd >= dateStr)) return ex
  }
  return null
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
    frequency: row.frequency || 'weekly', intervalWeeks: row.interval_weeks || 1,
    seasonStart: row.season_start, seasonEnd: row.season_end,
    serviceStatus: row.service_status || 'active',
    startDate: row.start_date, endDate: row.end_date,
    account: { id: row.account_id, name: row.account_name, address: row.address, city: row.city, state: row.state, zip: row.zip,
      latitude: row.latitude, longitude: row.longitude, contactName: row.contact_name, contactPhone: row.contact_phone,
      notes: row.account_notes, estimatedMinutes: row.account_estimated_minutes || 30 } }
}

function formatCompletion(row) {
  return { id: row.id, routeStopId: row.route_stop_id, routeId: row.route_id, completedById: row.completed_by_id,
    completedByName: row.completed_by_name, workDate: row.work_date, completedAt: row.completed_at,
    status: row.status, notes: row.notes, latitude: row.latitude, longitude: row.longitude, timeSpentMinutes: row.time_spent_minutes }
}

// ═══════════════════════════════════════════
// Service Plan Routes — Recurring schedules + exceptions
//
// Visits are calculated on the fly, not stored.
// Only completions create real records.
// Exceptions handle skips and pauses.
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOrgId } from '../utils/db.js'
import { logger } from '../utils/logger.js'
import { DAY_NAMES } from '../constants/index.js'
import { findException } from '../utils/scheduling.js'

const router = Router()

// ═══════════════════════════════════════════
// SERVICE PLAN CRUD
// ═══════════════════════════════════════════

/** @route GET /api/service-plans — List plans (optionally by account or route) */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { accountId, routeId } = req.query
    const params = [orgId]
    const where = ['sp.active = true', `sp.org_id = $${params.length}`]

    if (accountId) { params.push(accountId); where.push(`sp.account_id = $${params.length}`) }
    if (routeId) { params.push(routeId); where.push(`sp.route_id = $${params.length}`) }

    const result = await db.query(`
      SELECT sp.*,
        a.name AS account_name, a.address AS account_address, a.city AS account_city,
        a.estimated_minutes AS account_estimated_minutes,
        r.name AS route_name, r.color AS route_color, r.day_of_week AS route_day,
        COALESCE((SELECT json_agg(json_build_object(
          'id', se.id, 'type', se.exception_type, 'dateStart', se.date_start,
          'dateEnd', se.date_end, 'reason', se.reason
        )) FROM service_exceptions se WHERE se.service_plan_id = sp.id), '[]') AS exceptions
      FROM service_plans sp
      JOIN accounts a ON a.id = sp.account_id
      LEFT JOIN routes r ON r.id = sp.route_id
      WHERE ${where.join(' AND ')}
      ORDER BY a.name ASC, sp.created_at ASC
    `, params)

    res.json(result.rows.map(formatPlan))
}))

/** @route GET /api/service-plans/:id — Get single plan */
router.get('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const result = await db.query(`
      SELECT sp.*,
        a.name AS account_name, a.address AS account_address, a.city AS account_city,
        a.estimated_minutes AS account_estimated_minutes,
        r.name AS route_name, r.color AS route_color, r.day_of_week AS route_day,
        COALESCE((SELECT json_agg(json_build_object(
          'id', se.id, 'type', se.exception_type, 'dateStart', se.date_start,
          'dateEnd', se.date_end, 'reason', se.reason
        )) FROM service_exceptions se WHERE se.service_plan_id = sp.id), '[]') AS exceptions
      FROM service_plans sp
      JOIN accounts a ON a.id = sp.account_id
      LEFT JOIN routes r ON r.id = sp.route_id
      WHERE sp.id = $1 AND sp.active = true AND sp.org_id = $2
    `, [req.params.id, orgId])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    res.json(formatPlan(result.rows[0]))
}))

/** @route POST /api/service-plans — Create plan */
router.post('/', requireAuth,
  validateBody({ accountId: { required: true, type: 'number' }, frequency: { required: true, type: 'string' } }),
  asyncHandler(async (req, res) => {
      const orgId = getOrgId(req)
      const { accountId, frequency, intervalWeeks, preferredDays, routeId, startDate, endDate, seasonStart, seasonEnd, notes } = req.body

      const result = await db.query(
        `INSERT INTO service_plans (account_id, status, frequency, interval_weeks, preferred_days, route_id, start_date, end_date, season_start, season_end, notes, org_id)
         VALUES ($1, 'active', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [
          accountId, frequency, intervalWeeks || getDefaultInterval(frequency),
          preferredDays || [1], routeId || null,
          startDate || new Date().toLocaleDateString('en-CA'), endDate || null,
          seasonStart || null, seasonEnd || null, notes || null,
          orgId,
        ]
      )

      if (routeId) await autoAddStop(routeId, accountId)

      const full = await fetchFullPlan(result.rows[0].id, orgId)
      res.json(full)
  })
)

/** @route PUT /api/service-plans/:id — Update plan */
router.put('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { status, frequency, intervalWeeks, preferredDays, routeId, startDate, endDate, seasonStart, seasonEnd, notes } = req.body

    const old = await db.query('SELECT route_id, account_id FROM service_plans WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
    if (old.rows.length === 0) return res.status(404).json({ error: 'Not found' })
    const oldRouteId = old.rows[0].route_id
    const accountId = old.rows[0].account_id

    await db.query(
      `UPDATE service_plans SET
        status = COALESCE($1, status), frequency = COALESCE($2, frequency),
        interval_weeks = $3, preferred_days = $4,
        route_id = $5, start_date = $6, end_date = $7,
        season_start = $8, season_end = $9, notes = $10, updated_at = NOW()
       WHERE id = $11 AND org_id = $12`,
      [
        status || null, frequency || null,
        intervalWeeks || getDefaultInterval(frequency || 'weekly'),
        preferredDays || [1], routeId || null,
        startDate || null, endDate || null,
        seasonStart || null, seasonEnd || null, notes || null,
        req.params.id, orgId,
      ]
    )

    if (routeId && routeId !== oldRouteId) await autoAddStop(routeId, accountId)

    const full = await fetchFullPlan(req.params.id, orgId)
    res.json(full)
}))

/** @route PATCH /api/service-plans/:id/status — Quick status change (pause / resume / cancel) */
router.patch('/:id/status', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { status } = req.body
    if (!['active', 'paused', 'canceled'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active, paused, or canceled' })
    }
    await db.query('UPDATE service_plans SET status = $1, updated_at = NOW() WHERE id = $2 AND org_id = $3', [status, req.params.id, orgId])

    if (status === 'canceled') {
      await db.query('UPDATE service_plans SET end_date = COALESCE(end_date, CURRENT_DATE) WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
    }

    res.json({ success: true })
}))

/** @route DELETE /api/service-plans/:id — Soft-delete plan */
router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    await db.query('UPDATE service_plans SET active = false, updated_at = NOW() WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
    res.json({ success: true })
}))

// ═══════════════════════════════════════════
// EXCEPTIONS (skip / pause)
// ═══════════════════════════════════════════

/** @route POST /api/service-plans/:id/exceptions — Add exception (skip / pause) */
router.post('/:id/exceptions', requireAuth, validateIdParam,
  validateBody({ exceptionType: { required: true, type: 'string' }, dateStart: { required: true, type: 'string' } }),
  asyncHandler(async (req, res) => {
      const orgId = getOrgId(req)

      // Verify plan belongs to this org
      const check = await db.query('SELECT id FROM service_plans WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
      if (check.rows.length === 0) return res.status(404).json({ error: 'Not found' })

      const { exceptionType, dateStart, dateEnd, reason } = req.body
      const result = await db.query(
        `INSERT INTO service_exceptions (service_plan_id, exception_type, date_start, date_end, reason, org_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [req.params.id, exceptionType, dateStart, dateEnd || null, reason || null, orgId]
      )
      res.json(formatException(result.rows[0]))
  })
)

/** @route DELETE /api/service-plans/:id/exceptions/:exceptionId — Remove exception */
router.delete('/:id/exceptions/:exceptionId', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const exId = parseInt(req.params.exceptionId, 10)
    if (isNaN(exId) || exId < 1) return res.status(400).json({ error: 'Invalid exception ID' })
    await db.query(
      'DELETE FROM service_exceptions WHERE id = $1 AND service_plan_id = $2 AND org_id = $3',
      [exId, req.params.id, orgId]
    )
    res.json({ success: true })
}))

// ═══════════════════════════════════════════
// VISIT CALCULATION — The core engine
// ═══════════════════════════════════════════

/** @route GET /api/service-plans/schedule/visits — Get calculated visits for a date range */
router.get('/schedule/visits', requireAuth, asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { start, end, crewId, routeId } = req.query
    if (!start || !end) return res.status(400).json({ error: 'start and end required' })

    const params = [orgId]
    const where = ["sp.active = true", "sp.status = 'active'", `sp.org_id = $${params.length}`]
    if (routeId) { params.push(routeId); where.push(`sp.route_id = $${params.length}`) }

    const plansR = await db.query(`
      SELECT sp.*,
        a.name AS account_name, a.address AS account_address, a.city AS account_city,
        a.estimated_minutes AS account_estimated_minutes,
        a.contact_name, a.contact_phone,
        r.name AS route_name, r.color AS route_color, r.day_of_week AS route_day, r.crew_id,
        COALESCE((SELECT json_agg(json_build_object(
          'id', se.id, 'type', se.exception_type, 'dateStart', se.date_start, 'dateEnd', se.date_end, 'reason', se.reason
        )) FROM service_exceptions se WHERE se.service_plan_id = sp.id), '[]') AS exceptions
      FROM service_plans sp
      JOIN accounts a ON a.id = sp.account_id
      LEFT JOIN routes r ON r.id = sp.route_id
      WHERE ${where.join(' AND ')}
    `, params)

    let plans = plansR.rows
    if (crewId) {
      plans = plans.filter(p => p.crew_id && String(p.crew_id) === String(crewId))
    }

    const visits = []
    const startDate = new Date(start + 'T12:00:00')
    const endDate = new Date(end + 'T12:00:00')

    for (const plan of plans) {
      const exceptions = (plan.exceptions || []).filter(e => e.id !== null)
      const planStart = plan.start_date ? new Date(plan.start_date + 'T12:00:00') : new Date('2000-01-01')
      const planEnd = plan.end_date ? new Date(plan.end_date + 'T12:00:00') : new Date('2099-12-31')
      const preferredDays = plan.preferred_days || []

      const current = new Date(Math.max(startDate.getTime(), planStart.getTime()))
      while (current <= endDate && current <= planEnd) {
        const dateStr = current.toLocaleDateString('en-CA')
        const dow = current.getDay()

        if (isDueOnDate(plan, current, preferredDays, dow, dateStr)) {
          const exception = findException(exceptions, dateStr)
          const status = exception ? (exception.type === 'skip' ? 'skipped' : 'paused') : 'scheduled'

          visits.push({
            servicePlanId: plan.id,
            accountId: plan.account_id,
            accountName: plan.account_name,
            accountAddress: plan.account_address,
            accountCity: plan.account_city,
            estimatedMinutes: plan.account_estimated_minutes || 30,
            contactName: plan.contact_name,
            contactPhone: plan.contact_phone,
            date: dateStr,
            dayOfWeek: dow,
            dayName: DAY_NAMES[dow],
            routeId: plan.route_id,
            routeName: plan.route_name,
            routeColor: plan.route_color,
            frequency: plan.frequency,
            status,
            exceptionReason: exception?.reason || null,
          })
        }

        current.setDate(current.getDate() + 1)
      }
    }

    visits.sort((a, b) => a.date.localeCompare(b.date) || a.accountName.localeCompare(b.accountName))
    res.json(visits)
}))

/** @route GET /api/service-plans/schedule/today — Visits due today (for field app) */
router.get('/schedule/today', requireAuth, asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const today = new Date().toLocaleDateString('en-CA')
    const { crewId, routeId } = req.query

    const params = [orgId]
    const where = ["sp.active = true", "sp.status = 'active'", `sp.org_id = $${params.length}`]
    if (routeId) { params.push(routeId); where.push(`sp.route_id = $${params.length}`) }

    const plansR = await db.query(`
      SELECT sp.*,
        a.name AS account_name, a.address AS account_address, a.city AS account_city,
        a.estimated_minutes AS account_estimated_minutes,
        a.contact_name, a.contact_phone,
        r.name AS route_name, r.color AS route_color, r.day_of_week AS route_day, r.crew_id,
        COALESCE((SELECT json_agg(json_build_object(
          'id', se.id, 'type', se.exception_type, 'dateStart', se.date_start, 'dateEnd', se.date_end, 'reason', se.reason
        )) FROM service_exceptions se WHERE se.service_plan_id = sp.id), '[]') AS exceptions
      FROM service_plans sp
      JOIN accounts a ON a.id = sp.account_id
      LEFT JOIN routes r ON r.id = sp.route_id
      WHERE ${where.join(' AND ')}
    `, params)

    let plans = plansR.rows
    if (crewId) plans = plans.filter(p => p.crew_id && String(p.crew_id) === String(crewId))

    const todayDate = new Date(today + 'T12:00:00')
    const dow = todayDate.getDay()
    const visits = []

    for (const plan of plans) {
      const exceptions = (plan.exceptions || []).filter(e => e.id !== null)
      const planStart = plan.start_date ? new Date(plan.start_date + 'T12:00:00') : new Date('2000-01-01')
      const planEnd = plan.end_date ? new Date(plan.end_date + 'T12:00:00') : new Date('2099-12-31')
      if (todayDate < planStart || todayDate > planEnd) continue

      if (isDueOnDate(plan, todayDate, plan.preferred_days || [], dow, today)) {
        const exception = findException(exceptions, today)
        if (!exception) {
          visits.push({
            servicePlanId: plan.id,
            accountId: plan.account_id,
            accountName: plan.account_name,
            accountAddress: plan.account_address,
            accountCity: plan.account_city,
            estimatedMinutes: plan.account_estimated_minutes || 30,
            contactName: plan.contact_name,
            contactPhone: plan.contact_phone,
            date: today,
            dayOfWeek: dow,
            routeId: plan.route_id,
            routeName: plan.route_name,
            routeColor: plan.route_color,
            status: 'scheduled',
          })
        }
      }
    }

    visits.sort((a, b) => a.accountName.localeCompare(b.accountName))
    res.json(visits)
}))

// ═══════════════════════════════════════════
// CALCULATION HELPERS
// ═══════════════════════════════════════════

function isDueOnDate(plan, date, preferredDays, dow) {
  if (!preferredDays.includes(dow)) return false

  // Seasonal window check
  if (plan.season_start && plan.season_end) {
    const md = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    if (plan.season_start <= plan.season_end) {
      if (md < plan.season_start || md > plan.season_end) return false
    } else {
      // Wrapping range (e.g., 11-01 to 03-31 for winter)
      if (md < plan.season_start && md > plan.season_end) return false
    }
  }

  // Frequency interval — weekly plans match every preferred day
  const interval = plan.interval_weeks || 1
  if (interval <= 1) return true

  // Biweekly+: check if this week is a service week relative to start_date
  const epoch = plan.start_date ? new Date(plan.start_date + 'T12:00:00') : new Date('2024-01-01T12:00:00')
  const msPerWeek = 7 * 24 * 60 * 60 * 1000
  const weeksSinceEpoch = Math.floor((date.getTime() - epoch.getTime()) / msPerWeek)
  return weeksSinceEpoch % interval === 0
}

// ═══════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════

async function autoAddStop(routeId, accountId) {
  try {
    const existing = await db.query(
      'SELECT id FROM route_stops WHERE route_id = $1 AND account_id = $2 AND active = true', [routeId, accountId]
    )
    if (existing.rows.length > 0) return

    const maxR = await db.query(
      'SELECT COALESCE(MAX(stop_order), -1) + 1 AS next_order FROM route_stops WHERE route_id = $1 AND active = true', [routeId]
    )
    const acct = await db.query('SELECT estimated_minutes FROM accounts WHERE id = $1', [accountId])
    const estMin = acct.rows[0]?.estimated_minutes || 30

    await db.query(
      `INSERT INTO route_stops (route_id, account_id, stop_order, estimated_minutes)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (route_id, account_id) DO UPDATE SET active = true, stop_order = $3`,
      [routeId, accountId, maxR.rows[0].next_order, estMin]
    )
  } catch (e) {
    logger.error({ err: e }, 'autoAddStop failed')
  }
}

async function fetchFullPlan(id, orgId) {
  const result = await db.query(`
    SELECT sp.*,
      a.name AS account_name, a.address AS account_address, a.city AS account_city,
      a.estimated_minutes AS account_estimated_minutes,
      r.name AS route_name, r.color AS route_color, r.day_of_week AS route_day,
      COALESCE((SELECT json_agg(json_build_object(
        'id', se.id, 'type', se.exception_type, 'dateStart', se.date_start,
        'dateEnd', se.date_end, 'reason', se.reason
      )) FROM service_exceptions se WHERE se.service_plan_id = sp.id), '[]') AS exceptions
    FROM service_plans sp
    JOIN accounts a ON a.id = sp.account_id
    LEFT JOIN routes r ON r.id = sp.route_id
    WHERE sp.id = $1 AND sp.org_id = $2
  `, [id, orgId])
  return formatPlan(result.rows[0])
}

function getDefaultInterval(frequency) {
  switch (frequency) {
    case 'weekly': return 1
    case 'biweekly': return 2
    case 'monthly': return 4
    case 'seasonal': return 1
    default: return 1
  }
}

function formatPlan(row) {
  return {
    id: row.id,
    accountId: row.account_id,
    accountName: row.account_name,
    accountAddress: row.account_address,
    accountCity: row.account_city,
    accountEstimatedMinutes: row.account_estimated_minutes,
    status: row.status,
    frequency: row.frequency,
    intervalWeeks: row.interval_weeks,
    preferredDays: row.preferred_days || [],
    preferredDayNames: (row.preferred_days || []).map(d => DAY_NAMES[d]),
    routeId: row.route_id,
    routeName: row.route_name || null,
    routeColor: row.route_color || null,
    routeDay: row.route_day,
    startDate: row.start_date,
    endDate: row.end_date,
    seasonStart: row.season_start,
    seasonEnd: row.season_end,
    notes: row.notes,
    exceptions: (row.exceptions || []).filter(e => e.id !== null),
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function formatException(row) {
  return {
    id: row.id,
    servicePlanId: row.service_plan_id,
    type: row.exception_type,
    dateStart: row.date_start,
    dateEnd: row.date_end,
    reason: row.reason,
    createdAt: row.created_at,
  }
}

export default router

// ═══════════════════════════════════════════
// Roster Routes — Daily crew attendance
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam, sanitizeQueryInt } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { withTransaction, getOrgId } from '../utils/db.js'

const router = Router()

/**
 * @route POST /api/rosters — Submit or upsert a daily roster.
 * Uses withTransaction() for automatic BEGIN/COMMIT/ROLLBACK.
 */
router.post(
  '/',
  requireAuth,
  validateBody({
    crewName: { required: true, type: 'string' },
    submittedByName: { required: true, type: 'string' },
    members: { required: true, type: 'array' },
  }),
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { crewId, crewName, submittedById, submittedByName, workDate, members, notes } = req.body
    const date = workDate || new Date().toLocaleDateString('en-CA')

    const result = await withTransaction(async (client) => {
      // Upsert: remove existing roster for this crew + date
      if (crewId) {
        const existing = await client.query(
          'SELECT id FROM daily_crew_rosters WHERE crew_id = $1 AND work_date = $2 AND org_id = $3',
          [crewId, date, orgId],
        )
        for (const row of existing.rows) {
          await client.query('DELETE FROM daily_roster_members WHERE roster_id = $1', [row.id])
          await client.query('DELETE FROM daily_crew_rosters WHERE id = $1', [row.id])
        }
      }

      const rosterR = await client.query(
        `INSERT INTO daily_crew_rosters (crew_id, crew_name, submitted_by_id, submitted_by_name, work_date, notes, org_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at`,
        [crewId, crewName, submittedById, submittedByName, date, notes || null, orgId],
      )
      const rosterId = rosterR.rows[0].id

      for (const m of members) {
        await client.query(
          'INSERT INTO daily_roster_members (roster_id, employee_id, employee_name, present) VALUES ($1,$2,$3,$4)',
          [rosterId, m.id, m.name, m.present !== false],
        )
      }

      return { id: rosterId, createdAt: rosterR.rows[0].created_at }
    })

    res.json(result)
  }),
)

/** @route GET /api/rosters — List rosters with optional filters */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { crewId, date } = req.query
    const limit = sanitizeQueryInt(req.query.limit, 50, 1, 200)
    const where = []
    const params = []

    params.push(orgId)
    where.push(`r.org_id = $${params.length}`)
    if (crewId) {
      params.push(crewId)
      where.push(`r.crew_id = $${params.length}`)
    }
    if (date) {
      params.push(date)
      where.push(`r.work_date = $${params.length}`)
    }

    const whereStr = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''
    params.push(limit)

    const result = await db.query(
      `
    SELECT r.*,
      COALESCE((SELECT json_agg(json_build_object(
        'id', m.id, 'employeeId', m.employee_id, 'name', m.employee_name, 'present', m.present
      )) FROM daily_roster_members m WHERE m.roster_id = r.id), '[]') AS members
    FROM daily_crew_rosters r ${whereStr}
    ORDER BY r.work_date DESC, r.created_at DESC
    LIMIT $${params.length}
  `,
      params,
    )

    res.json(
      result.rows.map((row) => ({
        id: row.id,
        crewId: row.crew_id,
        crewName: row.crew_name,
        submittedBy: row.submitted_by_name,
        workDate: row.work_date,
        notes: row.notes,
        createdAt: row.created_at,
        members: (row.members || []).filter((m) => m.id !== null),
      })),
    )
  }),
)

/** @route GET /api/rosters/today — Today's roster for a crew */
router.get(
  '/today',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { crewId } = req.query
    const today = new Date().toLocaleDateString('en-CA')
    let where = 'WHERE r.work_date = $1 AND r.org_id = $2'
    const params = [today, orgId]
    if (crewId) {
      params.push(crewId)
      where += ` AND r.crew_id = $${params.length}`
    }

    const result = await db.query(
      `
    SELECT r.*,
      COALESCE((SELECT json_agg(json_build_object(
        'id', m.id, 'employeeId', m.employee_id, 'name', m.employee_name, 'present', m.present
      )) FROM daily_roster_members m WHERE m.roster_id = r.id), '[]') AS members
    FROM daily_crew_rosters r ${where}
    ORDER BY r.created_at DESC LIMIT 1`,
      params,
    )

    if (result.rows.length === 0) return res.json(null)

    const row = result.rows[0]
    res.json({
      id: row.id,
      crewId: row.crew_id,
      crewName: row.crew_name,
      submittedBy: row.submitted_by_name,
      workDate: row.work_date,
      notes: row.notes,
      members: (row.members || []).filter((m) => m.id !== null),
    })
  }),
)

/**
 * @route GET /api/rosters/attendance-today
 * Rich attendance overview for AdminHome dashboard.
 * Returns { crews, unrostered, totalWorking, totalEmployees }
 */
router.get(
  '/attendance-today',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const today = new Date().toLocaleDateString('en-CA')
    const crewsR = await db.query(
      'SELECT c.id, c.name, c.lead_name FROM crews c WHERE c.active = true AND c.org_id = $1 ORDER BY c.name',
      [orgId],
    )
    const empsR = await db.query(
      'SELECT e.id, e.first_name, e.last_name, e.default_crew_id FROM employees e WHERE e.active = true AND e.org_id = $1',
      [orgId],
    )
    const rostersR = await db.query(
      `
    SELECT r.crew_id, r.crew_name, r.submitted_by_name,
      COALESCE((SELECT json_agg(json_build_object('employeeId',m.employee_id,'name',m.employee_name))
        FROM daily_roster_members m WHERE m.roster_id = r.id), '[]') AS members
    FROM daily_crew_rosters r WHERE r.work_date = $1 AND r.org_id = $2
    ORDER BY r.created_at DESC`,
      [today, orgId],
    )

    const rosterByCrewId = {}
    for (const r of rostersR.rows) {
      if (!rosterByCrewId[r.crew_id]) rosterByCrewId[r.crew_id] = r
    }

    const rosteredIds = new Set()
    const crewAttendance = crewsR.rows.map((crew) => {
      const roster = rosterByCrewId[crew.id]
      if (!roster)
        return {
          crewId: crew.id,
          crewName: crew.name,
          submitted: false,
          memberCount: 0,
          members: [],
        }
      const members = (roster.members || []).filter((m) => m.employeeId !== null)
      members.forEach((m) => rosteredIds.add(m.employeeId))
      return {
        crewId: crew.id,
        crewName: crew.name,
        submitted: true,
        submittedBy: roster.submitted_by_name,
        memberCount: members.length,
        members: members.map((m) => m.name),
      }
    })

    const unrostered = empsR.rows
      .filter((e) => !rosteredIds.has(e.id))
      .map((e) => ({
        id: e.id,
        name: `${e.first_name} ${e.last_name}`,
        defaultCrew: crewsR.rows.find((c) => c.id === e.default_crew_id)?.name || null,
      }))

    res.json({
      crews: crewAttendance,
      unrostered,
      totalWorking: rosteredIds.size,
      totalEmployees: empsR.rows.length,
    })
  }),
)

/** @route DELETE /api/rosters/:id — Delete roster + members atomically */
router.delete(
  '/:id',
  requireAuth,
  validateIdParam,
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    await withTransaction(async (client) => {
      await client.query('DELETE FROM daily_roster_members WHERE roster_id = $1', [req.params.id])
      await client.query('DELETE FROM daily_crew_rosters WHERE id = $1 AND org_id = $2', [
        req.params.id,
        orgId,
      ])
    })
    res.json({ success: true })
  }),
)

export default router

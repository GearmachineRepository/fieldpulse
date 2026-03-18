// ═══════════════════════════════════════════
// Schedule Events Routes
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOrgId } from '../utils/db.js'

const router = Router()

function formatEvent(row) {
  return {
    id: row.id, title: row.title, notes: row.notes,
    eventDate: row.event_date, startTime: row.start_time, endTime: row.end_time,
    eventType: row.event_type, color: row.color,
    crewId: row.crew_id, crewName: row.crew_name || null,
    accountId: row.account_id, accountName: row.account_name || null,
    completed: row.completed, completedAt: row.completed_at,
    createdAt: row.created_at,
  }
}

/** @route GET /api/schedule-events — List events, filterable by date range */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const { startDate, endDate, crewId } = req.query
  const where = ['e.active = true']
  const params = []

  params.push(orgId); where.push(`e.org_id = $${params.length}`)

  if (startDate) { params.push(startDate); where.push(`e.event_date >= $${params.length}`) }
  if (endDate)   { params.push(endDate);   where.push(`e.event_date <= $${params.length}`) }
  if (crewId)    { params.push(crewId);    where.push(`e.crew_id = $${params.length}`) }

  const result = await db.query(`
    SELECT e.*, c.name AS crew_name, a.name AS account_name
    FROM schedule_events e
    LEFT JOIN crews c ON c.id = e.crew_id
    LEFT JOIN accounts a ON a.id = e.account_id
    WHERE ${where.join(' AND ')}
    ORDER BY e.event_date ASC, e.start_time ASC NULLS LAST
  `, params)

  res.json(result.rows.map(formatEvent))
}))

/** @route POST /api/schedule-events */
router.post('/',
  requireAuth,
  validateBody({ title: { required: true, type: 'string' }, eventDate: { required: true, type: 'string' } }),
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { title, notes, eventDate, startTime, endTime, eventType, color, crewId, accountId } = req.body
    const result = await db.query(
      `INSERT INTO schedule_events (title, notes, event_date, start_time, end_time, event_type, color, crew_id, account_id, org_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [title, notes || null, eventDate, startTime || null, endTime || null,
       eventType || 'task', color || '#3B82F6', crewId || null, accountId || null, orgId]
    )
    // Re-fetch with joins
    const full = await db.query(`
      SELECT e.*, c.name AS crew_name, a.name AS account_name
      FROM schedule_events e LEFT JOIN crews c ON c.id = e.crew_id LEFT JOIN accounts a ON a.id = e.account_id
      WHERE e.id = $1
    `, [result.rows[0].id])
    res.json(formatEvent(full.rows[0]))
  })
)

/** @route PUT /api/schedule-events/:id */
router.put('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const { title, notes, eventDate, startTime, endTime, eventType, color, crewId, accountId, completed } = req.body
  const updates = []
  const params = []

  if (title !== undefined)     { params.push(title);     updates.push(`title = $${params.length}`) }
  if (notes !== undefined)     { params.push(notes);     updates.push(`notes = $${params.length}`) }
  if (eventDate !== undefined) { params.push(eventDate); updates.push(`event_date = $${params.length}`) }
  if (startTime !== undefined) { params.push(startTime); updates.push(`start_time = $${params.length}`) }
  if (endTime !== undefined)   { params.push(endTime);   updates.push(`end_time = $${params.length}`) }
  if (eventType !== undefined) { params.push(eventType); updates.push(`event_type = $${params.length}`) }
  if (color !== undefined)     { params.push(color);     updates.push(`color = $${params.length}`) }
  if (crewId !== undefined)    { params.push(crewId);    updates.push(`crew_id = $${params.length}`) }
  if (accountId !== undefined) { params.push(accountId); updates.push(`account_id = $${params.length}`) }
  if (completed !== undefined) {
    params.push(completed); updates.push(`completed = $${params.length}`)
    if (completed) { updates.push(`completed_at = NOW()`) }
    else { updates.push(`completed_at = NULL`) }
  }

  if (updates.length === 0) return res.json({ success: true })

  const orgId = getOrgId(req)
  params.push(req.params.id)
  params.push(orgId)
  await db.query(`UPDATE schedule_events SET ${updates.join(', ')} WHERE id = $${params.length - 1} AND org_id = $${params.length}`, params)
  res.json({ success: true })
}))

/** @route DELETE /api/schedule-events/:id */
router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  await db.query('UPDATE schedule_events SET active = false WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
  res.json({ success: true })
}))

export default router

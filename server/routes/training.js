// ═══════════════════════════════════════════
// Training Routes
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateIdParam } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/AppError.js'
import { getOrgId } from '../utils/db.js'

const router = Router()

/** @route GET /api/training — List training sessions with signoff counts
 *  Query params:
 *    type       — filter to exact type match
 *    type_not   — exclude a specific type
 */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const params = [orgId]
  let where = 'ts.org_id = $1'

  if (req.query.type) {
    params.push(req.query.type)
    where += ` AND ts.type = $${params.length}`
  }
  if (req.query.type_not) {
    params.push(req.query.type_not)
    where += ` AND (ts.type IS NULL OR ts.type != $${params.length})`
  }

  const r = await db.query(
    `SELECT ts.*,
            COUNT(so.id)::int AS signoff_count
     FROM training_sessions ts
     LEFT JOIN training_signoffs so ON so.training_session_id = ts.id
     WHERE ${where}
     GROUP BY ts.id
     ORDER BY ts.training_date DESC, ts.created_at DESC`,
    params
  )
  res.json(r.rows)
}))

/** @route GET /api/training/:id — Get single session with signoff details */
router.get('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const session = await db.query(
    'SELECT * FROM training_sessions WHERE id = $1 AND org_id = $2',
    [req.params.id, orgId]
  )
  if (session.rows.length === 0) {
    throw new AppError('Training session not found', 404)
  }

  const signoffs = await db.query(
    `SELECT so.id, so.employee_id, so.signed_at, so.signature_data, so.notes,
            e.first_name, e.last_name
     FROM training_signoffs so
     JOIN employees e ON e.id = so.employee_id
     WHERE so.training_session_id = $1 AND so.org_id = $2
     ORDER BY so.signed_at DESC`,
    [req.params.id, orgId]
  )

  res.json({ ...session.rows[0], signoffs: signoffs.rows })
}))

/** @route POST /api/training — Create training session */
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const { title, description, trainer, training_date, duration_hours, location, type, status, notes } = req.body

  if (!title || !training_date) {
    throw new AppError('title and training_date are required', 400)
  }

  const r = await db.query(
    `INSERT INTO training_sessions (org_id, title, description, trainer, training_date, duration_hours, location, type, status, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [orgId, title, description || null, trainer || null, training_date, duration_hours || null,
     location || null, type || null, status || 'scheduled', notes || null]
  )
  res.json(r.rows[0])
}))

/** @route PUT /api/training/:id — Update training session */
router.put('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const { title, description, trainer, training_date, duration_hours, location, type, status, notes } = req.body

  if (!title || !training_date) {
    throw new AppError('title and training_date are required', 400)
  }

  const r = await db.query(
    `UPDATE training_sessions
     SET title = $1, description = $2, trainer = $3, training_date = $4,
         duration_hours = $5, location = $6, type = $7, status = $8, notes = $9,
         updated_at = now()
     WHERE id = $10 AND org_id = $11
     RETURNING *`,
    [title, description || null, trainer || null, training_date, duration_hours || null,
     location || null, type || null, status || 'scheduled', notes || null,
     req.params.id, orgId]
  )

  if (r.rows.length === 0) {
    throw new AppError('Training session not found', 404)
  }
  res.json(r.rows[0])
}))

/** @route DELETE /api/training/:id — Delete training session */
router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  await db.query('DELETE FROM training_sessions WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
  res.json({ success: true })
}))

/** @route GET /api/training/:id/signoffs — List signoffs for a session */
router.get('/:id/signoffs', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const r = await db.query(
    `SELECT so.id, so.employee_id, so.signed_at, so.signature_data, so.notes,
            e.first_name, e.last_name
     FROM training_signoffs so
     JOIN employees e ON e.id = so.employee_id
     WHERE so.training_session_id = $1 AND so.org_id = $2
     ORDER BY so.signed_at DESC`,
    [req.params.id, orgId]
  )
  res.json(r.rows)
}))

/** @route POST /api/training/:id/signoffs — Add signoff (append-only, no UPDATE) */
router.post('/:id/signoffs', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const { employee_id, signature_data, notes } = req.body

  if (!employee_id) {
    throw new AppError('employee_id is required', 400)
  }

  // Verify session belongs to org
  const session = await db.query(
    'SELECT id FROM training_sessions WHERE id = $1 AND org_id = $2',
    [req.params.id, orgId]
  )
  if (session.rows.length === 0) {
    throw new AppError('Training session not found', 404)
  }

  const r = await db.query(
    `INSERT INTO training_signoffs (org_id, training_session_id, employee_id, signature_data, notes)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [orgId, req.params.id, employee_id, signature_data || null, notes || null]
  )
  res.json(r.rows[0])
}))

export default router

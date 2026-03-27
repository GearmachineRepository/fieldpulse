// ═══════════════════════════════════════════
// Field Docs Routes — General notes, inspections, etc.
//
// Unified table for lightweight field documentation.
// Spray logs & incidents keep their own specialized tables.
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateIdParam } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/AppError.js'
import { getOrgId } from '../utils/db.js'

export default function fieldDocRoutes(upload, uploadToStorage) {
  const router = Router()

  /** @route GET /api/field-docs — List field docs with optional filters */
  router.get('/', requireAuth, asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { type, crewName, status, limit: rawLimit } = req.query
    const where = []
    const params = []

    params.push(orgId); where.push(`fd.org_id = $${params.length}`)
    if (type) { params.push(type); where.push(`fd.type = $${params.length}`) }
    if (crewName) { params.push(crewName); where.push(`fd.crew_name = $${params.length}`) }
    if (status) { params.push(status); where.push(`fd.status = $${params.length}`) }

    const limit = Math.min(Math.max(parseInt(rawLimit) || 200, 1), 500)
    params.push(limit)

    const r = await db.query(`
      SELECT fd.*,
        COALESCE(pc.photo_count, 0)::integer AS photo_count,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', p.id, 'filename', p.filename, 'originalName', p.original_name,
            'storagePath', p.storage_path, 'caption', p.caption
          )) FROM field_doc_photos p WHERE p.field_doc_id = fd.id),
          '[]'
        ) AS photos
      FROM field_docs fd
      LEFT JOIN (
        SELECT field_doc_id, COUNT(*) AS photo_count
        FROM field_doc_photos GROUP BY field_doc_id
      ) pc ON pc.field_doc_id = fd.id
      WHERE ${where.join(' AND ')}
      ORDER BY fd.created_at DESC
      LIMIT $${params.length}
    `, params)

    res.json(r.rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      location: row.location,
      gpsLat: row.gps_lat,
      gpsLng: row.gps_lng,
      crewName: row.crew_name,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      checklist: row.checklist,
      status: row.status,
      metadata: row.metadata,
      photoCount: row.photo_count,
      photos: (row.photos || []).filter(p => p.id !== null),
      date: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date(row.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      createdAt: row.created_at,
    })))
  }))

  /** @route GET /api/field-docs/:id — Single field doc */
  router.get('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const r = await db.query(
      `SELECT fd.*,
        COALESCE(
          (SELECT json_agg(json_build_object(
            'id', p.id, 'filename', p.filename, 'originalName', p.original_name,
            'storagePath', p.storage_path, 'caption', p.caption
          )) FROM field_doc_photos p WHERE p.field_doc_id = fd.id),
          '[]'
        ) AS photos
       FROM field_docs fd WHERE fd.id = $1 AND fd.org_id = $2`,
      [req.params.id, orgId]
    )
    if (r.rows.length === 0) throw new AppError('Document not found', 404)

    const row = r.rows[0]
    res.json({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      location: row.location,
      gpsLat: row.gps_lat,
      gpsLng: row.gps_lng,
      crewName: row.crew_name,
      employeeId: row.employee_id,
      employeeName: row.employee_name,
      checklist: row.checklist,
      status: row.status,
      metadata: row.metadata,
      photos: (row.photos || []).filter(p => p.id !== null),
      createdAt: row.created_at,
    })
  }))

  /** @route POST /api/field-docs — Create a field doc */
  router.post('/', requireAuth, asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const {
      type, title, body, location, gpsLat, gpsLng,
      crewName, employeeId, employeeName,
      checklist, status, metadata,
    } = req.body

    if (!type || !title) {
      throw new AppError('type and title are required', 400)
    }

    const r = await db.query(
      `INSERT INTO field_docs (
         org_id, type, title, body, location, gps_lat, gps_lng,
         crew_name, employee_id, employee_name,
         checklist, status, metadata
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        orgId, type, title, body || null,
        location || null, gpsLat || null, gpsLng || null,
        crewName || null, employeeId || null, employeeName || null,
        checklist ? JSON.stringify(checklist) : null,
        status || 'submitted',
        metadata ? JSON.stringify(metadata) : '{}',
      ]
    )

    res.json({
      id: r.rows[0].id,
      type: r.rows[0].type,
      title: r.rows[0].title,
      createdAt: r.rows[0].created_at,
    })
  }))

  /** @route PUT /api/field-docs/:id — Update (admin review, status change) */
  router.put('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { status, metadata } = req.body

    const sets = ['updated_at = NOW()']
    const params = []

    if (status) { params.push(status); sets.push(`status = $${params.length}`) }
    if (metadata) { params.push(JSON.stringify(metadata)); sets.push(`metadata = $${params.length}`) }

    params.push(req.params.id)
    params.push(orgId)

    await db.query(
      `UPDATE field_docs SET ${sets.join(', ')} WHERE id = $${params.length - 1} AND org_id = $${params.length}`,
      params
    )
    res.json({ success: true })
  }))

  /** @route DELETE /api/field-docs/:id */
  router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    await db.query('DELETE FROM field_docs WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
    res.json({ success: true })
  }))

  // ═══════════════════════════════════════════
  // Photos
  // ═══════════════════════════════════════════

  /** @route POST /api/field-docs/:id/photos — Upload photo(s) */
  router.post('/:id/photos', requireAuth, validateIdParam, upload.array('photos', 10), uploadToStorage, asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)

    // Verify doc belongs to org
    const check = await db.query(
      'SELECT id FROM field_docs WHERE id = $1 AND org_id = $2',
      [req.params.id, orgId]
    )
    if (check.rows.length === 0) throw new AppError('Document not found', 404)

    const saved = []
    for (const f of req.files) {
      const r = await db.query(
        `INSERT INTO field_doc_photos (field_doc_id, org_id, filename, original_name, mime_type, size_bytes, storage_path, caption)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, filename, original_name`,
        [req.params.id, orgId, f.filename, f.originalname, f.mimetype, f.size, f.filename, req.body.caption || null]
      )
      saved.push(r.rows[0])
    }
    res.json(saved)
  }))

  /** @route GET /api/field-docs/:id/photos — List photos */
  router.get('/:id/photos', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const r = await db.query(
      `SELECT * FROM field_doc_photos WHERE field_doc_id = $1 AND org_id = $2 ORDER BY created_at`,
      [req.params.id, orgId]
    )
    res.json(r.rows.map(row => ({
      id: row.id,
      filename: row.filename,
      originalName: row.original_name,
      storagePath: row.storage_path,
      caption: row.caption,
      createdAt: row.created_at,
    })))
  }))

  return router
}

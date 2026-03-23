// ═══════════════════════════════════════════
// Incident Routes
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateIdParam } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/AppError.js'
import { getOrgId } from '../utils/db.js'
import { createUpload, uploadToStorage } from '../middleware/upload.js'
import supabase from '../lib/supabase.js'

const router = Router()

// Upload middleware for incident photos (reuses shared Supabase Storage pattern)
const upload = createUpload('uploads')

/** @route GET /api/incidents — List all incidents for org (with reporter name + photo count) */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const r = await db.query(
    `SELECT i.*,
            e.first_name AS reporter_first_name,
            e.last_name AS reporter_last_name,
            COALESCE(pc.photo_count, 0)::integer AS photo_count
     FROM incidents i
     LEFT JOIN employees e ON e.id = i.reported_by
     LEFT JOIN (
       SELECT incident_id, COUNT(*) AS photo_count
       FROM incident_photos
       GROUP BY incident_id
     ) pc ON pc.incident_id = i.id
     WHERE i.org_id = $1
     ORDER BY i.incident_date DESC`,
    [orgId]
  )
  res.json(r.rows)
}))

/** @route GET /api/incidents/:id — Get single incident with full details */
router.get('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const r = await db.query(
    `SELECT i.*,
            e.first_name AS reporter_first_name,
            e.last_name AS reporter_last_name
     FROM incidents i
     LEFT JOIN employees e ON e.id = i.reported_by
     WHERE i.id = $1 AND i.org_id = $2`,
    [req.params.id, orgId]
  )
  if (r.rows.length === 0) throw new AppError('Incident not found', 404)
  res.json(r.rows[0])
}))

/** @route POST /api/incidents — Create incident */
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const {
    title, description, incidentDate, location, severity, type,
    reportedBy, status, investigationNotes, correctiveActions,
    witnesses, injuryOccurred, injuryDescription,
  } = req.body

  if (!title || !incidentDate) {
    throw new AppError('title and incidentDate are required', 400)
  }

  const r = await db.query(
    `INSERT INTO incidents (
       org_id, title, description, incident_date, location, severity, type,
       reported_by, status, investigation_notes, corrective_actions,
       witnesses, injury_occurred, injury_description
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      orgId,
      title,
      description || null,
      incidentDate,
      location || null,
      severity || 'low',
      type || null,
      reportedBy || null,
      status || 'open',
      investigationNotes || null,
      correctiveActions || null,
      witnesses || null,
      injuryOccurred === true || injuryOccurred === 'true',
      injuryDescription || null,
    ]
  )
  res.json(r.rows[0])
}))

/** @route PUT /api/incidents/:id — Update incident (blocked if locked) */
router.put('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)

  // Check if report is locked
  const check = await db.query(
    'SELECT report_locked FROM incidents WHERE id = $1 AND org_id = $2',
    [req.params.id, orgId]
  )
  if (check.rows.length === 0) throw new AppError('Incident not found', 404)
  if (check.rows[0].report_locked) {
    return res.status(403).json({ error: 'Report is locked and cannot be edited' })
  }

  const {
    title, description, incidentDate, location, severity, type,
    reportedBy, status, investigationNotes, correctiveActions,
    witnesses, injuryOccurred, injuryDescription,
  } = req.body

  await db.query(
    `UPDATE incidents SET
       title = $1, description = $2, incident_date = $3, location = $4,
       severity = $5, type = $6, reported_by = $7, status = $8,
       investigation_notes = $9, corrective_actions = $10,
       witnesses = $11, injury_occurred = $12, injury_description = $13,
       updated_at = now()
     WHERE id = $14 AND org_id = $15`,
    [
      title, description || null, incidentDate, location || null,
      severity || 'low', type || null, reportedBy || null, status || 'open',
      investigationNotes || null, correctiveActions || null,
      witnesses || null, injuryOccurred === true || injuryOccurred === 'true',
      injuryDescription || null,
      req.params.id, orgId,
    ]
  )
  res.json({ success: true })
}))

/** @route PUT /api/incidents/:id/lock — Lock report (one-way, cannot unlock) */
router.put('/:id/lock', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  await db.query(
    'UPDATE incidents SET report_locked = true, updated_at = now() WHERE id = $1 AND org_id = $2',
    [req.params.id, orgId]
  )
  res.json({ success: true })
}))

/** @route DELETE /api/incidents/:id — Delete incident (only if not locked) */
router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)

  const check = await db.query(
    'SELECT report_locked FROM incidents WHERE id = $1 AND org_id = $2',
    [req.params.id, orgId]
  )
  if (check.rows.length === 0) throw new AppError('Incident not found', 404)
  if (check.rows[0].report_locked) {
    return res.status(403).json({ error: 'Report is locked and cannot be deleted' })
  }

  await db.query('DELETE FROM incidents WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
  res.json({ success: true })
}))

// ═══════════════════════════════════════════
// Incident Photos
// ═══════════════════════════════════════════

/** @route GET /api/incidents/:id/photos — List photos for an incident */
router.get('/:id/photos', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)

  // Verify incident belongs to org
  const check = await db.query(
    'SELECT id FROM incidents WHERE id = $1 AND org_id = $2',
    [req.params.id, orgId]
  )
  if (check.rows.length === 0) throw new AppError('Incident not found', 404)

  const r = await db.query(
    `SELECT ip.*,
            e.first_name AS uploader_first_name,
            e.last_name AS uploader_last_name
     FROM incident_photos ip
     LEFT JOIN employees e ON e.id = ip.uploaded_by
     WHERE ip.incident_id = $1 AND ip.org_id = $2
     ORDER BY ip.created_at DESC`,
    [req.params.id, orgId]
  )

  res.json(r.rows.map(row => ({
    id: row.id,
    incidentId: row.incident_id,
    filename: row.filename,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    storagePath: row.storage_path,
    caption: row.caption,
    uploadedBy: row.uploaded_by,
    uploaderName: row.uploader_first_name && row.uploader_last_name
      ? `${row.uploader_first_name} ${row.uploader_last_name}` : null,
    createdAt: row.created_at,
  })))
}))

/** @route POST /api/incidents/:id/photos — Upload photo(s) to an incident */
router.post('/:id/photos', requireAuth, validateIdParam, upload.single('photo'), uploadToStorage, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)

  // Verify incident belongs to org and is not locked
  const check = await db.query(
    'SELECT id, report_locked FROM incidents WHERE id = $1 AND org_id = $2',
    [req.params.id, orgId]
  )
  if (check.rows.length === 0) throw new AppError('Incident not found', 404)
  if (check.rows[0].report_locked) {
    return res.status(403).json({ error: 'Report is locked — photos cannot be added' })
  }

  if (!req.file) {
    throw new AppError('No photo uploaded', 400)
  }

  const { caption, uploadedBy } = req.body
  const storagePath = req.file.filename

  const r = await db.query(
    `INSERT INTO incident_photos (
       org_id, incident_id, filename, original_name, mime_type,
       size_bytes, storage_path, caption, uploaded_by
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      orgId,
      req.params.id,
      req.file.filename,
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      storagePath,
      caption || null,
      uploadedBy ? parseInt(uploadedBy) : null,
    ]
  )

  res.json({
    id: r.rows[0].id,
    incidentId: r.rows[0].incident_id,
    filename: r.rows[0].filename,
    originalName: r.rows[0].original_name,
    mimeType: r.rows[0].mime_type,
    sizeBytes: r.rows[0].size_bytes,
    storagePath: r.rows[0].storage_path,
    caption: r.rows[0].caption,
    uploadedBy: r.rows[0].uploaded_by,
    createdAt: r.rows[0].created_at,
  })
}))

/** @route DELETE /api/incidents/:id/photos/:photoId — Delete a photo */
router.delete('/:id/photos/:photoId', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const photoId = parseInt(req.params.photoId, 10)
  if (isNaN(photoId) || photoId < 1) throw new AppError('Invalid photo ID', 400)

  // Verify incident belongs to org and is not locked
  const check = await db.query(
    'SELECT id, report_locked FROM incidents WHERE id = $1 AND org_id = $2',
    [req.params.id, orgId]
  )
  if (check.rows.length === 0) throw new AppError('Incident not found', 404)
  if (check.rows[0].report_locked) {
    return res.status(403).json({ error: 'Report is locked — photos cannot be removed' })
  }

  // Get photo record for storage cleanup
  const photo = await db.query(
    'SELECT * FROM incident_photos WHERE id = $1 AND incident_id = $2 AND org_id = $3',
    [photoId, req.params.id, orgId]
  )
  if (photo.rows.length === 0) throw new AppError('Photo not found', 404)

  // Delete from Supabase Storage (best-effort — don't fail the request if storage delete fails)
  if (supabase && photo.rows[0].storage_path) {
    try {
      await supabase.storage.from('uploads').remove([photo.rows[0].storage_path])
    } catch (err) {
      // Log but don't block — the DB record is the source of truth
      console.error('Failed to delete photo from storage:', err.message)
    }
  }

  // Delete from DB
  await db.query(
    'DELETE FROM incident_photos WHERE id = $1 AND org_id = $2',
    [photoId, orgId]
  )

  res.json({ success: true })
}))

export default router

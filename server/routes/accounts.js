// ═══════════════════════════════════════════
// Account Routes — Property / Customer CRUD
// Auto-geocodes using US Census Geocoder (primary)
// with Nominatim as fallback. Census has near-complete
// US address coverage from TIGER/Line postal data.
// + Account-linked resources for field crew access
// ═══════════════════════════════════════════

import { Router } from 'express'
import https from 'https'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam, sanitizeQueryInt } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError } from '../utils/AppError.js'
import { logger } from '../utils/logger.js'
import { getOrgId } from '../utils/db.js'
import { createUpload, uploadToStorage } from '../middleware/upload.js'
import supabase from '../lib/supabase.js'

const router = Router()
const upload = createUpload('uploads')

// ── Generic HTTPS GET helper ──
function httpsGet(url, label) {
  return new Promise((resolve) => {
    logger.info(`  [geocode] [${label}] Requesting...`)

    const req = https.get(url, {
      headers: { 'User-Agent': 'CruPoint/1.0' },
    }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (res.statusCode !== 200) {
          logger.info(`  [geocode] [${label}] HTTP ${res.statusCode}`)
          resolve(null)
          return
        }
        resolve(data)
      })
    })

    req.on('error', (e) => {
      logger.error(`  [geocode] [${label}] Network error:`, e.message)
      resolve(null)
    })

    req.setTimeout(15000, () => {
      logger.error(`  [geocode] [${label}] Timeout`)
      req.destroy()
      resolve(null)
    })
  })
}

// ── US Census Geocoder (primary — best US coverage) ──
// Docs: https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.pdf
async function censusGeocode({ address, city, state, zip }) {
  // Try structured first
  if (address && (city || zip)) {
    const params = new URLSearchParams({
      street: address,
      benchmark: 'Public_AR_Current',
      format: 'json',
    })
    if (city) params.set('city', city)
    if (state) params.set('state', state)
    if (zip) params.set('zip', zip)

    const url = `https://geocoding.geo.census.gov/geocoder/locations/address?${params.toString()}`
    const raw = await httpsGet(url, 'census-structured')

    if (raw) {
      try {
        const data = JSON.parse(raw)
        const matches = data?.result?.addressMatches
        if (matches && matches.length > 0) {
          const coords = matches[0].coordinates
          logger.info(`  [geocode] [census-structured] ✓ Found: ${coords.y}, ${coords.x}`)
          return { latitude: coords.y, longitude: coords.x }
        }
        logger.info(`  [geocode] [census-structured] No matches`)
      } catch (e) {
        logger.info(`  [geocode] [census-structured] Parse error:`, e.message)
      }
    }
  }

  // Try one-line address
  const oneline = [address, city, state, zip].filter(Boolean).join(', ')
  if (oneline) {
    const params = new URLSearchParams({
      address: oneline,
      benchmark: 'Public_AR_Current',
      format: 'json',
    })

    const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?${params.toString()}`
    const raw = await httpsGet(url, 'census-oneline')

    if (raw) {
      try {
        const data = JSON.parse(raw)
        const matches = data?.result?.addressMatches
        if (matches && matches.length > 0) {
          const coords = matches[0].coordinates
          logger.info(`  [geocode] [census-oneline] ✓ Found: ${coords.y}, ${coords.x}`)
          return { latitude: coords.y, longitude: coords.x }
        }
        logger.info(`  [geocode] [census-oneline] No matches`)
      } catch (e) {
        logger.info(`  [geocode] [census-oneline] Parse error:`, e.message)
      }
    }
  }

  return null
}

// ── Nominatim fallback (for non-US or Census misses) ──
async function nominatimGeocode({ address, city, state, zip }) {
  const params = new URLSearchParams({ format: 'json', limit: '1' })

  if (address) params.set('street', address)
  if (city) params.set('city', city)
  if (state) params.set('state', state)
  if (zip) params.set('postalcode', zip)

  const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`
  const raw = await httpsGet(url, 'nominatim')

  if (raw) {
    try {
      const results = JSON.parse(raw)
      if (results.length > 0) {
        logger.info(`  [geocode] [nominatim] ✓ Found: ${results[0].lat}, ${results[0].lon}`)
        return { latitude: parseFloat(results[0].lat), longitude: parseFloat(results[0].lon) }
      }
      logger.info(`  [geocode] [nominatim] No matches`)
    } catch (e) {
      logger.info(`  [geocode] [nominatim] Parse error:`, e.message)
    }
  }

  return null
}

// ── Main geocode function — Census first, Nominatim fallback ──
async function geocode({ address, city, state, zip }) {
  logger.info(`\n  [geocode] Looking up: "${address}", ${city || '?'}, ${state || '?'} ${zip || '?'}`)

  const censusResult = await censusGeocode({ address, city, state, zip })
  if (censusResult) return censusResult

  const nominatimResult = await nominatimGeocode({ address, city, state, zip })
  if (nominatimResult) return nominatimResult

  logger.info(`  [geocode] ✗ All geocoders failed\n`)
  return { latitude: null, longitude: null }
}

// ═══════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════

/** @route GET /api/accounts — List all active accounts */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const { search, type, city } = req.query
  const limit = sanitizeQueryInt(req.query.limit, 200, 1, 500)
  const where = ['a.active = true']
  const params = []

  params.push(orgId)
  where.push(`a.org_id = $${params.length}`)

  if (search) {
    params.push(`%${search}%`)
    where.push(`(a.name ILIKE $${params.length} OR a.address ILIKE $${params.length} OR a.contact_name ILIKE $${params.length})`)
  }
  if (type) {
    params.push(type)
    where.push(`a.account_type = $${params.length}`)
  }
  if (city) {
    params.push(city)
    where.push(`a.city = $${params.length}`)
  }

  params.push(limit)
  const result = await db.query(`
    SELECT a.* FROM accounts a
    WHERE ${where.join(' AND ')}
    ORDER BY a.name ASC
    LIMIT $${params.length}
  `, params)

  res.json(result.rows.map(formatAccount))
}))

/** @route GET /api/accounts/:id — Get single account */
router.get('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const result = await db.query('SELECT * FROM accounts WHERE id = $1 AND active = true AND org_id = $2', [req.params.id, orgId])
  if (result.rows.length === 0) return res.status(404).json({ error: 'Account not found' })
  res.json(formatAccount(result.rows[0]))
}))

/** @route POST /api/accounts — Create account (auto-geocodes) */
router.post('/',
  requireAuth,
  validateBody({
    name: { required: true, type: 'string', maxLength: 200 },
    address: { required: true, type: 'string', maxLength: 300 },
  }),
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { name, address, city, state, zip, contactName, contactPhone, contactEmail, accountType, notes, groupId, estimatedMinutes } = req.body
    let { latitude, longitude } = req.body

    if (!latitude || !longitude) {
      const coords = await geocode({ address, city, state, zip })
      latitude = coords.latitude
      longitude = coords.longitude
    }

    const result = await db.query(
      `INSERT INTO accounts (name, address, city, state, zip, latitude, longitude, contact_name, contact_phone, contact_email, account_type, notes, group_id, estimated_minutes, org_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [name, address, city || null, state || 'CA', zip || null,
       latitude || null, longitude || null,
       contactName || null, contactPhone || null, contactEmail || null,
       accountType || 'residential', notes || null, groupId || null, estimatedMinutes || 30, orgId]
    )
    res.json(formatAccount(result.rows[0]))
  })
)

/** @route PUT /api/accounts/:id — Update account (auto-geocodes) */
router.put('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const { name, address, city, state, zip, contactName, contactPhone, contactEmail, accountType, notes, groupId, estimatedMinutes } = req.body
  let { latitude, longitude } = req.body

  if (!latitude || !longitude) {
    const coords = await geocode({ address, city, state, zip })
    latitude = coords.latitude
    longitude = coords.longitude
  }

  await db.query(
    `UPDATE accounts SET name=$1, address=$2, city=$3, state=$4, zip=$5,
     latitude=$6, longitude=$7, contact_name=$8, contact_phone=$9, contact_email=$10,
     account_type=$11, notes=$12, group_id=$13, estimated_minutes=$14 WHERE id=$15 AND org_id=$16`,
    [name, address, city || null, state || 'CA', zip || null,
     latitude || null, longitude || null,
     contactName || null, contactPhone || null, contactEmail || null,
     accountType || 'residential', notes || null, groupId || null, estimatedMinutes || 30,
     req.params.id, orgId]
  )

  const updated = await db.query('SELECT * FROM accounts WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
  res.json(formatAccount(updated.rows[0]))
}))

/** @route DELETE /api/accounts/:id — Soft-delete account */
router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  await db.query('UPDATE accounts SET active = false WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
  res.json({ success: true })
}))

/** @route POST /api/accounts/geocode — Manual geocode endpoint */
router.post('/geocode',
  requireAuth,
  validateBody({ address: { required: true, type: 'string' } }),
  asyncHandler(async (req, res) => {
    const result = await geocode({ address: req.body.address, city: null, state: null, zip: null })
    res.json({ ...result, display: req.body.address })
  })
)

/** @route PATCH /api/accounts/:id/estimated-time — Update estimated service time */
router.patch('/:id/estimated-time', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const { estimatedMinutes } = req.body
  if (!estimatedMinutes && estimatedMinutes !== 0) return res.status(400).json({ error: 'estimatedMinutes is required' })

  await db.query('UPDATE accounts SET estimated_minutes = $1 WHERE id = $2 AND org_id = $3', [parseInt(estimatedMinutes) || 30, req.params.id, orgId])
  const updated = await db.query('SELECT * FROM accounts WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
  res.json(formatAccount(updated.rows[0]))
}))

// ═══════════════════════════════════════════
// Account-linked Resources
// ═══════════════════════════════════════════

/** @route GET /api/accounts/:id/resources — List resources linked to this account */
router.get('/:id/resources', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const result = await db.query(`
    SELECT r.*, c.name AS category_name, c.color AS category_color
    FROM account_resources ar
    JOIN resources r ON r.id = ar.resource_id AND r.active = true
    JOIN accounts a ON a.id = ar.account_id AND a.org_id = $2
    LEFT JOIN resource_categories c ON c.id = r.category_id
    WHERE ar.account_id = $1
    ORDER BY r.pinned DESC, r.title ASC
  `, [req.params.id, orgId])

  res.json(result.rows.map(row => ({
    id: row.id, title: row.title, description: row.description,
    categoryId: row.category_id, categoryName: row.category_name || null,
    categoryColor: row.category_color || null,
    resourceType: row.resource_type, url: row.url,
    filename: row.filename, originalName: row.original_name,
    mimeType: row.mime_type, fileSize: row.file_size,
    tags: row.tags || [], pinned: row.pinned, createdAt: row.created_at,
  })))
}))

/** @route POST /api/accounts/:id/resources — Link a resource to this account */
router.post('/:id/resources', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const { resourceId } = req.body
  if (!resourceId) return res.status(400).json({ error: 'resourceId is required' })

  // Verify account belongs to org
  const acct = await db.query('SELECT id FROM accounts WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
  if (acct.rows.length === 0) return res.status(404).json({ error: 'Account not found' })

  await db.query(
    `INSERT INTO account_resources (account_id, resource_id)
     VALUES ($1, $2) ON CONFLICT (account_id, resource_id) DO NOTHING`,
    [req.params.id, resourceId]
  )
  res.json({ success: true })
}))

/** @route DELETE /api/accounts/:id/resources/:resourceId — Unlink a resource from this account */
router.delete('/:id/resources/:resourceId', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const resourceId = parseInt(req.params.resourceId, 10)
  if (isNaN(resourceId) || resourceId < 1) return res.status(400).json({ error: 'Invalid resource ID' })

  // Verify account belongs to org
  const acct = await db.query('SELECT id FROM accounts WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
  if (acct.rows.length === 0) return res.status(404).json({ error: 'Account not found' })

  await db.query(
    'DELETE FROM account_resources WHERE account_id = $1 AND resource_id = $2',
    [req.params.id, resourceId]
  )
  res.json({ success: true })
}))

// ═══════════════════════════════════════════
// Account Photos — Property/job site photos
// ═══════════════════════════════════════════

/** @route GET /api/accounts/:id/photos — List photos for an account */
router.get('/:id/photos', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const acct = await db.query('SELECT id FROM accounts WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
  if (acct.rows.length === 0) throw new AppError('Account not found', 404)

  const r = await db.query(
    `SELECT ap.*,
            e.first_name AS uploader_first_name,
            e.last_name AS uploader_last_name
     FROM account_photos ap
     LEFT JOIN employees e ON e.id = ap.uploaded_by
     WHERE ap.account_id = $1 AND ap.org_id = $2
     ORDER BY ap.created_at DESC`,
    [req.params.id, orgId]
  )

  res.json(r.rows.map(row => ({
    id: row.id,
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

/** @route POST /api/accounts/:id/photos — Upload photo(s) to an account */
router.post('/:id/photos', requireAuth, validateIdParam, upload.single('photo'), uploadToStorage, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const acct = await db.query('SELECT id FROM accounts WHERE id = $1 AND org_id = $2', [req.params.id, orgId])
  if (acct.rows.length === 0) throw new AppError('Account not found', 404)

  if (!req.file) throw new AppError('No photo uploaded', 400)

  const { caption, uploadedBy } = req.body
  const storagePath = req.file.filename

  const r = await db.query(
    `INSERT INTO account_photos (
       org_id, account_id, filename, original_name, mime_type,
       size_bytes, storage_path, caption, uploaded_by
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      orgId, req.params.id, req.file.originalname, req.file.originalname,
      req.file.mimetype, req.file.size,
      storagePath, caption || null,
      uploadedBy ? parseInt(uploadedBy) : null,
    ]
  )

  res.json({
    id: r.rows[0].id,
    filename: r.rows[0].filename,
    storagePath: r.rows[0].storage_path,
    caption: r.rows[0].caption,
    uploadedBy: r.rows[0].uploaded_by,
    createdAt: r.rows[0].created_at,
  })
}))

/** @route DELETE /api/accounts/:id/photos/:photoId — Delete a photo */
router.delete('/:id/photos/:photoId', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const photoId = parseInt(req.params.photoId, 10)
  if (isNaN(photoId) || photoId < 1) throw new AppError('Invalid photo ID', 400)

  const photo = await db.query(
    'SELECT * FROM account_photos WHERE id = $1 AND account_id = $2 AND org_id = $3',
    [photoId, req.params.id, orgId]
  )
  if (photo.rows.length === 0) throw new AppError('Photo not found', 404)

  if (supabase && photo.rows[0].storage_path) {
    try {
      await supabase.storage.from('uploads').remove([photo.rows[0].storage_path])
    } catch (err) {
      logger.error('Failed to delete photo from storage:', err.message)
    }
  }

  await db.query(
    'DELETE FROM account_photos WHERE id = $1 AND org_id = $2',
    [photoId, orgId]
  )

  res.json({ success: true })
}))

// ── Format DB row → API response ──
function formatAccount(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    latitude: row.latitude,
    longitude: row.longitude,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    accountType: row.account_type,
    notes: row.notes,
    createdAt: row.created_at,
    group_id: row.group_id,
    estimatedMinutes: row.estimated_minutes || 30,
  }
}

export default router
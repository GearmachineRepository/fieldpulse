// ═══════════════════════════════════════════
// Resources Routes — Library CRUD + file upload
// + Account linking (reverse direction)
// ═══════════════════════════════════════════

import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(process.cwd(), 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `resource-${crypto.randomBytes(8).toString('hex')}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } })

// ═══════════════════════════════════════════
// Categories
// ═══════════════════════════════════════════

router.get('/categories', requireAuth, asyncHandler(async (req, res) => {
  const r = await db.query(`
    SELECT c.*,
      (SELECT COUNT(*) FROM resources r WHERE r.category_id = c.id AND r.active = true) AS resource_count
    FROM resource_categories c WHERE c.active = true ORDER BY c.sort_order ASC, c.name ASC
  `)
  res.json(r.rows.map(row => ({
    id: row.id, name: row.name, icon: row.icon, color: row.color,
    sortOrder: row.sort_order, resourceCount: parseInt(row.resource_count),
  })))
}))

router.post('/categories',
  requireAuth,
  validateBody({ name: { required: true, type: 'string' } }),
  asyncHandler(async (req, res) => {
    const { name, icon, color } = req.body
    const maxOrder = await db.query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM resource_categories')
    const r = await db.query(
      'INSERT INTO resource_categories (name, icon, color, sort_order) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, icon || 'folder', color || '#475569', maxOrder.rows[0].next]
    )
    res.json(r.rows[0])
  })
)

router.put('/categories/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const { name, icon, color } = req.body
  await db.query('UPDATE resource_categories SET name=$1, icon=$2, color=$3 WHERE id=$4',
    [name, icon || 'folder', color || '#475569', req.params.id])
  res.json({ success: true })
}))

router.delete('/categories/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  await db.query('UPDATE resource_categories SET active = false WHERE id = $1', [req.params.id])
  await db.query('UPDATE resources SET category_id = NULL WHERE category_id = $1', [req.params.id])
  res.json({ success: true })
}))

// ═══════════════════════════════════════════
// Resources
// ═══════════════════════════════════════════

function formatResource(row) {
  return {
    id: row.id, title: row.title, description: row.description,
    categoryId: row.category_id, categoryName: row.category_name || null,
    categoryColor: row.category_color || null,
    resourceType: row.resource_type, url: row.url,
    filename: row.filename, originalName: row.original_name,
    mimeType: row.mime_type, fileSize: row.file_size,
    tags: row.tags || [], pinned: row.pinned, createdAt: row.created_at,
  }
}

/** @route GET /api/resources — List all, filterable */
router.get('/', requireAuth, asyncHandler(async (req, res) => {
  const { categoryId, search, pinned } = req.query
  const where = ['r.active = true']
  const params = []

  if (categoryId) { params.push(categoryId); where.push(`r.category_id = $${params.length}`) }
  if (pinned === 'true') { where.push('r.pinned = true') }
  if (search) {
    params.push(`%${search}%`)
    where.push(`(r.title ILIKE $${params.length} OR r.description ILIKE $${params.length} OR r.original_name ILIKE $${params.length})`)
  }

  const result = await db.query(`
    SELECT r.*, c.name AS category_name, c.color AS category_color
    FROM resources r LEFT JOIN resource_categories c ON c.id = r.category_id
    WHERE ${where.join(' AND ')}
    ORDER BY r.pinned DESC, r.created_at DESC
  `, params)

  res.json(result.rows.map(formatResource))
}))

/** @route POST /api/resources — Create (link) */
router.post('/',
  requireAuth,
  validateBody({ title: { required: true, type: 'string' } }),
  asyncHandler(async (req, res) => {
    const { title, description, categoryId, url, tags, pinned } = req.body
    const result = await db.query(
      `INSERT INTO resources (title, description, category_id, resource_type, url, tags, pinned)
       VALUES ($1,$2,$3,'link',$4,$5,$6) RETURNING *`,
      [title, description || null, categoryId || null, url || null, tags || null, pinned || false]
    )
    const full = await db.query(`
      SELECT r.*, c.name AS category_name, c.color AS category_color
      FROM resources r LEFT JOIN resource_categories c ON c.id = r.category_id WHERE r.id = $1
    `, [result.rows[0].id])
    res.json(formatResource(full.rows[0]))
  })
)

/** @route POST /api/resources/upload — Create (file upload) */
router.post('/upload', requireAuth, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })
  const { title, description, categoryId, tags, pinned } = req.body
  const result = await db.query(
    `INSERT INTO resources (title, description, category_id, resource_type, filename, original_name, mime_type, file_size, tags, pinned)
     VALUES ($1,$2,$3,'file',$4,$5,$6,$7,$8,$9) RETURNING *`,
    [title || req.file.originalname, description || null, categoryId || null,
     req.file.filename, req.file.originalname, req.file.mimetype, req.file.size,
     tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : null, pinned === 'true']
  )
  const full = await db.query(`
    SELECT r.*, c.name AS category_name, c.color AS category_color
    FROM resources r LEFT JOIN resource_categories c ON c.id = r.category_id WHERE r.id = $1
  `, [result.rows[0].id])
  res.json(formatResource(full.rows[0]))
}))

/** @route PUT /api/resources/:id */
router.put('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const { title, description, categoryId, url, tags, pinned } = req.body
  await db.query(
    `UPDATE resources SET title=$1, description=$2, category_id=$3, url=$4, tags=$5, pinned=$6 WHERE id=$7`,
    [title, description || null, categoryId || null, url || null, tags || null, pinned || false, req.params.id]
  )
  res.json({ success: true })
}))

// ── Replace file on existing resource ──
router.put('/:id/file', requireAuth, validateIdParam, upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  await db.query(
    `UPDATE resources SET filename=$1, original_name=$2, mime_type=$3, file_size=$4 WHERE id=$5`,
    [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, req.params.id]
  )

  const full = await db.query(`
    SELECT r.*, c.name AS category_name, c.color AS category_color
    FROM resources r LEFT JOIN resource_categories c ON c.id = r.category_id WHERE r.id = $1
  `, [req.params.id])
  res.json(formatResource(full.rows[0]))
}))

/** @route DELETE /api/resources/:id */
router.delete('/:id', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  await db.query('UPDATE resources SET active = false WHERE id = $1', [req.params.id])
  res.json({ success: true })
}))

// ═══════════════════════════════════════════
// Resource → Account Linking
// ═══════════════════════════════════════════

/** @route GET /api/resources/:id/accounts — Accounts linked to this resource */
router.get('/:id/accounts', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT a.* FROM account_resources ar
    JOIN accounts a ON a.id = ar.account_id AND a.active = true
    WHERE ar.resource_id = $1 ORDER BY a.name ASC
  `, [req.params.id])
  res.json(result.rows.map(row => ({
    id: row.id, name: row.name, address: row.address,
    city: row.city, state: row.state, zip: row.zip,
    latitude: row.latitude, longitude: row.longitude,
    contactName: row.contact_name, contactPhone: row.contact_phone,
  })))
}))

/** @route POST /api/resources/:id/accounts — Link account to this resource */
router.post('/:id/accounts', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const { accountId } = req.body
  if (!accountId) return res.status(400).json({ error: 'accountId is required' })
  await db.query(
    `INSERT INTO account_resources (account_id, resource_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [accountId, req.params.id]
  )
  res.json({ success: true })
}))

/** @route DELETE /api/resources/:id/accounts/:accountId — Unlink account */
router.delete('/:id/accounts/:accountId', requireAuth, validateIdParam, asyncHandler(async (req, res) => {
  const accountId = parseInt(req.params.accountId, 10)
  if (isNaN(accountId) || accountId < 1) return res.status(400).json({ error: 'Invalid account ID' })
  await db.query('DELETE FROM account_resources WHERE account_id = $1 AND resource_id = $2', [accountId, req.params.id])
  res.json({ success: true })
}))

export default router
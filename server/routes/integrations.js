// ═══════════════════════════════════════════
// Integration Connection Routes
// Manages API keys + connection status for third-party services
// Uses integration_connections table (migration 014)
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOrgId } from '../utils/db.js'

const router = Router()

/** @route GET /api/integrations/sds-manager — Get connection status + masked key */
router.get('/sds-manager', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const r = await db.query(
    `SELECT id, provider, status, config, connected_at, last_sync_at
     FROM integration_connections
     WHERE company_id = $1 AND provider = 'sds_manager'
     LIMIT 1`,
    [orgId]
  )

  if (r.rows.length === 0) {
    return res.json({ connected: false, maskedKey: null })
  }

  const row = r.rows[0]
  const apiKey = row.config?.api_key || ''
  const masked = apiKey ? apiKey.slice(0, 4) + '••••' + apiKey.slice(-4) : null

  res.json({
    connected: row.status === 'active',
    maskedKey: masked,
    connectedAt: row.connected_at,
    lastSyncAt: row.last_sync_at,
  })
}))

/** @route POST /api/integrations/sds-manager — Save API key (upsert) */
router.post('/sds-manager', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const { apiKey } = req.body

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 8) {
    return res.status(400).json({ error: 'API key is required (min 8 characters)' })
  }

  const configJson = JSON.stringify({ api_key: apiKey.trim() })

  // Check if connection already exists
  const existing = await db.query(
    `SELECT id FROM integration_connections
     WHERE company_id = $1 AND provider = 'sds_manager'
     LIMIT 1`,
    [orgId]
  )

  let r
  if (existing.rows.length > 0) {
    r = await db.query(
      `UPDATE integration_connections
       SET config = $1, status = 'active', connected_at = NOW()
       WHERE id = $2
       RETURNING id`,
      [configJson, existing.rows[0].id]
    )
  } else {
    r = await db.query(
      `INSERT INTO integration_connections (company_id, provider, status, config, connected_at)
       VALUES ($1, 'sds_manager', 'active', $2, NOW())
       RETURNING id`,
      [orgId, configJson]
    )
  }

  res.json({ ok: true, id: r.rows[0].id })
}))

/** @route DELETE /api/integrations/sds-manager — Disconnect */
router.delete('/sds-manager', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  await db.query(
    `UPDATE integration_connections
     SET status = 'disconnected', config = '{}'
     WHERE company_id = $1 AND provider = 'sds_manager'`,
    [orgId]
  )
  res.json({ ok: true })
}))

/** @route POST /api/integrations/sds-manager/search — Proxy search to SDS Manager API */
router.post('/sds-manager/search', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)
  const { query } = req.body

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Search query is required' })
  }

  // Get API key from integration_connections
  const conn = await db.query(
    `SELECT config FROM integration_connections
     WHERE company_id = $1 AND provider = 'sds_manager' AND status = 'active'
     LIMIT 1`,
    [orgId]
  )

  if (conn.rows.length === 0 || !conn.rows[0].config?.api_key) {
    return res.status(400).json({ error: 'SDS Manager not connected. Add your API key in Settings.' })
  }

  // TODO: Replace with real SDS Manager API call when ready
  // const apiKey = conn.rows[0].config.api_key
  // const response = await fetch(`${SDS_MANAGER_BASE}/search?q=${encodeURIComponent(query)}`, {
  //   headers: { 'Authorization': `Bearer ${apiKey}` }
  // })
  // const data = await response.json()
  // return res.json(data.results.map(mapSDSManagerResponse))

  // For now, return empty results with a message
  res.json({ results: [], message: 'SDS Manager search connected — real API results will appear when the integration goes live.' })
}))

/** @route POST /api/integrations/sds-manager/sync — Sync all imported records */
router.post('/sds-manager/sync', requireAuth, asyncHandler(async (req, res) => {
  const orgId = getOrgId(req)

  const conn = await db.query(
    `SELECT config FROM integration_connections
     WHERE company_id = $1 AND provider = 'sds_manager' AND status = 'active'
     LIMIT 1`,
    [orgId]
  )

  if (conn.rows.length === 0 || !conn.rows[0].config?.api_key) {
    return res.status(400).json({ error: 'SDS Manager not connected' })
  }

  // TODO: Implement actual sync logic
  // Update last_sync_at timestamp
  await db.query(
    `UPDATE integration_connections SET last_sync_at = NOW()
     WHERE company_id = $1 AND provider = 'sds_manager'`,
    [orgId]
  )

  res.json({ ok: true, synced: 0, message: 'Sync infrastructure ready — records will sync when the integration goes live.' })
}))

export default router

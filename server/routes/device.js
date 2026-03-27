// ═══════════════════════════════════════════
// Device Routes — Registration code management
//
// Database-backed registration codes that admins
// can generate, set expiry on, and revoke.
// Field devices verify codes to register.
// ═══════════════════════════════════════════

import { Router } from 'express'
import crypto from 'crypto'
import rateLimit from 'express-rate-limit'
import QRCode from 'qrcode'
import { validateBody } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOrgId } from '../utils/db.js'
import db from '../db.js'

const router = Router()

// ── Helpers ──

/** Generate a random 8-char alphanumeric code like "CRPT-A3K9" */
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I confusion
  let rand = ''
  for (let i = 0; i < 4; i++) rand += chars[crypto.randomInt(chars.length)]
  return `CRPT-${rand}`
}

// Rate-limit verify: 5 attempts per 15 min per IP
const codeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts — try again later' },
})

// ── Public: verify a registration code ──

router.post('/verify-code',
  codeLimiter,
  validateBody({ code: { required: true, type: 'string' } }),
  asyncHandler(async (req, res) => {
    const { code } = req.body
    const trimmed = code.trim().toUpperCase()

    // 1. Check DB for a valid, non-revoked, non-expired code
    const { rows } = await db.query(
      `SELECT rc.*, o.name AS org_name
       FROM registration_codes rc
       JOIN organizations o ON o.id = rc.org_id
       WHERE UPPER(rc.code) = $1
         AND rc.revoked = false
         AND (rc.expires_at IS NULL OR rc.expires_at > NOW())`,
      [trimmed]
    )

    if (rows.length === 0) {
      // Fallback: check legacy CompanyCode env var for backwards compat
      const legacyCode = process.env.CompanyCode
      if (legacyCode && trimmed === legacyCode.trim().toUpperCase()) {
        return res.json({
          valid: true,
          company: {
            name: process.env.VITE_APP_NAME || 'CruPoint',
            code: legacyCode.trim().toUpperCase(),
          },
        })
      }
      return res.status(401).json({ error: 'Invalid or expired registration code' })
    }

    const row = rows[0]
    res.json({
      valid: true,
      company: {
        name: row.org_name || 'CruPoint',
        code: row.code,
        orgId: row.org_id,
      },
    })
  })
)

// ── Protected: list active codes for this org ──

router.get('/codes',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { rows } = await db.query(
      `SELECT id, code, label, expires_at, revoked, created_at
       FROM registration_codes
       WHERE org_id = $1
       ORDER BY created_at DESC`,
      [orgId]
    )
    res.json(rows)
  })
)

// ── Protected: create a new registration code ──

router.post('/codes',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { label, expiresIn } = req.body // expiresIn: "1h", "24h", "7d", "30d", or null (never)

    // Generate unique code (retry on collision)
    let code, attempts = 0
    while (attempts < 10) {
      code = generateCode()
      const exists = await db.query('SELECT 1 FROM registration_codes WHERE code = $1', [code])
      if (exists.rows.length === 0) break
      attempts++
    }

    // Calculate expiry
    let expiresAt = null
    if (expiresIn) {
      const now = new Date()
      const match = expiresIn.match(/^(\d+)(h|d)$/)
      if (match) {
        const [, num, unit] = match
        if (unit === 'h') now.setHours(now.getHours() + parseInt(num))
        else if (unit === 'd') now.setDate(now.getDate() + parseInt(num))
        expiresAt = now.toISOString()
      }
    }

    const { rows } = await db.query(
      `INSERT INTO registration_codes (org_id, code, label, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, code, label, expires_at, revoked, created_at`,
      [orgId, code, label || null, expiresAt, req.user?.id || null]
    )

    res.status(201).json(rows[0])
  })
)

// ── Protected: revoke a code ──

router.delete('/codes/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { id } = req.params

    const { rowCount } = await db.query(
      `UPDATE registration_codes SET revoked = true
       WHERE id = $1 AND org_id = $2 AND revoked = false`,
      [id, orgId]
    )

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Code not found or already revoked' })
    }

    res.json({ ok: true })
  })
)

// ── Protected: generate QR code for a specific registration code ──

router.get('/codes/:id/qr',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { id } = req.params

    const { rows } = await db.query(
      `SELECT rc.code, o.name AS org_name
       FROM registration_codes rc
       JOIN organizations o ON o.id = rc.org_id
       WHERE rc.id = $1 AND rc.org_id = $2`,
      [id, orgId]
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Code not found' })
    }

    const payload = JSON.stringify({
      app: 'crupoint',
      code: rows[0].code,
    })

    const svg = await QRCode.toString(payload, {
      type: 'svg',
      width: 280,
      margin: 2,
      color: { dark: '#0F172A', light: '#FFFFFF' },
    })

    res.json({
      svg,
      code: rows[0].code,
      company: rows[0].org_name || 'CruPoint',
    })
  })
)

export default router

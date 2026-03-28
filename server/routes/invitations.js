// ═══════════════════════════════════════════
// Invitation Routes — Team member invitations
//
// MVP: No email sending — returns invite link
// for manual sharing via "Copy Link" button.
// ═══════════════════════════════════════════

import { Router } from 'express'
import crypto from 'crypto'
import db from '../db.js'
import supabase from '../lib/supabase.js'
import { requireAuth, signToken } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getOrgId } from '../utils/db.js'
import { validateBody } from '../middleware/validate.js'
import { logger } from '../utils/logger.js'

const router = Router()

// ── Helpers ──
const VALID_ROLES = ['owner', 'manager', 'viewer']
const INVITE_EXPIRY_DAYS = 7

/** All available page keys for permissions */
const ALL_PAGES = [
  'employees',
  'crews',
  'vehicles',
  'equipment',
  'training',
  'certifications',
  'incidents',
  'sds',
  'documents',
  'reports',
  'projects',
  'schedule',
]

// ═══════════════════════════════════════════
// List invitations for org
// ═══════════════════════════════════════════

/** @route GET /api/invitations — List org invitations */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)

    const r = await db.query(
      `SELECT i.id, i.email, i.role, i.permissions, i.status, i.token,
            i.expires_at, i.created_at, a.name AS invited_by_name
     FROM invitations i
     LEFT JOIN admins a ON a.id = i.invited_by
     WHERE i.org_id = $1
     ORDER BY i.created_at DESC`,
      [orgId],
    )

    res.json(r.rows)
  }),
)

// ═══════════════════════════════════════════
// List org members (admins)
// ═══════════════════════════════════════════

/** @route GET /api/invitations/members — List org members */
router.get(
  '/members',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)

    const r = await db.query(
      `SELECT id, name, email, role, permissions, created_at
     FROM admins
     WHERE org_id = $1 AND active = true
     ORDER BY created_at ASC`,
      [orgId],
    )

    res.json(r.rows)
  }),
)

// ═══════════════════════════════════════════
// Create invitation
// ═══════════════════════════════════════════

/** @route POST /api/invitations — Create a new invitation */
router.post(
  '/',
  requireAuth,
  validateBody({
    email: { required: true, type: 'string' },
    role: { required: true, type: 'string' },
  }),
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const adminId = req.user.adminId

    const { email, role, permissions = {} } = req.body

    // Validate role
    if (!VALID_ROLES.includes(role)) {
      return res
        .status(400)
        .json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` })
    }

    // Check if email is already an org member
    const existing = await db.query(
      'SELECT id FROM admins WHERE LOWER(email) = LOWER($1) AND org_id = $2 AND active = true',
      [email.trim(), orgId],
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'This email is already a member of your organization' })
    }

    // Check for pending invite to same email
    const pendingInvite = await db.query(
      `SELECT id FROM invitations
       WHERE LOWER(email) = LOWER($1) AND org_id = $2 AND status = 'pending' AND expires_at > NOW()`,
      [email.trim(), orgId],
    )
    if (pendingInvite.rows.length > 0) {
      return res.status(409).json({ error: 'A pending invitation already exists for this email' })
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

    // Sanitize permissions — only keep valid page keys
    const cleanPerms = {}
    if (permissions.pages && typeof permissions.pages === 'object') {
      cleanPerms.pages = {}
      for (const key of ALL_PAGES) {
        if (key in permissions.pages) {
          cleanPerms.pages[key] = !!permissions.pages[key]
        }
      }
    }

    const r = await db.query(
      `INSERT INTO invitations (org_id, email, role, permissions, invited_by, token, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, role, permissions, status, token, expires_at, created_at`,
      [
        orgId,
        email.trim().toLowerCase(),
        role,
        JSON.stringify(cleanPerms),
        adminId,
        token,
        expiresAt,
      ],
    )

    const invite = r.rows[0]
    logger.info({ inviteId: invite.id, email: invite.email, role }, 'Invitation created')

    res.status(201).json(invite)
  }),
)

// ═══════════════════════════════════════════
// Revoke invitation
// ═══════════════════════════════════════════

/** @route DELETE /api/invitations/:id — Revoke an invitation */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orgId = getOrgId(req)
    const { id } = req.params

    const r = await db.query(
      `UPDATE invitations SET status = 'revoked'
     WHERE id = $1 AND org_id = $2 AND status = 'pending'
     RETURNING id`,
      [id, orgId],
    )

    if (!r.rows.length) {
      return res.status(404).json({ error: 'Invitation not found or already processed' })
    }

    res.json({ success: true })
  }),
)

// ═══════════════════════════════════════════
// Validate invite token (public)
// ═══════════════════════════════════════════

/** @route GET /api/invitations/accept/:token — Validate token, return org info */
router.get(
  '/accept/:token',
  asyncHandler(async (req, res) => {
    const { token } = req.params

    const r = await db.query(
      `SELECT i.id, i.email, i.role, i.permissions, i.status, i.expires_at,
            o.name AS org_name
     FROM invitations i
     JOIN organizations o ON o.id = i.org_id
     WHERE i.token = $1`,
      [token],
    )

    if (!r.rows.length) {
      return res.status(404).json({ error: 'Invitation not found' })
    }

    const invite = r.rows[0]

    if (invite.status !== 'pending') {
      return res.status(410).json({ error: 'This invitation has already been used or revoked' })
    }

    if (new Date(invite.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This invitation has expired' })
    }

    res.json({
      email: invite.email,
      role: invite.role,
      permissions: invite.permissions,
      orgName: invite.org_name,
    })
  }),
)

// ═══════════════════════════════════════════
// Accept invitation (public)
// ═══════════════════════════════════════════

/** @route POST /api/invitations/accept/:token — Accept invite, create account */
router.post(
  '/accept/:token',
  validateBody({
    name: { required: true, type: 'string' },
    password: { required: true, type: 'string' },
  }),
  asyncHandler(async (req, res) => {
    const { token } = req.params
    const { name, password } = req.body

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }

    // Fetch invitation
    const invR = await db.query(
      `SELECT i.*, o.name AS org_name
       FROM invitations i
       JOIN organizations o ON o.id = i.org_id
       WHERE i.token = $1`,
      [token],
    )

    if (!invR.rows.length) {
      return res.status(404).json({ error: 'Invitation not found' })
    }

    const invite = invR.rows[0]

    if (invite.status !== 'pending') {
      return res.status(410).json({ error: 'This invitation has already been used or revoked' })
    }

    if (new Date(invite.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This invitation has expired' })
    }

    // Check if email already exists as admin
    const existingAdmin = await db.query(
      'SELECT id FROM admins WHERE LOWER(email) = LOWER($1) AND active = true',
      [invite.email],
    )
    if (existingAdmin.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    let supabaseUid = null
    let authToken = null

    // Create Supabase auth user if available
    if (supabase) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: invite.email,
        password,
        email_confirm: true,
      })

      if (error) {
        logger.error({ err: error }, 'Failed to create Supabase user for invite')
        return res.status(500).json({ error: 'Failed to create account. Please try again.' })
      }

      supabaseUid = data.user.id

      // Sign in to get a session token
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: invite.email,
        password,
      })

      if (!signInErr && signInData.session) {
        authToken = signInData.session.access_token
      }
    }

    // Create admin record
    const adminR = await db.query(
      `INSERT INTO admins (name, email, role, permissions, org_id, supabase_uid, active)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, name, email, role, permissions`,
      [
        name.trim(),
        invite.email,
        invite.role,
        JSON.stringify(invite.permissions),
        invite.org_id,
        supabaseUid,
      ],
    )

    const newAdmin = adminR.rows[0]

    // If no Supabase token, sign a legacy JWT
    if (!authToken) {
      authToken = signToken({
        type: 'admin',
        adminId: newAdmin.id,
        role: newAdmin.role,
        orgId: invite.org_id,
      })
    }

    // Mark invitation as accepted
    await db.query(
      `UPDATE invitations SET status = 'accepted', accepted_at = NOW() WHERE id = $1`,
      [invite.id],
    )

    logger.info(
      { adminId: newAdmin.id, email: invite.email, role: invite.role },
      'Invitation accepted',
    )

    res.json({
      id: newAdmin.id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role,
      permissions: newAdmin.permissions,
      token: authToken,
    })
  }),
)

export default router

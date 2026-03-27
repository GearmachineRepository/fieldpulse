// ═══════════════════════════════════════════
// Invitations API — CRUD for team invitations
// ═══════════════════════════════════════════

import { request } from './core.js'

/** List all invitations for the current org */
export function getInvitations() {
  return request('/invitations')
}

/** List all admin members for the current org */
export function getOrgMembers() {
  return request('/invitations/members')
}

/** Create a new invitation */
export function createInvitation({ email, role, permissions }) {
  return request('/invitations', {
    method: 'POST',
    body: JSON.stringify({ email, role, permissions }),
  })
}

/** Revoke (delete) a pending invitation */
export function revokeInvitation(id) {
  return request(`/invitations/${id}`, { method: 'DELETE' })
}

/** Validate an invitation token (public) */
export function validateInviteToken(token) {
  return request(`/invitations/accept/${token}`)
}

/** Accept an invitation — creates account */
export function acceptInvitation(token, { name, password }) {
  return request(`/invitations/accept/${token}`, {
    method: 'POST',
    body: JSON.stringify({ name, password }),
  })
}

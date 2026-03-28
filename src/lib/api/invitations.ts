// ═══════════════════════════════════════════
// Invitations API — CRUD for team invitations
// ═══════════════════════════════════════════

import { request } from './core.js'
import type { Id, Invitation, OrgMember, AdminUser } from '@/types'

/** List all invitations for the current org */
export function getInvitations(): Promise<Invitation[]> {
  return request<Invitation[]>('/invitations')
}

/** List all admin members for the current org */
export function getOrgMembers(): Promise<OrgMember[]> {
  return request<OrgMember[]>('/invitations/members')
}

/** Create a new invitation */
export function createInvitation({ email, role, permissions }: { email: string; role: string; permissions?: string[] }): Promise<Invitation> {
  return request<Invitation>('/invitations', {
    method: 'POST',
    body: JSON.stringify({ email, role, permissions }),
  })
}

/** Revoke (delete) a pending invitation */
export function revokeInvitation(id: Id): Promise<void> {
  return request<void>(`/invitations/${id}`, { method: 'DELETE' })
}

/** Validate an invitation token (public) */
export function validateInviteToken(token: string): Promise<Invitation> {
  return request<Invitation>(`/invitations/accept/${token}`)
}

/** Accept an invitation — creates account */
export function acceptInvitation(token: string, { name, password }: { name: string; password: string }): Promise<AdminUser> {
  return request<AdminUser>(`/invitations/accept/${token}`, {
    method: 'POST',
    body: JSON.stringify({ name, password }),
  })
}

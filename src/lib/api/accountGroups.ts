// ═══════════════════════════════════════════
// Account Groups API — Group management for accounts
// ═══════════════════════════════════════════
import type { AccountGroup, Id } from '@/types'
import { request } from './core.js'

export const getAccountGroups = (): Promise<AccountGroup[]> =>
  request<AccountGroup[]>('/account-groups')
export const createAccountGroup = (d: Partial<AccountGroup>): Promise<AccountGroup> =>
  request<AccountGroup>('/account-groups', { method: 'POST', body: JSON.stringify(d) })
export const updateAccountGroup = (id: Id, d: Partial<AccountGroup>): Promise<AccountGroup> =>
  request<AccountGroup>(`/account-groups/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteAccountGroup = (id: Id): Promise<void> =>
  request<void>(`/account-groups/${id}`, { method: 'DELETE' })

// ═══════════════════════════════════════════
// Accounts API — CRUD operations for customer accounts
// ═══════════════════════════════════════════
import type { Account, Id, Resource } from '@/types'
import { request, buildQuery } from './core.js'

export const getAccounts = (params: Record<string, unknown> = {}): Promise<Account[]> =>
  request<Account[]>(`/accounts${buildQuery(params)}`)
export const createAccount = (d: Partial<Account>): Promise<Account> =>
  request<Account>('/accounts', { method: 'POST', body: JSON.stringify(d) })
export const updateAccount = (id: Id, d: Partial<Account>): Promise<Account> =>
  request<Account>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteAccount = (id: Id): Promise<void> =>
  request<void>(`/accounts/${id}`, { method: 'DELETE' })
export const geocodeAddress = (address: string): Promise<{ lat: number; lng: number }> =>
  request<{ lat: number; lng: number }>('/accounts/geocode', {
    method: 'POST',
    body: JSON.stringify({ address }),
  })

// Targeted update for estimated service time
export const patchAccountTime = (id: Id, estimatedMinutes: number): Promise<Account> =>
  request<Account>(`/accounts/${id}/estimated-time`, {
    method: 'PATCH',
    body: JSON.stringify({ estimatedMinutes }),
  })

// Account-linked resources
export const getAccountResources = (accountId: Id): Promise<Resource[]> =>
  request<Resource[]>(`/accounts/${accountId}/resources`)
export const linkAccountResource = (accountId: Id, resourceId: Id): Promise<void> =>
  request<void>(`/accounts/${accountId}/resources`, {
    method: 'POST',
    body: JSON.stringify({ resourceId }),
  })
export const unlinkAccountResource = (accountId: Id, resourceId: Id): Promise<void> =>
  request<void>(`/accounts/${accountId}/resources/${resourceId}`, { method: 'DELETE' })

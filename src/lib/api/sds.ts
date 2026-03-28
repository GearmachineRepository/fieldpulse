// ═══════════════════════════════════════════
// SDS API — Safety Data Sheet management
// ═══════════════════════════════════════════
import type { Id, SdsEntry } from '@/types'
import { request } from './core.js'

export const getSdsEntries = (): Promise<SdsEntry[]> =>
  request<SdsEntry[]>('/sds')
export const createSdsEntry = (d: Partial<SdsEntry>): Promise<SdsEntry> =>
  request<SdsEntry>('/sds', { method: 'POST', body: JSON.stringify(d) })
export const updateSdsEntry = (id: Id, d: Partial<SdsEntry>): Promise<SdsEntry> =>
  request<SdsEntry>(`/sds/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteSdsEntry = (id: Id): Promise<void> =>
  request<void>(`/sds/${id}`, { method: 'DELETE' })

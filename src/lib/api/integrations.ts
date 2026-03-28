// ═══════════════════════════════════════════
// Integration API — Client-side functions
// Manages integration connections (SDS Manager, etc.)
// ═══════════════════════════════════════════

import type { IntegrationConnection, SdsEntry } from '@/types'
import { request } from './core.js'

/** Get SDS Manager connection status + masked key */
export const getSDSManagerConnection = (): Promise<IntegrationConnection> =>
  request<IntegrationConnection>('/integrations/sds-manager')

/** Save SDS Manager API key */
export const saveSDSManagerKey = (apiKey: string): Promise<IntegrationConnection> =>
  request<IntegrationConnection>('/integrations/sds-manager', {
    method: 'POST',
    body: JSON.stringify({ apiKey }),
  })

/** Disconnect SDS Manager */
export const disconnectSDSManager = (): Promise<void> =>
  request<void>('/integrations/sds-manager', { method: 'DELETE' })

/** Search SDS Manager (server-proxied) */
export const searchSDSManagerAPI = (query: string): Promise<SdsEntry[]> =>
  request<SdsEntry[]>('/integrations/sds-manager/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  })

/** Trigger sync of all imported SDS records */
export const syncSDSManagerLibrary = (): Promise<{ synced: number }> =>
  request<{ synced: number }>('/integrations/sds-manager/sync', { method: 'POST' })

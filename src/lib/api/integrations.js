// ═══════════════════════════════════════════
// Integration API — Client-side functions
// Manages integration connections (SDS Manager, etc.)
// ═══════════════════════════════════════════

import { request } from './core.js'

/** Get SDS Manager connection status + masked key */
export const getSDSManagerConnection = () =>
  request('/integrations/sds-manager')

/** Save SDS Manager API key */
export const saveSDSManagerKey = (apiKey) =>
  request('/integrations/sds-manager', {
    method: 'POST',
    body: JSON.stringify({ apiKey }),
  })

/** Disconnect SDS Manager */
export const disconnectSDSManager = () =>
  request('/integrations/sds-manager', { method: 'DELETE' })

/** Search SDS Manager (server-proxied) */
export const searchSDSManagerAPI = (query) =>
  request('/integrations/sds-manager/search', {
    method: 'POST',
    body: JSON.stringify({ query }),
  })

/** Trigger sync of all imported SDS records */
export const syncSDSManagerLibrary = () =>
  request('/integrations/sds-manager/sync', { method: 'POST' })

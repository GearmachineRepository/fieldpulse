// ═══════════════════════════════════════════
// SDS API — Safety Data Sheet management
// ═══════════════════════════════════════════
import { request } from './core.js'

export const getSdsEntries = () => request('/sds')
export const createSdsEntry = (d) => request('/sds', { method: 'POST', body: JSON.stringify(d) })
export const updateSdsEntry = (id, d) =>
  request(`/sds/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteSdsEntry = (id) => request(`/sds/${id}`, { method: 'DELETE' })

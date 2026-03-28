// ═══════════════════════════════════════════
// Crews API — Crew management operations
// ═══════════════════════════════════════════
import { request } from './core.js'

export const getCrewLoginTiles = () => request('/crews/login-tiles')
export const getCrews = () => request('/crews')
export const createCrew = (d) => request('/crews', { method: 'POST', body: JSON.stringify(d) })
export const updateCrew = (id, d) =>
  request(`/crews/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteCrew = (id) => request(`/crews/${id}`, { method: 'DELETE' })

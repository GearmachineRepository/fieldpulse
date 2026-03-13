// ═══════════════════════════════════════════
// Spray Logs API — Spray log submission and retrieval
// ═══════════════════════════════════════════
import { request, multipartRequest, buildQuery } from './core.js'

export const createSprayLog  = (d)           => request('/spray-logs', { method: 'POST', body: JSON.stringify(d) })
export const getSprayLogs    = (params = {}) => request(`/spray-logs${buildQuery(params)}`)
export const getAllSprayLogs  = ()            => request('/spray-logs?limit=500')
export const deleteSprayLog  = (id)          => request(`/spray-logs/${id}`, { method: 'DELETE' })

export const uploadPhotos = async (logId, files) => {
  const fd = new FormData()
  files.forEach(f => fd.append('photos', f))
  return multipartRequest(`/spray-logs/${logId}/photos`, fd)
}

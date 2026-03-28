// ═══════════════════════════════════════════
// Incidents API — Incident CRUD + lock + photos
// ═══════════════════════════════════════════
import { request, multipartRequest } from './core.js'

export const getIncidents = () => request('/incidents')
export const getIncident = (id) => request(`/incidents/${id}`)
export const createIncident = (data) =>
  request('/incidents', { method: 'POST', body: JSON.stringify(data) })
export const updateIncident = (id, data) =>
  request(`/incidents/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const lockIncident = (id) => request(`/incidents/${id}/lock`, { method: 'PUT' })
export const deleteIncident = (id) => request(`/incidents/${id}`, { method: 'DELETE' })

// ── Photos ──
export const getIncidentPhotos = (incidentId) => request(`/incidents/${incidentId}/photos`)
export const uploadIncidentPhoto = (incidentId, file, caption) => {
  const fd = new FormData()
  fd.append('photo', file)
  if (caption) fd.append('caption', caption)
  return multipartRequest(`/incidents/${incidentId}/photos`, fd)
}
export const deleteIncidentPhoto = (incidentId, photoId) =>
  request(`/incidents/${incidentId}/photos/${photoId}`, { method: 'DELETE' })

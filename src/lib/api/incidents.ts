// ═══════════════════════════════════════════
// Incidents API — Incident CRUD + lock + photos
// ═══════════════════════════════════════════
import type { Id, Incident, Photo } from '@/types'
import { request, multipartRequest } from './core.js'

export const getIncidents = (): Promise<Incident[]> =>
  request<Incident[]>('/incidents')
export const getIncident = (id: Id): Promise<Incident> =>
  request<Incident>(`/incidents/${id}`)
export const createIncident = (data: Partial<Incident>): Promise<Incident> =>
  request<Incident>('/incidents', { method: 'POST', body: JSON.stringify(data) })
export const updateIncident = (id: Id, data: Partial<Incident>): Promise<Incident> =>
  request<Incident>(`/incidents/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const lockIncident = (id: Id): Promise<Incident> =>
  request<Incident>(`/incidents/${id}/lock`, { method: 'PUT' })
export const deleteIncident = (id: Id): Promise<void> =>
  request<void>(`/incidents/${id}`, { method: 'DELETE' })

// ── Photos ──
export const getIncidentPhotos = (incidentId: Id): Promise<Photo[]> =>
  request<Photo[]>(`/incidents/${incidentId}/photos`)
export const uploadIncidentPhoto = (incidentId: Id, file: File, caption?: string): Promise<Photo> => {
  const fd = new FormData()
  fd.append('photo', file)
  if (caption) fd.append('caption', caption)
  return multipartRequest<Photo>(`/incidents/${incidentId}/photos`, fd)
}
export const deleteIncidentPhoto = (incidentId: Id, photoId: Id): Promise<void> =>
  request<void>(`/incidents/${incidentId}/photos/${photoId}`, { method: 'DELETE' })

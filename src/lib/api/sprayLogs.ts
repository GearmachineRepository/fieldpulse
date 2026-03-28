// ═══════════════════════════════════════════
// Spray Logs API — Spray log submission and retrieval
// ═══════════════════════════════════════════
import type { Id, SprayLog, Photo } from '@/types'
import { request, multipartRequest, buildQuery } from './core.js'

export const createSprayLog = (d: Partial<SprayLog>): Promise<SprayLog> =>
  request<SprayLog>('/spray-logs', { method: 'POST', body: JSON.stringify(d) })
export const getSprayLogs = (params: Record<string, unknown> = {}): Promise<SprayLog[]> =>
  request<SprayLog[]>(`/spray-logs${buildQuery(params)}`)
export const getAllSprayLogs = (): Promise<SprayLog[]> =>
  request<SprayLog[]>('/spray-logs?limit=500')
export const deleteSprayLog = (id: Id): Promise<void> =>
  request<void>(`/spray-logs/${id}`, { method: 'DELETE' })

export const uploadPhotos = async (logId: Id, files: File[]): Promise<Photo[]> => {
  const fd = new FormData()
  files.forEach((f) => fd.append('photos', f))
  return multipartRequest<Photo[]>(`/spray-logs/${logId}/photos`, fd)
}

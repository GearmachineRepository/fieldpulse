// ═══════════════════════════════════════════
// Crews API — Crew management operations
// ═══════════════════════════════════════════
import type { Crew, CrewLoginTile, Id } from '@/types'
import { request } from './core.js'

export const getCrewLoginTiles = (): Promise<CrewLoginTile[]> =>
  request<CrewLoginTile[]>('/crews/login-tiles')
export const getCrews = (): Promise<Crew[]> => request<Crew[]>('/crews')
export const createCrew = (d: Partial<Crew>): Promise<Crew> =>
  request<Crew>('/crews', { method: 'POST', body: JSON.stringify(d) })
export const updateCrew = (id: Id, d: Partial<Crew>): Promise<Crew> =>
  request<Crew>(`/crews/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteCrew = (id: Id): Promise<void> =>
  request<void>(`/crews/${id}`, { method: 'DELETE' })

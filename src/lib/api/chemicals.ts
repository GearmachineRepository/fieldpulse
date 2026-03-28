// ═══════════════════════════════════════════
// Chemicals API — Chemical product management
// ═══════════════════════════════════════════
import { request } from './core.js'
import type { Id, Chemical } from '@/types'

export const getChemicals = (): Promise<Chemical[]> => request<Chemical[]>('/chemicals')
export const createChemical = (d: Partial<Chemical>): Promise<Chemical> =>
  request<Chemical>('/chemicals', { method: 'POST', body: JSON.stringify(d) })
export const updateChemical = (id: Id, d: Partial<Chemical>): Promise<Chemical> =>
  request<Chemical>(`/chemicals/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteChemical = (id: Id): Promise<void> => request<void>(`/chemicals/${id}`, { method: 'DELETE' })

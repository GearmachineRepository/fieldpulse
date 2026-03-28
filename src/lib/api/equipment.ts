// ═══════════════════════════════════════════
// Equipment API — Equipment management
// ═══════════════════════════════════════════
import type { Equipment, Id } from '@/types'
import { request } from './core.js'

export const getEquipment = (): Promise<Equipment[]> => request<Equipment[]>('/equipment')
export const createEquipment = (d: Partial<Equipment>): Promise<Equipment> =>
  request<Equipment>('/equipment', { method: 'POST', body: JSON.stringify(d) })
export const updateEquipment = (id: Id, d: Partial<Equipment>): Promise<Equipment> =>
  request<Equipment>(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteEquipment = (id: Id): Promise<void> =>
  request<void>(`/equipment/${id}`, { method: 'DELETE' })

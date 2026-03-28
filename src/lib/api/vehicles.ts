// ═══════════════════════════════════════════
// Vehicles API — Fleet vehicle management
// ═══════════════════════════════════════════
import { request } from './core.js'
import type { Id, Vehicle } from '@/types'

export const getVehicles = (): Promise<Vehicle[]> => request<Vehicle[]>('/vehicles')
export const createVehicle = (d: Partial<Vehicle>): Promise<Vehicle> =>
  request<Vehicle>('/vehicles', { method: 'POST', body: JSON.stringify(d) })
export const updateVehicle = (id: Id, d: Partial<Vehicle>): Promise<Vehicle> =>
  request<Vehicle>(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteVehicle = (id: Id): Promise<void> => request<void>(`/vehicles/${id}`, { method: 'DELETE' })

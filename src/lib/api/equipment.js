// ═══════════════════════════════════════════
// Equipment API — Equipment management
// ═══════════════════════════════════════════
import { request } from './core.js'

export const getEquipment = () => request('/equipment')
export const createEquipment = (d) =>
  request('/equipment', { method: 'POST', body: JSON.stringify(d) })
export const updateEquipment = (id, d) =>
  request(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteEquipment = (id) => request(`/equipment/${id}`, { method: 'DELETE' })

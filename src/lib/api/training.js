// ═══════════════════════════════════════════
// Training API — Session + Signoff operations
// ═══════════════════════════════════════════
import { request } from './core.js'

export const getTrainingSessions = () => request('/training')
export const getTrainingSession = (id) => request(`/training/${id}`)
export const createTrainingSession = (data) => request('/training', { method: 'POST', body: JSON.stringify(data) })
export const updateTrainingSession = (id, data) => request(`/training/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteTrainingSession = (id) => request(`/training/${id}`, { method: 'DELETE' })
export const getSessionSignoffs = (sessionId) => request(`/training/${sessionId}/signoffs`)
export const addSignoff = (sessionId, employeeId) => request(`/training/${sessionId}/signoffs`, { method: 'POST', body: JSON.stringify({ employee_id: employeeId }) })

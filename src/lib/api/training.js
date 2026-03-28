// ═══════════════════════════════════════════
// Training API — Session + Signoff operations
// ═══════════════════════════════════════════
import { request, buildQuery } from './core.js'

export const getTrainingSessions = (params = {}) => request(`/training${buildQuery(params)}`)
export const getTrainingSession = (id) => request(`/training/${id}`)
export const createTrainingSession = (data) =>
  request('/training', { method: 'POST', body: JSON.stringify(data) })
export const updateTrainingSession = (id, data) =>
  request(`/training/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteTrainingSession = (id) => request(`/training/${id}`, { method: 'DELETE' })
export const getSessionSignoffs = (sessionId) => request(`/training/${sessionId}/signoffs`)
export const addSignoff = (sessionId, employeeId) =>
  request(`/training/${sessionId}/signoffs`, {
    method: 'POST',
    body: JSON.stringify({ employeeId }),
  })

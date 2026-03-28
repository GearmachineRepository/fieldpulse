// ═══════════════════════════════════════════
// Training API — Session + Signoff operations
// ═══════════════════════════════════════════
import { request, buildQuery } from './core.js'
import type { Id, TrainingSession, TrainingSignoff } from '@/types'

export const getTrainingSessions = (params: Record<string, unknown> = {}): Promise<TrainingSession[]> => request<TrainingSession[]>(`/training${buildQuery(params)}`)
export const getTrainingSession = (id: Id): Promise<TrainingSession> => request<TrainingSession>(`/training/${id}`)
export const createTrainingSession = (data: Partial<TrainingSession>): Promise<TrainingSession> =>
  request<TrainingSession>('/training', { method: 'POST', body: JSON.stringify(data) })
export const updateTrainingSession = (id: Id, data: Partial<TrainingSession>): Promise<TrainingSession> =>
  request<TrainingSession>(`/training/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteTrainingSession = (id: Id): Promise<void> => request<void>(`/training/${id}`, { method: 'DELETE' })
export const getSessionSignoffs = (sessionId: Id): Promise<TrainingSignoff[]> => request<TrainingSignoff[]>(`/training/${sessionId}/signoffs`)
export const addSignoff = (sessionId: Id, employeeId: Id): Promise<TrainingSignoff> =>
  request<TrainingSignoff>(`/training/${sessionId}/signoffs`, {
    method: 'POST',
    body: JSON.stringify({ employeeId }),
  })

// ═══════════════════════════════════════════
// Schedule Events API — Calendar event management
// ═══════════════════════════════════════════
import { request, buildQuery } from './core.js'
import type { Id, ScheduleEvent } from '@/types'

export const getScheduleEvents = (params: Record<string, unknown> = {}): Promise<ScheduleEvent[]> => request<ScheduleEvent[]>(`/schedule-events${buildQuery(params)}`)
export const createScheduleEvent = (d: Partial<ScheduleEvent>): Promise<ScheduleEvent> =>
  request<ScheduleEvent>('/schedule-events', { method: 'POST', body: JSON.stringify(d) })
export const updateScheduleEvent = (id: Id, d: Partial<ScheduleEvent>): Promise<ScheduleEvent> =>
  request<ScheduleEvent>(`/schedule-events/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteScheduleEvent = (id: Id): Promise<void> => request<void>(`/schedule-events/${id}`, { method: 'DELETE' })

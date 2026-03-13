// ═══════════════════════════════════════════
// Schedule Events API — Calendar event management
// ═══════════════════════════════════════════
import { request, buildQuery } from './core.js'

export const getScheduleEvents   = (params = {}) => request(`/schedule-events${buildQuery(params)}`)
export const createScheduleEvent = (d)            => request('/schedule-events', { method: 'POST', body: JSON.stringify(d) })
export const updateScheduleEvent = (id, d)        => request(`/schedule-events/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteScheduleEvent = (id)           => request(`/schedule-events/${id}`, { method: 'DELETE' })

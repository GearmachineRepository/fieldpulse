// ═══════════════════════════════════════════
// Rosters API — Daily crew roster management
// ═══════════════════════════════════════════
import { request, buildQuery } from './core.js'

export const submitRoster      = (d)           => request('/rosters', { method: 'POST', body: JSON.stringify(d) })
export const getRosters        = (params = {}) => request(`/rosters${buildQuery(params)}`)
export const getTodayRoster    = (crewId)      => request(`/rosters/today${buildQuery({ crewId })}`)
export const getAttendanceToday = ()           => request('/rosters/attendance-today')
export const deleteRoster      = (id)          => request(`/rosters/${id}`, { method: 'DELETE' })

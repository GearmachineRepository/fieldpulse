// ═══════════════════════════════════════════
// Rosters API — Daily crew roster management
// ═══════════════════════════════════════════
import { request, buildQuery } from './core.js'
import type { Id, Roster, RosterMember } from '@/types'

export const submitRoster = (d: Partial<Roster>): Promise<Roster> => request<Roster>('/rosters', { method: 'POST', body: JSON.stringify(d) })
export const getRosters = (params: Record<string, unknown> = {}): Promise<Roster[]> => request<Roster[]>(`/rosters${buildQuery(params)}`)
export const getTodayRoster = (crewId: Id): Promise<Roster & { members: RosterMember[] }> => request<Roster & { members: RosterMember[] }>(`/rosters/today${buildQuery({ crewId })}`)
export const getAttendanceToday = (): Promise<RosterMember[]> => request<RosterMember[]>('/rosters/attendance-today')
export const deleteRoster = (id: Id): Promise<void> => request<void>(`/rosters/${id}`, { method: 'DELETE' })

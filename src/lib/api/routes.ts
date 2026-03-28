// ═══════════════════════════════════════════
// Routes API — Route and stop management
// ═══════════════════════════════════════════
import { request, multipartRequest, buildQuery } from './core.js'
import type { Id, Route, RouteStop, RouteCompletion, Visit, ServiceException } from '@/types'

export const getRoutes = (params: Record<string, unknown> = {}): Promise<Route[]> => request<Route[]>(`/routes${buildQuery(params)}`)
export const getRoute = (id: Id): Promise<Route> => request<Route>(`/routes/${id}`)
export const createRoute = (d: Partial<Route>): Promise<Route> => request<Route>('/routes', { method: 'POST', body: JSON.stringify(d) })
export const updateRoute = (id: Id, d: Partial<Route>): Promise<Route> =>
  request<Route>(`/routes/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteRoute = (id: Id): Promise<void> => request<void>(`/routes/${id}`, { method: 'DELETE' })

export const addRouteStop = (routeId: Id, d: Partial<RouteStop>): Promise<RouteStop> =>
  request<RouteStop>(`/routes/${routeId}/stops`, { method: 'POST', body: JSON.stringify(d) })
export const updateRouteStop = (routeId: Id, stopId: Id, d: Partial<RouteStop>): Promise<RouteStop> =>
  request<RouteStop>(`/routes/${routeId}/stops/${stopId}`, { method: 'PUT', body: JSON.stringify(d) })
export const removeRouteStop = (routeId: Id, stopId: Id): Promise<void> =>
  request<void>(`/routes/${routeId}/stops/${stopId}`, { method: 'DELETE' })
export const reorderRouteStops = (routeId: Id, stopIds: Id[]): Promise<void> =>
  request<void>(`/routes/${routeId}/stops-order`, { method: 'PUT', body: JSON.stringify({ stopIds }) })

// Stop exceptions (skip / pause)
export const addStopException = (routeId: Id, stopId: Id, d: Partial<ServiceException>): Promise<ServiceException> =>
  request<ServiceException>(`/routes/${routeId}/stops/${stopId}/exceptions`, {
    method: 'POST',
    body: JSON.stringify(d),
  })
export const removeStopException = (routeId: Id, stopId: Id, exId: Id): Promise<void> =>
  request<void>(`/routes/${routeId}/stops/${stopId}/exceptions/${exId}`, { method: 'DELETE' })

// Calculated visits (frequency-aware)
export const getScheduleVisits = (start: string, end: string, params: Record<string, unknown> = {}): Promise<Visit[]> =>
  request<Visit[]>(`/routes/schedule/visits${buildQuery({ start, end, ...params })}`)

export const getWeekSchedule = (): Promise<Visit[]> => request<Visit[]>('/routes/schedule/week')
export const getDailyProgress = (date: string): Promise<{ total: number; completed: number; visits: Visit[] }> =>
  request<{ total: number; completed: number; visits: Visit[] }>(`/routes/schedule/daily-progress${buildQuery({ date })}`)
export const getCrewRoutes = (crewId: Id): Promise<Route[]> => request<Route[]>(`/routes/crew/${crewId}`)
export const getRouteDay = (routeId: Id, date: string): Promise<Visit[]> => request<Visit[]>(`/routes/${routeId}/day/${date}`)

export const completeRouteStop = (d: Partial<RouteCompletion>): Promise<RouteCompletion> =>
  request<RouteCompletion>('/routes/completions', { method: 'POST', body: JSON.stringify(d) })
export const undoCompletion = (completionId: Id): Promise<void> =>
  request<void>(`/routes/completions/${completionId}`, { method: 'DELETE' })

export const uploadFieldNotes = async (completionId: Id, files: File[], noteText?: string): Promise<RouteCompletion> => {
  const fd = new FormData()
  files.forEach((f) => fd.append('photos', f))
  if (noteText) fd.append('noteText', noteText)
  return multipartRequest<RouteCompletion>(`/routes/completions/${completionId}/photos`, fd)
}

export const getCompletionLog = (params: Record<string, unknown> = {}): Promise<RouteCompletion[]> =>
  request<RouteCompletion[]>(`/routes/completions/log${buildQuery(params)}`)

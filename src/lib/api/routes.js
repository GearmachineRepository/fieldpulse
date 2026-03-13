// ═══════════════════════════════════════════
// Routes API — Route and stop management
// ═══════════════════════════════════════════
import { request, multipartRequest, buildQuery } from './core.js'

export const getRoutes    = (params = {}) => request(`/routes${buildQuery(params)}`)
export const getRoute     = (id)          => request(`/routes/${id}`)
export const createRoute  = (d)           => request('/routes',     { method: 'POST',   body: JSON.stringify(d) })
export const updateRoute  = (id, d)       => request(`/routes/${id}`, { method: 'PUT',  body: JSON.stringify(d) })
export const deleteRoute  = (id)          => request(`/routes/${id}`, { method: 'DELETE' })

export const addRouteStop      = (routeId, d)          => request(`/routes/${routeId}/stops`,             { method: 'POST',   body: JSON.stringify(d) })
export const updateRouteStop   = (routeId, stopId, d)  => request(`/routes/${routeId}/stops/${stopId}`,   { method: 'PUT',    body: JSON.stringify(d) })
export const removeRouteStop   = (routeId, stopId)     => request(`/routes/${routeId}/stops/${stopId}`,   { method: 'DELETE' })
export const reorderRouteStops = (routeId, stopIds)    => request(`/routes/${routeId}/stops-order`,       { method: 'PUT',    body: JSON.stringify({ stopIds }) })

// Stop exceptions (skip / pause)
export const addStopException    = (routeId, stopId, d) => request(`/routes/${routeId}/stops/${stopId}/exceptions`, { method: 'POST', body: JSON.stringify(d) })
export const removeStopException = (routeId, stopId, exId) => request(`/routes/${routeId}/stops/${stopId}/exceptions/${exId}`, { method: 'DELETE' })

// Calculated visits (frequency-aware)
export const getScheduleVisits = (start, end, params = {}) => request(`/routes/schedule/visits${buildQuery({ start, end, ...params })}`)

export const getWeekSchedule   = ()       => request('/routes/schedule/week')
export const getDailyProgress  = (date)   => request(`/routes/schedule/daily-progress${buildQuery({ date })}`)
export const getCrewRoutes     = (crewId) => request(`/routes/crew/${crewId}`)
export const getRouteDay       = (routeId, date) => request(`/routes/${routeId}/day/${date}`)

export const completeRouteStop = (d)             => request('/routes/completions', { method: 'POST', body: JSON.stringify(d) })
export const undoCompletion    = (completionId)  => request(`/routes/completions/${completionId}`, { method: 'DELETE' })

export const uploadFieldNotes = async (completionId, files, noteText) => {
  const fd = new FormData()
  files.forEach(f => fd.append('photos', f))
  if (noteText) fd.append('noteText', noteText)
  return multipartRequest(`/routes/completions/${completionId}/photos`, fd)
}

export const getCompletionLog = (params = {}) => request(`/routes/completions/log${buildQuery(params)}`)

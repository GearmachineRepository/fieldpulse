// ═══════════════════════════════════════════
// API Client — all backend calls
// ═══════════════════════════════════════════

const BASE = '/api'

let authToken = null
export function setAuthToken(token) { authToken = token }
export function clearAuthToken() { authToken = null }
export function getAuthToken() { return authToken }

async function request(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...opts.headers }
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`
  const res = await fetch(`${BASE}${path}`, { ...opts, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }))
    const err = new Error(body.error || `Request failed (${res.status})`); err.status = res.status; throw err
  }
  return res.json()
}

async function multipartRequest(path, formData, method = 'POST') {
  const headers = {}
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`
  const res = await fetch(`${BASE}${path}`, { method, headers, body: formData })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }))
    const err = new Error(body.error || `Request failed (${res.status})`); err.status = res.status; throw err
  }
  return res.json()
}

// ── Auth ──
export const verifyPin = async (vehicleId, pin) => { const r = await request('/auth/verify-pin', { method: 'POST', body: JSON.stringify({ vehicleId, pin }) }); if (r.token) setAuthToken(r.token); return r }
export const verifyAdminPin = async (adminId, pin) => { const r = await request('/auth/admin-pin', { method: 'POST', body: JSON.stringify({ adminId, pin }) }); if (r.token) setAuthToken(r.token); return r }
export const crewLogin = async (employeeId, pin) => { const r = await request('/auth/crew-login', { method: 'POST', body: JSON.stringify({ employeeId, pin }) }); if (r.token) setAuthToken(r.token); return r }
export const getAdminsList = () => request('/admins/list')
export const getCrewLoginTiles = () => request('/crews/login-tiles')

// ── Vehicles ──
export const getVehicles = () => request('/vehicles')
export const createVehicle = (d) => request('/vehicles', { method: 'POST', body: JSON.stringify(d) })
export const updateVehicle = (id, d) => request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteVehicle = (id) => request(`/vehicles/${id}`, { method: 'DELETE' })

// ── Crews ──
export const getCrews = () => request('/crews')
export const createCrew = (d) => request('/crews', { method: 'POST', body: JSON.stringify(d) })
export const updateCrew = (id, d) => request(`/crews/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteCrew = (id) => request(`/crews/${id}`, { method: 'DELETE' })

// ── Employees ──
export const getEmployees = () => request('/employees')
export const createEmployee = async (data, photoFile) => { const fd = new FormData(); Object.entries(data).forEach(([k, v]) => { if (v != null) fd.append(k, v) }); if (photoFile) fd.append('photo', photoFile); return multipartRequest('/employees', fd) }
export const updateEmployee = async (id, data, photoFile) => { const fd = new FormData(); Object.entries(data).forEach(([k, v]) => { if (v != null) fd.append(k, v) }); if (photoFile) fd.append('photo', photoFile); return multipartRequest(`/employees/${id}`, fd, 'PUT') }
export const deleteEmployee = (id) => request(`/employees/${id}`, { method: 'DELETE' })

// ── Equipment ──
export const getEquipment = () => request('/equipment')
export const createEquipment = (d) => request('/equipment', { method: 'POST', body: JSON.stringify(d) })
export const updateEquipment = (id, d) => request(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteEquipment = (id) => request(`/equipment/${id}`, { method: 'DELETE' })

// ── Chemicals ──
export const getChemicals = () => request('/chemicals')
export const createChemical = (d) => request('/chemicals', { method: 'POST', body: JSON.stringify(d) })
export const updateChemical = (id, d) => request(`/chemicals/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteChemical = (id) => request(`/chemicals/${id}`, { method: 'DELETE' })

// ── Spray Logs ──
export const createSprayLog = (d) => request('/spray-logs', { method: 'POST', body: JSON.stringify(d) })
export const getSprayLogs = (params = {}) => { const q = new URLSearchParams(); if (params.vehicleId) q.set('vehicleId', params.vehicleId); if (params.crewName) q.set('crewName', params.crewName); const qs = q.toString(); return request(`/spray-logs${qs ? `?${qs}` : ''}`) }
export const deleteSprayLog = (id) => request(`/spray-logs/${id}`, { method: 'DELETE' })
export const getAllSprayLogs = () => request('/spray-logs?limit=500')
export const uploadPhotos = async (logId, files) => { const fd = new FormData(); files.forEach(f => fd.append('photos', f)); return multipartRequest(`/spray-logs/${logId}/photos`, fd) }

// ── Rosters ──
export const submitRoster = (d) => request('/rosters', { method: 'POST', body: JSON.stringify(d) })
export const getRosters = (params = {}) => { const qs = Object.entries(params).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join('&'); return request(`/rosters${qs ? `?${qs}` : ''}`) }
export const getTodayRoster = (crewId) => request(`/rosters/today${crewId ? `?crewId=${crewId}` : ''}`)
export const getAttendanceToday = () => request('/rosters/attendance-today')
export const deleteRoster = (id) => request(`/rosters/${id}`, { method: 'DELETE' })

// ── Reports ──
export const getPurReport = (month, year) => request(`/reports/pur?month=${month}&year=${year}`)
export const getPurReportRange = (start, end) => request(`/reports/pur?start=${start}&end=${end}`)
export const getRosterReport = (start, end) => request(`/reports/rosters?start=${start}&end=${end}`)

// ── Accounts ──
export const getAccounts = (params = {}) => { const q = new URLSearchParams(); if (params.search) q.set('search', params.search); if (params.type) q.set('type', params.type); if (params.city) q.set('city', params.city); const qs = q.toString(); return request(`/accounts${qs ? `?${qs}` : ''}`) }
export const createAccount = (d) => request('/accounts', { method: 'POST', body: JSON.stringify(d) })
export const updateAccount = (id, d) => request(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteAccount = (id) => request(`/accounts/${id}`, { method: 'DELETE' })
export const geocodeAddress = (address) => request('/accounts/geocode', { method: 'POST', body: JSON.stringify({ address }) })

// ── Routes ──
export const getRoutes = (params = {}) => { const q = new URLSearchParams(); if (params.crewId) q.set('crewId', params.crewId); if (params.dayOfWeek !== undefined) q.set('dayOfWeek', params.dayOfWeek); const qs = q.toString(); return request(`/routes${qs ? `?${qs}` : ''}`) }
export const getRoute = (id) => request(`/routes/${id}`)
export const createRoute = (d) => request('/routes', { method: 'POST', body: JSON.stringify(d) })
export const updateRoute = (id, d) => request(`/routes/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteRoute = (id) => request(`/routes/${id}`, { method: 'DELETE' })

export const addRouteStop = (routeId, d) => request(`/routes/${routeId}/stops`, { method: 'POST', body: JSON.stringify(d) })
export const removeRouteStop = (routeId, stopId) => request(`/routes/${routeId}/stops/${stopId}`, { method: 'DELETE' })
export const updateRouteStop = (routeId, stopId, d) => request(`/routes/${routeId}/stops/${stopId}`, { method: 'PUT', body: JSON.stringify(d) })
export const reorderRouteStops = (routeId, stopIds) => request(`/routes/${routeId}/stops-order`, { method: 'PUT', body: JSON.stringify({ stopIds }) })

export const getWeekSchedule = () => request('/routes/schedule/week')
export const getDailyProgress = (date) => request(`/routes/schedule/daily-progress${date ? `?date=${date}` : ''}`)

export const getCrewRoutes = (crewId) => request(`/routes/crew/${crewId}`)
export const getRouteDay = (routeId, date) => request(`/routes/${routeId}/day/${date}`)

export const completeRouteStop = (d) => request('/routes/completions', { method: 'POST', body: JSON.stringify(d) })
export const undoCompletion = (completionId) => request(`/routes/completions/${completionId}`, { method: 'DELETE' })
export const uploadFieldNotes = async (completionId, files, noteText) => { const fd = new FormData(); files.forEach(f => fd.append('photos', f)); if (noteText) fd.append('noteText', noteText); return multipartRequest(`/routes/completions/${completionId}/photos`, fd) }

export const getCompletionLog = (params = {}) => {
  const q = new URLSearchParams()
  if (params.start) q.set('start', params.start)
  if (params.end) q.set('end', params.end)
  if (params.crewId) q.set('crewId', params.crewId)
  if (params.routeId) q.set('routeId', params.routeId)
  const qs = q.toString()
  return request(`/routes/completions/log${qs ? `?${qs}` : ''}`)
}

// ── Health ──
export const checkHealth = () => request('/health')
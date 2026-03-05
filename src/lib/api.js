// ═══════════════════════════════════════════
// API Client — all backend calls
// ═══════════════════════════════════════════

const BASE = '/api'

// ── Token management ──
// Token is persisted in sessionStorage so a page refresh doesn't force re-login.
// sessionStorage is cleared when the browser tab is closed, which is the right
// behaviour for a shared-device (iPad/kiosk) app.

const TOKEN_KEY = 'fp_auth_token'

export function setAuthToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearAuthToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY)
}

// ── Core request helpers ──

async function request(path, opts = {}) {
  const token = getAuthToken()
  const headers = { 'Content-Type': 'application/json', ...opts.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...opts, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }))
    const err = new Error(body.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return res.json()
}

async function multipartRequest(path, formData, method = 'POST') {
  const token = getAuthToken()
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { method, headers, body: formData })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }))
    const err = new Error(body.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return res.json()
}

/** Builds a query string from a params object, omitting null/undefined values. */
function buildQuery(params = {}) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') q.set(k, v)
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

// ── Auth ──
export const verifyPin = async (vehicleId, pin) => {
  const r = await request('/auth/verify-pin', { method: 'POST', body: JSON.stringify({ vehicleId, pin }) })
  if (r.token) setAuthToken(r.token)
  return r
}

export const verifyAdminPin = async (adminId, pin) => {
  const r = await request('/auth/admin-pin', { method: 'POST', body: JSON.stringify({ adminId, pin }) })
  if (r.token) setAuthToken(r.token)
  return r
}

export const crewLogin = async (employeeId, pin) => {
  const r = await request('/auth/crew-login', { method: 'POST', body: JSON.stringify({ employeeId, pin }) })
  if (r.token) setAuthToken(r.token)
  return r
}

// ── Health ──
export const checkHealth = () => request('/health')

// ── Admins ──
export const getAdminsList = () => request('/admins/list')

// ── Vehicles ──
export const getVehicles = () => request('/vehicles')
export const createVehicle = (d) => request('/vehicles', { method: 'POST', body: JSON.stringify(d) })
export const updateVehicle = (id, d) => request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteVehicle = (id) => request(`/vehicles/${id}`, { method: 'DELETE' })

// ── Crews ──
export const getCrewLoginTiles = () => request('/crews/login-tiles')
export const getCrews = () => request('/crews')
export const createCrew = (d) => request('/crews', { method: 'POST', body: JSON.stringify(d) })
export const updateCrew = (id, d) => request(`/crews/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteCrew = (id) => request(`/crews/${id}`, { method: 'DELETE' })

// ── Employees ──
export const getEmployees = () => request('/employees')
export const createEmployee = async (data, photoFile) => {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => { if (v != null) fd.append(k, v) })
  if (photoFile) fd.append('photo', photoFile)
  return multipartRequest('/employees', fd)
}
export const updateEmployee = async (id, data, photoFile) => {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => { if (v != null) fd.append(k, v) })
  if (photoFile) fd.append('photo', photoFile)
  return multipartRequest(`/employees/${id}`, fd, 'PUT')
}
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
export const getSprayLogs = (params = {}) => request(`/spray-logs${buildQuery(params)}`)
export const getAllSprayLogs = () => request('/spray-logs?limit=500')
export const deleteSprayLog = (id) => request(`/spray-logs/${id}`, { method: 'DELETE' })
export const uploadPhotos = async (logId, files) => {
  const fd = new FormData()
  files.forEach(f => fd.append('photos', f))
  return multipartRequest(`/spray-logs/${logId}/photos`, fd)
}

// ── Rosters ──
export const submitRoster = (d) => request('/rosters', { method: 'POST', body: JSON.stringify(d) })
export const getRosters = (params = {}) => request(`/rosters${buildQuery(params)}`)
export const getTodayRoster = (crewId) => request(`/rosters/today${buildQuery({ crewId })}`)
export const getAttendanceToday = () => request('/rosters/attendance-today')
export const deleteRoster = (id) => request(`/rosters/${id}`, { method: 'DELETE' })

// ── Reports ──
export const getPurReport = (month, year) => request(`/reports/pur${buildQuery({ month, year })}`)
export const getPurReportRange = (start, end) => request(`/reports/pur${buildQuery({ start, end })}`)
export const getRosterReport = (start, end) => request(`/reports/rosters${buildQuery({ start, end })}`)

// ── Accounts ──
export const getAccounts = (params = {}) => request(`/accounts${buildQuery(params)}`)
export const createAccount = (d) => request('/accounts', { method: 'POST', body: JSON.stringify(d) })
export const updateAccount = (id, d) => request(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteAccount = (id) => request(`/accounts/${id}`, { method: 'DELETE' })
export const geocodeAddress = (address) => request('/accounts/geocode', { method: 'POST', body: JSON.stringify({ address }) })

// ── Routes ──
export const getRoutes = (params = {}) => request(`/routes${buildQuery(params)}`)
export const getRoute = (id) => request(`/routes/${id}`)
export const createRoute = (d) => request('/routes', { method: 'POST', body: JSON.stringify(d) })
export const updateRoute = (id, d) => request(`/routes/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteRoute = (id) => request(`/routes/${id}`, { method: 'DELETE' })

export const addRouteStop = (routeId, d) => request(`/routes/${routeId}/stops`, { method: 'POST', body: JSON.stringify(d) })
export const removeRouteStop = (routeId, stopId) => request(`/routes/${routeId}/stops/${stopId}`, { method: 'DELETE' })
export const updateRouteStop = (routeId, stopId, d) => request(`/routes/${routeId}/stops/${stopId}`, { method: 'PUT', body: JSON.stringify(d) })
export const reorderRouteStops = (routeId, stopIds) => request(`/routes/${routeId}/stops-order`, { method: 'PUT', body: JSON.stringify({ stopIds }) })

export const getWeekSchedule = () => request('/routes/schedule/week')
export const getDailyProgress = (date) => request(`/routes/schedule/daily-progress${buildQuery({ date })}`)
export const getCrewRoutes = (crewId) => request(`/routes/crew/${crewId}`)
export const getRouteDay = (routeId, date) => request(`/routes/${routeId}/day/${date}`)

export const completeRouteStop = (d) => request('/routes/completions', { method: 'POST', body: JSON.stringify(d) })
export const undoCompletion = (completionId) => request(`/routes/completions/${completionId}`, { method: 'DELETE' })
export const uploadFieldNotes = async (completionId, files, noteText) => {
  const fd = new FormData()
  files.forEach(f => fd.append('photos', f))
  if (noteText) fd.append('noteText', noteText)
  return multipartRequest(`/routes/completions/${completionId}/photos`, fd)
}
export const getCompletionLog = (params = {}) => request(`/routes/completions/log${buildQuery(params)}`)

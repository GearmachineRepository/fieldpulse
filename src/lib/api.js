const BASE = '/api'
async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts })
  if (!res.ok) { const e = await res.json().catch(() => ({ error: 'Failed' })); throw new Error(e.error) }
  return res.json()
}

// Auth
export const verifyPin = (vehicleId, pin) => request('/auth/verify-pin', { method: 'POST', body: JSON.stringify({ vehicleId, pin }) })
export const verifyAdminPin = (adminId, pin) => request('/auth/admin-pin', { method: 'POST', body: JSON.stringify({ adminId, pin }) })
export const crewLogin = (employeeId, pin) => request('/auth/crew-login', { method: 'POST', body: JSON.stringify({ employeeId, pin }) })
export const getAdminsList = () => request('/admins/list')
export const getCrewLoginTiles = () => request('/crews/login-tiles')

// Vehicles
export const getVehicles = () => request('/vehicles')
export const createVehicle = (d) => request('/vehicles', { method: 'POST', body: JSON.stringify(d) })
export const updateVehicle = (id, d) => request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteVehicle = (id) => request(`/vehicles/${id}`, { method: 'DELETE' })

// Crews
export const getCrews = () => request('/crews')
export const createCrew = (d) => request('/crews', { method: 'POST', body: JSON.stringify(d) })
export const updateCrew = (id, d) => request(`/crews/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteCrew = (id) => request(`/crews/${id}`, { method: 'DELETE' })

// Employees (multipart for photo)
export const getEmployees = () => request('/employees')
export const createEmployee = async (data, photoFile) => {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => { if (v != null) fd.append(k, v) })
  if (photoFile) fd.append('photo', photoFile)
  const res = await fetch(`${BASE}/employees`, { method: 'POST', body: fd })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}
export const updateEmployee = async (id, data, photoFile) => {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => { if (v != null) fd.append(k, v) })
  if (photoFile) fd.append('photo', photoFile)
  const res = await fetch(`${BASE}/employees/${id}`, { method: 'PUT', body: fd })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}
export const deleteEmployee = (id) => request(`/employees/${id}`, { method: 'DELETE' })

// Equipment
export const getEquipment = () => request('/equipment')
export const createEquipment = (d) => request('/equipment', { method: 'POST', body: JSON.stringify(d) })
export const updateEquipment = (id, d) => request(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteEquipment = (id) => request(`/equipment/${id}`, { method: 'DELETE' })

// Chemicals
export const getChemicals = () => request('/chemicals')
export const createChemical = (d) => request('/chemicals', { method: 'POST', body: JSON.stringify(d) })
export const updateChemical = (id, d) => request(`/chemicals/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteChemical = (id) => request(`/chemicals/${id}`, { method: 'DELETE' })

// Spray logs
export const createSprayLog = (d) => request('/spray-logs', { method: 'POST', body: JSON.stringify(d) })
export const getSprayLogs = (vehicleId) => request(`/spray-logs${vehicleId ? `?vehicleId=${vehicleId}` : ''}`)
export const getAllSprayLogs = () => request('/spray-logs?limit=500')
export const uploadPhotos = async (logId, files) => {
  const fd = new FormData(); files.forEach(f => fd.append('photos', f))
  const res = await fetch(`${BASE}/spray-logs/${logId}/photos`, { method: 'POST', body: fd })
  if (!res.ok) throw new Error('Upload failed'); return res.json()
}

// Reports
export const getPurReport = (m, y) => request(`/reports/pur?month=${m}&year=${y}`)
export const checkHealth = () => request('/health')

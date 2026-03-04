const BASE = '/api'

async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(err.error || `HTTP ${res.status}`)
    }
    return await res.json()
  } catch (err) { console.error(`API ${path}:`, err.message); throw err }
}

// Auth
export const verifyPin = (vehicleId, pin) => request('/auth/verify-pin', { method: 'POST', body: JSON.stringify({ vehicleId, pin }) })
export const verifyAdminPin = (adminId, pin) => request('/auth/admin-pin', { method: 'POST', body: JSON.stringify({ adminId, pin }) })
export const getAdminsList = () => request('/admins/list')
export const getVehicles = () => request('/vehicles')

// CRUD helpers
export const getEquipment = () => request('/equipment')
export const createEquipment = (data) => request('/equipment', { method: 'POST', body: JSON.stringify(data) })
export const updateEquipment = (id, data) => request(`/equipment/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteEquipment = (id) => request(`/equipment/${id}`, { method: 'DELETE' })

export const getChemicals = () => request('/chemicals')
export const createChemical = (data) => request('/chemicals', { method: 'POST', body: JSON.stringify(data) })
export const updateChemical = (id, data) => request(`/chemicals/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteChemical = (id) => request(`/chemicals/${id}`, { method: 'DELETE' })

export const getCrews = () => request('/crews')
export const createCrew = (data) => request('/crews', { method: 'POST', body: JSON.stringify(data) })
export const updateCrew = (id, data) => request(`/crews/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteCrew = (id) => request(`/crews/${id}`, { method: 'DELETE' })

export const createVehicle = (data) => request('/vehicles', { method: 'POST', body: JSON.stringify(data) })
export const updateVehicle = (id, data) => request(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteVehicle = (id) => request(`/vehicles/${id}`, { method: 'DELETE' })

// Spray logs
export const createSprayLog = (data) => request('/spray-logs', { method: 'POST', body: JSON.stringify(data) })
export const getSprayLogs = (vehicleId) => request(`/spray-logs${vehicleId ? `?vehicleId=${vehicleId}` : ''}`)
export const getAllSprayLogs = () => request('/spray-logs?limit=500')

// Photos (multipart — no JSON header)
export const uploadPhotos = async (logId, files) => {
  const formData = new FormData()
  files.forEach(f => formData.append('photos', f))
  const res = await fetch(`${BASE}/spray-logs/${logId}/photos`, { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}

// PUR Report
export const getPurReport = (month, year) => request(`/reports/pur?month=${month}&year=${year}`)

// Health
export const checkHealth = () => request('/health')

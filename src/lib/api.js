// ═══════════════════════════════════════════
// API Helper — All backend calls in one file
// ═══════════════════════════════════════════

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
  } catch (err) {
    console.error(`API ${path}:`, err.message)
    throw err
  }
}

// ── Auth ──
export const verifyPin = (vehicleId, pin) =>
  request('/auth/verify-pin', {
    method: 'POST',
    body: JSON.stringify({ vehicleId, pin }),
  })

export const getVehicles = () =>
  request('/vehicles')

// ── Equipment ──
export const getEquipment = () =>
  request('/equipment')

// ── Chemicals ──
export const getChemicals = () =>
  request('/chemicals')

// ── Spray Logs ──
export const createSprayLog = (data) =>
  request('/spray-logs', {
    method: 'POST',
    body: JSON.stringify(data),
  })

export const getSprayLogs = (vehicleId) => {
  const params = vehicleId ? `?vehicleId=${vehicleId}` : ''
  return request(`/spray-logs${params}`)
}

// ── Health ──
export const checkHealth = () =>
  request('/health')

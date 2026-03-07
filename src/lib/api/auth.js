import { request, setAuthToken, getAuthToken } from './core.js'

export const checkHealth   = () => request('/health')
export const getAdminsList = () => request('/admins/list')

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

// ── Session restore ──
// Called once on app startup. If a token exists in sessionStorage, hits /api/auth/me
// to get the current user's profile and rebuild React state — no PIN re-entry needed.
// Returns null if there's no token or it has expired.
export const restoreSession = async () => {
  if (!getAuthToken()) return null
  try {
    return await request('/auth/me')
  } catch {
    // Token expired or invalid — clear it so the user sees the login screen cleanly
    const { clearAuthToken } = await import('./core.js')
    clearAuthToken()
    return null
  }
}
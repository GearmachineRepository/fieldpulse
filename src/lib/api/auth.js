// ═══════════════════════════════════════════
// API — Auth
//
// loginWithEmail  → POST /api/auth/login (admin dashboard)
// crewLogin       → POST /api/auth/crew-login (field app)
// restoreSession  → GET  /api/auth/me
// ═══════════════════════════════════════════

import { request, setAuthToken, getAuthToken, clearAuthToken } from './core.js'

export const checkHealth = () => request('/health')

// ── Admin: email + password ──
export const loginWithEmail = async (email, password) => {
  const r = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  if (r.token) setAuthToken(r.token)
  return r
}

// ── Field: crew employee PIN ──
export const crewLogin = async (employeeId, pin) => {
  const r = await request('/auth/crew-login', {
    method: 'POST',
    body: JSON.stringify({ employeeId, pin }),
  })
  if (r.token) setAuthToken(r.token)
  return r
}

// ── Crew login tiles (public) ──
export const getCrewLoginTiles = () => request('/crews/login-tiles')

// ── Session restore ──
export const restoreSession = async () => {
  if (!getAuthToken()) return null
  try {
    return await request('/auth/me')
  } catch {
    clearAuthToken()
    return null
  }
}

// ── Forgot / Reset password ──
export const forgotPassword = (email) =>
  request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

export const resetPassword = (accessToken, password) =>
  request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ accessToken, password }),
  })

// ── Legacy (kept for backward compat) ──
export const getAdminsList = () => request('/admins/list')

export const verifyAdminPin = async (adminId, pin) => {
  const r = await request('/auth/admin-pin', {
    method: 'POST',
    body: JSON.stringify({ adminId, pin }),
  })
  if (r.token) setAuthToken(r.token)
  return r
}

export const verifyPin = async (vehicleId, pin) => {
  const r = await request('/auth/verify-pin', {
    method: 'POST',
    body: JSON.stringify({ vehicleId, pin }),
  })
  if (r.token) setAuthToken(r.token)
  return r
}

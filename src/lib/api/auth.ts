// ═══════════════════════════════════════════
// API — Auth
//
// loginWithEmail  → POST /api/auth/login (admin dashboard)
// crewLogin       → POST /api/auth/crew-login (field app)
// restoreSession  → GET  /api/auth/me
// ═══════════════════════════════════════════

import type { AdminUser, EmployeeUser } from '@/types'
import { request, setAuthToken, getAuthToken, clearAuthToken } from './core.js'

interface AuthResponse {
  token?: string
  user?: AdminUser | EmployeeUser
}

export const checkHealth = (): Promise<{ status: string }> =>
  request<{ status: string }>('/health')

// ── Signup ──
export const signup = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  const r = await request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  })
  if (r.token) setAuthToken(r.token)
  return r
}

// ── Admin: email + password ──
export const loginWithEmail = async (email: string, password: string): Promise<AuthResponse> => {
  const r = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  if (r.token) setAuthToken(r.token)
  return r
}

// ── Field: crew employee PIN ──
export const crewLogin = async (employeeId: string, pin: string): Promise<AuthResponse> => {
  const r = await request<AuthResponse>('/auth/crew-login', {
    method: 'POST',
    body: JSON.stringify({ employeeId, pin }),
  })
  if (r.token) setAuthToken(r.token)
  return r
}

// ── Session restore ──
export const restoreSession = async (): Promise<AuthResponse | null> => {
  if (!getAuthToken()) return null
  try {
    return await request<AuthResponse>('/auth/me')
  } catch {
    clearAuthToken()
    return null
  }
}

// ── Forgot / Reset password ──
export const forgotPassword = (email: string): Promise<{ message: string }> =>
  request<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

export const resetPassword = (accessToken: string, password: string): Promise<{ message: string }> =>
  request<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ accessToken, password }),
  })

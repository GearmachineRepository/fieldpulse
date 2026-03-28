// ═══════════════════════════════════════════
// API Core — shared fetch + token management
// ═══════════════════════════════════════════

import { ApiError } from '@/types'

const BASE = '/api'

// ── Token management ──
// sessionStorage clears on tab close — right behaviour for a shared-device app.
const TOKEN_KEY = 'fp_auth_token'

export const setAuthToken = (t: string): void => sessionStorage.setItem(TOKEN_KEY, t)
export const clearAuthToken = (): void => sessionStorage.removeItem(TOKEN_KEY)
export const getAuthToken = (): string | null => sessionStorage.getItem(TOKEN_KEY)

// ── Helpers ──

/** Builds a query string, omitting null/undefined/empty-string values. */
export function buildQuery(params: Record<string, unknown> = {}): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') q.set(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

/** JSON request helper. */
export async function request<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...opts, headers })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new ApiError(body.error || `Request failed (${res.status})`, res.status)
  }
  return res.json()
}

/** Multipart/FormData request helper. */
export async function multipartRequest<T = unknown>(
  path: string,
  formData: FormData,
  method: 'POST' | 'PUT' = 'POST',
): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { method, headers, body: formData })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new ApiError(body.error || `Request failed (${res.status})`, res.status)
  }
  return res.json()
}

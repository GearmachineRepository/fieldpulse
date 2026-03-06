// ═══════════════════════════════════════════
// API Core — shared fetch + token management
// ═══════════════════════════════════════════

const BASE = '/api'

// ── Token management ──
// sessionStorage clears on tab close — right behaviour for a shared-device app.
const TOKEN_KEY = 'fp_auth_token'

export const setAuthToken  = (t) => sessionStorage.setItem(TOKEN_KEY, t)
export const clearAuthToken = ()  => sessionStorage.removeItem(TOKEN_KEY)
export const getAuthToken  = ()  => sessionStorage.getItem(TOKEN_KEY)

// ── Helpers ──

/** Builds a query string, omitting null/undefined/empty-string values. */
export function buildQuery(params = {}) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') q.set(k, v)
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

/** JSON request helper. */
export async function request(path, opts = {}) {
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

/** Multipart/FormData request helper. */
export async function multipartRequest(path, formData, method = 'POST') {
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

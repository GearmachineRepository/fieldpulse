// ═══════════════════════════════════════════
// API — Device Registration
//
// Handles company code verification for field
// devices. Device state is stored in localStorage
// (persists across sessions, unlike sessionStorage).
// ═══════════════════════════════════════════

import { request } from './core.js'

const DEVICE_KEY = 'fp_device_registration'

// ── Verify company code against backend ──
export async function verifyCompanyCode(code) {
  return request('/device/verify-code', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

// ── Device registration persistence ──
// localStorage so it survives tab close / browser restart.
// This is intentional — device registration is a one-time
// setup, not a per-session thing.

export function getDeviceRegistration() {
  try {
    const raw = localStorage.getItem(DEVICE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setDeviceRegistration(company) {
  localStorage.setItem(DEVICE_KEY, JSON.stringify({
    companyName: company.name,
    companyCode: company.code,
    registeredAt: new Date().toISOString(),
  }))
}

export function clearDeviceRegistration() {
  localStorage.removeItem(DEVICE_KEY)
}

// ── Registration codes (admin) ──

export function getRegistrationCodes() {
  return request('/device/codes')
}

export function createRegistrationCode({ label, expiresIn } = {}) {
  return request('/device/codes', {
    method: 'POST',
    body: JSON.stringify({ label, expiresIn }),
  })
}

export function revokeRegistrationCode(id) {
  return request(`/device/codes/${id}`, { method: 'DELETE' })
}

export function getRegistrationCodeQR(id) {
  return request(`/device/codes/${id}/qr`)
}

// ═══════════════════════════════════════════
// API — Device Registration
//
// Handles company code verification for field
// devices. Device state is stored in localStorage
// (persists across sessions, unlike sessionStorage).
// ═══════════════════════════════════════════

import { request } from './core.js'
import type { Id, DeviceRegistration, RegistrationCode } from '@/types'

const DEVICE_KEY = 'fp_device_registration'

// ── Verify company code against backend ──
export async function verifyCompanyCode(code: string): Promise<{ name: string; code: string }> {
  return request<{ name: string; code: string }>('/device/verify-code', {
    method: 'POST',
    body: JSON.stringify({ code }),
  })
}

// ── Device registration persistence ──
// localStorage so it survives tab close / browser restart.
// This is intentional — device registration is a one-time
// setup, not a per-session thing.

export function getDeviceRegistration(): DeviceRegistration | null {
  try {
    const raw = localStorage.getItem(DEVICE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as DeviceRegistration
  } catch {
    return null
  }
}

export function setDeviceRegistration(company: { name: string; code: string }): void {
  localStorage.setItem(
    DEVICE_KEY,
    JSON.stringify({
      companyName: company.name,
      companyCode: company.code,
      registeredAt: new Date().toISOString(),
    }),
  )
}

export function clearDeviceRegistration(): void {
  localStorage.removeItem(DEVICE_KEY)
}

// ── Registration codes (admin) ──

export function getRegistrationCodes(): Promise<RegistrationCode[]> {
  return request<RegistrationCode[]>('/device/codes')
}

export function createRegistrationCode({ label, expiresIn }: { label?: string; expiresIn?: string } = {}): Promise<RegistrationCode> {
  return request<RegistrationCode>('/device/codes', {
    method: 'POST',
    body: JSON.stringify({ label, expiresIn }),
  })
}

export function revokeRegistrationCode(id: Id): Promise<void> {
  return request<void>(`/device/codes/${id}`, { method: 'DELETE' })
}

export function getRegistrationCodeQR(id: Id): Promise<{ qr: string }> {
  return request<{ qr: string }>(`/device/codes/${id}/qr`)
}

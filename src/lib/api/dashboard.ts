// ═══════════════════════════════════════════
// Dashboard API — Pinnable cards
// ═══════════════════════════════════════════

import { request } from './core.js'
import type { DashboardPin } from '@/types'

/** Get dashboard pins for current company (server seeds defaults if none) */
export const getDashboardPins = (): Promise<DashboardPin[]> => request<DashboardPin[]>('/dashboard-pins')

/** Update dashboard pins */
export const updateDashboardPins = (pins: DashboardPin[]): Promise<DashboardPin[]> =>
  request<DashboardPin[]>('/dashboard-pins', {
    method: 'PUT',
    body: JSON.stringify({ pins }),
  })

// ═══════════════════════════════════════════
// Dashboard API — Pinnable cards
// ═══════════════════════════════════════════

import { request } from './core.js'

/** Get dashboard pins for current company (server seeds defaults if none) */
export const getDashboardPins = () =>
  request('/dashboard-pins')

/** Update dashboard pins */
export const updateDashboardPins = (pins) =>
  request('/dashboard-pins', {
    method: 'PUT',
    body: JSON.stringify({ pins }),
  })

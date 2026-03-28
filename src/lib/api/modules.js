// ═══════════════════════════════════════════
// Modules API — Per-org module state
// ═══════════════════════════════════════════
import { request } from './core.js'

export const getModules = () => request('/modules')
export const toggleModule = (key, enabled) =>
  request(`/modules/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  })

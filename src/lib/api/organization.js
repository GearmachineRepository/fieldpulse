// ═══════════════════════════════════════════
// Organization API — Company settings
// ═══════════════════════════════════════════
import { request } from './core.js'

export const getOrganization    = () => request('/organization')
export const updateOrganization = (d) => request('/organization', { method: 'PUT', body: JSON.stringify(d) })

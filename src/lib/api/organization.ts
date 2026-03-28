// ═══════════════════════════════════════════
// Organization API — Company settings
// ═══════════════════════════════════════════
import { request } from './core.js'
import type { Organization } from '@/types'

export const getOrganization = (): Promise<Organization> => request<Organization>('/organization')
export const updateOrganization = (d: Partial<Organization>): Promise<Organization> =>
  request<Organization>('/organization', { method: 'PUT', body: JSON.stringify(d) })

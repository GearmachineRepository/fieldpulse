// ═══════════════════════════════════════════
// Modules API — Per-org module state
// ═══════════════════════════════════════════
import { request } from './core.js'
import type { ModuleConfig } from '@/types'

export const getModules = (): Promise<ModuleConfig[]> => request<ModuleConfig[]>('/modules')
export const toggleModule = (key: string, enabled: boolean): Promise<ModuleConfig> =>
  request<ModuleConfig>(`/modules/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  })

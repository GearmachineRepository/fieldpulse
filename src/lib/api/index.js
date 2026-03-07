// ═══════════════════════════════════════════
// API barrel — re-exports all domain modules
// so existing `import { getCrews } from '@/lib/api/index.js'`
// imports continue to work without modification.
//
// New code should import directly:
//   import { getCrews } from '@/lib/api/crews.js'
// ═══════════════════════════════════════════

export * from './core.js'
export * from './auth.js'
export * from './vehicles.js'
export * from './crews.js'
export * from './employees.js'
export * from './equipment.js'
export * from './chemicals.js'
export * from './sprayLogs.js'
export * from './rosters.js'
export * from './reports.js'
export * from './accounts.js'
export * from './routes.js'

// ═══════════════════════════════════════════
// Hooks — Barrel Export
//
// Usage:
//   import { useChemicals, useToast, useAuth } from '@/hooks'
//
// Or access everything at once via DataProvider:
//   import { useData } from '@/context/DataProvider.jsx'
//   const { chemicals, crews, toast } = useData()
// ═══════════════════════════════════════════

// ── Core ──
export { default as useCrud }    from './useCrud.js'
export { default as useAuth }    from './useAuth.js'
export { default as useToast }   from './useToast.js'
export { default as useWeather } from './useWeather.js'

// ── Domain (full CRUD) ──
export {
  useChemicals,
  useEquipment,
  useCrews,
  useEmployees,
  useAccounts,
  useVehicles,
  useSprayLogs,
  useRosters,
  useRoutes,
} from './domain.js'

// ── Legacy compat (remove after migration) ──
export { default as useResource } from './useResource.js'

// ═══════════════════════════════════════════
// Hooks — Barrel Export
// ═══════════════════════════════════════════

export { default as useAuth, AuthProvider } from './useAuth.jsx'
export { default as useCrud }       from './useCrud.js'
export { default as usePageData, invalidateCache, clearAllCache } from './usePageData.js'
export { default as useToast }      from './useToast.js'
export { default as useWeather }    from './useWeather.js'
export { default as useTheme }      from './useTheme.js'
export { default as useNavigation } from './useNavigation.js'
export { default as useShell }      from './useShell.js'

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
  useAccountGroups,
} from './domain.js'

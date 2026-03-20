// ═══════════════════════════════════════════
// Domain Hooks — one per API resource
// ═══════════════════════════════════════════

import useCrud from './useCrud.js'
import {
  getChemicals, createChemical, updateChemical, deleteChemical,
  getEquipment, createEquipment, updateEquipment, deleteEquipment,
  getCrews, createCrew, updateCrew, deleteCrew,
  getEmployees, deleteEmployee,
  getAccounts, createAccount, updateAccount, deleteAccount,
  getVehicles, createVehicle, updateVehicle, deleteVehicle,
  getSprayLogs, deleteSprayLog,
  getRosters, deleteRoster,
  getRoutes, createRoute, updateRoute, deleteRoute,
  getAccountGroups, createAccountGroup, updateAccountGroup, deleteAccountGroup,
} from '@/lib/api/index.js'

export function useChemicals(opts = {}) {
  return useCrud({ fetchFn: getChemicals, createFn: createChemical, updateFn: updateChemical, deleteFn: deleteChemical, ...opts })
}

export function useEquipment(opts = {}) {
  return useCrud({ fetchFn: getEquipment, createFn: createEquipment, updateFn: updateEquipment, deleteFn: deleteEquipment, ...opts })
}

export function useCrews(opts = {}) {
  return useCrud({ fetchFn: getCrews, createFn: createCrew, updateFn: updateCrew, deleteFn: deleteCrew, ...opts })
}

export function useEmployees(opts = {}) {
  return useCrud({ fetchFn: getEmployees, deleteFn: deleteEmployee, ...opts })
}

export function useAccounts(opts = {}) {
  return useCrud({ fetchFn: getAccounts, createFn: createAccount, updateFn: updateAccount, deleteFn: deleteAccount, ...opts })
}

export function useVehicles(opts = {}) {
  return useCrud({ fetchFn: getVehicles, createFn: createVehicle, updateFn: updateVehicle, deleteFn: deleteVehicle, ...opts })
}

export function useSprayLogs({ params = {}, ...opts } = {}) {
  return useCrud({ fetchFn: () => getSprayLogs(params), deleteFn: deleteSprayLog, ...opts })
}

export function useRosters({ params = {}, ...opts } = {}) {
  return useCrud({ fetchFn: () => getRosters(params), deleteFn: deleteRoster, ...opts })
}

export function useRoutes(opts = {}) {
  return useCrud({ fetchFn: getRoutes, createFn: createRoute, updateFn: updateRoute, deleteFn: deleteRoute, ...opts })
}

// Project alias (client-side rename of accounts)
export const useProjects = useAccounts

export function useAccountGroups(opts = {}) {
  return useCrud({ fetchFn: getAccountGroups, createFn: createAccountGroup, updateFn: updateAccountGroup, deleteFn: deleteAccountGroup, ...opts })
}

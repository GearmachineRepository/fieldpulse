// ═══════════════════════════════════════════
// Domain Hooks — one per API resource
//
// Each hook wraps useCrud with the specific API
// functions for its domain. Pages call these
// directly — no prop drilling needed.
//
//   import { useChemicals } from '@/hooks'
//   const { data, create, update, remove, refresh } = useChemicals()
//
// CRUD COVERAGE:
//   ✅ Full CRUD: chemicals, equipment, crews, accounts, vehicles, routes
//   ⚠️  List + delete only: employees, sprayLogs, rosters
//      (employees & sprayLogs use FormData for create/update —
//       call the API functions directly, then hook.refresh())
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
} from '@/lib/api/index.js'

// ── Chemicals ── (full CRUD)
export function useChemicals(opts = {}) {
  return useCrud({
    fetchFn:  getChemicals,
    createFn: createChemical,
    updateFn: updateChemical,
    deleteFn: deleteChemical,
    ...opts,
  })
}

// ── Equipment ── (full CRUD)
export function useEquipment(opts = {}) {
  return useCrud({
    fetchFn:  getEquipment,
    createFn: createEquipment,
    updateFn: updateEquipment,
    deleteFn: deleteEquipment,
    ...opts,
  })
}

// ── Crews ── (full CRUD)
export function useCrews(opts = {}) {
  return useCrud({
    fetchFn:  getCrews,
    createFn: createCrew,
    updateFn: updateCrew,
    deleteFn: deleteCrew,
    ...opts,
  })
}

// ── Employees ── (list + delete)
// Create/update use FormData (multipart photo upload).
// For those, import { createEmployee, updateEmployee } from '@/lib/api/index.js'
// directly, call it, then employees.refresh().
export function useEmployees(opts = {}) {
  return useCrud({
    fetchFn:  getEmployees,
    deleteFn: deleteEmployee,
    ...opts,
  })
}

// ── Accounts ── (full CRUD)
export function useAccounts(opts = {}) {
  return useCrud({
    fetchFn:  getAccounts,
    createFn: createAccount,
    updateFn: updateAccount,
    deleteFn: deleteAccount,
    ...opts,
  })
}

// ── Vehicles ── (full CRUD)
export function useVehicles(opts = {}) {
  return useCrud({
    fetchFn:  getVehicles,
    createFn: createVehicle,
    updateFn: updateVehicle,
    deleteFn: deleteVehicle,
    ...opts,
  })
}

// ── Spray Logs ── (list + delete)
// Create uses a complex multi-table transaction payload.
// Import { createSprayLog } from '@/lib/api/index.js' directly,
// call it, then sprayLogs.refresh().
export function useSprayLogs({ params = {}, ...opts } = {}) {
  return useCrud({
    fetchFn:  () => getSprayLogs(params),
    deleteFn: deleteSprayLog,
    ...opts,
  })
}

// ── Rosters ── (list + delete)
export function useRosters({ params = {}, ...opts } = {}) {
  return useCrud({
    fetchFn:  () => getRosters(params),
    deleteFn: deleteRoster,
    ...opts,
  })
}

// ── Routes ── (full CRUD)
export function useRoutes(opts = {}) {
  return useCrud({
    fetchFn:  getRoutes,
    createFn: createRoute,
    updateFn: updateRoute,
    deleteFn: deleteRoute,
    ...opts,
  })
}

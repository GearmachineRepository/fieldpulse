// ═══════════════════════════════════════════
// DataProvider — Global data context
//
// Wraps every domain hook into a single context.
// Any component anywhere can do:
//
//   const { chemicals, crews, employees } = useData()
//   chemicals.data      → [...]
//   chemicals.create(d) → POST + auto-refresh
//   chemicals.loading   → true/false
//
// This replaces the "fetch everything in the shell
// and pass as props" pattern. Pages become self-
// contained — they declare what data they need
// and the hooks handle the rest.
//
// Mounted in main.jsx alongside AppProvider.
// ═══════════════════════════════════════════

import { createContext, useContext } from 'react'
import {
  useChemicals,
  useEquipment,
  useCrews,
  useEmployees,
  useAccounts,
  useVehicles,
  useSprayLogs,
  useRosters,
  useRoutes,
} from '@/hooks/domain.js'
import useWeather from '@/hooks/useWeather.js'
import useToast   from '@/hooks/useToast.js'

const DataContext = createContext(null)

/**
 * Wraps the app and provides all domain data via context.
 * Hooks are initialized but NOT fetched automatically —
 * each page calls .refresh() when it mounts, or uses
 * { immediate: true } when it always needs the data.
 */
export function DataProvider({ children }) {
  const chemicals = useChemicals()
  const equipment = useEquipment()
  const crews     = useCrews()
  const employees = useEmployees()
  const accounts  = useAccounts()
  const vehicles  = useVehicles()
  const sprayLogs = useSprayLogs()
  const rosters   = useRosters()
  const routes    = useRoutes()
  const weather   = useWeather()
  const toast     = useToast()

  const value = {
    chemicals,
    equipment,
    crews,
    employees,
    accounts,
    vehicles,
    sprayLogs,
    rosters,
    routes,
    weather,
    toast,

    // Convenience: refresh everything at once
    // (used by shells on login, same as old fetchAllData)
    refreshAll: async () => {
      await Promise.all([
        chemicals.refresh(),
        equipment.refresh(),
        crews.refresh(),
        employees.refresh(),
        accounts.refresh(),
        sprayLogs.refresh(),
      ])
    },
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

/**
 * Access all domain data from any component.
 *
 * @example
 * const { chemicals, toast } = useData()
 * chemicals.data    → array
 * chemicals.create  → async function
 * toast.show('Saved ✓')
 */
export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData() must be used inside <DataProvider>')
  return ctx
}

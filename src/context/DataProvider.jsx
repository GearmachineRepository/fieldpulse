// ═══════════════════════════════════════════
// DataProvider — Global data context
// ═══════════════════════════════════════════

import { createContext, useContext } from 'react'
import {
  useChemicals, useEquipment, useCrews, useEmployees,
  useAccounts, useVehicles, useSprayLogs, useRosters,
  useRoutes, useAccountGroups,
} from '@/hooks/domain.js'
import useWeather from '@/hooks/useWeather.js'
import useToast   from '@/hooks/useToast.js'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const chemicals     = useChemicals()
  const equipment     = useEquipment()
  const crews         = useCrews()
  const employees     = useEmployees()
  const accounts      = useAccounts()
  const vehicles      = useVehicles()
  const sprayLogs     = useSprayLogs()
  const rosters       = useRosters()
  const routes        = useRoutes()
  const accountGroups = useAccountGroups()
  const weather       = useWeather()
  const toast         = useToast()

  const value = {
    chemicals, equipment, crews, employees, accounts, vehicles,
    sprayLogs, rosters, routes, accountGroups, weather, toast,

    refreshAll: async () => {
      await Promise.all([
        chemicals.refresh(), equipment.refresh(), crews.refresh(),
        employees.refresh(), accounts.refresh(), vehicles.refresh(),
        sprayLogs.refresh(), rosters.refresh(), routes.refresh(),
        accountGroups.refresh(),
      ])
    },
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData() must be used inside <DataProvider>')
  return ctx
}

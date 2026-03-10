// ═══════════════════════════════════════════
// useAuth — Data Hook
//
// Manages authentication state: login, logout,
// session restore. Consumed by shells, never by
// UI primitives.
//
// This replaces the auth portions of AppContext
// (LOGIN_CREW, LOGIN_ADMIN, LOGOUT, RESTORE_SESSION).
// ═══════════════════════════════════════════

import { useState, useCallback, useEffect, useRef } from 'react'
import {
  crewLogin,
  verifyAdminPin,
  clearAuthToken,
} from '@/lib/api/index.js'
import { restoreSession } from '@/lib/api/auth.js'

/**
 * @returns {{
 *   admin: object|null,
 *   employee: object|null,
 *   crew: object|null,
 *   vehicle: object|null,
 *   restoring: boolean,
 *   isAuthenticated: boolean,
 *   loginCrew: (employeeId: number, pin: string) => Promise<void>,
 *   loginAdmin: (adminId: number, pin: string) => Promise<void>,
 *   logout: () => void,
 * }}
 */
export default function useAuth() {
  const [admin, setAdmin]       = useState(null)
  const [employee, setEmployee] = useState(null)
  const [crew, setCrew]         = useState(null)
  const [vehicle, setVehicle]   = useState(null)
  const [restoring, setRestoring] = useState(true)
  const restored = useRef(false)

  // ── Session restore (runs once on mount) ──
  useEffect(() => {
    if (restored.current) return
    restored.current = true

    restoreSession()
      .then(session => {
        if (!session) return
        if (session.type === 'admin') {
          setAdmin(session.admin)
        } else if (session.type === 'employee') {
          setEmployee(session.employee)
          setCrew(session.crew)
          if (session.vehicle) setVehicle(session.vehicle)
        }
      })
      .catch(() => { /* no valid session — stay logged out */ })
      .finally(() => setRestoring(false))
  }, [])

  // ── Actions ──

  const loginCrew = useCallback(async (employeeId, pin) => {
    const result = await crewLogin(employeeId, pin)
    setEmployee(result.employee)
    setCrew(result.crew)
    if (result.vehicle) setVehicle(result.vehicle)
  }, [])

  const loginAdmin = useCallback(async (adminId, pin) => {
    const result = await verifyAdminPin(adminId, pin)
    setAdmin(result)
  }, [])

  const logout = useCallback(() => {
    clearAuthToken()
    setAdmin(null)
    setEmployee(null)
    setCrew(null)
    setVehicle(null)
  }, [])

  const isAuthenticated = !!(admin || employee)

  return {
    admin,
    employee,
    crew,
    vehicle,
    restoring,
    isAuthenticated,
    loginCrew,
    loginAdmin,
    logout,
  }
}

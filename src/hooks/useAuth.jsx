/* eslint-disable react-refresh/only-export-components */
// ═══════════════════════════════════════════
// useAuth — Auth provider + hook
//
// Admin: email + password via loginWithEmail()
// Field: crew employee PIN via loginCrew()
// ═══════════════════════════════════════════

import { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react'
import { clearAuthToken } from '@/lib/api/core.js'
import {
  signup as signupApi,
  loginWithEmail,
  crewLogin,
  restoreSession,
} from '@/lib/api/auth.js'
import { getCrewLoginTiles } from '@/lib/api/crews.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin]       = useState(null)
  const [employee, setEmployee] = useState(null)
  const [crew, setCrew]         = useState(null)
  const [vehicle, setVehicle]   = useState(null)
  const [restoring, setRestoring] = useState(true)
  const restored = useRef(false)

  // ── Session restore (runs once) ──
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
      .catch(() => {})
      .finally(() => setRestoring(false))
  }, [])

  // ── Signup: create account ──
  const signupAdmin = useCallback(async (name, email, password) => {
    const result = await signupApi(name, email, password)
    setAdmin(result)
    return result
  }, [])

  // ── Admin login: email + password ──
  const loginAdmin = useCallback(async (email, password) => {
    const result = await loginWithEmail(email, password)
    setAdmin(result)
    return result
  }, [])

  // ── Field login: employee PIN ──
  const loginCrew = useCallback(async (employeeId, pin) => {
    const result = await crewLogin(employeeId, pin)
    setEmployee(result.employee)
    setCrew(result.crew)
    if (result.vehicle) setVehicle(result.vehicle)
    return result
  }, [])

  // ── Logout ──
  const logout = useCallback(() => {
    clearAuthToken()
    setAdmin(null)
    setEmployee(null)
    setCrew(null)
    setVehicle(null)
  }, [])

  const value = {
    admin,
    employee,
    crew,
    vehicle,
    restoring,
    isAdmin: !!admin,
    isField: !!employee,
    isAuthenticated: !!(admin || employee),
    signupAdmin,
    loginAdmin,
    loginCrew,
    logout,
    getCrewLoginTiles,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth() must be used inside <AuthProvider>')
  return ctx
}

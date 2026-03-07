// ═══════════════════════════════════════════
// App Context — centralized state + actions
// ═══════════════════════════════════════════

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { getChemicals, getEquipment, getCrews, getEmployees, getSprayLogs, getAccounts, clearAuthToken } from '@/lib/api/index.js'
import { restoreSession } from '@/lib/api/auth.js'
import { getSimulatedWeather, getWeatherByCoords } from '@/lib/weather.js'

// ────────────────────────────────────────────
// State shape
// ────────────────────────────────────────────
const initialState = {
  // Auth
  vehicle:          null,
  admin:            null,
  loggedInEmployee: null,
  loggedInCrew:     null,

  // Navigation & UI
  page:        'home',
  sidebarOpen: false,
  toast:       null,

  // true while checking sessionStorage for an existing token on startup.
  // Every shell reads this flag — the restore runs in AppProvider so it
  // fires immediately regardless of which route is loaded first.
  restoring: true,

  // Data
  chemicals:  [],
  equipment:  [],
  crews:      [],
  employees:  [],
  logs:       [],
  accounts:   [],
  weather:    getSimulatedWeather(),
  dataLoaded: false,
}

// ────────────────────────────────────────────
// Reducer
// ────────────────────────────────────────────
function appReducer(state, action) {
  switch (action.type) {

    case 'LOGIN_CREW':
      return {
        ...state,
        loggedInEmployee: action.employee,
        loggedInCrew:     action.crew,
        vehicle:          action.vehicle || state.vehicle,
        page:             'home',
        restoring:        false,
      }

    case 'LOGIN_ADMIN':
      return { ...state, admin: action.admin, page: 'admin-home', restoring: false }

    case 'LOGOUT':
      return { ...initialState, restoring: false, weather: getSimulatedWeather() }

    // Dispatched once on app startup after /api/auth/me resolves.
    // Rebuilds auth state from a stored token — no PIN re-entry needed.
    case 'RESTORE_SESSION': {
      const { session } = action
      if (!session) return { ...state, restoring: false }
      if (session.type === 'admin') {
        return { ...state, admin: session.admin, page: 'admin-home', restoring: false }
      }
      if (session.type === 'employee') {
        return {
          ...state,
          loggedInEmployee: session.employee,
          loggedInCrew:     session.crew,
          vehicle:          session.vehicle || state.vehicle,
          page:             'home',
          restoring:        false,
        }
      }
      return { ...state, restoring: false }
    }

    case 'SET_PAGE':        return { ...state, page: action.page }
    case 'SET_SIDEBAR':     return { ...state, sidebarOpen: action.open }
    case 'SET_TOAST':       return { ...state, toast: action.message }
    case 'SET_WEATHER':     return { ...state, weather: action.weather }

    case 'SET_ALL_DATA':
      return {
        ...state,
        chemicals:  action.chemicals,
        equipment:  action.equipment,
        crews:      action.crews,
        employees:  action.employees,
        logs:       action.logs,
        accounts:   action.accounts ?? state.accounts,
        dataLoaded: true,
      }

    case 'SET_CHEMICALS': return { ...state, chemicals: action.chemicals }
    case 'SET_EQUIPMENT': return { ...state, equipment: action.equipment }
    case 'SET_CREWS':     return { ...state, crews: action.crews }
    case 'SET_EMPLOYEES': return { ...state, employees: action.employees }
    case 'SET_LOGS':      return { ...state, logs: action.logs }
    case 'SET_ACCOUNTS':  return { ...state, accounts: action.accounts }

    default: return state
  }
}

// ────────────────────────────────────────────
// Contexts
// ────────────────────────────────────────────
const AppContext      = createContext(null)
const DispatchContext = createContext(null)

// ────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // ── Session restore — runs once, immediately on app start ──
  // Lives here in the Provider (not in a shell) so it fires regardless
  // of which route is loaded first. Shells just read the `restoring` flag.
  useEffect(() => {
    restoreSession()
      .then(session => dispatch({ type: 'RESTORE_SESSION', session }))
      .catch(() => dispatch({ type: 'RESTORE_SESSION', session: null }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AppContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </AppContext.Provider>
  )
}

// ────────────────────────────────────────────
// Hooks
// ────────────────────────────────────────────
export function useAppState() {
  const ctx = useContext(AppContext)
  if (ctx === null) throw new Error('useAppState must be used inside <AppProvider>')
  return ctx
}

export function useAppDispatch() {
  const ctx = useContext(DispatchContext)
  if (ctx === null) throw new Error('useAppDispatch must be used inside <AppProvider>')
  return ctx
}

export function useAppActions() {
  const dispatch = useAppDispatch()
  const state    = useAppState()

  const showToast = useCallback((message) => {
    dispatch({ type: 'SET_TOAST', message })
    setTimeout(() => dispatch({ type: 'SET_TOAST', message: null }), 2500)
  }, [dispatch])

  const logout = useCallback(() => {
    clearAuthToken()
    dispatch({ type: 'LOGOUT' })
  }, [dispatch])

  const setPage     = useCallback((page) => dispatch({ type: 'SET_PAGE', page }), [dispatch])
  const setSidebar  = useCallback((open) => dispatch({ type: 'SET_SIDEBAR', open }), [dispatch])

  const getLogParams = useCallback(() => {
    if (state.admin)              return {}
    if (state.vehicle?.id)        return { vehicleId: state.vehicle.id }
    if (state.loggedInCrew?.name) return { crewName: state.loggedInCrew.name }
    return {}
  }, [state.admin, state.vehicle, state.loggedInCrew])

  const fetchAllData = useCallback(async () => {
    const [chemicals, equipment, crews, employees, logs, accounts] = await Promise.all([
      getChemicals(), getEquipment(), getCrews(), getEmployees(),
      getSprayLogs(getLogParams()), getAccounts(),
    ])
    dispatch({ type: 'SET_ALL_DATA', chemicals, equipment, crews, employees, logs, accounts })
  }, [dispatch, getLogParams])

  const refreshLogs = useCallback(async () => {
    const logs = await getSprayLogs(getLogParams())
    dispatch({ type: 'SET_LOGS', logs })
  }, [dispatch, getLogParams])

  const fetchWeather = useCallback(() => {
    if (!navigator.geolocation) {
      dispatch({ type: 'SET_WEATHER', weather: getSimulatedWeather() })
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const weather = await getWeatherByCoords(pos.coords.latitude, pos.coords.longitude)
          dispatch({ type: 'SET_WEATHER', weather })
        } catch {
          dispatch({ type: 'SET_WEATHER', weather: getSimulatedWeather() })
        }
      },
      () => dispatch({ type: 'SET_WEATHER', weather: getSimulatedWeather() }),
      { timeout: 8000 }
    )
  }, [dispatch])

  return { showToast, logout, setPage, setSidebar, getLogParams, fetchAllData, refreshLogs, fetchWeather }
}
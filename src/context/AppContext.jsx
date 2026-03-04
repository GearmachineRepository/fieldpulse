// ═══════════════════════════════════════════
// App Context — centralized state management
// Replaces 15+ useState hooks in App.jsx
// ═══════════════════════════════════════════

import { createContext, useContext, useReducer, useCallback } from 'react'
import { getChemicals, getEquipment, getCrews, getEmployees, getSprayLogs, createSprayLog, clearAuthToken } from '../lib/api.js'
import { getSimulatedWeather, getWeatherByCoords } from '../lib/weather.js'

// ── Initial state ──
const initialState = {
  // Auth
  vehicle: null,
  admin: null,
  loggedInEmployee: null,
  loggedInCrew: null,

  // Navigation & UI
  page: 'spray',
  sidebarOpen: false,
  toast: null,

  // Data
  chemicals: [],
  equipment: [],
  crews: [],
  employees: [],
  logs: [],
  weather: getSimulatedWeather(),
  dataLoaded: false,
}

// ── Reducer ──
function appReducer(state, action) {
  switch (action.type) {
    // Auth
    case 'LOGIN_CREW':
      return {
        ...state,
        loggedInEmployee: action.employee,
        loggedInCrew: action.crew,
        vehicle: action.vehicle || state.vehicle,
        page: 'home',
      }
    case 'LOGIN_ADMIN':
      return { ...state, admin: action.admin, page: 'admin-home' }
    case 'LOGOUT':
      return { ...initialState, weather: getSimulatedWeather() }

    // Navigation & UI
    case 'SET_PAGE':
      return { ...state, page: action.page }
    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.open }
    case 'SET_TOAST':
      return { ...state, toast: action.message }

    // Data — bulk load after login
    case 'SET_ALL_DATA':
      return {
        ...state,
        chemicals: action.chemicals,
        equipment: action.equipment,
        crews: action.crews,
        employees: action.employees,
        logs: action.logs,
        dataLoaded: true,
      }

    // Data — individual updates (after admin edits, new logs, etc.)
    case 'SET_CHEMICALS':
      return { ...state, chemicals: action.chemicals }
    case 'SET_EQUIPMENT':
      return { ...state, equipment: action.equipment }
    case 'SET_CREWS':
      return { ...state, crews: action.crews }
    case 'SET_EMPLOYEES':
      return { ...state, employees: action.employees }
    case 'SET_LOGS':
      return { ...state, logs: action.logs }
    case 'SET_WEATHER':
      return { ...state, weather: action.weather }

    default:
      return state
  }
}

// ── Context ──
const AppContext = createContext(null)
const DispatchContext = createContext(null)

// ── Provider ──
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <AppContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </AppContext.Provider>
  )
}

// ── Hooks ──
export function useAppState() {
  const ctx = useContext(AppContext)
  if (!ctx && ctx !== initialState) throw new Error('useAppState must be used inside AppProvider')
  return ctx
}

export function useAppDispatch() {
  const ctx = useContext(DispatchContext)
  if (!ctx) throw new Error('useAppDispatch must be used inside AppProvider')
  return ctx
}

// ── Action helpers (convenience hooks) ──
export function useAppActions() {
  const dispatch = useAppDispatch()
  const state = useAppState()

  const showToast = useCallback((message) => {
    dispatch({ type: 'SET_TOAST', message })
    setTimeout(() => dispatch({ type: 'SET_TOAST', message: null }), 2500)
  }, [dispatch])

  const logout = useCallback(() => {
    clearAuthToken()
    dispatch({ type: 'LOGOUT' })
  }, [dispatch])

  const setPage = useCallback((page) => {
    dispatch({ type: 'SET_PAGE', page })
  }, [dispatch])

  const getLogParams = useCallback(() => {
    if (state.admin) return {}
    if (state.vehicle?.id) return { vehicleId: state.vehicle.id }
    if (state.loggedInCrew?.name) return { crewName: state.loggedInCrew.name }
    return {}
  }, [state.admin, state.vehicle, state.loggedInCrew])

  const fetchAllData = useCallback(async () => {
    try {
      const logParams = state.admin ? {} :
        (state.vehicle?.id ? { vehicleId: state.vehicle.id } :
        (state.loggedInCrew?.name ? { crewName: state.loggedInCrew.name } : {}))
      const [chemicals, equipment, crews, employees, logs] = await Promise.all([
        getChemicals(), getEquipment(), getCrews(), getEmployees(),
        getSprayLogs(logParams),
      ])
      dispatch({ type: 'SET_ALL_DATA', chemicals, equipment, crews, employees, logs })
    } catch (e) {
      console.error('Failed to load data:', e)
      showToast('Failed to load data')
    }
  }, [state.admin, state.vehicle, state.loggedInCrew, dispatch, showToast])

  const refreshData = useCallback(async () => {
    try {
      const [chemicals, equipment, crews, employees] = await Promise.all([
        getChemicals(), getEquipment(), getCrews(), getEmployees(),
      ])
      dispatch({ type: 'SET_CHEMICALS', chemicals })
      dispatch({ type: 'SET_EQUIPMENT', equipment })
      dispatch({ type: 'SET_CREWS', crews })
      dispatch({ type: 'SET_EMPLOYEES', employees })
      const logParams = getLogParams()
      dispatch({ type: 'SET_LOGS', logs: await getSprayLogs(logParams) })
    } catch (e) {
      console.error('Refresh failed:', e)
    }
  }, [dispatch, getLogParams])

  const submitSprayLog = useCallback(async (logData) => {
    try {
      await createSprayLog({ vehicleId: state.vehicle?.id || null, ...logData })
      const logParams = getLogParams()
      dispatch({ type: 'SET_LOGS', logs: await getSprayLogs(logParams) })
      showToast('Spray log submitted & saved ✓')
      return true
    } catch {
      showToast('Failed to save')
      return false
    }
  }, [state.vehicle, dispatch, getLogParams, showToast])

  const fetchWeather = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            dispatch({ type: 'SET_WEATHER', weather: await getWeatherByCoords(pos.coords.latitude, pos.coords.longitude) })
          } catch {
            dispatch({ type: 'SET_WEATHER', weather: getSimulatedWeather() })
          }
        },
        () => dispatch({ type: 'SET_WEATHER', weather: getSimulatedWeather() }),
        { timeout: 8000 }
      )
    } else {
      dispatch({ type: 'SET_WEATHER', weather: getSimulatedWeather() })
    }
  }, [dispatch])

  const refreshLogs = useCallback(async () => {
    const logParams = getLogParams()
    dispatch({ type: 'SET_LOGS', logs: await getSprayLogs(logParams) })
  }, [dispatch, getLogParams])

  return {
    dispatch,
    showToast,
    logout,
    setPage,
    getLogParams,
    fetchAllData,
    refreshData,
    submitSprayLog,
    fetchWeather,
    refreshLogs,
  }
}
// ═══════════════════════════════════════════
// App — Root router
// Handles: Login → Crew shell → Admin shell
// All state lives in AppContext (see context/AppContext.jsx)
// ═══════════════════════════════════════════

import { useEffect } from 'react'
import { C, FONT } from './config/index.js'
import { createSprayLog } from './lib/api/sprayLogs.js'

import { useAppState, useAppActions, useAppDispatch } from './context/AppContext.jsx'

import LoginScreen  from './pages/LoginScreen.jsx'
import Sidebar      from './components/Sidebar.jsx'
import AppHeader    from './components/layout/AppHeader.jsx'
import Toast        from './components/common/Toast.jsx'
import AdminSidebar, { ADMIN_PAGE_TITLES } from './components/admin/AdminSidebar.jsx'

import FieldHome      from './pages/FieldHome.jsx'
import CrewPage       from './pages/CrewPage.jsx'
import CrewRoutes     from './pages/CrewRoutes.jsx'
import SprayTracker   from './pages/SprayTracker.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

export default function App() {
  const state    = useAppState()
  const dispatch = useAppDispatch()
  const {
    showToast, logout, setPage, setSidebar,
    fetchAllData, refreshLogs, fetchWeather,
  } = useAppActions()

  const {
    vehicle, admin, loggedInEmployee, loggedInCrew,
    page, sidebarOpen, toast,
    chemicals, equipment, crews, employees, logs, accounts,
    weather, dataLoaded,
  } = state

  // ── Fetch data after any login ──
  useEffect(() => {
    if (!vehicle && !admin && !loggedInEmployee) return
    fetchAllData().catch(console.error)
    fetchWeather()
  }, [vehicle?.id, admin?.id, loggedInEmployee?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle login callbacks ──
  const handleCrewLogin = (result) => {
    dispatch({
      type: 'LOGIN_CREW',
      employee: result.employee,
      crew:     result.crew,
      vehicle:  result.vehicle,
    })
  }

  const handleAdminLogin = (result) => {
    dispatch({ type: 'LOGIN_ADMIN', admin: result })
  }

  const handleSubmitLog = async (logData) => {
    const result = await createSprayLog(logData)
    await refreshLogs()
    return result
  }

  // ── Not logged in → Login screen ──
  if (!vehicle && !admin && !loggedInEmployee) {
    return <LoginScreen onCrewLogin={handleCrewLogin} onAdminLogin={handleAdminLogin} />
  }

  // ── Derive display info ──
  const isAdmin      = Boolean(admin)
  const effectiveVehicle = vehicle || (loggedInCrew ? { name: loggedInCrew.name, crewName: loggedInCrew.name } : null)
  const displayName  = admin?.name || loggedInEmployee
    ? `${loggedInEmployee?.firstName || ''} ${loggedInEmployee?.lastName || ''}`.trim()
    : (vehicle?.name || '')
  const displaySub   = admin?.role ? `Role: ${admin.role}` : (loggedInCrew?.name || vehicle?.crewName || '')
  const pageTitle    = isAdmin
    ? (ADMIN_PAGE_TITLES[page] || 'Admin')
    : ({ home: 'Home', spray: 'Spray Log', crew: 'Crew', routes: 'My Routes' }[page] || 'FieldPulse')

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT }}>

      {/* ── Header — always full width ── */}
      <AppHeader
        pageTitle={pageTitle}
        isAdmin={isAdmin}
        displayName={displayName}
        displaySub={displaySub}
        onMenuOpen={() => setSidebar(true)}
        onLogout={logout}
      />

      {/* ── Navigation drawers ── */}
      {isAdmin ? (
        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebar(false)}
          currentPage={page}
          onNav={(p) => { setPage(p); setSidebar(false) }}
        />
      ) : (
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebar(false)}
          currentPage={page}
          onNav={(p) => { setPage(p); setSidebar(false) }}
          loggedInEmployee={loggedInEmployee}
        />
      )}

      {/* ── Page content — constrained per mode ── */}
      <div style={{ maxWidth: isAdmin ? 900 : 430, margin: '0 auto', padding: '14px 16px 40px' }}>
        {/* ── Crew pages ── */}
        {!isAdmin && page === 'home' && (
          <FieldHome
            vehicle={effectiveVehicle}
            weather={weather}
            logs={logs}
            employees={employees}
            crews={crews}
            onNav={setPage}
            loggedInEmployee={loggedInEmployee}
            loggedInCrew={loggedInCrew}
          />
        )}
        {!isAdmin && page === 'crew' && (
          <CrewPage
            employees={employees}
            crews={crews}
            loggedInEmployee={loggedInEmployee}
            loggedInCrew={loggedInCrew}
            vehicle={effectiveVehicle}
            showToast={showToast}
          />
        )}
        {!isAdmin && page === 'routes' && (
          <CrewRoutes
            loggedInEmployee={loggedInEmployee}
            loggedInCrew={loggedInCrew}
          />
        )}
        {!isAdmin && page === 'spray' && (
          <SprayTracker
            vehicle={effectiveVehicle}
            chemicals={chemicals}
            equipment={equipment}
            crews={crews}
            logs={logs}
            weather={weather}
            onRefreshWeather={fetchWeather}
            onSubmitLog={handleSubmitLog}
            onLogsUpdated={refreshLogs}
            loggedInEmployee={loggedInEmployee}
            loggedInCrew={loggedInCrew}
          />
        )}

        {/* ── Admin pages ── */}
        {isAdmin && (
          <AdminDashboard
            page={page}
            chemicals={chemicals}
            equipment={equipment}
            crews={crews}
            employees={employees}
            logs={logs}
            accounts={accounts}
            onRefresh={fetchAllData}
            showToast={showToast}
            onNav={setPage}
          />
        )}

        {/* ── Unknown crew page fallback ── */}
        {!isAdmin && !['home','crew','routes','spray'].includes(page) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>Coming Soon</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Toast notification ── */}
      <Toast message={toast} />
    </div>
  )
}
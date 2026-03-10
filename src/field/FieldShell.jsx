// ═══════════════════════════════════════════
// FieldShell — /app/*
// Converted: inline styles → ShellLayout.
// Data wiring via AppContext unchanged.
// ═══════════════════════════════════════════

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSprayLog } from '@/lib/api/sprayLogs.js'
import { useAppState, useAppActions, useAppDispatch } from '@/context/AppContext.jsx'

import ShellLayout  from '@/ui/layouts/ShellLayout.jsx'
import LoginScreen  from '@/field/pages/LoginScreen.jsx'
import FieldHome    from '@/field/pages/FieldHome.jsx'
import CrewPage     from '@/field/pages/CrewPage.jsx'
import CrewRoutes   from '@/field/pages/CrewRoutes.jsx'
import SprayTracker from '@/field/pages/SprayTracker.jsx'

import AppHeader from '@/components/layout/AppHeader.jsx'
import Sidebar   from '@/field/components/Sidebar.jsx'

export default function FieldShell() {
  const navigate = useNavigate()
  const state    = useAppState()
  const dispatch = useAppDispatch()
  const { showToast, logout, setPage, setSidebar, fetchAllData, refreshLogs, fetchWeather } = useAppActions()

  const {
    vehicle, admin, loggedInEmployee, loggedInCrew,
    page, sidebarOpen, toast,
    chemicals, equipment, crews, employees, logs,
    weather, restoring,
  } = state

  // ── If an admin session was restored, hand off to AdminShell ──
  useEffect(() => {
    if (!restoring && admin) navigate('/admin', { replace: true })
  }, [admin, restoring, navigate])

  // ── Fetch data once crew logs in ──
  useEffect(() => {
    if (!vehicle && !loggedInEmployee) return
    fetchAllData().catch(console.error)
    fetchWeather()
  }, [vehicle?.id, loggedInEmployee?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Wait for session restore ──
  if (restoring) {
    return <ShellLayout.Loader />
  }

  // ── Not logged in → login screen ──
  if (!vehicle && !loggedInEmployee) {
    const handleCrewLogin  = (r) => dispatch({ type: 'LOGIN_CREW',  employee: r.employee, crew: r.crew, vehicle: r.vehicle })
    const handleAdminLogin = (r) => dispatch({ type: 'LOGIN_ADMIN', admin: r })
    return <LoginScreen onCrewLogin={handleCrewLogin} onAdminLogin={handleAdminLogin} />
  }

  // ── Logged in as crew ──
  const effectiveVehicle = vehicle || (loggedInCrew ? { name: loggedInCrew.name, crewName: loggedInCrew.name } : null)
  const displayName = `${loggedInEmployee?.firstName || ''} ${loggedInEmployee?.lastName || ''}`.trim() || vehicle?.name || ''
  const displaySub  = loggedInCrew?.name || vehicle?.crewName || ''
  const pageTitle   = { home: 'Home', spray: 'Spray Log', crew: 'Crew', routes: 'My Routes' }[page] || 'FieldPulse'

  const handleSubmitLog = async (logData) => {
    const result = await createSprayLog(logData)
    await refreshLogs()
    return result
  }

  return (
    <ShellLayout
      narrow
      header={
        <AppHeader
          pageTitle={pageTitle}
          isAdmin={false}
          displayName={displayName}
          displaySub={displaySub}
          onMenuOpen={() => setSidebar(true)}
          onLogout={logout}
        />
      }
      sidebar={
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebar(false)}
          currentPage={page}
          onNav={(p) => { setPage(p); setSidebar(false) }}
          loggedInEmployee={loggedInEmployee}
        />
      }
      toast={toast}
    >
      {page === 'home' && (
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
      {page === 'crew' && (
        <CrewPage
          employees={employees}
          crews={crews}
          loggedInEmployee={loggedInEmployee}
          loggedInCrew={loggedInCrew}
          vehicle={effectiveVehicle}
          showToast={showToast}
        />
      )}
      {page === 'routes' && (
        <CrewRoutes
          loggedInEmployee={loggedInEmployee}
          loggedInCrew={loggedInCrew}
        />
      )}
      {page === 'spray' && (
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
      {!['home', 'crew', 'routes', 'spray'].includes(page) && (
        <EmptyState icon="🚧" title="Coming Soon" />
      )}
    </ShellLayout>
  )
}

// Inline fallback — avoids importing EmptyState just for this edge case
function EmptyState({ icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>{title}</div>
      </div>
    </div>
  )
}

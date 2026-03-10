// ═══════════════════════════════════════════
// AdminShell — /admin/*
// Converted: inline styles → ShellLayout.
// Data wiring via AppContext unchanged.
// ═══════════════════════════════════════════

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppState, useAppActions } from '@/context/AppContext.jsx'

import ShellLayout    from '@/ui/layouts/ShellLayout.jsx'
import AdminDashboard from '@/admin/pages/AdminDashboard.jsx'
import AdminSidebar, { ADMIN_PAGE_TITLES } from '@/admin/components/AdminSidebar.jsx'
import AppHeader      from '@/components/layout/AppHeader.jsx'

export default function AdminShell() {
  const navigate = useNavigate()
  const state    = useAppState()
  const { logout, setPage, setSidebar, fetchAllData, showToast } = useAppActions()

  const {
    admin, restoring,
    page, sidebarOpen, toast,
    chemicals, equipment, crews, employees, logs, accounts,
    dataLoaded,
  } = state

  useEffect(() => {
    if (restoring) return
    if (!admin) navigate('/app', { replace: true })
  }, [admin, restoring, navigate])

  // ── Fetch data on first admin load ──
  useEffect(() => {
    if (!admin) return
    fetchAllData().catch(console.error)
  }, [admin?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading / redirect in progress ──
  if (restoring || !admin || !dataLoaded) {
    return <ShellLayout.Loader />
  }

  return (
    <ShellLayout
      header={
        <AppHeader
          pageTitle={ADMIN_PAGE_TITLES[page] || 'Admin'}
          isAdmin={true}
          displayName={admin.name}
          displaySub={admin.role ? `Role: ${admin.role}` : ''}
          onMenuOpen={() => setSidebar(true)}
          onLogout={logout}
        />
      }
      sidebar={
        <AdminSidebar
          open={sidebarOpen}
          onClose={() => setSidebar(false)}
          currentPage={page}
          onNav={(p) => { setPage(p); setSidebar(false) }}
        />
      }
      toast={toast}
    >
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
    </ShellLayout>
  )
}

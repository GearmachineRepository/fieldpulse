// ═══════════════════════════════════════════
// AdminShell — /admin/*
// Everything a company admin sees after
// logging in with their PIN.
// Owns: admin nav, all management sections.
// Does NOT know field app exists.
// ═══════════════════════════════════════════

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { C, FONT } from '@/config/index.js'
import { useAppState, useAppActions, useAppDispatch } from '@/context/AppContext.jsx'

import AdminDashboard from '@/admin/pages/AdminDashboard.jsx'
import AdminSidebar, { ADMIN_PAGE_TITLES } from '@/admin/components/AdminSidebar.jsx'
import AppHeader from '@/components/layout/AppHeader.jsx'
import Toast     from '@/components/common/Toast.jsx'

export default function AdminShell() {
  const navigate = useNavigate()
  const state    = useAppState()
  const { logout, setPage, setSidebar, fetchAllData, showToast } = useAppActions()

  const {
    admin, restoring,
    page, sidebarOpen, toast,
    chemicals, equipment, crews, employees, logs, accounts,
  } = state

  // ── Session restore is handled by FieldShell ──
  // If someone navigates directly to /admin and has a valid admin token,
  // FieldShell (which runs first at /app) has already restored the session.
  // If they land directly on /admin without going through /app first, we need
  // to redirect them to /app so session restore can run.
  // Step 2 will give AdminShell its own context and restore flow.
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
  if (restoring || !admin) {
    return (
      <main style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: C.bg, fontFamily: FONT,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💧</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Loading…</div>
        </div>
      </main>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: FONT }}>
      <AppHeader
        pageTitle={ADMIN_PAGE_TITLES[page] || 'Admin'}
        isAdmin={true}
        displayName={admin.name}
        displaySub={admin.role ? `Role: ${admin.role}` : ''}
        onMenuOpen={() => setSidebar(true)}
        onLogout={logout}
      />

      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebar(false)}
        currentPage={page}
        onNav={(p) => { setPage(p); setSidebar(false) }}
      />

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '14px 16px 40px' }}>
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
      </main>

      <Toast message={toast} />
    </div>
  )
}
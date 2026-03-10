// ═══════════════════════════════════════════
// AdminShell (Refactored) — /admin/*
//
// BEFORE: 80+ lines, imported C/FONT/cardStyle,
//         built inline styles, knew about AppContext
//         dispatch types, duplicated loader markup.
//
// AFTER:  ~40 lines. Wires hooks to UI Kit.
//         Zero inline styles. Swapping the visual
//         design means changing ShellLayout/AppHeader
//         in @/ui, not touching this file.
// ═══════════════════════════════════════════

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// ── UI Kit (swappable skin) ──
import { ShellLayout } from '@/ui'

// ── Data hooks (stable logic) ──
import { useAuth, useToast } from '@/hooks'
import { useChemicals, useEquipment, useCrews, useEmployees, useSprayLogs, useAccounts } from '@/hooks'

// ── Feature components (admin-specific) ──
import AdminDashboard from '@/admin/pages/AdminDashboard.jsx'
import AdminSidebar, { ADMIN_PAGE_TITLES } from '@/admin/components/AdminSidebar.jsx'
import AppHeader from '@/components/layout/AppHeader.jsx'

import { useState } from 'react'

export default function AdminShell() {
  const navigate = useNavigate()
  const { admin, restoring, logout } = useAuth()
  const toast = useToast()

  // ── Navigation state (local to this shell) ──
  const [page, setPage]           = useState('admin-home')
  const [sidebarOpen, setSidebar] = useState(false)

  // ── Domain data ──
  const chemicals = useChemicals()
  const equipment = useEquipment()
  const crews     = useCrews()
  const employees = useEmployees()
  const logs      = useSprayLogs()
  const accounts  = useAccounts()

  // ── Redirect if not admin ──
  useEffect(() => {
    if (!restoring && !admin) navigate('/app', { replace: true })
  }, [admin, restoring, navigate])

  // ── Fetch all data on first admin load ──
  useEffect(() => {
    if (!admin) return
    Promise.all([
      chemicals.refresh(), equipment.refresh(), crews.refresh(),
      employees.refresh(), logs.refresh(), accounts.refresh(),
    ]).catch(console.error)
  }, [admin?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const refreshAll = async () => {
    await Promise.all([
      chemicals.refresh(), equipment.refresh(), crews.refresh(),
      employees.refresh(), logs.refresh(), accounts.refresh(),
    ])
  }

  // Derive loaded state from all resources
  const dataLoaded = !chemicals.loading && !equipment.loading && !crews.loading
    && !employees.loading && !logs.loading && !accounts.loading

  // ── Loading ──
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
      toast={toast.message}
    >
      <AdminDashboard
        page={page}
        chemicals={chemicals.data}
        equipment={equipment.data}
        crews={crews.data}
        employees={employees.data}
        logs={logs.data}
        accounts={accounts.data}
        onRefresh={refreshAll}
        showToast={toast.show}
        onNav={setPage}
      />
    </ShellLayout>
  )
}

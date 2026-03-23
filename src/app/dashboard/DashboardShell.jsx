// ═══════════════════════════════════════════
// Dashboard Shell — /dashboard/*
//
// Thin orchestrator. All state lives in hooks:
//   useNavigation() — activePage, sections, breadcrumb
//   useShell()      — sidebar/modal booleans
//   useTheme()      — light/dark toggle
//   useAuth()       — admin session
//
// Pages are rendered via React Router <Outlet />.
// ═══════════════════════════════════════════

import { useEffect } from "react"
import { Outlet, Link, useNavigate as useRouterNavigate } from "react-router-dom"
import { Loader2, Menu, Plus } from "lucide-react"
import { T } from "@/app/tokens.js"
import useAuth from "@/hooks/useAuth.jsx"
import { ModulesProvider } from "@/hooks/useModules.jsx"
import useNavigation from "@/hooks/useNavigation.js"
import useShell from "@/hooks/useShell.js"
import useTheme from "@/hooks/useTheme.js"
// DataProvider is deprecated — kept for backward compat during migration
// import { useData } from "@/context/DataProvider.jsx"
import DashboardRail from "@/app/dashboard/components/DashboardRail.jsx"
import DashboardSidebar from "@/app/dashboard/components/DashboardSidebar.jsx"
import CompanyQRModal from "@/app/dashboard/components/CompanyQRModal.jsx"
import s from "./DashboardShell.module.css"

export default function DashboardShell() {
  const routerNavigate = useRouterNavigate()
  const { isAdmin, restoring } = useAuth()
  const { activePage, activeSection, navigate, selectSection, breadcrumb } = useNavigation()
  const { sidebarOpen, openSidebar, closeSidebar, qrModalOpen, closeQrModal } = useShell()

  // Initialize theme on mount
  useTheme()

  useEffect(() => { if (!restoring && !isAdmin) routerNavigate("/login", { replace: true }) }, [isAdmin, restoring, routerNavigate])
  // DataProvider is deprecated — pages load their own data via usePageData

  if (restoring || !isAdmin) {
    return (
      <div className={s.loading}>
        <Loader2 size={24} color={T.accent} className={s.spinner} />
      </div>
    )
  }

  // Format today's date for topbar
  const today = new Date()
  const dateStr = today.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" }).toUpperCase()

  return (
    <ModulesProvider>
    <div className={s.shell}>
      {/* Section rail */}
      <DashboardRail
        activeSection={activeSection}
        onSelectSection={selectSection}
      />

      {/* Section sidebar */}
      <DashboardSidebar
        activePage={activePage}
        activeSection={activeSection}
        onNavigate={navigate}
        onSelectSection={selectSection}
        open={sidebarOpen}
        onClose={closeSidebar}
      />

      <CompanyQRModal open={qrModalOpen} onClose={closeQrModal} />

      {/* Main content area */}
      <div className={s.main}>
        {/* Topbar with clickable breadcrumb */}
        <div className={s.topbar}>
          <button className={s.hamburger} onClick={openSidebar} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <div className={s.tbLeft}>
            {breadcrumb.map((seg, i) => {
              const isLast = i === breadcrumb.length - 1
              return (
                <span key={i}>
                  {i > 0 && <span className={s.tbSep}>/</span>}
                  {isLast || !seg.path ? (
                    <span className={isLast ? s.tbTitle : s.tbPath}>{seg.label}</span>
                  ) : (
                    <Link to={seg.path} className={s.tbPath}>{seg.label}</Link>
                  )}
                </span>
              )
            })}
          </div>
          <div className={s.tbRight}>
            <div className={s.tbBtn}>{dateStr}</div>
            <button className={`${s.tbBtn} ${s.tbBtnPri}`}><Plus size={14} /> New</button>
          </div>
        </div>

        {/* Page content — rendered by React Router */}
        <main className={s.content}>
          <Outlet />
        </main>
      </div>
    </div>
    </ModulesProvider>
  )
}

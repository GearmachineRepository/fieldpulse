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

import { useState, useEffect, useRef, useCallback } from "react"
import { Outlet, Link, useNavigate as useRouterNavigate } from "react-router-dom"
import { Loader2, Menu, ChevronDown, Settings, LogOut } from "lucide-react"
import { T } from "@/app/tokens.js"
import useAuth from "@/hooks/useAuth.jsx"
import { ModulesProvider } from "@/hooks/useModules.jsx"
import useNavigation from "@/hooks/useNavigation.js"
import useShell from "@/hooks/useShell.js"
import useTheme from "@/hooks/useTheme.js"
import DashboardRail from "@/app/dashboard/components/DashboardRail.jsx"
import DashboardSidebar from "@/app/dashboard/components/DashboardSidebar.jsx"
import CompanyQRModal from "@/app/dashboard/components/CompanyQRModal.jsx"
import s from "./DashboardShell.module.css"

export default function DashboardShell() {
  const routerNavigate = useRouterNavigate()
  const { admin, isAdmin, restoring, logout } = useAuth()
  const { activePage, activeSection, navigate, selectSection, breadcrumb } = useNavigation()
  const { sidebarOpen, openSidebar, closeSidebar, qrModalOpen, closeQrModal } = useShell()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Initialize theme on mount
  useTheme()

  useEffect(() => { if (!restoring && !isAdmin) routerNavigate("/login", { replace: true }) }, [isAdmin, restoring, routerNavigate])

  // Close user menu on click outside
  useEffect(() => {
    if (!userMenuOpen) return
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [userMenuOpen])

  const handleSignOut = useCallback(() => {
    setUserMenuOpen(false)
    logout()
    routerNavigate("/login", { replace: true })
  }, [logout, routerNavigate])

  const handleGoSettings = useCallback(() => {
    setUserMenuOpen(false)
    selectSection("settings")
    navigate("settings")
  }, [selectSection, navigate])

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

  const initials = admin?.name
    ? admin.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "?"

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
            <div className={`${s.tbBtn} ${s.wsBtn}`}>
              {admin?.company || "My Workspace"}
              <ChevronDown size={12} />
            </div>
            <div className={s.userMenuWrap} ref={menuRef}>
              <button
                className={s.userAvatar}
                onClick={() => setUserMenuOpen(v => !v)}
                aria-label="User menu"
              >
                {initials}
              </button>
              {userMenuOpen && (
                <div className={s.userMenu}>
                  <div className={s.userMenuHeader}>
                    <div className={s.userMenuName}>{admin?.name || "User"}</div>
                    <div className={s.userMenuEmail}>{admin?.email || ""}</div>
                    <div className={s.userMenuRole}>{(admin?.role || "member").toUpperCase()}</div>
                  </div>
                  <div className={s.userMenuDivider} />
                  <button className={s.userMenuItem} onClick={handleGoSettings}>
                    <Settings size={14} /> Settings
                  </button>
                  <button className={s.userMenuItem} onClick={handleSignOut}>
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
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

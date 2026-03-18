// ═══════════════════════════════════════════
// Dashboard Shell — /admin/*
// ═══════════════════════════════════════════

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Bell, Menu, Loader2, User, Settings, LogOut, ChevronDown } from "lucide-react"
import { T } from "@/app/tokens.js"
import { ENABLED_MODULES } from "@/app/modules.js"
import useAuth from "@/hooks/useAuth.jsx"
import { useData } from "@/context/DataProvider.jsx"
import DashboardSidebar, { NAV_ITEMS } from "@/app/dashboard/components/DashboardSidebar.jsx"
import CompanyQRModal from "@/app/dashboard/components/CompanyQRModal.jsx"
import s from "./DashboardShell.module.css"

import DashboardHome   from "@/app/dashboard/pages/DashboardHome.jsx"
import TeamPage        from "@/app/dashboard/pages/TeamPage.jsx"
import FleetPage       from "@/app/dashboard/pages/FleetPage.jsx"
import AccountsPage    from "@/app/dashboard/pages/AccountsPage.jsx"
import ClockInPage     from "@/app/dashboard/pages/ClockInPage.jsx"
import FieldDocsPage   from "@/app/dashboard/pages/FieldDocsPage.jsx"
import SchedulePage    from "@/app/dashboard/pages/SchedulePage.jsx"
import ResourcesPage   from "@/app/dashboard/pages/ResourcesPage.jsx"
import ModulePage      from "@/app/dashboard/pages/ModulePage.jsx"
import ReportsPage     from "@/app/dashboard/pages/ReportsPage.jsx"
import PlaceholderPage from "@/app/dashboard/pages/PlaceholderPage.jsx"

export default function DashboardShell() {
  const navigate = useNavigate()
  const { admin, isAdmin, restoring, logout } = useAuth()
  const { refreshAll } = useData()

  const [activePage, setActivePage] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const avatarRef = useRef(null)

  useEffect(() => { if (!restoring && !isAdmin) navigate("/login", { replace: true }) }, [isAdmin, restoring, navigate])
  useEffect(() => { if (isAdmin) refreshAll().catch(console.error) }, [isAdmin]) // eslint-disable-line react-hooks/exhaustive-deps

  if (restoring || !isAdmin) {
    return (
      <div className={s.loading}>
        <Loader2 size={24} color={T.accent} className={s.spinner} />
      </div>
    )
  }

  const getPageTitle = () => {
    if (activePage === "dashboard") return "Dashboard"
    if (activePage.startsWith("mod-")) return ENABLED_MODULES.find(m => `mod-${m.key}` === activePage)?.label || "Module"
    return NAV_ITEMS.find(n => n.key === activePage)?.label || activePage
  }

  const handleLogout = () => { logout(); navigate("/login", { replace: true }) }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":  return <DashboardHome onNavigate={setActivePage} />
      case "team":       return <TeamPage />
      case "fleet":      return <FleetPage />
      case "accounts":   return <AccountsPage />
      case "clock-in":   return <ClockInPage />
      case "field-docs": return <FieldDocsPage />
      case "schedule":   return <SchedulePage />
      case "resources":  return <ResourcesPage />
      case "reports":    return <ReportsPage />
      default:
        if (activePage.startsWith("mod-")) return <ModulePage moduleKey={activePage.replace("mod-", "")} />
        return <PlaceholderPage title={getPageTitle()} />
    }
  }

  return (
    <div className={s.shell}>
      <DashboardSidebar activePage={activePage} onNavigate={setActivePage}
        open={sidebarOpen} onClose={() => setSidebarOpen(false)}
        onSettings={() => setQrModalOpen(true)} />

      <CompanyQRModal open={qrModalOpen} onClose={() => setQrModalOpen(false)} />

      <div className={s.main}>
        <div className={s.header}>
          <div className={s.headerLeft}>
            <button className={s.hamburger} onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <div className={s.headerTitle}>{getPageTitle()}</div>
          </div>
          <div className={s.headerRight}>
            <div className={s.searchBar}>
              <Search size={16} />
              <span className={s.searchText}>Search...</span>
            </div>
            <Bell size={20} className={s.bell} />
            <div style={{ position: "relative" }} ref={avatarRef}>
              <button onClick={() => setAvatarMenuOpen(!avatarMenuOpen)} className={s.avatar}
                style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {admin?.name?.charAt(0) || "A"}
              </button>
              {avatarMenuOpen && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 49 }}
                    onClick={() => setAvatarMenuOpen(false)} />
                  <div style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 50,
                    width: 240, background: T.card, borderRadius: 14,
                    border: `1px solid ${T.border}`, boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                  }}>
                    <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{admin?.name || "User"}</div>
                      <div style={{ fontSize: 12, color: T.textLight, marginTop: 2 }}>{admin?.email || ""}</div>
                      <div style={{
                        fontSize: 10, fontWeight: 700, color: T.accent, textTransform: "uppercase",
                        letterSpacing: "0.5px", marginTop: 6,
                      }}>
                        {admin?.role || "member"}
                      </div>
                    </div>
                    <div style={{ padding: "6px" }}>
                      <button onClick={() => { setAvatarMenuOpen(false); setActivePage("settings") }}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, width: "100%",
                          padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                          background: "none", fontFamily: T.font, fontSize: 14, color: T.text,
                          textAlign: "left",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = T.bg}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                      >
                        <User size={16} color={T.textLight} /> Profile
                      </button>
                      <button onClick={() => { setAvatarMenuOpen(false); setActivePage("settings") }}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, width: "100%",
                          padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                          background: "none", fontFamily: T.font, fontSize: 14, color: T.text,
                          textAlign: "left",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = T.bg}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                      >
                        <Settings size={16} color={T.textLight} /> Settings
                      </button>
                    </div>
                    <div style={{ padding: "6px", borderTop: `1px solid ${T.border}` }}>
                      <button onClick={() => { setAvatarMenuOpen(false); handleLogout() }}
                        style={{
                          display: "flex", alignItems: "center", gap: 10, width: "100%",
                          padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                          background: "none", fontFamily: T.font, fontSize: 14, color: T.red,
                          textAlign: "left",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = T.redLight}
                        onMouseLeave={e => e.currentTarget.style.background = "none"}
                      >
                        <LogOut size={16} /> Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <main className={s.content}>
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

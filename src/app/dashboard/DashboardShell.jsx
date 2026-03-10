// ═══════════════════════════════════════════
// Dashboard Shell — /admin/*
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Bell, Menu, Loader2 } from "lucide-react"
import { T } from "@/app/tokens.js"
import { ENABLED_MODULES } from "@/app/modules.js"
import useAuth from "@/hooks/useAuth.jsx"
import { useData } from "@/context/DataProvider.jsx"
import DashboardSidebar, { NAV_ITEMS } from "@/app/dashboard/components/DashboardSidebar.jsx"

import DashboardHome   from "@/app/dashboard/pages/DashboardHome.jsx"
import TeamPage        from "@/app/dashboard/pages/TeamPage.jsx"
import FleetPage       from "@/app/dashboard/pages/FleetPage.jsx"
import AccountsPage    from "@/app/dashboard/pages/AccountsPage.jsx"
import ClockInPage     from "@/app/dashboard/pages/ClockInPage.jsx"
import FieldDocsPage   from "@/app/dashboard/pages/FieldDocsPage.jsx"
import SchedulePage    from "@/app/dashboard/pages/SchedulePage.jsx"
import ResourcesPage   from "@/app/dashboard/pages/ResourcesPage.jsx"
import ModulePage      from "@/app/dashboard/pages/ModulePage.jsx"
import PlaceholderPage from "@/app/dashboard/pages/PlaceholderPage.jsx"

export default function DashboardShell() {
  const navigate = useNavigate()
  const { admin, isAdmin, restoring, logout } = useAuth()
  const { refreshAll } = useData()

  const [activePage, setActivePage] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => { if (!restoring && !isAdmin) navigate("/login", { replace: true }) }, [isAdmin, restoring, navigate])
  useEffect(() => { if (isAdmin) refreshAll().catch(console.error) }, [isAdmin]) // eslint-disable-line react-hooks/exhaustive-deps

  if (restoring || !isAdmin) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg, fontFamily: T.font }}>
        <Loader2 size={24} color={T.accent} style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
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
      case "dashboard":  return <DashboardHome isMobile={isMobile} onNavigate={setActivePage} />
      case "team":       return <TeamPage isMobile={isMobile} />
      case "fleet":      return <FleetPage isMobile={isMobile} />
      case "accounts":   return <AccountsPage isMobile={isMobile} />
      case "clock-in":   return <ClockInPage isMobile={isMobile} />
      case "field-docs": return <FieldDocsPage isMobile={isMobile} />
      case "schedule":   return <SchedulePage isMobile={isMobile} />
      case "resources":  return <ResourcesPage isMobile={isMobile} />
      default:
        if (activePage.startsWith("mod-")) return <ModulePage moduleKey={activePage.replace("mod-", "")} />
        return <PlaceholderPage title={getPageTitle()} />
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, fontFamily: T.font, color: T.text }}>
      <DashboardSidebar activePage={activePage} onNavigate={setActivePage}
        open={sidebarOpen} onClose={() => setSidebarOpen(false)} isMobile={isMobile} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: isMobile ? "12px 16px" : "12px 32px",
          background: T.card, borderBottom: `1px solid ${T.border}`,
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
                <Menu size={22} color={T.text} />
              </button>
            )}
            <div style={{ fontSize: 18, fontWeight: 700 }}>{getPageTitle()}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 16 }}>
            {!isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.bg, borderRadius: 10, padding: "8px 14px", width: 220 }}>
                <Search size={16} color={T.textLight} />
                <span style={{ fontSize: 14, color: T.textLight }}>Search...</span>
              </div>
            )}
            <Bell size={20} color={T.textMed} style={{ cursor: "pointer" }} />
            <button onClick={handleLogout} style={{
              width: 34, height: 34, borderRadius: 10, background: T.accent,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", border: "none",
            }}>{admin?.name?.charAt(0) || "A"}</button>
          </div>
        </div>
        <div style={{ flex: 1, padding: isMobile ? 16 : 32, overflowY: "auto" }}>
          {renderPage()}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Dashboard Sidebar — Admin navigation
// Collapsible modules section for scalability.
// ═══════════════════════════════════════════

import { useState, useRef, useEffect } from "react"
import {
  LayoutDashboard, Calendar, FileText, Clock, Users,
  MapPinned, Truck, BookOpen, BarChart3, Settings,
  LogOut, Leaf, ChevronUp, ChevronDown,
} from "lucide-react"
import { T } from "@/app/tokens.js"
import { ENABLED_MODULES } from "@/app/modules.js"
import { APP } from "@/config/app.js"

export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { type: "divider", label: "OPERATIONS" },
  { key: "schedule", label: "Schedule", icon: Calendar },
  { key: "field-docs", label: "Field Docs", icon: FileText },
  { key: "clock-in", label: "Daily Clock-In", icon: Clock },
  { type: "divider", label: "MANAGE" },
  { key: "team", label: "Team", icon: Users },
  { key: "accounts", label: "Accounts", icon: MapPinned },
  { key: "fleet", label: "Fleet", icon: Truck },
  { key: "resources", label: "Resources", icon: BookOpen },
  { type: "divider", label: "REPORTS" },
  { key: "reports", label: "Reports", icon: BarChart3 },
]

export default function DashboardSidebar({ activePage, onNavigate, open, onClose, isMobile }) {
  const [modulesExpanded, setModulesExpanded] = useState(true)
  const sidebarRef = useRef(null)
  const showModulesCollapsed = ENABLED_MODULES.length > 4

  const handleNav = (key) => {
    onNavigate(key)
    if (isMobile && onClose) onClose()
  }

  // Focus trap for mobile
  useEffect(() => {
    if (!isMobile || !open) return
    const sidebar = sidebarRef.current
    if (!sidebar) return

    const handleKey = (e) => {
      if (e.key === "Escape") onClose()
    }
    sidebar.addEventListener("keydown", handleKey)
    return () => sidebar.removeEventListener("keydown", handleKey)
  }, [isMobile, open, onClose])

  return (
    <>
      {isMobile && open && (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} />
      )}

      <div ref={sidebarRef} style={{
        width: 240, background: T.sidebar, display: "flex",
        flexDirection: "column", flexShrink: 0, overflow: "hidden",
        ...(isMobile ? {
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 50,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: open ? "4px 0 32px rgba(0,0,0,0.18)" : "none",
        } : {}),
      }}>
        {/* Logo */}
        <div style={{
          padding: "20px 20px", display: "flex", alignItems: "center", gap: 10,
          borderBottom: "1px solid #1E293B", minHeight: 64,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: T.accent, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Leaf size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{APP.name}</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>{APP.tagline}</div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {NAV_ITEMS.map((item, i) => {
            if (item.type === "divider") {
              return (
                <div key={i} style={{
                  fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase",
                  letterSpacing: 1.2, padding: "16px 12px 6px",
                }}>{item.label}</div>
              )
            }
            const active = activePage === item.key
            return (
              <button key={item.key} onClick={() => handleNav(item.key)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 2,
                background: active ? T.sidebarActive : "transparent",
                color: active ? "#fff" : "#94A3B8", fontFamily: T.font,
                fontSize: 14, fontWeight: active ? 600 : 500, transition: "all 0.15s",
              }}>
                <item.icon size={18} />
                <span>{item.label}</span>
              </button>
            )
          })}

          {/* Modules section */}
          {ENABLED_MODULES.length > 0 && (
            <>
              <button
                onClick={() => showModulesCollapsed && setModulesExpanded(!modulesExpanded)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  width: "100%", padding: "16px 12px 6px", border: "none", background: "none",
                  cursor: showModulesCollapsed ? "pointer" : "default", fontFamily: T.font,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 1.2 }}>
                  MODULES ({ENABLED_MODULES.length})
                </span>
                {showModulesCollapsed && (
                  modulesExpanded ? <ChevronUp size={14} color="#475569" /> : <ChevronDown size={14} color="#475569" />
                )}
              </button>

              {(modulesExpanded || !showModulesCollapsed) && ENABLED_MODULES.map(mod => {
                const active = activePage === `mod-${mod.key}`
                return (
                  <button key={mod.key} onClick={() => handleNav(`mod-${mod.key}`)} style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 2,
                    background: active ? T.sidebarActive : "transparent",
                    color: active ? "#fff" : "#94A3B8", fontFamily: T.font,
                    fontSize: 14, fontWeight: active ? 600 : 500, transition: "all 0.15s",
                  }}>
                    <mod.icon size={18} />
                    <span style={{ flex: 1, textAlign: "left" }}>{mod.label}</span>
                    <span style={{
                      fontSize: 8, fontWeight: 700, background: `${mod.color}20`,
                      color: mod.color, padding: "2px 6px", borderRadius: 4,
                    }}>MOD</span>
                  </button>
                )
              })}

              {!modulesExpanded && showModulesCollapsed && (
                <div style={{ padding: "4px 12px 8px", fontSize: 12, color: "#475569" }}>
                  {ENABLED_MODULES.length} modules active
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid #1E293B" }}>
          <button style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
            borderRadius: 8, border: "none", cursor: "pointer",
            background: "transparent", color: "#64748B", fontFamily: T.font, fontSize: 13,
          }}>
            <Settings size={18} /><span>Settings</span>
          </button>
          <button style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px",
            borderRadius: 8, border: "none", cursor: "pointer",
            background: "transparent", color: "#64748B", fontFamily: T.font, fontSize: 13,
          }}>
            <LogOut size={18} /><span>Log Out</span>
          </button>
          <div style={{ fontSize: 10, color: "#334155", padding: "8px 12px 4px" }}>{APP.name} v{APP.version}</div>
        </div>
      </div>
    </>
  )
}

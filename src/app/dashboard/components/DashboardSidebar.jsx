// ═══════════════════════════════════════════
// Dashboard Sidebar — Admin navigation
// CSS Module + collapsible groups + icon-only collapsed mode.
// ═══════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from "react"
import {
  LayoutDashboard, Calendar, FileText, Clock, Users,
  MapPinned, Truck, BookOpen, BarChart3, Settings,
  LogOut, Leaf, ChevronUp, ChevronDown, PanelLeftClose, PanelLeftOpen,
} from "lucide-react"
import { ENABLED_MODULES } from "@/app/modules.js"
import { APP } from "@/config/app.js"
import s from "./DashboardSidebar.module.css"

/* ── Nav items (exported for DashboardShell page titles) ── */
export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { type: "divider", label: "OPERATIONS", group: "operations" },
  { key: "schedule", label: "Schedule", icon: Calendar, group: "operations" },
  { key: "field-docs", label: "Field Docs", icon: FileText, group: "operations" },
  { key: "clock-in", label: "Daily Clock-In", icon: Clock, group: "operations" },
  { type: "divider", label: "MANAGE", group: "manage" },
  { key: "team", label: "Team", icon: Users, group: "manage" },
  { key: "accounts", label: "Accounts", icon: MapPinned, group: "manage" },
  { key: "fleet", label: "Fleet", icon: Truck, group: "manage" },
  { key: "resources", label: "Resources", icon: BookOpen, group: "manage" },
  { type: "divider", label: "REPORTS", group: "reports" },
  { key: "reports", label: "Reports", icon: BarChart3, group: "reports" },
]

/* ── localStorage helpers ── */
const LS_COLLAPSED = "fp-sidebar-collapsed"
const LS_GROUPS = "fp-sidebar-groups"

function readBool(key, fallback) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v === "true" } catch { return fallback }
}

function readJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v) } catch { return fallback }
}

/* ── Build grouped structure from flat NAV_ITEMS ── */
function buildGroups() {
  const groups = []
  let current = null

  for (const item of NAV_ITEMS) {
    if (item.type === "divider") {
      current = { label: item.label, groupKey: item.group, items: [] }
      groups.push(current)
    } else if (!item.group) {
      // Top-level items (Dashboard) — no group wrapper
      groups.push({ type: "single", item })
    } else if (current) {
      current.items.push(item)
    }
  }
  return groups
}

const NAV_GROUPS = buildGroups()

/* ── Component ── */
export default function DashboardSidebar({ activePage, onNavigate, open, onClose, onSettings }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => readBool(LS_COLLAPSED, false))
  const [groupStates, setGroupStates] = useState(() =>
    readJSON(LS_GROUPS, { operations: true, manage: true, reports: true, modules: true })
  )
  const [modulesExpanded, setModulesExpanded] = useState(true)
  const sidebarRef = useRef(null)
  const showModulesCollapsed = ENABLED_MODULES.length > 4

  // Persist collapsed state
  useEffect(() => {
    try { localStorage.setItem(LS_COLLAPSED, String(sidebarCollapsed)) } catch { /* noop */ }
  }, [sidebarCollapsed])

  useEffect(() => {
    try { localStorage.setItem(LS_GROUPS, JSON.stringify(groupStates)) } catch { /* noop */ }
  }, [groupStates])

  const toggleGroup = useCallback((groupKey) => {
    setGroupStates(prev => ({ ...prev, [groupKey]: !prev[groupKey] }))
  }, [])

  const handleNav = useCallback((key) => {
    onNavigate(key)
    // On mobile the sidebar is an overlay — close after navigating
    if (onClose) onClose()
  }, [onNavigate, onClose])

  // Escape key closes mobile overlay
  useEffect(() => {
    if (!open) return
    const handleKey = (e) => { if (e.key === "Escape") onClose?.() }
    const el = sidebarRef.current
    if (!el) return
    el.addEventListener("keydown", handleKey)
    return () => el.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  /* helper: class combiner */
  const cx = (...classes) => classes.filter(Boolean).join(" ")

  /* ── Render a nav button ── */
  const renderNavBtn = (item) => {
    const active = activePage === item.key
    return (
      <button
        key={item.key}
        onClick={() => handleNav(item.key)}
        className={cx(s.navBtn, active && s.active)}
        aria-current={active ? "page" : undefined}
      >
        <span className={s.navBtnIcon}><item.icon size={18} /></span>
        <span className={s.navBtnLabel}>{item.label}</span>
        <span className={s.tooltip}>{item.label}</span>
      </button>
    )
  }

  /* ── Render a collapsible group ── */
  const renderGroup = (group) => {
    const expanded = groupStates[group.groupKey] !== false
    return (
      <div key={group.groupKey}>
        <button
          className={s.groupHeader}
          onClick={() => toggleGroup(group.groupKey)}
          aria-expanded={expanded}
        >
          <span className={s.groupLabel}>{group.label}</span>
          <ChevronUp
            size={14}
            className={cx(s.groupChevron, expanded ? s.groupChevronUp : s.groupChevronDown)}
          />
        </button>
        {expanded && group.items.map(renderNavBtn)}
      </div>
    )
  }

  /* ── Group modules by category when many ── */
  const renderModules = () => {
    if (ENABLED_MODULES.length === 0) return null

    const modsExpanded = modulesExpanded || !showModulesCollapsed

    return (
      <>
        <button
          className={s.groupHeader}
          onClick={() => showModulesCollapsed && setModulesExpanded(!modulesExpanded)}
          style={{ cursor: showModulesCollapsed ? "pointer" : "default" }}
          aria-expanded={modsExpanded}
        >
          <span className={s.groupLabel}>MODULES ({ENABLED_MODULES.length})</span>
          {showModulesCollapsed && (
            <ChevronUp
              size={14}
              className={cx(s.groupChevron, modulesExpanded ? s.groupChevronUp : s.groupChevronDown)}
            />
          )}
        </button>

        {modsExpanded && ENABLED_MODULES.map(mod => {
          const active = activePage === `mod-${mod.key}`
          return (
            <button
              key={mod.key}
              onClick={() => handleNav(`mod-${mod.key}`)}
              className={cx(s.navBtn, active && s.active)}
              aria-current={active ? "page" : undefined}
            >
              <span className={s.navBtnIcon}><mod.icon size={18} /></span>
              <span className={s.navBtnLabel} style={{ flex: 1, textAlign: "left" }}>{mod.label}</span>
              <span
                className={s.modBadge}
                style={{ background: `${mod.color}20`, color: mod.color }}
              >MOD</span>
              <span className={s.tooltip}>{mod.label}</span>
            </button>
          )
        })}

        {!modulesExpanded && showModulesCollapsed && (
          <div className={s.modulesCollapsedInfo}>
            {ENABLED_MODULES.length} modules active
          </div>
        )}
      </>
    )
  }

  const sidebarCx = cx(
    s.sidebar,
    sidebarCollapsed && s.collapsed,
    open && s.open,
  )

  return (
    <>
      {/* Backdrop (mobile only via CSS) */}
      <div
        className={cx(s.backdrop, open && s.open)}
        onClick={onClose}
        aria-hidden="true"
      />

      <nav ref={sidebarRef} className={sidebarCx} aria-label="Main navigation">
        {/* Logo */}
        <div className={s.logo}>
          <div className={s.logoIcon}>
            <Leaf size={18} color="#fff" />
          </div>
          <div className={s.logoText}>
            <div className={s.logoName}>{APP.name}</div>
            <div className={s.logoTagline}>{APP.tagline}</div>
          </div>
        </div>

        {/* Nav */}
        <div className={s.nav}>
          {NAV_GROUPS.map(entry => {
            if (entry.type === "single") return renderNavBtn(entry.item)
            return renderGroup(entry)
          })}

          {/* Modules */}
          {renderModules()}
        </div>

        {/* Footer */}
        <div className={s.footer}>
          <button className={s.footerBtn} onClick={onSettings}>
            <Settings size={18} />
            <span className={s.footerBtnLabel}>Settings</span>
            <span className={s.tooltip}>Settings</span>
          </button>
          <button className={s.footerBtn}>
            <LogOut size={18} />
            <span className={s.footerBtnLabel}>Log Out</span>
            <span className={s.tooltip}>Log Out</span>
          </button>
          <div className={s.version}>{APP.name} v{APP.version}</div>

          {/* Collapse / Expand toggle */}
          <button
            className={s.collapseBtn}
            onClick={() => setSidebarCollapsed(c => !c)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            <span className={s.collapseBtnLabel}>
              {sidebarCollapsed ? "Expand" : "Collapse"}
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}

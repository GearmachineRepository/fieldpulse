// ═══════════════════════════════════════════
// Admin Sidebar — Grouped navigation
// Data-driven: add a section by adding to NAV_GROUPS
// ═══════════════════════════════════════════

import { useRef, useEffect } from 'react'
import { APP, C } from '@/config/index.js'

// ── Navigation config — single source of truth ──
export const NAV_GROUPS = [
  {
    items: [
      { key: 'admin-home', icon: '🏠', label: 'Dashboard' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { key: 'admin-spraylogs', icon: '📋', label: 'Spray Logs' },
      { key: 'admin-rosters',   icon: '🕐', label: 'Daily Clock-In' },
      { key: 'admin-routes',    icon: '🗺️', label: 'Routes' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { key: 'admin-team',      icon: '👥', label: 'Team' },
      { key: 'admin-accounts',  icon: '🏘️', label: 'Accounts' },
      { key: 'admin-inventory', icon: '🧪', label: 'Inventory' },
      { key: 'admin-vehicles',  icon: '🚛', label: 'Fleet' },
    ],
  },
]

export const ADMIN_PAGE_TITLES = {}
NAV_GROUPS.forEach(g => g.items.forEach(it => { ADMIN_PAGE_TITLES[it.key] = it.label }))

export default function AdminSidebar({ open, onClose, currentPage, onNav }) {
  const activeKey   = getActiveKey(currentPage)
  const sidebarRef  = useRef(null)
  const onCloseRef  = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const sidebar = sidebarRef.current
    if (!sidebar) return

    if (open) {
      // Remove inert so the sidebar is interactive
      sidebar.removeAttribute('inert')

      // Focus the first nav item after the CSS transition starts
      requestAnimationFrame(() => {
        const first = sidebar.querySelector('[tabindex]:not([tabindex="-1"]), button')
        first?.focus()
      })

      // ── Focus trap ──
      const trap = (e) => {
        if (e.key === 'Escape') { onCloseRef.current(); return }
        if (e.key !== 'Tab') return
        const focusable = sidebar.querySelectorAll(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last  = focusable[focusable.length - 1]
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus() }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first.focus() }
        }
      }
      sidebar.addEventListener('keydown', trap)
      return () => sidebar.removeEventListener('keydown', trap)
    } else {
      // Sidebar is closed — make it fully inert so Tab cannot reach hidden nav items
      sidebar.setAttribute('inert', '')
    }
  }, [open])

  return (
    <>
      {open && (
        <div onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40, transition: 'opacity 0.2s' }} />
      )}

      <div
        ref={sidebarRef}
        // inert is set/removed by the effect above; start closed
        inert=""
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 280,
          background: C.sidebar, zIndex: 50,
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex', flexDirection: 'column',
          boxShadow: open ? '4px 0 32px rgba(0,0,0,0.18)' : 'none',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid #2E2E2A' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.accent, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 2 }}>{APP.name}</div>
          <div style={{ fontSize: 13, color: '#777770' }}>Admin Panel</div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} style={{ marginBottom: 8 }}>
              {group.label && (
                <div style={{ fontSize: 10, fontWeight: 800, color: '#555550', textTransform: 'uppercase', letterSpacing: 2, padding: '8px 8px 4px' }}>
                  {group.label}
                </div>
              )}
              {group.items.map(item => {
                const isActive = activeKey === item.key
                return (
                  <div key={item.key} tabIndex={0} role="button"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => { onNav(item.key); onClose() }}
                    onKeyDown={e => e.key === 'Enter' && (onNav(item.key), onClose())}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 10, cursor: 'pointer', marginBottom: 2,
                      background: isActive ? C.accentLight : 'transparent',
                      color: isActive ? C.accent : '#C8C8C0',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: 14,
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = C.sidebarHover }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                    <span style={{ fontSize: 18 }}>{item.icon}</span>
                    {item.label}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

function getActiveKey(page) {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (page === item.key) return item.key
    }
  }
  return null
}
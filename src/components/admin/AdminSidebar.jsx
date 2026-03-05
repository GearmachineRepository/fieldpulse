// ═══════════════════════════════════════════
// Admin Sidebar — Grouped navigation
// Data-driven: add a section by adding to NAV_GROUPS
// ═══════════════════════════════════════════

import { APP, C } from '../../config.js'

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
      { key: 'admin-rosters',   icon: '🕐', label: 'Daily Clock-In' },  // ← renamed from "Crew Rosters"
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
  const activeKey = getActiveKey(currentPage)

  return (
    <>
      {open && (
        <div onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40, transition: 'opacity 0.2s' }} />
      )}

      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 280,
        background: C.sidebar, zIndex: 50,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: open ? '4px 0 32px rgba(0,0,0,0.18)' : 'none',
      }}>
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
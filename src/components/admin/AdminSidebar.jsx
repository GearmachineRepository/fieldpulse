// ═══════════════════════════════════════════
// Admin Sidebar — Grouped navigation
// Data-driven: add a section by adding to NAV_GROUPS
// ═══════════════════════════════════════════

import { APP, C } from '../../config.js'

// ── Navigation config — single source of truth ──
// To add a new page: add an item here and a route in AdminDashboard.jsx
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
      { key: 'admin-rosters', icon: '👷', label: 'Crew Rosters' },
    ],
  },
  {
    label: 'Manage',
    items: [
      { key: 'admin-team', icon: '👥', label: 'Team' },
      { key: 'admin-inventory', icon: '🧪', label: 'Inventory' },
      { key: 'admin-vehicles', icon: '🚛', label: 'Fleet' },
    ],
  },
]

// Flat lookup for page titles (used by App.jsx header)
export const ADMIN_PAGE_TITLES = {}
NAV_GROUPS.forEach(g => g.items.forEach(it => { ADMIN_PAGE_TITLES[it.key] = it.label }))

export default function AdminSidebar({ open, onClose, currentPage, onNav }) {
  // Determine which nav item is "active" — team sub-pages map to team, etc.
  const activeKey = getActiveKey(currentPage)

  return (
    <>
      {/* Overlay */}
      {open && (
        <div onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40, transition: 'opacity 0.2s' }} />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 280,
        background: C.sidebar, zIndex: 50,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: open ? '4px 0 24px rgba(0,0,0,0.3)' : 'none',
      }}>
        {/* Brand */}
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid #333' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 4, color: C.amber, fontWeight: 800 }}>
            {APP.name}
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginTop: 4 }}>
            Admin Panel
          </div>
        </div>

        {/* Nav Groups */}
        <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <div style={{
                  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2,
                  color: '#666', padding: '16px 24px 6px',
                }}>
                  {group.label}
                </div>
              )}
              {group.items.map(it => {
                const isActive = activeKey === it.key
                return (
                  <div key={it.key} tabIndex={0} role="button"
                    onClick={() => { onNav(it.key); onClose() }}
                    onKeyDown={e => { if (e.key === 'Enter') { onNav(it.key); onClose() } }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '13px 24px',
                      cursor: 'pointer',
                      background: isActive ? C.sidebarHover : 'transparent',
                      borderLeft: isActive ? `3px solid ${C.amber}` : '3px solid transparent',
                      transition: 'all 0.15s',
                    }}>
                    <span style={{ fontSize: 18, width: 26, textAlign: 'center' }}>{it.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? '#fff' : '#999' }}>
                      {it.label}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #333', fontSize: 11, color: '#555' }}>
          {APP.name} v{APP.version}
        </div>
      </div>
    </>
  )
}

// Maps sub-pages back to their parent nav item
function getActiveKey(page) {
  if (page === 'admin-employees' || page === 'admin-crews') return 'admin-team'
  if (page === 'admin-chemicals' || page === 'admin-equipment') return 'admin-inventory'
  return page
}
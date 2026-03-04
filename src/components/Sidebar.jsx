import { APP, C } from '../config.js'

const NAV_ITEMS = [
  { key: 'spray', icon: '💧', label: 'Spray Tracker', active: true },
  { key: 'routes', icon: '🗺️', label: 'Routes', active: false },
  { key: 'properties', icon: '🏘️', label: 'Properties', active: false },
  { key: 'crew', icon: '👷', label: 'Crew', active: false },
  { key: 'schedule', icon: '📅', label: 'Schedule', active: false },
  { key: 'reports', icon: '📊', label: 'Reports', active: false },
  { key: 'settings', icon: '⚙️', label: 'Settings', active: false },
]

export default function Sidebar({ open, onClose, currentPage, onNav }) {
  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 40, transition: 'opacity 0.2s',
          }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 280,
        background: C.sidebar, zIndex: 50,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Brand */}
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid #333' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 4, color: C.accent, fontWeight: 800 }}>
            {APP.name}
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginTop: 4 }}>
            {APP.tagline}
          </div>
        </div>

        {/* Nav Items */}
        <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(it => (
            <div
              key={it.key}
              onClick={() => { if (it.active) { onNav(it.key); onClose(); } }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 24px',
                cursor: it.active ? 'pointer' : 'default',
                background: currentPage === it.key ? C.sidebarHover : 'transparent',
                borderLeft: currentPage === it.key ? `3px solid ${C.accent}` : '3px solid transparent',
                opacity: it.active ? 1 : 0.35,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{it.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: currentPage === it.key ? '#fff' : '#aaa' }}>
                {it.label}
              </span>
              {!it.active && (
                <span style={{
                  marginLeft: 'auto', fontSize: 10, padding: '2px 8px',
                  borderRadius: 6, background: '#333', color: '#666', fontWeight: 700,
                }}>
                  Soon
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #333', fontSize: 11, color: '#555' }}>
          {APP.name} v{APP.version} · Phase 1
        </div>
      </div>
    </>
  )
}

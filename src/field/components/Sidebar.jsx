import { useRef, useEffect } from 'react'
import { APP, C } from '@/config/index.js'

const NAV_ITEMS = [
  { key: 'home',   icon: '🏠', label: 'Home' },
  { key: 'routes', icon: '🗺️', label: 'My Routes' },
  { key: 'crew',   icon: '👷', label: 'Crew' },
  { key: 'spray',  icon: '💧', label: 'Spray Tracker' },
]

export default function Sidebar({ open, onClose, currentPage, onNav }) {
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
      // (rAF ensures the element is visible before we focus it)
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
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 40, transition: 'opacity 0.2s',
          }}
        />
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
        }}
      >
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid #333' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 4, color: C.accent, fontWeight: 800 }}>
            {APP.name}
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginTop: 4 }}>
            {APP.tagline}
          </div>
        </div>

        <div style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(it => (
            <div
              key={it.key}
              tabIndex={0}
              role="button"
              aria-current={currentPage === it.key ? 'page' : undefined}
              onClick={() => { onNav(it.key); onClose() }}
              onKeyDown={e => { if (e.key === 'Enter') { onNav(it.key); onClose() } }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 24px',
                cursor: 'pointer',
                background: currentPage === it.key ? C.sidebarHover : 'transparent',
                borderLeft: currentPage === it.key ? `3px solid ${C.accent}` : '3px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{it.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: currentPage === it.key ? '#fff' : '#aaa' }}>
                {it.label}
              </span>
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #333', fontSize: 11, color: '#555' }}>
          {APP.name} v{APP.version}
        </div>
      </div>
    </>
  )
}
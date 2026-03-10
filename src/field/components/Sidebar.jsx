// ═══════════════════════════════════════════
// Field Sidebar — Crew navigation
// Converted: inline styles → CSS Modules.
// Focus trap + inert logic unchanged.
// ═══════════════════════════════════════════

import { useRef, useEffect } from 'react'
import { APP } from '@/config/app.js'
import styles from './Sidebar.module.css'

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
      sidebar.removeAttribute('inert')
      requestAnimationFrame(() => {
        const first = sidebar.querySelector('[tabindex]:not([tabindex="-1"]), button')
        first?.focus()
      })

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
      sidebar.setAttribute('inert', '')
    }
  }, [open])

  return (
    <>
      {open && (
        <div onClick={onClose} className={styles.overlay} />
      )}

      <div
        ref={sidebarRef}
        inert=""
        className={`${styles.sidebar} ${open ? styles.open : ''}`}
      >
        <div className={styles.header}>
          <div className={styles.brand}>{APP.name}</div>
          <div className={styles.tagline}>{APP.tagline}</div>
        </div>

        <div className={styles.nav}>
          {NAV_ITEMS.map(it => (
            <div
              key={it.key}
              tabIndex={0}
              role="button"
              aria-current={currentPage === it.key ? 'page' : undefined}
              onClick={() => { onNav(it.key); onClose() }}
              onKeyDown={e => { if (e.key === 'Enter') { onNav(it.key); onClose() } }}
              className={`${styles.navItem} ${currentPage === it.key ? styles.navItemActive : ''}`}
            >
              <span className={styles.navIcon}>{it.icon}</span>
              <span className={styles.navLabel}>{it.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          {APP.name} v{APP.version}
        </div>
      </div>
    </>
  )
}

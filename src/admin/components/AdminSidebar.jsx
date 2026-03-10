// ═══════════════════════════════════════════
// Admin Sidebar — Grouped navigation
// Converted: inline styles → CSS Modules.
// Focus trap + inert logic unchanged.
// ═══════════════════════════════════════════

import { useRef, useEffect } from 'react'
import { APP } from '@/config/app.js'
import styles from './AdminSidebar.module.css'

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

function getActiveKey(page) {
  for (const g of NAV_GROUPS) {
    for (const it of g.items) {
      if (it.key === page) return it.key
    }
  }
  return 'admin-home'
}

export default function AdminSidebar({ open, onClose, currentPage, onNav }) {
  const activeKey   = getActiveKey(currentPage)
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
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.brand}>{APP.name}</div>
          <div className={styles.subtitle}>Admin Panel</div>
        </div>

        {/* Nav */}
        <div className={styles.nav}>
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={styles.group}>
              {group.label && (
                <div className={styles.groupLabel}>{group.label}</div>
              )}
              {group.items.map(item => {
                const isActive = activeKey === item.key
                return (
                  <div
                    key={item.key}
                    tabIndex={0}
                    role="button"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => { onNav(item.key); onClose() }}
                    onKeyDown={e => e.key === 'Enter' && (onNav(item.key), onClose())}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    <span className={styles.navLabel}>{item.label}</span>
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

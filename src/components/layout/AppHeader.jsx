// ═══════════════════════════════════════════
// AppHeader — top navigation bar
// Converted from inline styles → CSS Modules.
// Same prop interface, zero downstream changes.
// ═══════════════════════════════════════════

import { APP } from '@/config/app.js'
import styles from './AppHeader.module.css'

/**
 * @param {{
 *   pageTitle: string,
 *   isAdmin: boolean,
 *   displayName: string,
 *   displaySub?: string,
 *   onMenuOpen: () => void,
 *   onLogout: () => void,
 * }} props
 */
export default function AppHeader({ pageTitle, isAdmin, displayName, displaySub, onMenuOpen, onLogout }) {
  return (
    <div className={styles.header}>
      <div className={styles.row}>

        {/* ── Hamburger ── */}
        <div
          tabIndex={0}
          role="button"
          onClick={onMenuOpen}
          onKeyDown={e => e.key === 'Enter' && onMenuOpen()}
          className={styles.hamburger}
          aria-label="Open menu"
        >
          <div className={styles.hamburgerLine} />
          <div className={styles.hamburgerLine} />
          <div className={`${styles.hamburgerLine} ${styles.hamburgerLineShort}`} />
        </div>

        {/* ── Brand + page title ── */}
        <div className={styles.brand}>
          <div className={`${styles.appName} ${isAdmin ? styles.appNameAdmin : ''}`}>
            {APP.name}{isAdmin ? ' · ADMIN' : ''}
          </div>
          <div className={styles.pageTitle}>
            {pageTitle}
          </div>
        </div>

        {/* ── User info + sign out ── */}
        <div className={styles.user}>
          <div className={styles.userInfo}>
            {displayName}
            {displaySub && (
              <div className={styles.userSub}>{displaySub}</div>
            )}
          </div>
          <button
            onClick={onLogout}
            className={styles.signOut}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

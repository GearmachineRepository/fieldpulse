// ═══════════════════════════════════════════
// ShellLayout — UI Kit Layout
//
// Standard page structure: header + sidebar +
// main content + toast. Used by every shell.
//
// Updated: added `narrow` prop for crew-side
// layout (430px) vs admin (900px default).
// ═══════════════════════════════════════════

import styles from './ShellLayout.module.css'
import Toast from '../primitives/Toast.jsx'

/**
 * @param {React.ReactNode} header
 * @param {React.ReactNode} [sidebar]
 * @param {React.ReactNode} children
 * @param {string|null} [toast]
 * @param {boolean} [narrow=false]  Use 430px max-width (crew/field app)
 */
export default function ShellLayout({ header, sidebar, children, toast, narrow = false }) {
  return (
    <div className={styles.shell}>
      {header}
      {sidebar}
      <main className={`${styles.content} ${narrow ? styles.narrow : ''}`}>
        {children}
      </main>
      <Toast message={toast} />
    </div>
  )
}

/**
 * Full-screen centered loader shown during shell bootstrap.
 */
ShellLayout.Loader = function ShellLoader({ message = 'Loading…', icon = '💧' }) {
  return (
    <main className={styles.loader}>
      <div className={styles.loaderInner}>
        <div className={styles.loaderIcon}>{icon}</div>
        <div className={styles.loaderText}>{message}</div>
      </div>
    </main>
  )
}

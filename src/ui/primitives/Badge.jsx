// ═══════════════════════════════════════════
// Badge — UI Kit Primitive
// Small status indicators / labels
// ═══════════════════════════════════════════

import styles from './Badge.module.css'

/**
 * @param {'accent'|'blue'|'amber'|'red'|'neutral'} [variant='neutral']
 * @param {React.ReactNode} children
 */
export default function Badge({ variant = 'neutral', children, className = '' }) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`}>
      {children}
    </span>
  )
}

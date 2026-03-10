// ═══════════════════════════════════════════
// EmptyState — UI Kit Primitive
// Replaces src/components/common/EmptyState.jsx
// ═══════════════════════════════════════════

import styles from './EmptyState.module.css'

/**
 * @param {string} icon      Emoji or icon string
 * @param {string} title
 * @param {string} [subtitle]
 * @param {React.ReactNode} [action]  Optional CTA button
 */
export default function EmptyState({ icon, title, subtitle, action }) {
  return (
    <div className={styles.wrapper}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.title}>{title}</div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}

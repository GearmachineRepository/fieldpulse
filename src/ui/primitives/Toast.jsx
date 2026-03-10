// ═══════════════════════════════════════════
// Toast — UI Kit Primitive
// Replaces src/components/common/Toast.jsx
// ═══════════════════════════════════════════

import styles from './Toast.module.css'

/**
 * @param {string|null} message  null = hidden
 */
export default function Toast({ message }) {
  if (!message) return null
  return (
    <div className={styles.toast} role="status" aria-live="polite">
      {message}
    </div>
  )
}

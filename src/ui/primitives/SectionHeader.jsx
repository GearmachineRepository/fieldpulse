// ═══════════════════════════════════════════
// SectionHeader — UI Kit Primitive
// Replaces SectionHeader from SharedAdmin.jsx
// ═══════════════════════════════════════════

import styles from './SectionHeader.module.css'
import Button from './Button.jsx'

/**
 * @param {string} title
 * @param {number} [count]      Shows "N total" subtitle
 * @param {function} [onAdd]    Shows an Add button
 * @param {string} [addLabel]   Label for the add button
 */
export default function SectionHeader({ title, count, onAdd, addLabel }) {
  return (
    <div className={styles.wrapper}>
      <div>
        <h2 className={styles.title}>{title}</h2>
        {count !== undefined && (
          <div className={styles.count}>{count} total</div>
        )}
      </div>
      {onAdd && (
        <Button
          variant="accent"
          size="sm"
          fullWidth={false}
          onClick={onAdd}
        >
          + {addLabel || 'Add New'}
        </Button>
      )}
    </div>
  )
}

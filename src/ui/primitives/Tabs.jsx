// ═══════════════════════════════════════════
// Tabs — UI Kit Primitive
// Replaces SubTabs from SharedAdmin.jsx
// ═══════════════════════════════════════════

import styles from './Tabs.module.css'

/**
 * @param {{ key: string, label: string }[]} tabs
 * @param {string} active   Currently active tab key
 * @param {function} onChange  Called with the new tab key
 * @param {string} [className]
 */
export default function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`${styles.wrapper} ${className}`} role="tablist">
      {tabs.map(t => (
        <button
          key={t.key}
          role="tab"
          aria-selected={active === t.key}
          className={`${styles.tab} ${active === t.key ? styles.active : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

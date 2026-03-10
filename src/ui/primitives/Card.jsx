// ═══════════════════════════════════════════
// Card — UI Kit Primitive
// Replaces cardStyle() inline helper
// ═══════════════════════════════════════════

import styles from './Card.module.css'

/**
 * @param {'default'|'interactive'|'selected'|'danger'|'info'} [variant='default']
 * @param {boolean} [compact=false]  Tighter padding for list items
 * @param {React.ReactNode} children
 * @param {function} [onClick]  Makes the card clickable
 * @param {string} [className]
 */
export default function Card({
  variant = 'default',
  compact = false,
  children,
  onClick,
  className = '',
  ...rest
}) {
  const Tag = onClick ? 'button' : 'div'
  const cls = [
    styles.card,
    styles[variant],
    compact ? styles.compact : '',
    onClick ? styles.clickable : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <Tag className={cls} onClick={onClick} {...(onClick ? { type: 'button' } : {})} {...rest}>
      {children}
    </Tag>
  )
}

/** Sub-component for card header with title + optional action */
Card.Header = function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`${styles.header} ${className}`}>
      <div>
        <div className={styles.title}>{title}</div>
        {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}

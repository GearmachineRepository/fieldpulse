// ═══════════════════════════════════════════
// Button — UI Kit Primitive
//
// Pure presentational. No API calls, no context.
// All behavior comes through props.
// ═══════════════════════════════════════════

import styles from './Button.module.css'

/**
 * @param {'accent'|'blue'|'red'|'ghost'|'outline'} [variant='accent']
 * @param {'sm'|'md'|'lg'} [size='lg']
 * @param {boolean} [fullWidth=true]
 * @param {boolean} [disabled=false]
 * @param {boolean} [loading=false]
 * @param {React.ReactNode} children
 * @param {function} [onClick]
 * @param {string} [className]  Extra classes for one-off overrides
 */
export default function Button({
  variant = 'accent',
  size = 'lg',
  fullWidth = true,
  disabled = false,
  loading = false,
  children,
  onClick,
  className = '',
  type = 'button',
  ...rest
}) {
  const cls = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.full : '',
    loading ? styles.loading : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? <span className={styles.spinner} /> : children}
    </button>
  )
}

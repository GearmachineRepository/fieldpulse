// ═══════════════════════════════════════════
// Modal — UI Kit Primitive
// Replaces Modal from SharedAdmin.jsx
// Focus trap + Escape to close built in.
// ═══════════════════════════════════════════

import { useEffect, useRef, useCallback } from 'react'
import styles from './Modal.module.css'

/**
 * @param {boolean} open
 * @param {function} onClose
 * @param {string} [title]
 * @param {React.ReactNode} children
 * @param {React.ReactNode} [footer]  Buttons row at the bottom
 * @param {'sm'|'md'|'lg'} [size='md']
 */
export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // ── Focus trap + Escape ──
  useEffect(() => {
    if (!open) return

    const dialog = dialogRef.current
    if (!dialog) return

    // Focus first interactive element
    requestAnimationFrame(() => {
      const focusable = dialog.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length > 0) focusable[0].focus()
    })

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onCloseRef.current(); return }
      if (e.key !== 'Tab') return

      const focusable = dialog.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }

    dialog.addEventListener('keydown', handleKeyDown)
    return () => dialog.removeEventListener('keydown', handleKeyDown)
  }, [open])

  if (!open) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}
        className={`${styles.dialog} ${styles[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button className={styles.close} onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        )}

        <div className={styles.body}>
          {children}
        </div>

        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

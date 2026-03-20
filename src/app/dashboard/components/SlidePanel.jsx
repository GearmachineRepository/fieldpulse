// ═══════════════════════════════════════════
// SlidePanel — Right-side slide-in detail
//
// Slides in from the right edge over content.
// z-index: --z-panel (200) — above content,
// below modals (300).
// ═══════════════════════════════════════════

import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import s from "./SlidePanel.module.css"

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   title?: string,
 *   width?: number,
 *   children: React.ReactNode,
 * }} props
 */
export default function SlidePanel({
  open,
  onClose,
  title,
  width = 420,
  children,
}) {
  const panelRef = useRef(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className={s.backdrop} onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className={s.panel}
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {title && (
          <div className={s.header}>
            <div className={s.title}>{title}</div>
            <button className={s.closeBtn} onClick={onClose} type="button" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}
        <div className={s.content}>{children}</div>
      </div>
    </>
  )
}

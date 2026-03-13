// ═══════════════════════════════════════════
// Tooltip — UI Kit Primitive
// Hover/focus info popup
// ═══════════════════════════════════════════

import s from "./Tooltip.module.css"

/**
 * @param {string} text — Tooltip content
 * @param {'top'|'bottom'|'left'|'right'} [position='top']
 * @param {React.ReactNode} children — Trigger element
 */
export default function Tooltip({ text, position = "top", children }) {
  return (
    <div className={s.wrapper}>
      {children}
      <div className={`${s.tip} ${s[position]}`} role="tooltip">{text}</div>
    </div>
  )
}

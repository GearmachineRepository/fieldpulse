// ═══════════════════════════════════════════
// Alert — UI Kit Primitive
// Contextual notification banners
// ═══════════════════════════════════════════

import { Info, CheckCircle, AlertTriangle, AlertCircle, X } from "lucide-react"
import s from "./Alert.module.css"

const ICONS = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
}

/**
 * @param {'info'|'success'|'warning'|'error'} [variant='info']
 * @param {string} [title] — Optional bold title line
 * @param {React.ReactNode} children — Alert body content
 * @param {() => void} [onDismiss] — Shows close button if provided
 * @param {string} [className]
 */
export default function Alert({ variant = "info", title, children, onDismiss, className = "" }) {
  const Icon = ICONS[variant]
  return (
    <div className={`${s.alert} ${s[variant]} ${className}`} role="alert">
      <Icon size={18} className={s.icon} />
      <div className={s.content}>
        {title && <div className={s.title}>{title}</div>}
        {children}
      </div>
      {onDismiss && (
        <button className={s.dismiss} onClick={onDismiss} aria-label="Dismiss">
          <X size={16} />
        </button>
      )}
    </div>
  )
}

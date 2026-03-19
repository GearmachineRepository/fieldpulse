// ═══════════════════════════════════════════
// Shared Dashboard Components
//
// Design-system aligned. All CRUD pages share
// these Modal, FormField, ConfirmModal, and
// utility components.
//
// import { Modal, FormField, ... } from '@/app/dashboard/components/PageUI.jsx'
// ═══════════════════════════════════════════

import { useState, useRef, useEffect, useCallback } from "react"
import { X, AlertCircle, Loader2, ChevronDown, Search } from "lucide-react"
import s from "./PageUI.module.css"

// ── Exported CSS Module classes for pages ──
export const styles = s

// ── Form Field ──
export function FormField({ label, value, onChange, type = "text", placeholder, maxLength, autoFocus, error, children }) {
  const id = label ? `field-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined

  if (children) {
    return (
      <div className={s.fieldGroup}>
        {label && <label htmlFor={id} className={s.label}>{label}</label>}
        {children}
        {error && <div className={s.error}>{error}</div>}
      </div>
    )
  }
  return (
    <div className={s.fieldGroup}>
      {label && <label htmlFor={id} className={s.label}>{label}</label>}
      <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength} autoFocus={autoFocus}
        className={`${s.input} ${error ? s.inputError : ""}`} />
      {error && <div className={s.error}>{error}</div>}
    </div>
  )
}

// ── Textarea Field ──
export function TextareaField({ label, value, onChange, placeholder, rows = 3, error }) {
  const id = label ? `field-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined
  return (
    <div className={s.fieldGroup}>
      {label && <label htmlFor={id} className={s.label}>{label}</label>}
      <textarea id={id} value={value} onChange={e => onChange(e.target.value)} rows={rows}
        placeholder={placeholder} className={`${s.textarea} ${error ? s.inputError : ""}`} />
      {error && <div className={s.error}>{error}</div>}
    </div>
  )
}

// ── Select Field ──
export function SelectField({ label, value, onChange, options, placeholder, error }) {
  const id = label ? `field-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined
  return (
    <div className={s.fieldGroup}>
      {label && <label htmlFor={id} className={s.label}>{label}</label>}
      <select id={id} value={value} onChange={e => onChange(e.target.value)}
        className={`${s.select} ${error ? s.inputError : ""}`}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
      {error && <div className={s.error}>{error}</div>}
    </div>
  )
}

// ── Modal (with focus trap + Escape) ──
export function Modal({ title, onClose, children, size = "md" }) {
  const dialogRef = useRef(null)
  const sizeClass = size === "sm" ? s.modalPanelSm : size === "lg" ? s.modalPanelLg : s.modalPanelMd

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  // Focus trap + Escape
  useEffect(() => {
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
      if (e.key === "Escape") { onClose(); return }
      if (e.key !== "Tab") return

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

    dialog.addEventListener("keydown", handleKeyDown)
    return () => dialog.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} className={s.modalOverlay}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Dialog"}
        className={`${s.modalPanel} ${sizeClass}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={s.modalHeader}>
          <div className={s.modalTitle}>{title}</div>
          <button onClick={onClose} className={s.modalClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className={s.modalBody}>{children}</div>
      </div>
    </div>
  )
}

// ── Modal Footer (Save / Cancel / optional Delete) ──
export function ModalFooter({ onClose, onSave, onDelete, saving, disabled, deleteLabel = "Delete" }) {
  return (
    <div className={s.modalFooter}>
      <div>
        {onDelete && (
          <button onClick={onDelete} className={s.btnDelete}>{deleteLabel}</button>
        )}
      </div>
      <div className={s.modalFooterRight}>
        <button onClick={onClose} className={s.btnCancel}>Cancel</button>
        <button onClick={onSave} disabled={saving || disabled} className={s.btnSave}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  )
}

// ── Confirm Modal ──
export function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = "Remove", confirmColor }) {
  // Escape to cancel
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onCancel() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onCancel])

  return (
    <div onClick={e => e.target === e.currentTarget && onCancel()} className={s.confirmOverlay}>
      <div className={s.confirmPanel} role="alertdialog" aria-label={title}>
        <div className={s.confirmIcon}>
          <AlertCircle size={22} color="var(--red)" />
        </div>
        <div className={s.confirmTitle}>{title}</div>
        <div className={s.confirmMessage}>{message}</div>
        <div className={s.confirmActions}>
          <button onClick={onCancel} className={s.btnConfirmCancel}>Cancel</button>
          <button onClick={onConfirm} className={s.btnConfirmAction}
            style={confirmColor ? { background: confirmColor } : { background: "var(--red)" }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page Header ──
export function PageHeader({ title, count, countLabel, action }) {
  return (
    <div className={s.pageHeader}>
      <div>
        <div className={s.pageTitle}>{title}</div>
        {count !== undefined && (
          <div className={s.pageCount}>{count} {countLabel || "total"}</div>
        )}
      </div>
      {action}
    </div>
  )
}

// ── Add Button ──
export function AddButton({ label, icon: Icon = null, onClick }) {
  return (
    <button onClick={onClick} className={s.addBtn}>
      {Icon && <Icon size={15} />}
      {label}
    </button>
  )
}

// ── Search Bar ──
export function SearchBar({ value, onChange, placeholder = "Search…" }) {
  return (
    <div className={s.searchBar}>
      <Search size={15} color="var(--t3)" />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={s.searchInput} />
    </div>
  )
}

// ── Dropdown Filter ──
export function DropdownFilter({ label, options, value, onChange, onCreateNew }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const filtered = options.filter(o =>
    (o.label || o.name || "").toLowerCase().includes(search.toLowerCase())
  )

  const activeLabel = value
    ? (options.find(o => (o.value ?? o.id) === value)?.label || options.find(o => (o.value ?? o.id) === value)?.name || label)
    : label

  return (
    <div ref={ref} className={s.dropdownWrap}>
      <button onClick={() => setOpen(!open)}
        className={`${s.dropdownTrigger} ${value ? s.dropdownTriggerActive : s.dropdownTriggerEmpty}`}>
        {activeLabel}
        <ChevronDown size={14} color="var(--t3)" />
      </button>

      {open && (
        <div className={s.dropdownMenu}>
          <div className={s.dropdownSearch}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filter…" autoFocus className={s.dropdownSearchInput} />
          </div>

          <div className={s.dropdownOptions}>
            <button onClick={() => { onChange(""); setOpen(false); setSearch("") }}
              className={`${s.dropdownOption} ${!value ? s.dropdownOptionActive : ""}`}>
              All
            </button>

            {filtered.map(o => {
              const oValue = o.value ?? o.id
              const oLabel = o.label ?? o.name
              const isActive = oValue === value
              return (
                <button key={oValue} onClick={() => { onChange(oValue); setOpen(false); setSearch("") }}
                  className={`${s.dropdownOption} ${isActive ? s.dropdownOptionActive : ""}`}>
                  {o.color && <div className={s.dropdownColorDot} style={{ background: o.color }} />}
                  {oLabel}
                </button>
              )
            })}
          </div>

          {onCreateNew && (
            <div className={s.dropdownFooter}>
              <button onClick={() => { onCreateNew(); setOpen(false); setSearch("") }}
                className={s.dropdownCreate}>
                + Create New
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Card wrapper with hover + keyboard ──
export function ClickableCard({ children, onClick, style = {}, className = "" }) {
  return (
    <div
      tabIndex={0}
      role="button"
      onClick={onClick}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onClick())}
      className={`${s.card} ${className}`}
      style={style}
    >
      {children}
    </div>
  )
}

// ── Icon Button ──
export function IconButton({ icon: Icon, color = "var(--t2)", onClick, title }) {
  return (
    <button onClick={e => { e.stopPropagation(); onClick() }} title={title} className={s.iconBtn}>
      <Icon size={14} color={color} />
    </button>
  )
}

// ── Loading / Empty ──
export function LoadingSpinner() {
  return (
    <div className={s.loading}>
      <Loader2 size={22} className={s.spinner} />
    </div>
  )
}

export function EmptyMessage({ text, ctaLabel, ctaIcon: CtaIcon, onCta }) {
  return (
    <div className={s.empty}>
      {text}
      {onCta && (
        <div>
          <button onClick={onCta} className={s.emptyCta}>
            {CtaIcon && <CtaIcon size={15} />}
            {ctaLabel}
          </button>
        </div>
      )}
    </div>
  )
}

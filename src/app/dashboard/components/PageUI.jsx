// ═══════════════════════════════════════════
// Shared Dashboard Components
//
// Extracted from individual pages so all CRUD
// pages share the same Modal, FormField,
// ConfirmModal, and utility components.
//
// import { Modal, FormField, ConfirmModal, ... } from '@/app/dashboard/components/PageUI.jsx'
// ═══════════════════════════════════════════

import { useState, useRef, useEffect } from "react"
import { X, AlertCircle, Loader2, ChevronDown, Search } from "lucide-react"
import s from "./PageUI.module.css"

// ── Exported CSS Module classes for pages not yet migrated ──
export const styles = s

// ── Form Field ──
export function FormField({ label, value, onChange, type = "text", placeholder, maxLength, autoFocus, children }) {
  if (children) {
    return (
      <div className={s.fieldGroup}>
        <label className={s.label}>{label}</label>
        {children}
      </div>
    )
  }
  return (
    <div className={s.fieldGroup}>
      <label className={s.label}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength} autoFocus={autoFocus} className={s.input} />
    </div>
  )
}

// ── Textarea Field ──
export function TextareaField({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div className={s.fieldGroup}>
      <label className={s.label}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
        placeholder={placeholder} className={s.textarea} />
    </div>
  )
}

// ── Select Field ──
export function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div className={s.fieldGroup}>
      <label className={s.label}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className={s.select}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
    </div>
  )
}

// ── Modal ──
export function Modal({ title, onClose, children, size = "md" }) {
  const sizeClass = size === "sm" ? s.modalPanelSm : size === "lg" ? s.modalPanelLg : s.modalPanelMd
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} className={s.modalOverlay}>
      <div className={`${s.modalPanel} ${sizeClass}`}>
        <div className={s.modalHeader}>
          <div className={s.modalTitle}>{title}</div>
          <button onClick={onClose} className={s.modalClose} aria-label="Close">
            <X size={20} />
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
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  )
}

// ── Confirm Modal ──
export function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = "Remove", confirmColor }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onCancel()} className={s.confirmOverlay}>
      <div className={s.confirmPanel}>
        <div className={s.confirmIcon}>
          <AlertCircle size={24} color="var(--color-red)" />
        </div>
        <div className={s.confirmTitle}>{title}</div>
        <div className={s.confirmMessage}>{message}</div>
        <div className={s.confirmActions}>
          <button onClick={onCancel} className={s.btnConfirmCancel}>Cancel</button>
          <button onClick={onConfirm} className={s.btnConfirmAction}
            style={confirmColor ? { background: confirmColor } : { background: 'var(--color-red)' }}>
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
      {Icon && <Icon size={16} />}
      {label}
    </button>
  )
}

// ── Search Bar ──
export function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className={s.searchBar}>
      <Search size={16} color="var(--color-text-light)" />
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
        <ChevronDown size={14} color="var(--color-text-light)" />
      </button>

      {open && (
        <div className={s.dropdownMenu}>
          <div className={s.dropdownSearch}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filter..." autoFocus className={s.dropdownSearchInput} />
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
                + Create Group
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
export function IconButton({ icon: Icon, color = "var(--color-text-med)", onClick, title }) {
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
      <Loader2 size={24} className={s.spinner} />
    </div>
  )
}

export function EmptyMessage({ text }) {
  return <div className={s.empty}>{text}</div>
}

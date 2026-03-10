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
import { X, AlertCircle, Loader2, ChevronDown } from "lucide-react"
import { T } from "@/app/tokens.js"

// ── Styles ──
export const labelStyle = {
  display: "block", fontSize: 12, fontWeight: 700, color: T.textLight,
  textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6,
}
export const inputStyle = {
  width: "100%", padding: "12px 14px", borderRadius: 10, background: T.bg,
  border: `1.5px solid ${T.border}`, color: T.text, fontSize: 14,
  fontFamily: T.font, outline: "none", boxSizing: "border-box",
}
export const selectStyle = { ...inputStyle, appearance: "auto" }

// ── Form Field ──
export function FormField({ label, value, onChange, type = "text", placeholder, maxLength, autoFocus, children }) {
  if (children) {
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>{label}</label>
        {children}
      </div>
    )
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} maxLength={maxLength} autoFocus={autoFocus} style={inputStyle} />
    </div>
  )
}

// ── Textarea Field ──
export function TextareaField({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows}
        placeholder={placeholder} style={{ ...inputStyle, resize: "vertical", minHeight: 60 }} />
    </div>
  )
}

// ── Select Field ──
export function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={selectStyle}>
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
  const maxW = size === "sm" ? 400 : size === "lg" ? 560 : 480
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: T.card, borderRadius: 16, width: "100%", maxWidth: maxW,
        maxHeight: "90vh", overflowY: "auto", boxShadow: T.shadowLg,
        animation: "modalIn 0.2s ease",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 0" }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{title}</div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
            <X size={20} color={T.textMed} />
          </button>
        </div>
        <div style={{ padding: "20px 24px" }}>{children}</div>
      </div>
      <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.97) } to { opacity:1; transform:scale(1) } }`}</style>
    </div>
  )
}

// ── Modal Footer (Save / Cancel / optional Delete) ──
export function ModalFooter({ onClose, onSave, onDelete, saving, disabled, deleteLabel = "Delete" }) {
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "space-between", paddingTop: 12, borderTop: `1px solid ${T.border}`, marginTop: 8 }}>
      <div>
        {onDelete && (
          <button onClick={onDelete} style={{
            padding: "10px 18px", borderRadius: 10, cursor: "pointer",
            background: T.redLight, border: `1.5px solid ${T.red}20`,
            color: T.red, fontSize: 13, fontWeight: 600, fontFamily: T.font,
          }}>{deleteLabel}</button>
        )}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onClose} style={{
          padding: "10px 20px", borderRadius: 10, cursor: "pointer", background: "transparent",
          border: `1.5px solid ${T.border}`, color: T.textMed, fontSize: 14, fontWeight: 600, fontFamily: T.font,
        }}>Cancel</button>
        <button onClick={onSave} disabled={saving || disabled} style={{
          padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer",
          background: T.accent, color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: T.font,
          opacity: (saving || disabled) ? 0.5 : 1,
        }}>{saving ? "Saving..." : "Save"}</button>
      </div>
    </div>
  )
}

// ── Confirm Modal ──
export function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = "Remove", confirmColor = T.red }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onCancel()} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 110,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: T.card, borderRadius: 16, width: "100%", maxWidth: 380,
        padding: 28, textAlign: "center", boxShadow: T.shadowLg,
        animation: "modalIn 0.15s ease",
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14, background: T.redLight,
          margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <AlertCircle size={24} color={T.red} />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 14, color: T.textMed, marginBottom: 24, lineHeight: 1.5 }}>{message}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: "12px", borderRadius: 10, cursor: "pointer", background: "transparent",
            border: `1.5px solid ${T.border}`, color: T.textMed, fontSize: 14, fontWeight: 600, fontFamily: T.font,
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: "12px", borderRadius: 10, border: "none", cursor: "pointer",
            background: confirmColor, color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: T.font,
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

// ── Page Header ──
export function PageHeader({ title, count, countLabel, action }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      marginBottom: 16, flexWrap: "wrap", gap: 12,
    }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{title}</div>
        {count !== undefined && (
          <div style={{ fontSize: 13, color: T.textLight }}>{count} {countLabel || "total"}</div>
        )}
      </div>
      {action}
    </div>
  )
}

// ── Add Button ──
export function AddButton({ label, icon: Icon = null, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
      borderRadius: 10, border: "none", cursor: "pointer",
      background: T.accent, color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: T.font,
    }}>
      {Icon && <Icon size={16} />}
      {label}
    </button>
  )
}

// ── Search Bar ──
export function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, background: T.card,
      borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.border}`, marginBottom: 16,
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.textLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
      </svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ flex: 1, border: "none", outline: "none", fontSize: 14, fontFamily: T.font, background: "transparent", color: T.text }} />
    </div>
  )
}

// ── Dropdown Filter ──
export function DropdownFilter({ label, options, value, onChange, onCreateNew }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef(null)

  // Close on click outside
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
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
        borderRadius: 10, border: `1px solid ${T.border}`, background: T.card,
        cursor: "pointer", fontFamily: T.font, fontSize: 13, fontWeight: 600,
        color: value ? T.text : T.textLight, whiteSpace: "nowrap",
      }}>
        {activeLabel}
        <ChevronDown size={14} color={T.textLight} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 60,
          background: T.card, borderRadius: 12, border: `1px solid ${T.border}`,
          boxShadow: T.shadowMd, width: 220, maxHeight: 300, display: "flex", flexDirection: "column",
          animation: "modalIn 0.15s ease",
        }}>
          {/* Search */}
          <div style={{ padding: "10px 12px 6px" }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Filter..." autoFocus
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`,
                fontSize: 13, fontFamily: T.font, outline: "none", background: T.bg, boxSizing: "border-box" }} />
          </div>

          {/* Options */}
          <div style={{ overflowY: "auto", maxHeight: 200, padding: "4px 6px" }}>
            {/* "All" option */}
            <button onClick={() => { onChange(""); setOpen(false); setSearch("") }} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px",
              borderRadius: 8, border: "none", cursor: "pointer", fontFamily: T.font,
              background: !value ? T.accentLight : "transparent",
              color: !value ? T.accent : T.text, fontSize: 13, fontWeight: !value ? 700 : 500,
              textAlign: "left",
            }}>All</button>

            {filtered.map(o => {
              const oValue = o.value ?? o.id
              const oLabel = o.label ?? o.name
              const isActive = oValue === value
              return (
                <button key={oValue} onClick={() => { onChange(oValue); setOpen(false); setSearch("") }} style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px",
                  borderRadius: 8, border: "none", cursor: "pointer", fontFamily: T.font,
                  background: isActive ? T.accentLight : "transparent",
                  color: isActive ? T.accent : T.text, fontSize: 13, fontWeight: isActive ? 700 : 500,
                  textAlign: "left",
                }}>
                  {o.color && <div style={{ width: 10, height: 10, borderRadius: 3, background: o.color, flexShrink: 0 }} />}
                  {oLabel}
                </button>
              )
            })}
          </div>

          {/* Create new */}
          {onCreateNew && (
            <div style={{ padding: "6px 6px 8px", borderTop: `1px solid ${T.border}` }}>
              <button onClick={() => { onCreateNew(); setOpen(false); setSearch("") }} style={{
                display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "8px 10px",
                borderRadius: 8, border: "none", cursor: "pointer", fontFamily: T.font,
                background: "transparent", color: T.accent, fontSize: 13, fontWeight: 600, textAlign: "left",
              }}>
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
export function ClickableCard({ children, onClick, style = {} }) {
  return (
    <div
      tabIndex={0}
      role="button"
      onClick={onClick}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onClick())}
      style={{
        background: T.card, borderRadius: 12, border: `1px solid ${T.border}`,
        boxShadow: T.shadow, cursor: "pointer", transition: "border-color 0.15s",
        ...style,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
      onFocus={e => e.currentTarget.style.borderColor = T.accent}
      onBlur={e => e.currentTarget.style.borderColor = T.border}
    >
      {children}
    </div>
  )
}

// ── Icon Buttons (Edit / Delete) ──
export function IconButton({ icon: Icon, color = T.textMed, onClick, title }) {
  return (
    <button onClick={e => { e.stopPropagation(); onClick() }} title={title} style={{
      width: 34, height: 34, borderRadius: 8, border: `1px solid ${T.border}`,
      background: T.card, cursor: "pointer", display: "flex", alignItems: "center",
      justifyContent: "center", flexShrink: 0, transition: "background 0.1s",
    }}>
      <Icon size={14} color={color} />
    </button>
  )
}

// ── Loading / Empty ──
export function LoadingSpinner() {
  return (
    <div style={{ textAlign: "center", padding: 40, color: T.textLight }}>
      <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export function EmptyMessage({ text }) {
  return <div style={{ textAlign: "center", padding: 40, color: T.textLight, fontSize: 14 }}>{text}</div>
}

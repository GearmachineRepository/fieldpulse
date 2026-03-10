// ═══════════════════════════════════════════
// BottomSheet — Slide-up filter panel for mobile
//
// Usage:
//   <BottomSheet open={open} onClose={() => setOpen(false)} title="Filter">
//     <BottomSheetOption label="All" active={!filter} onClick={() => { setFilter(null); setOpen(false) }} />
//     <BottomSheetOption label="SDS Sheets" count={5} color="#EF4444" active={filter === 1} onClick={...} />
//   </BottomSheet>
// ═══════════════════════════════════════════

import { useEffect, useRef } from "react"
import { X, Check } from "lucide-react"
import { T } from "@/app/tokens.js"

export function BottomSheet({ open, onClose, title, children }) {
  const sheetRef = useRef(null)

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
      return () => { document.body.style.overflow = "" }
    }
  }, [open])

  if (!open) return null

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)",
        animation: "fadeIn 0.2s ease",
      }} />

      {/* Sheet */}
      <div ref={sheetRef} style={{
        position: "relative", width: "100%", maxWidth: 430,
        background: T.card, borderRadius: "20px 20px 0 0",
        maxHeight: "75vh", display: "flex", flexDirection: "column",
        animation: "slideUp 0.25s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: "0 -10px 40px rgba(0,0,0,0.15)",
      }}>
        {/* Handle + header */}
        <div style={{ padding: "12px 20px 0", flexShrink: 0 }}>
          <div style={{
            width: 36, height: 4, borderRadius: 2, background: T.border,
            margin: "0 auto 14px",
          }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{title}</div>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 8, border: "none",
              background: T.bg, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <X size={18} color={T.textMed} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ overflowY: "auto", padding: "0 20px 28px" }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  )
}

export function BottomSheetOption({ label, count, color, icon: Icon, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 12, width: "100%",
      padding: "14px 16px", borderRadius: 12, border: "none", cursor: "pointer",
      background: active ? `${color || T.accent}08` : "transparent",
      fontFamily: T.font, textAlign: "left", marginBottom: 4,
      transition: "background 0.1s",
    }}>
      {/* Color dot or icon */}
      {color && !Icon && (
        <div style={{ width: 10, height: 10, borderRadius: 5, background: color, flexShrink: 0 }} />
      )}
      {Icon && <Icon size={18} color={color || T.textMed} style={{ flexShrink: 0 }} />}

      {/* Label */}
      <div style={{ flex: 1 }}>
        <span style={{
          fontSize: 15, fontWeight: active ? 700 : 500,
          color: active ? (color || T.accent) : T.text,
        }}>{label}</span>
      </div>

      {/* Count */}
      {count !== undefined && (
        <span style={{
          fontSize: 13, fontWeight: 600,
          color: active ? (color || T.accent) : T.textLight,
        }}>{count}</span>
      )}

      {/* Active check */}
      {active && (
        <Check size={18} color={color || T.accent} style={{ flexShrink: 0 }} />
      )}
    </button>
  )
}

// ═══════════════════════════════════════════
// FilterButton — Triggers the bottom sheet
// Shows active filter name or default label.
// ═══════════════════════════════════════════
export function FilterButton({ label, activeLabel, onClick }) {
  const hasFilter = !!activeLabel
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
      borderRadius: 10, border: `1.5px solid ${hasFilter ? T.accent : T.border}`,
      background: hasFilter ? T.accentLight : T.card, cursor: "pointer",
      fontFamily: T.font, fontSize: 13, fontWeight: 600,
      color: hasFilter ? T.accent : T.textMed, whiteSpace: "nowrap",
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
      {activeLabel || label}
    </button>
  )
}

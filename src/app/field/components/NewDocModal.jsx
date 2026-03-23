// ═══════════════════════════════════════════
// New Doc Modal — Type picker → opens form
// ═══════════════════════════════════════════

import { FileText, Camera, ClipboardList, X, Package } from "lucide-react"
import { T } from "@/app/tokens.js"
import { ENABLED_MODULES } from "@/app/modules.js"

const CORE_TYPES = [
  { key: "general-note", icon: FileText, label: "General Note", desc: "Notes & observations", color: T.blue },
  { key: "photo-doc", icon: Camera, label: "Photo Doc", desc: "Visual documentation", color: T.amber },
  { key: "inspection", icon: ClipboardList, label: "Inspection", desc: "Site inspection", color: T.accent },
]

export default function NewDocModal({ onClose, onSelectType }) {
  // Group enabled modules by category
  const categories = {}
  ENABLED_MODULES.forEach(mod => {
    if (!categories[mod.category]) categories[mod.category] = []
    categories[mod.category].push(mod)
  })

  const handleSelect = (key) => {
    onSelectType?.(key)
    // For types that don't have a form yet, just close
    if (!["spray-log"].includes(key)) {
      onClose()
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{
        width: "100%", maxWidth: 430, background: T.card, borderRadius: "4px 4px 0 0",
        maxHeight: "85vh", display: "flex", flexDirection: "column", fontFamily: T.font,
        animation: "slideUp 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 20px 0", flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: T.text }}>New Field Doc</div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer" }}>
            <X size={22} color={T.textMed} />
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "16px 20px 32px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Documents</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
            {CORE_TYPES.map((d) => (
              <button key={d.key} onClick={() => handleSelect(d.key)} style={{
                padding: 16, borderRadius: 3, border: `1.5px solid ${T.border}`,
                background: T.card, cursor: "pointer", textAlign: "left", fontFamily: T.font,
              }}>
                <d.icon size={22} color={d.color} style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{d.label}</div>
                <div style={{ fontSize: 12, color: T.textLight, marginTop: 2 }}>{d.desc}</div>
              </button>
            ))}
          </div>

          {Object.entries(categories).map(([category, mods]) => (
            <div key={category}>
              <div style={{
                fontSize: 12, fontWeight: 600, color: T.textLight, textTransform: "uppercase",
                letterSpacing: 0.5, marginBottom: 10, display: "flex", alignItems: "center", gap: 6,
              }}>
                <Package size={12} /> {category} Modules
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {mods.map((mod) => (
                  <button key={mod.key} onClick={() => handleSelect(mod.key === "spray" ? "spray-log" : mod.key)} style={{
                    padding: 16, borderRadius: 3, border: `1.5px solid ${T.border}`,
                    background: T.card, cursor: "pointer", textAlign: "left", fontFamily: T.font,
                    position: "relative",
                  }}>
                    <mod.icon size={22} color={mod.color} style={{ marginBottom: 8 }} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{mod.label}</div>
                    <div style={{ fontSize: 12, color: T.textLight, marginTop: 2 }}>{mod.desc}</div>
                    <div style={{
                      position: "absolute", top: 10, right: 10, fontSize: 8, fontWeight: 600,
                      background: `${mod.color}15`, color: mod.color, padding: "2px 6px", borderRadius: 4,
                    }}>MOD</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }`}</style>
    </div>
  )
}

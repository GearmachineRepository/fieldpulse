// ═══════════════════════════════════════════
// Module Page — Generic module sub-area
// ═══════════════════════════════════════════

import { useState } from "react"
import { Plus, FileText, CheckCircle2 } from "lucide-react"
import { T } from "@/app/tokens.js"
import { ENABLED_MODULES } from "@/app/modules.js"

export default function ModulePage({ moduleKey }) {
  const mod = ENABLED_MODULES.find(m => m.key === moduleKey)
  const [tab, setTab] = useState("logs")

  if (!mod) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, color: T.textLight }}>
        <div style={{ textAlign: "center" }}>
          <FileText size={48} strokeWidth={1} />
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text, marginTop: 16 }}>Module not found</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${mod.color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <mod.icon size={22} color={mod.color} />
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{mod.label}</div>
          <div style={{ fontSize: 13, color: T.textLight }}>Module · {mod.category}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 4, background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, padding: 4, marginBottom: 24, overflowX: "auto" }}>
        {["Logs", "Inventory", "Reports"].map(t => (
          <button key={t} onClick={() => setTab(t.toLowerCase())} style={{
            padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 600, fontFamily: T.font, whiteSpace: "nowrap",
            background: tab === t.toLowerCase() ? mod.color : "transparent",
            color: tab === t.toLowerCase() ? "#fff" : T.textMed,
          }}>{t}</button>
        ))}
      </div>

      {tab === "logs" && (
        <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Recent {mod.label} Logs</div>
            <button style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
              borderRadius: 8, border: "none", cursor: "pointer",
              background: mod.color, color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: T.font,
            }}>
              <Plus size={16} /> New Log
            </button>
          </div>

          {/* Sample data — replace with useData() hook later */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.bg }}>
                {["DATE", "PROPERTY", "CREW", "STATUS"].map(h => (
                  <th key={h} style={{ fontSize: 11, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "left", padding: "10px 16px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { date: "Mar 9", property: "Oak Ridge Estates", crew: "Crew Alpha", status: "Synced" },
                { date: "Mar 8", property: "Maple Drive HOA", crew: "Crew Beta", status: "Synced" },
                { date: "Mar 7", property: "Cedar Lane Park", crew: "Crew Alpha", status: "Synced" },
              ].map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, cursor: "pointer" }}>
                  <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600 }}>{r.date}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13 }}>{r.property}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: T.textMed }}>{r.crew}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: T.accent }}>
                      <CheckCircle2 size={14} /> {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab !== "logs" && (
        <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.border}`, boxShadow: T.shadow, padding: 40, textAlign: "center", color: T.textLight }}>
          <mod.icon size={40} strokeWidth={1} />
          <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginTop: 12 }}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>This section is coming soon</div>
        </div>
      )}
    </div>
  )
}

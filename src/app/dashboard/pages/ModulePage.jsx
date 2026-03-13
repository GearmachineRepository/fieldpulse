// ═══════════════════════════════════════════
// Module Page — Generic module sub-area
// ═══════════════════════════════════════════

import { useState } from "react"
import { Plus, FileText, CheckCircle2 } from "lucide-react"
import { ENABLED_MODULES } from "@/app/modules.js"
import s from "./ModulePage.module.css"

export default function ModulePage({ moduleKey }) {
  const mod = ENABLED_MODULES.find(m => m.key === moduleKey)
  const [tab, setTab] = useState("logs")

  if (!mod) {
    return (
      <div className={s.notFoundWrapper}>
        <div className={s.notFoundInner}>
          <FileText size={48} strokeWidth={1} />
          <div className={s.notFoundTitle}>Module not found</div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className={s.header}>
        <div className={s.iconBox} style={{ background: `${mod.color}12` }}>
          <mod.icon size={22} color={mod.color} />
        </div>
        <div>
          <div className={s.modLabel}>{mod.label}</div>
          <div className={s.modCategory}>Module · {mod.category}</div>
        </div>
      </div>

      <div className={s.tabBar}>
        {["Logs", "Inventory", "Reports"].map(t => (
          <button key={t} onClick={() => setTab(t.toLowerCase())} className={s.tabButton} style={{
            background: tab === t.toLowerCase() ? mod.color : "transparent",
            color: tab === t.toLowerCase() ? "#fff" : undefined,
          }}>{t}</button>
        ))}
      </div>

      {tab === "logs" && (
        <div className={s.card}>
          <div className={s.cardHeader}>
            <div className={s.cardTitle}>Recent {mod.label} Logs</div>
            <button className={s.newLogButton} style={{ background: mod.color }}>
              <Plus size={16} /> New Log
            </button>
          </div>

          {/* Sample data — replace with useData() hook later */}
          <table className={s.table}>
            <thead>
              <tr className={s.tableHeadRow}>
                {["DATE", "PROPERTY", "CREW", "STATUS"].map(h => (
                  <th key={h} className={s.tableHeadCell}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { date: "Mar 9", property: "Oak Ridge Estates", crew: "Crew Alpha", status: "Synced" },
                { date: "Mar 8", property: "Maple Drive HOA", crew: "Crew Beta", status: "Synced" },
                { date: "Mar 7", property: "Cedar Lane Park", crew: "Crew Alpha", status: "Synced" },
              ].map((r, i) => (
                <tr key={i} className={s.tableRow}>
                  <td className={s.tableCellDate}>{r.date}</td>
                  <td className={s.tableCell}>{r.property}</td>
                  <td className={s.tableCellCrew}>{r.crew}</td>
                  <td className={s.tableCell}>
                    <span className={s.statusBadge}>
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
        <div className={s.emptyCard}>
          <mod.icon size={40} strokeWidth={1} />
          <div className={s.emptyTitle}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</div>
          <div className={s.emptySubtitle}>This section is coming soon</div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Incidents Page — Accident & incident reports
// ═══════════════════════════════════════════

import { AlertTriangle } from "lucide-react"
import s from "./PlaceholderPage.module.css"

export default function IncidentsPage() {
  return (
    <div className={s.wrapper}>
      <div className={s.inner}>
        <AlertTriangle size={48} strokeWidth={1} />
        <div className={s.title}>Incidents</div>
        <div className={s.subtitle}>Accident reports, near-misses, and safety incident tracking</div>
      </div>
    </div>
  )
}

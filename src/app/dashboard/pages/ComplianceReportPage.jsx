// ═══════════════════════════════════════════
// Compliance Report Page — Compliance reporting
// ═══════════════════════════════════════════

import { ClipboardCheck } from "lucide-react"
import s from "./PlaceholderPage.module.css"

export default function ComplianceReportPage() {
  return (
    <div className={s.wrapper}>
      <div className={s.inner}>
        <ClipboardCheck size={48} strokeWidth={1} />
        <div className={s.title}>Compliance Reports</div>
        <div className={s.subtitle}>Certification status, training gaps, and audit readiness</div>
      </div>
    </div>
  )
}

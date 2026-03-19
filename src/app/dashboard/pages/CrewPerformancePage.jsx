// ═══════════════════════════════════════════
// Crew Performance Page — Performance reports
// ═══════════════════════════════════════════

import { TrendingUp } from "lucide-react"
import s from "./PlaceholderPage.module.css"

export default function CrewPerformancePage() {
  return (
    <div className={s.wrapper}>
      <div className={s.inner}>
        <TrendingUp size={48} strokeWidth={1} />
        <div className={s.title}>Crew Performance</div>
        <div className={s.subtitle}>Productivity metrics, completion rates, and crew comparisons</div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Training Page — Training records & tailgate meetings
// ═══════════════════════════════════════════

import { GraduationCap } from "lucide-react"
import s from "./PlaceholderPage.module.css"

export default function TrainingPage() {
  return (
    <div className={s.wrapper}>
      <div className={s.inner}>
        <GraduationCap size={48} strokeWidth={1} />
        <div className={s.title}>Training</div>
        <div className={s.subtitle}>Training sessions, tailgate meetings, and video completions</div>
      </div>
    </div>
  )
}

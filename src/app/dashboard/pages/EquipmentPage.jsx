// ═══════════════════════════════════════════
// Equipment Page — Equipment & maintenance logs
// ═══════════════════════════════════════════

import { Wrench } from "lucide-react"
import s from "./PlaceholderPage.module.css"

export default function EquipmentPage() {
  return (
    <div className={s.wrapper}>
      <div className={s.inner}>
        <Wrench size={48} strokeWidth={1} />
        <div className={s.title}>Equipment</div>
        <div className={s.subtitle}>Equipment inventory, maintenance logs, and service history</div>
      </div>
    </div>
  )
}

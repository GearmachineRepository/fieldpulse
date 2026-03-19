// ═══════════════════════════════════════════
// SDS Page — Safety Data Sheet library
// ═══════════════════════════════════════════

import { FlaskConical } from "lucide-react"
import s from "./PlaceholderPage.module.css"

export default function SDSPage() {
  return (
    <div className={s.wrapper}>
      <div className={s.inner}>
        <FlaskConical size={48} strokeWidth={1} />
        <div className={s.title}>SDS Library</div>
        <div className={s.subtitle}>Searchable Safety Data Sheets with QR code access</div>
      </div>
    </div>
  )
}

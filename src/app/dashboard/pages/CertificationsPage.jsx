// ═══════════════════════════════════════════
// Certifications Page — Credential tracking & expiry
// ═══════════════════════════════════════════

import { Award } from "lucide-react"
import s from "./PlaceholderPage.module.css"

export default function CertificationsPage() {
  return (
    <div className={s.wrapper}>
      <div className={s.inner}>
        <Award size={48} strokeWidth={1} />
        <div className={s.title}>Certifications</div>
        <div className={s.subtitle}>Credential tracking, expiry alerts, and renewal management</div>
      </div>
    </div>
  )
}

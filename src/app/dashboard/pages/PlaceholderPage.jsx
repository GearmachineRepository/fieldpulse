// ═══════════════════════════════════════════
// Placeholder Page — "Coming soon" for unbuilt pages
// ═══════════════════════════════════════════

import { FileText } from 'lucide-react'
import s from './PlaceholderPage.module.css'

export default function PlaceholderPage({ title }) {
  return (
    <div className={s.wrapper}>
      <div className={s.inner}>
        <FileText size={48} strokeWidth={1} />
        <div className={s.title}>{title}</div>
        <div className={s.subtitle}>Full page coming soon</div>
      </div>
    </div>
  )
}

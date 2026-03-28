// ═══════════════════════════════════════════
// SkeletonCard — Card grid skeleton loading
// ═══════════════════════════════════════════

import s from './SkeletonCard.module.css'

export default function SkeletonCard({ count = 6 }) {
  return (
    <div className={s.grid}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={s.card}>
          <div className={s.titleBar} />
          <div className={s.line} style={{ width: '70%' }} />
          <div className={s.line} style={{ width: '45%' }} />
          <div className={s.footer}>
            <div className={s.badge} />
            <div className={s.badge} style={{ width: 48 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

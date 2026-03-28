// ═══════════════════════════════════════════
// SkeletonRow — Table skeleton loading
// ═══════════════════════════════════════════

import s from "./SkeletonRow.module.css"

export default function SkeletonRow({ columns = 4, count = 5 }) {
  return (
    <div className={s.wrap}>
      {/* Header row */}
      <div className={s.headerRow}>
        {Array.from({ length: columns }, (_, i) => (
          <div key={i} className={s.headerCell}>
            <div className={s.bar} style={{ width: `${50 + ((i * 37) % 30)}%` }} />
          </div>
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: count }, (_, row) => (
        <div key={row} className={s.row}>
          {Array.from({ length: columns }, (_, col) => (
            <div key={col} className={s.cell}>
              <div
                className={s.bar}
                style={{ width: `${40 + ((row * 17 + col * 31) % 40)}%` }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

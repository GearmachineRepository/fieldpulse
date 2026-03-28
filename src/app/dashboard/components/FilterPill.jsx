import s from './FilterPill.module.css'

export default function FilterPill({ label, active, onClick, color, isAll, count }) {
  const cls = [s.pill]
  if (active) cls.push(s.active)
  if (isAll) cls.push(s.all)

  // When a custom color is provided and pill is active, override active styling
  const activeStyle =
    active && color ? { borderColor: color, background: `${color}10`, color } : undefined

  return (
    <button className={cls.join(' ')} onClick={onClick} type="button" style={activeStyle}>
      {color && !active && <span className={s.dot} style={{ background: color }} />}
      {label}
      {count !== undefined && <span className={s.count}>({count})</span>}
    </button>
  )
}

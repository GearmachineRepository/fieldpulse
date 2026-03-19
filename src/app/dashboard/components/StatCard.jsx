import s from "./StatCard.module.css"

export default function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className={s.card} style={{ "--accent-color": color }}>
      <div className={s.top}>
        <span className={s.label}>{label}</span>
        {Icon && <Icon size={18} className={s.icon} />}
      </div>
      <div className={s.value}>{value}</div>
      {sub && <div className={s.sub}>{sub}</div>}
    </div>
  )
}

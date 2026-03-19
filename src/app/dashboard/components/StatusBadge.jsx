import s from "./StatusBadge.module.css"

const VARIANTS = { green: s.green, amber: s.amber, red: s.red, blue: s.blue, gray: s.gray }

export default function StatusBadge({ variant = "gray", children }) {
  return (
    <span className={`${s.badge} ${VARIANTS[variant] || s.gray}`}>
      {children}
    </span>
  )
}

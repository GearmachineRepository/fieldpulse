import s from './TabBar.module.css'

export default function TabBar({ tabs, active, onChange }) {
  return (
    <div className={s.bar}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`${s.tab} ${active === tab.key ? s.active : ''}`}
          onClick={() => onChange(tab.key)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

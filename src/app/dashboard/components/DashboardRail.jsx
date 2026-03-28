// ═══════════════════════════════════════════
// Dashboard Rail — Expandable section navigation
//
// 48px collapsed, expands to ~160px on hover
// as an overlay (doesn't shift other elements).
// ═══════════════════════════════════════════

import { Fragment } from 'react'
import { SECTIONS } from '@/app/dashboard/nav-sections.js'
import useModules from '@/hooks/useModules.jsx'
import s from './DashboardRail.module.css'

export default function DashboardRail({ activeSection, onSelectSection }) {
  const { enabledModules } = useModules()
  const sections = SECTIONS.filter((sec) => !(sec.dynamic && enabledModules.length === 0))

  return (
    <div className={s.wrapper}>
      <nav className={s.rail} aria-label="Section navigation">
        {/* Logo mark */}
        <div className={s.logo}>
          <div className={s.logoMark}>
            <svg viewBox="0 0 14 14" fill="none" className={s.logoSvg}>
              <circle cx="7" cy="5" r="2.4" fill="#1A0D00" />
              <path d="M7 8.5C4.5 8.5 2.5 10 2.5 11h9C11.5 10 9.5 8.5 7 8.5z" fill="#1A0D00" />
              <circle cx="11.5" cy="11.5" r="1.2" fill="rgba(26,13,0,0.5)" />
              <circle cx="2.5" cy="11.5" r="1.2" fill="rgba(26,13,0,0.5)" />
            </svg>
          </div>
        </div>

        {/* Section icons + labels */}
        <div className={s.nav}>
          {sections.map((section) => {
            const active = activeSection === section.key
            const showSep = section.key === 'modules' || section.key === 'settings'

            return (
              <Fragment key={section.key}>
                {showSep && <div className={s.sep} />}
                <button
                  className={`${s.item} ${active ? s.active : ''}`}
                  onClick={() => onSelectSection(section.key)}
                  aria-current={active ? 'true' : undefined}
                >
                  <span className={s.itemIcon}>
                    <section.icon size={16} />
                  </span>
                  <span className={s.itemLabel}>{section.label}</span>
                </button>
              </Fragment>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

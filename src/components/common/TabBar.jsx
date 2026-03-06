// ═══════════════════════════════════════════
// TabBar — reusable horizontal tab selector
// Previously duplicated inline in SprayTracker,
// LoginScreen, SprayLogsSection, SubTabs, etc.
// ═══════════════════════════════════════════

import { C } from '../../config/colors.js'

/**
 * @param {{ tabs: {key:string, label:string, icon?:string}[], active: string, onChange: (key:string)=>void, activeColor?: string }} props
 */
export default function TabBar({ tabs, active, onChange, activeColor = C.accent }) {
  return (
    // overflow: hidden removed — it was clipping the :focus-visible ring.
    // border-radius is applied to first/last tab children instead.
    <div style={{
      display: 'flex',
      background: C.card,
      borderRadius: 14,
      border: `1.5px solid ${C.cardBorder}`,
      marginBottom: 14,
    }}>
      {tabs.map((t, i) => (
        <div
          key={t.key}
          tabIndex={0}
          role="button"
          onClick={() => onChange(t.key)}
          onKeyDown={e => e.key === 'Enter' && onChange(t.key)}
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '12px 0',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            // outline: 'none' removed — focus ring handled globally in global.css
            color: active === t.key ? '#fff' : C.textLight,
            background: active === t.key ? activeColor : 'transparent',
            transition: 'all 0.15s',
            // Round outer corners of first/last tab to match the container shape
            borderRadius: i === 0
              ? '14px 0 0 14px'
              : i === tabs.length - 1
                ? '0 14px 14px 0'
                : 0,
          }}
        >
          {t.icon && `${t.icon} `}{t.label}
        </div>
      ))}
    </div>
  )
}
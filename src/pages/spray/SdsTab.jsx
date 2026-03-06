// ═══════════════════════════════════════════
// SDS Library Tab — Browse chemical safety data
// ═══════════════════════════════════════════

import { useState } from 'react'
import { C, SIG_COLORS, cardStyle, labelStyle, inputStyle, btnStyle } from '../../config.js'

export default function SdsTab({ chemicals }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  const filtered = chemicals.filter(c =>
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.ai.toLowerCase().includes(q.toLowerCase()) ||
    c.type.toLowerCase().includes(q.toLowerCase())
  )

  if (sel) {
    const sig = SIG_COLORS[sel.signal] || SIG_COLORS.CAUTION
    const r = sel.wxRestrictions || {}
    const cats = [
      { key: 'temp',      icon: '🌡', label: 'Temperature',     rule: r.temp },
      { key: 'humidity',  icon: '💧', label: 'Humidity',         rule: r.humidity },
      { key: 'windSpeed', icon: '💨', label: 'Wind Speed',        rule: r.windSpeed },
      { key: 'conditions',icon: '☁️', label: 'Sky / Conditions', rule: r.conditions },
    ]
    return (
      <div>
        {/* Back card — outline: 'none' removed */}
        <div tabIndex={0} role="button"
          onClick={() => setSel(null)}
          onKeyDown={e => e.key === 'Enter' && setSel(null)}
          style={{ ...cardStyle({ cursor: 'pointer' }), background: sig.bg, borderColor: sig.border, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13, fontWeight: 700, color: C.accent }}>
            ← Back to SDS Library
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{sel.name}</div>
              <div style={{ fontSize: 14, color: C.textMed, marginTop: 2 }}>{sel.type}</div>
            </div>
            <span style={{ fontSize: 13, padding: '5px 14px', borderRadius: 8, background: `${sig.badge}20`, color: sig.badge, fontWeight: 900, textTransform: 'uppercase', border: `2px solid ${sig.badge}40` }}>
              {sel.signal}
            </span>
          </div>
          <div style={{ marginTop: 12, fontSize: 14 }}>
            <span style={{ color: C.textLight }}>EPA:</span> <strong>{sel.epa}</strong>
            {' · '}
            <span style={{ color: C.textLight }}>Active:</span> <strong>{sel.ai}</strong>
          </div>
          {sel.restricted && (
            <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: C.redLight, border: `2px solid ${C.red}`, fontSize: 14, color: C.red, fontWeight: 800 }}>
              ⚠ RESTRICTED USE PESTICIDE
            </div>
          )}
        </div>

        <div style={cardStyle()}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, letterSpacing: 0.5 }}>Weather Restrictions from Label</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {cats.map(c => (
              <div key={c.key} style={{ padding: '12px 14px', borderRadius: 12, background: c.rule ? C.amberLight : '#FAFAF7', border: `1.5px solid ${c.rule ? C.amberBorder : C.cardBorder}` }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{c.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{c.label}</div>
                {c.rule
                  ? <div style={{ fontSize: 13, fontWeight: 700, color: C.amber, lineHeight: 1.4 }}>{c.rule.warn}</div>
                  : <div style={{ fontSize: 13, fontWeight: 600, color: C.textLight, fontStyle: 'italic' }}>N/A — not specified</div>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {sel.labelUrl
            ? <a href={sel.labelUrl} target="_blank" rel="noopener noreferrer"
                style={{ ...btnStyle(C.accent, '#fff', { flex: 1, fontSize: 14, textDecoration: 'none', display: 'block', textAlign: 'center' }) }}>
                📋 View Label
              </a>
            : null}
          {sel.sdsUrl
            ? <a href={sel.sdsUrl} target="_blank" rel="noopener noreferrer"
                style={{ ...btnStyle(C.blue, '#fff', { flex: 1, fontSize: 14, textDecoration: 'none', display: 'block', textAlign: 'center' }) }}>
                ☣️ View SDS
              </a>
            : null}
        </div>
      </div>
    )
  }

  return (
    <div>
      <input value={q} onChange={e => setQ(e.target.value)}
        placeholder="Search by name, type, or active ingredient"
        style={inputStyle({ marginBottom: 14 })} />
      {filtered.map(c => {
        const sig = SIG_COLORS[c.signal] || SIG_COLORS.CAUTION
        const rCount = c.wxRestrictions ? Object.values(c.wxRestrictions).filter(Boolean).length : 0
        return (
          // Chemical card — outline: 'none' removed
          <div key={c.id} tabIndex={0} role="button"
            onClick={() => setSel(c)}
            onKeyDown={e => e.key === 'Enter' && setSel(c)}
            style={{ ...cardStyle({ cursor: 'pointer' }), background: sig.bg, borderColor: sig.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: C.textMed, marginTop: 2 }}>{c.type}</div>
                <div style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>EPA: {c.epa}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: `${sig.badge}15`, color: sig.badge, fontWeight: 800, textTransform: 'uppercase' }}>
                  {c.signal}
                </span>
                {c.restricted && <span style={{ fontSize: 12, color: C.red, fontWeight: 700 }}>RESTRICTED</span>}
                {rCount > 0 && <span style={{ fontSize: 11, color: C.amber, fontWeight: 600 }}>{rCount} restriction{rCount > 1 ? 's' : ''}</span>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
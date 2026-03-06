// ═══════════════════════════════════════════
// History Tab — Crew-side spray log history
// ═══════════════════════════════════════════

import { useState } from 'react'
import { C, MONO, cardStyle, labelStyle, btnStyle } from '../../config/index.js'
import EmptyState  from '../../components/common/EmptyState.jsx'
import WindCompass from '../../components/WindCompass.jsx'
import { openPdf } from '../../components/PdfExport.js'
import LocationLink from '../../components/LocationLink.jsx'

export default function HistoryTab({ logs }) {
  const [expanded, setExpanded] = useState(null)

  if (logs.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No Spray Logs Yet"
        subtitle="Submit your first log in the New Log tab."
      />
    )
  }

  return (
    <div>
      <div style={labelStyle}>{logs.length} Spray Records</div>
      {logs.map(log => (
        <div key={log.id} style={{ marginBottom: 12 }}>
          <div
            tabIndex={0} role="button"
            onClick={() => setExpanded(expanded === log.id ? null : log.id)}
            onKeyDown={e => e.key === 'Enter' && setExpanded(expanded === log.id ? null : log.id)}
            style={{ ...cardStyle({ marginBottom: 0, cursor: 'pointer' }), borderRadius: expanded === log.id ? '16px 16px 0 0' : 16, outline: 'none' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{log.property}</div>
                <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>
                  {log.crewName} · {log.products.length} product{log.products.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{log.date}</div>
                <div style={{ fontSize: 12, color: C.textLight }}>{log.time}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 13, color: C.textLight, fontWeight: 600, flexWrap: 'wrap' }}>
              <span>🌡 {log.weather.temp}°F</span>
              <span>💨 {log.weather.windSpeed} mph</span>
              <span>🔧 {log.equipment}</span>
              {log.photos?.length > 0 && <span>📷 {log.photos.length}</span>}
            </div>
          </div>

          {expanded === log.id && (
            <div style={{ background: '#FAFAF7', border: `1.5px solid ${C.cardBorder}`, borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '16px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                {[
                  { l: 'Crew Lead', v: log.crewLead },
                  { l: 'License',   v: log.license },
                  { l: 'Equipment', v: log.equipment },
                  { l: 'Mix Vol',   v: log.totalMixVol },
                  { l: 'Location',  v: log.location, isLocation: true },
                  { l: 'Target',    v: log.targetPest },
                ].filter(f => f.v).map(f => (
                  <div key={f.l}>
                    <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>{f.l}</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {f.isLocation ? <LocationLink location={f.v} compact /> : f.v}
                    </div>
                  </div>
                ))}
              </div>

              {/* Products */}
              {log.products.map((p, i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 10, background: C.card, border: `1px solid ${C.cardBorder}`, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: C.textLight }}>EPA: {p.epa}</div>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: C.accent, fontFamily: MONO }}>{p.ozConcentrate}</div>
                </div>
              ))}

              {/* Weather */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <WindCompass direction={log.weather.windDir} speed={log.weather.windSpeed} size={50} />
                <div style={{ fontSize: 13, color: C.textMed }}>
                  {log.weather.temp}°F · {log.weather.humidity}% humidity · {log.weather.windSpeed} mph {log.weather.windDir} · {log.weather.conditions}
                </div>
              </div>

              <button onClick={() => openPdf(log)} style={{ ...btnStyle(C.accentLight, C.accent, { marginTop: 14, fontSize: 14 }) }}>
                🖨 Print / Save PDF
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

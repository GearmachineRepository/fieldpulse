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
          {/* Expandable card — outline: 'none' removed */}
          <div
            tabIndex={0} role="button"
            onClick={() => setExpanded(expanded === log.id ? null : log.id)}
            onKeyDown={e => e.key === 'Enter' && setExpanded(expanded === log.id ? null : log.id)}
            style={{ ...cardStyle({ marginBottom: 0, cursor: 'pointer' }), borderRadius: expanded === log.id ? '16px 16px 0 0' : 16 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{log.property}</div>
                <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>
                  {log.crewName} · {log.products.length} product{log.products.length !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>{log.date} · {log.time}</div>
              </div>
              <div style={{ fontSize: 18, color: C.textLight }}>{expanded === log.id ? '▲' : '▼'}</div>
            </div>
          </div>

          {expanded === log.id && (
            <div style={{ background: '#FAFAF7', border: `1.5px solid ${C.cardBorder}`, borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '16px' }}>
              {/* Products */}
              {log.products?.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={labelStyle}>Products</div>
                  {log.products.map((p, i) => (
                    <div key={i} style={{ fontSize: 14, color: C.text, padding: '4px 0', fontWeight: 600 }}>
                      {p.name} — {p.ozConcentrate} {p.unit}
                    </div>
                  ))}
                </div>
              )}

              {/* Weather */}
              {log.weather && (
                <div style={{ marginBottom: 12 }}>
                  <div style={labelStyle}>Weather</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <WindCompass direction={log.weather.windDir} size={48} />
                    <div style={{ fontSize: 13, color: C.textMed, fontFamily: MONO }}>
                      {log.weather.temp}°F · {log.weather.humidity}% humidity<br />
                      Wind {log.weather.windSpeed} mph {log.weather.windDir} · {log.weather.conditions}
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              {log.location && (
                <div style={{ marginBottom: 12 }}>
                  <div style={labelStyle}>Location</div>
                  <LocationLink location={log.location} compact />
                </div>
              )}

              {/* Notes */}
              {log.notes && (
                <div style={{ marginBottom: 12 }}>
                  <div style={labelStyle}>Notes</div>
                  <div style={{ fontSize: 14, color: C.textMed }}>{log.notes}</div>
                </div>
              )}

              <button onClick={() => openPdf(log)}
                style={{ ...btnStyle(C.accent, '#fff', { fontSize: 14 }) }}>
                📄 Export PDF
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
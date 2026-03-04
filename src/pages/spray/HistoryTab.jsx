// ═══════════════════════════════════════════
// History Tab — Crew-side spray log history
// ═══════════════════════════════════════════

import { useState } from 'react'
import { C, MONO, cardStyle, labelStyle, btnStyle } from '../../config.js'
import WindCompass from '../../components/WindCompass.jsx'
import { openPdf } from '../../components/PdfExport.js'
import LocationLink from '../../components/LocationLink.jsx'

export default function HistoryTab({ logs }) {
  const [expanded, setExpanded] = useState(null)
  if (logs.length === 0) return <div style={{ textAlign: 'center', padding: 40 }}><div style={{ fontSize: 40, marginBottom: 12 }}>📋</div><div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>No Spray Logs Yet</div><div style={{ fontSize: 14, color: C.textLight }}>Submit your first log in the New Log tab.</div></div>

  return (
    <div>
      <div style={labelStyle}>{logs.length} Spray Records</div>
      {logs.map(log => (
        <div key={log.id} style={{ marginBottom: 12 }}>
          <div tabIndex={0} role="button" onClick={() => setExpanded(expanded === log.id ? null : log.id)} onKeyDown={e => e.key === 'Enter' && setExpanded(expanded === log.id ? null : log.id)}
            style={{ ...cardStyle({ marginBottom: 0, cursor: 'pointer' }), borderRadius: expanded === log.id ? '16px 16px 0 0' : 16, outline: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div><div style={{ fontSize: 17, fontWeight: 800 }}>{log.property}</div>
                <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>{log.crewName} · {log.products.length} product{log.products.length !== 1 ? 's' : ''} · {log.totalMixVol}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{log.date}</div><div style={{ fontSize: 12, color: C.textLight }}>{log.time}</div></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 13, color: C.textLight, fontWeight: 600, flexWrap: 'wrap' }}>
              <span>🌡 {log.weather.temp}°F</span><span>💨 {log.weather.windSpeed} mph</span><span>🔧 {log.equipment}</span>
              {log.photos && log.photos.length > 0 && <span>📷 {log.photos.length}</span>}
              {log.members && log.members.length > 0 && <span>👷 {log.members.length}</span>}
              <span style={{ marginLeft: 'auto', color: C.accent }}>✓ {log.status}</span>
            </div>
          </div>
          {expanded === log.id && (
            <div style={{ background: '#FAFAF7', border: `1.5px solid ${C.cardBorder}`, borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '16px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                {[{ l: 'Crew', v: log.crewName }, { l: 'Crew Lead', v: log.crewLead }, { l: 'Cert #', v: log.license }, { l: 'Equipment', v: log.equipment },
                  { l: 'Mix Volume', v: log.totalMixVol }, { l: 'Location', v: log.location }, { l: 'Target Pest', v: log.targetPest }].map(f => (
                  <div key={f.l}><div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>{f.l}</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}><div style={{ fontSize: 14, fontWeight: 600 }}>
                    {f.l === 'Location' ? <LocationLink location={f.v} compact /> : (f.v || '—')}</div></div>
                    </div>
                ))}
              </div>

              {log.members && log.members.length > 0 && (
                <><div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Crew Members ({log.members.length})</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {log.members.map(m => <span key={m.id} style={{ padding: '6px 12px', borderRadius: 8, background: C.blueLight, border: `1px solid ${C.blueBorder}`, fontSize: 13, fontWeight: 600, color: C.blue }}>{m.name}</span>)}
                </div></>
              )}

              <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Mix Sheet</div>
              {log.products.map((p, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: C.card, border: `1px solid ${C.cardBorder}`, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><div style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: 12, color: C.textLight }}>EPA: {p.epa}</div></div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.accent, fontFamily: MONO }}>{p.ozConcentrate}</div>
                </div>
              ))}

              <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 14, marginBottom: 6 }}>Weather</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <WindCompass direction={log.weather.windDir} speed={log.weather.windSpeed} size={66} />
                <div style={{ fontSize: 14, color: C.textMed, lineHeight: 1.8 }}>{log.weather.temp}°F · {log.weather.humidity}%<br />{log.weather.windSpeed} mph {log.weather.windDir} · {log.weather.conditions}</div>
              </div>

              {log.photos && log.photos.length > 0 && (
                <><div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Photos ({log.photos.length})</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {log.photos.map(ph => (
                    <a key={ph.id} href={`/uploads/${ph.filename}`} target="_blank" rel="noopener noreferrer"
                      style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', border: `1.5px solid ${C.cardBorder}`, display: 'block' }}>
                      <img src={`/uploads/${ph.filename}`} alt={ph.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </a>
                  ))}
                </div></>
              )}

              {log.notes && <><div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Notes</div>
                <div style={{ fontSize: 14, color: C.textMed, lineHeight: 1.6, marginBottom: 14 }}>{log.notes}</div></>}
              <button tabIndex={0} onClick={() => openPdf(log)} style={btnStyle(C.blue, '#fff', { fontSize: 15 })}>📄 Export / Print as PDF</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
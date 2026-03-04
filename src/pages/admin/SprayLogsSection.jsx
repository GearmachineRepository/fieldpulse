// ═══════════════════════════════════════════
// Spray Logs Section — All Logs + Reports
// ═══════════════════════════════════════════

import { useState } from 'react'
import { APP, C, MONO, cardStyle, btnStyle, inputStyle } from '../../config.js'
import { deleteSprayLog, getPurReport } from '../../lib/api.js'
import { openPdf } from '../../components/PdfExport.js'
import WindCompass from '../../components/WindCompass.jsx'
import { SectionHeader, SubTabs, ConfirmDelete, FilterPills, DateRangePicker, getDateRange } from '../../components/admin/SharedAdmin.jsx'
import LocationLink from '../../components/LocationLink.jsx'

export default function SprayLogsSection({ logs, showToast, onRefresh }) {
  const [subTab, setSubTab] = useState('logs')
  return (
    <div>
      <SubTabs tabs={[{ key: 'logs', label: '📋 All Logs' }, { key: 'reports', label: '📊 Reports' }]} active={subTab} onChange={setSubTab} />
      {subTab === 'logs' && <AllLogsView logs={logs} showToast={showToast} onRefresh={onRefresh} />}
      {subTab === 'reports' && <ReportsView />}
    </div>
  )
}

// ── All Logs View ──
function AllLogsView({ logs, showToast, onRefresh }) {
  const [expanded, setExpanded] = useState(null)
  const [filterCrew, setFilterCrew] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const filtered = filterCrew ? logs.filter(l => l.crewName === filterCrew) : logs
  const crewNames = [...new Set(logs.map(l => l.crewName).filter(Boolean))]

  const handleDelete = async () => {
    try {
      await deleteSprayLog(deleteId)
      showToast('Spray log deleted ✓')
      setDeleteId(null); setExpanded(null)
      if (onRefresh) await onRefresh()
    } catch { showToast('Failed to delete') }
  }

  return (
    <div>
      <SectionHeader title="All Spray Logs" count={filtered.length} />
      <FilterPills crewNames={crewNames} active={filterCrew} onChange={setFilterCrew} />

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>No logs found</div>
        </div>
      ) : filtered.map(log => (
        <div key={log.id} style={{ marginBottom: 10 }}>
          {/* ── Collapsed card ── */}
          <div tabIndex={0} role="button"
            onClick={() => setExpanded(expanded === log.id ? null : log.id)}
            onKeyDown={e => e.key === 'Enter' && setExpanded(expanded === log.id ? null : log.id)}
            style={{ ...cardStyle({ marginBottom: 0, cursor: 'pointer' }), borderRadius: expanded === log.id ? '16px 16px 0 0' : 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{log.property}</div>
                <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>
                  {log.crewName} · {log.crewLead} · {log.products.length} product{log.products.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{log.date}</div>
                <div style={{ fontSize: 12, color: C.textLight }}>{log.time}</div>
              </div>
            </div>
            {/* Quick-glance badges */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 13, color: C.textLight, fontWeight: 600, flexWrap: 'wrap' }}>
              <span>🌡 {log.weather.temp}°F</span>
              <span>💨 {log.weather.windSpeed} mph</span>
              <span>🔧 {log.equipment}</span>
              {log.photos && log.photos.length > 0 && <span>📷 {log.photos.length}</span>}
              {log.members && log.members.length > 0 && <span>👷 {log.members.length}</span>}
            </div>
          </div>

          {/* ── Expanded detail ── */}
          {expanded === log.id && (
            <div style={{ background: '#FAFAF7', border: `1.5px solid ${C.cardBorder}`, borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '16px 18px' }}>

              {/* Field grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                {[
                  { l: 'Crew', v: log.crewName },
                  { l: 'Crew Lead', v: log.crewLead },
                  { l: 'Cert #', v: log.license },
                  { l: 'Equipment', v: log.equipment },
                  { l: 'Mix Volume', v: log.totalMixVol },
                  { l: 'Location', v: log.location },
                  { l: 'Target Pest', v: log.targetPest },
                ].map(f => (
                  <div key={f.l}>
                    <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>{f.l}</div>
                   <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {f.l === 'Location' ? <LocationLink location={f.v} compact /> : (f.v || '—')}
                  </div>
                  </div>
                ))}
              </div>

              {/* Crew Members */}
              {log.members && log.members.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                    Crew Members ({log.members.length})
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                    {log.members.map(m => (
                      <span key={m.id} style={{ padding: '6px 12px', borderRadius: 8, background: C.blueLight, border: `1px solid ${C.blueBorder}`, fontSize: 13, fontWeight: 600, color: C.blue }}>
                        {m.name}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {/* Mix Sheet */}
              <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Mix Sheet</div>
              {log.products.map((p, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: C.card, border: `1px solid ${C.cardBorder}`, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: C.textLight }}>EPA: {p.epa}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.accent, fontFamily: MONO }}>{p.ozConcentrate || p.amount}</div>
                </div>
              ))}

              {/* Weather with WindCompass */}
              <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 14, marginBottom: 6 }}>Weather</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <WindCompass direction={log.weather.windDir} speed={log.weather.windSpeed} size={66} />
                <div style={{ fontSize: 14, color: C.textMed, lineHeight: 1.8 }}>
                  {log.weather.temp}°F · {log.weather.humidity}%<br />
                  {log.weather.windSpeed} mph {log.weather.windDir} · {log.weather.conditions}
                </div>
              </div>

              {/* Photos */}
              {log.photos && log.photos.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                    Photos ({log.photos.length})
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    {log.photos.map(ph => (
                      <a key={ph.id} href={`/uploads/${ph.filename}`} target="_blank" rel="noopener noreferrer"
                        style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', border: `1.5px solid ${C.cardBorder}`, display: 'block' }}>
                        <img src={`/uploads/${ph.filename}`} alt={ph.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </a>
                    ))}
                  </div>
                </>
              )}

              {/* Notes */}
              {log.notes && (
                <>
                  <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Notes</div>
                  <div style={{ fontSize: 14, color: C.textMed, lineHeight: 1.6, marginBottom: 14 }}>{log.notes}</div>
                </>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button tabIndex={0} onClick={() => openPdf(log)} style={{ ...btnStyle(C.blue, '#fff', { flex: 1, fontSize: 14 }) }}>📄 Export PDF</button>
                <button tabIndex={0} onClick={() => setDeleteId(log.id)} style={{ ...btnStyle('#fff', C.red, { width: 'auto', padding: '10px 16px', fontSize: 14, border: `2px solid ${C.red}`, boxShadow: 'none' }) }}>🗑️</button>
              </div>
            </div>
          )}
        </div>
      ))}
      {deleteId && <ConfirmDelete name="this spray log" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
    </div>
  )
}

// ── PUR / Chemical Reports ──
function ReportsView() {
  const now = new Date()
  const [rangeType, setRangeType] = useState('monthly')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const monthNames = ['','January','February','March','April','May','June','July','August','September','October','November','December']

  const generate = async () => {
    const range = getDateRange(rangeType, month, year, startDate, endDate)
    if (!range.start || !range.end) return
    setLoading(true)
    try { setReport(await getPurReport(month, year)) }
    catch { setReport(null) }
    setLoading(false)
  }

  const exportReport = () => {
    if (!report) return
    const range = getDateRange(rangeType, month, year, startDate, endDate)
    const prodRows = report.products.map(p => `<tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:600">${p.name}</td>
      <td style="padding:8px 12px;border:1px solid #ddd">${p.epa}</td>
      <td style="padding:8px 12px;border:1px solid #ddd;font-weight:700;color:#2D7A3A">${p.totalAmount.toFixed(2)} ${p.unit}</td>
      <td style="padding:8px 12px;border:1px solid #ddd;text-align:center">${p.appCount}</td></tr>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Report — ${range.label}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:32px;color:#1a1a18;font-size:13px}
.header{border-bottom:3px solid #2D7A3A;padding-bottom:12px;margin-bottom:20px}.brand{font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#2D7A3A;font-weight:800}
h1{font-size:22px;margin:4px 0}h2{font-size:12px;color:#666}table{width:100%;border-collapse:collapse;margin-top:12px}
th{background:#f4f4f0;padding:8px 12px;border:1px solid #ddd;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#666}
.note{background:#E8F5EA;border:1.5px solid #B8DEC0;border-radius:6px;padding:12px 16px;margin-top:20px;font-size:12px;color:#2D7A3A}
.footer{margin-top:24px;border-top:2px solid #eee;padding-top:12px;font-size:9px;color:#999}@media print{body{padding:16px}}</style></head><body>
<div class="header"><div class="brand">${APP.name} — Pesticide Use Report</div>
<h1>${range.label}</h1><h2>Use Code 30 — Landscape Maintenance · Form DPR-PML-060</h2></div>
<div style="margin-bottom:16px;font-size:14px"><strong>Total Applications:</strong> ${report.totalApplications} · <strong>Products Used:</strong> ${report.products.length}</div>
<table><thead><tr><th>Product</th><th>EPA Reg #</th><th>Total Concentrate</th><th># Applications</th></tr></thead><tbody>${prodRows}</tbody></table>
${rangeType === 'monthly' ? `<div class="note">Submit DPR-PML-060 to County Agricultural Commissioner by the 10th of ${monthNames[month % 12 + 1] || 'January'} ${month === 12 ? year + 1 : year}.</div>` : ''}
<div class="footer">Generated by ${APP.name} · ${new Date().toLocaleString()} · Retain 2 years per CA DPR.</div></body></html>`

    const w = window.open('', '_blank', 'width=800,height=900')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400) }
  }

  return (
    <div>
      <SectionHeader title="Reports" />
      <div style={{ ...cardStyle(), padding: 20 }}>
        <div style={{ fontSize: 14, color: C.textMed, marginBottom: 16, lineHeight: 1.6 }}>
          Generate pesticide use reports for compliance, record-keeping, or internal review.
        </div>
        <DateRangePicker rangeType={rangeType} setRangeType={setRangeType} month={month} setMonth={setMonth}
          year={year} setYear={setYear} startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} accentColor={C.accent} />
        <button tabIndex={0} onClick={generate} disabled={loading} style={btnStyle(C.accent, '#fff', { opacity: loading ? 0.6 : 1 })}>
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {report && (
        <div style={{ marginTop: 16 }}>
          <div style={cardStyle({ background: C.accentLight, borderColor: C.accentBorder })}>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.accent }}>{getDateRange(rangeType, month, year, startDate, endDate).label}</div>
            <div style={{ fontSize: 14, color: C.textMed, marginTop: 4 }}>{report.totalApplications} application{report.totalApplications !== 1 ? 's' : ''} · {report.products.length} product{report.products.length !== 1 ? 's' : ''}</div>
          </div>
          {report.products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: C.textLight }}>No applications in this period</div>
          ) : (
            <>
              {report.products.map((p, i) => (
                <div key={i} style={cardStyle({ marginTop: 8 })}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: C.textMed }}>EPA: {p.epa} · {p.appCount} application{p.appCount !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: C.accent, fontFamily: MONO }}>{p.totalAmount.toFixed(2)} {p.unit}</div>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    {p.applications.map((a, j) => (
                      <div key={j} style={{ fontSize: 13, color: C.textMed, padding: '3px 0', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{a.date} · {a.crew} · {a.property}</span>
                        <span style={{ fontWeight: 700, color: C.accent, fontFamily: MONO }}>{a.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button tabIndex={0} onClick={exportReport} style={btnStyle(C.blue, '#fff')}>📄 Export / Print Report</button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
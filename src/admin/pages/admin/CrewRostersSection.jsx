// ═══════════════════════════════════════════
// Daily Clock-In Section — All clock-ins + Reports
// (Previously "Crew Rosters" — renamed to clarify
//  this is where crews clock in for the day, not
//  where you create/manage crews)
// ═══════════════════════════════════════════

import { useState, useEffect } from 'react'
import { APP, C, cardStyle, btnStyle } from '@/config/index.js'
import { getRosters, deleteRoster, getRosterReport } from '@/lib/api/index.js'
import { SectionHeader, SubTabs, ConfirmDelete, FilterPills, DateRangePicker, getDateRange } from '@/admin/components/SharedAdmin.jsx'
import { formatDateShort } from '@/lib/dateUtils.js'

export default function CrewRostersSection({ crews, employees, showToast }) {
  const [subTab, setSubTab] = useState('rosters')
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey(k => k + 1)
  return (
    <div>
      <SubTabs
        tabs={[
          { key: 'rosters', label: '🕐 All Clock-Ins' },
          { key: 'reports', label: '📊 Reports' },
        ]}
        active={subTab}
        onChange={setSubTab}
      />
      {subTab === 'rosters' && <AllRostersView key={refreshKey} crews={crews} employees={employees} showToast={showToast} onRefresh={refresh} />}
      {subTab === 'reports' && <RosterReportsView />}
    </div>
  )
}

// ── All Clock-Ins View ──
function AllRostersView({ crews, employees, showToast, onRefresh }) {
  const [rosters, setRosters] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [filterCrew, setFilterCrew] = useState('')
  const [deleteId, setDeleteId] = useState(null)

  const load = async () => {
    try { setRosters(await getRosters({ limit: 100 })) } catch {}
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    try {
      await deleteRoster(deleteId)
      showToast('Clock-in deleted ✓')
      setDeleteId(null); setExpanded(null)
      await load()
    } catch { showToast('Failed to delete') }
  }

  const filtered = filterCrew ? rosters.filter(r => r.crewName === filterCrew) : rosters
  const crewNames = [...new Set(rosters.map(r => r.crewName).filter(Boolean))]

  return (
    <div>
      <SectionHeader title="Daily Clock-Ins" count={filtered.length} />
      <FilterPills crewNames={crewNames} active={filterCrew} onChange={setFilterCrew} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🕐</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>No clock-ins found</div>
          <div style={{ fontSize: 13, color: C.textLight, marginTop: 4 }}>
            Crew leaders clock in their crew each morning from the field app
          </div>
        </div>
      ) : filtered.map(roster => {
        const emp = employees.find(e => roster.members?.some(m => m.employeeId === e.id))
        return (
          <div key={roster.id} style={{ marginBottom: 10 }}>
            <div tabIndex={0} role="button"
              onClick={() => setExpanded(expanded === roster.id ? null : roster.id)}
              onKeyDown={e => e.key === 'Enter' && setExpanded(expanded === roster.id ? null : roster.id)}
              style={{ ...cardStyle({ marginBottom: 0, cursor: 'pointer' }), borderRadius: expanded === roster.id ? '12px 12px 0 0' : 12, transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.blue}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.cardBorder}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{roster.crewName}</div>
                  <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>
                    {formatDateShort(roster.workDate)} · {roster.members?.length || 0} clocked in · Lead: {roster.submittedBy}
                  </div>
                </div>
                <div style={{ fontSize: 18, color: C.textLight }}>{expanded === roster.id ? '▲' : '▼'}</div>
              </div>
            </div>

            {expanded === roster.id && (
              <div style={{ ...cardStyle({ marginBottom: 0 }), borderTop: 'none', borderRadius: '0 0 12px 12px', background: '#FAFAF8' }}>
                <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  Members Clocked In
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {roster.members?.map(m => {
                    const empRecord = employees.find(e => e.id === m.employeeId)
                    return (
                      <div key={m.id || m.employeeId} style={{ display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 10px', borderRadius: 8, background: '#fff', border: `1.5px solid ${C.cardBorder}` }}>
                        {empRecord?.photo_filename ? (
                          <img src={`/uploads/${empRecord.photo_filename}`} alt="" style={{ width: 28, height: 28, borderRadius: 14, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 28, height: 28, borderRadius: 14, background: C.blue,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 800 }}>
                            {m.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>{m.name}</span>
                      </div>
                    )
                  })}
                </div>
                {roster.notes && (
                  <div>
                    <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Notes</div>
                    <div style={{ fontSize: 14, color: C.textMed, marginBottom: 10 }}>{roster.notes}</div>
                  </div>
                )}
                <button tabIndex={0} onClick={() => setDeleteId(roster.id)}
                  style={{ ...btnStyle('#fff', C.red, { width: 'auto', padding: '8px 16px', fontSize: 13, border: `2px solid ${C.red}`, boxShadow: 'none' }) }}>
                  🗑️ Delete Entry
                </button>
              </div>
            )}
          </div>
        )
      })}
      {deleteId && <ConfirmDelete name="this clock-in entry" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
    </div>
  )
}

// ── Clock-In Reports ──
function RosterReportsView() {
  const now = new Date()
  const [rangeType, setRangeType] = useState('monthly')
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    const range = getDateRange(rangeType, month, year, startDate, endDate)
    if (!range.start || !range.end) return
    setLoading(true)
    try { setReport(await getRosterReport(range.start, range.end)) }
    catch { setReport(null) }
    setLoading(false)
  }

  const exportRosterReport = () => {
    if (!report) return
    const range = getDateRange(rangeType, month, year, startDate, endDate)
    const crewRows = report.crews.map(c => {
      const memberRows = c.rosters.map(r =>
        `<tr><td style="padding:6px 12px;border:1px solid #ddd">${r.date}</td>
          <td style="padding:6px 12px;border:1px solid #ddd">${r.lead}</td>
          <td style="padding:6px 12px;border:1px solid #ddd">${r.memberCount}</td>
          <td style="padding:6px 12px;border:1px solid #ddd">${r.members.join(', ')}</td></tr>`).join('')
      return `<div style="margin-bottom:24px"><h3 style="font-size:16px;margin:8px 0">${c.crewName} — ${c.daysWorked} day${c.daysWorked !== 1 ?
        's' : ''}, ${c.totalMembers} unique member${c.totalMembers !== 1 ? 's' : ''}</h3>
        <table><thead><tr><th>Date</th><th>Lead</th><th># Members</th><th>Members</th></tr></thead><tbody>${memberRows}</tbody></table></div>`
    }).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Daily Clock-In Report — ${range.label}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:32px;color:#1a1a18;font-size:13px}
.header{border-bottom:3px solid #2563EB;padding-bottom:12px;margin-bottom:20px}.brand{font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#2563EB;font-weight:800}
h1{font-size:22px;margin:4px 0}h3{color:#2563EB}table{width:100%;border-collapse:collapse;margin-top:8px}
th{background:#f4f4f0;padding:6px 12px;border:1px solid #ddd;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#666}
.footer{margin-top:24px;border-top:2px solid #eee;padding-top:12px;font-size:9px;color:#999}@media print{body{padding:16px}}</style></head><body>
<div class="header"><div class="brand">${APP.name} — Daily Clock-In Report</div>
<h1>${range.label}</h1></div>
<div style="margin-bottom:16px;font-size:14px"><strong>Total Clock-Ins:</strong> ${report.totalRosters} · <strong>Crews:</strong> ${report.crews.length}</div>
${crewRows}
<div class="footer">Generated by ${APP.name} · ${new Date().toLocaleString()}</div></body></html>`

    const w = window.open('', '_blank', 'width=800,height=900')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400) }
  }

  return (
    <div>
      <SectionHeader title="Clock-In Reports" />
      <div style={{ ...cardStyle(), padding: 20 }}>
        <div style={{ fontSize: 14, color: C.textMed, marginBottom: 16, lineHeight: 1.6 }}>
          Generate reports to see which crews clocked in on which days and who was present.
        </div>
        <DateRangePicker rangeType={rangeType} setRangeType={setRangeType} month={month} setMonth={setMonth}
          year={year} setYear={setYear} startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} accentColor={C.blue} />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button tabIndex={0} onClick={generate} disabled={loading} style={btnStyle(C.blue, '#fff', { flex: 1, opacity: loading ? 0.6 : 1 })}>
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          {report && (
            <button tabIndex={0} onClick={exportRosterReport}
              style={btnStyle('#fff', C.blue, { width: 'auto', padding: '12px 18px', border: `2px solid ${C.blue}`, boxShadow: 'none' })}>
              🖨️ Print / Export
            </button>
          )}
        </div>
      </div>

      {report && (
        <div style={{ marginTop: 16 }}>
          <div style={cardStyle({ background: C.blueLight, borderColor: C.blueBorder })}>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.blue }}>{getDateRange(rangeType, month, year, startDate, endDate).label}</div>
            <div style={{ fontSize: 14, color: C.textMed, marginTop: 4 }}>
              {report.totalRosters} clock-in{report.totalRosters !== 1 ? 's' : ''} · {report.crews.length} crew{report.crews.length !== 1 ? 's' : ''}
            </div>
          </div>
          {report.crews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: C.textLight }}>No clock-ins in this period</div>
          ) : report.crews.map(c => (
            <div key={c.crewName} style={{ ...cardStyle(), marginTop: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{c.crewName}</div>
              <div style={{ fontSize: 13, color: C.textMed, marginBottom: 10 }}>
                {c.daysWorked} day{c.daysWorked !== 1 ? 's' : ''} worked · {c.totalMembers} unique member{c.totalMembers !== 1 ? 's' : ''}
              </div>
              {c.rosters.map((r, i) => (
                <div key={i} style={{ padding: '8px 0', borderTop: `1px solid ${C.cardBorder}`, fontSize: 13, color: C.textMed }}>
                  <span style={{ fontWeight: 700, color: C.text }}>{r.date}</span>
                  {' · '}Lead: {r.lead}
                  {' · '}{r.memberCount} member{r.memberCount !== 1 ? 's' : ''}
                  {r.members?.length > 0 && <span style={{ color: C.textLight }}> — {r.members.join(', ')}</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
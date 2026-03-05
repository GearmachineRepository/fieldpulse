// ═══════════════════════════════════════════
// Routes Section — Route management + Schedule + Work Log
// Three tabs: Routes | Schedule | Work Log
// ═══════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react'
import { APP, C, MONO, cardStyle, labelStyle, inputStyle, btnStyle } from '../../config.js'
import { getRoutes, getRoute, createRoute, updateRoute, deleteRoute, getAccounts,
  addRouteStop, removeRouteStop, updateRouteStop, reorderRouteStops,
  getWeekSchedule, getCompletionLog } from '../../lib/api.js'
import { SectionHeader, SubTabs, FormModal, ConfirmDelete, Field } from '../../components/admin/SharedAdmin.jsx'
import AccountMap from '../../components/AccountMap.jsx'
import LocationLink from '../../components/LocationLink.jsx'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_OPTIONS = [
  { value: '', label: 'Unscheduled' },
  { value: '1', label: 'Monday' }, { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' }, { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' }, { value: '6', label: 'Saturday' },
  { value: '0', label: 'Sunday' },
]
const ROUTE_COLORS = ['#2D7A3A', '#2563EB', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#DB2777', '#65A30D']

const STATUS_LABELS = {
  complete: { label: '✅ Complete', color: C.accent },
  in_progress: { label: '🔄 In Progress', color: C.amber },
  issue: { label: '⚠️ Issue', color: C.red },
}

export default function RoutesSection({ crews, accounts, onRefresh, showToast }) {
  const [subTab, setSubTab] = useState('routes')
  return (
    <div>
      <SubTabs tabs={[
        { key: 'routes', label: '🗺️ Routes' },
        { key: 'schedule', label: '📅 Schedule' },
        { key: 'worklog', label: '📊 Work Log' },
      ]} active={subTab} onChange={setSubTab} />
      {subTab === 'routes' && <RoutesListView crews={crews} accounts={accounts} onRefresh={onRefresh} showToast={showToast} />}
      {subTab === 'schedule' && <ScheduleView crews={crews} showToast={showToast} />}
      {subTab === 'worklog' && <WorkLogView crews={crews} showToast={showToast} />}
    </div>
  )
}

// ═══════════════════════════════════════════
// WORK LOG VIEW
// ═══════════════════════════════════════════
function WorkLogView({ crews, showToast }) {
  const today = new Date().toLocaleDateString('en-CA')
  const weekAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toLocaleDateString('en-CA') })()

  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState(weekAgo)
  const [endDate, setEndDate] = useState(today)
  const [filterCrew, setFilterCrew] = useState('')
  const [expanded, setExpanded] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { start: startDate, end: endDate }
      if (filterCrew) params.crewId = filterCrew
      setEntries(await getCompletionLog(params))
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [startDate, endDate, filterCrew])

  useEffect(() => { load() }, [load])

  // Group by date for display
  const byDate = {}
  for (const entry of entries) {
    const d = new Date(entry.workDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    if (!byDate[d]) byDate[d] = { label: d, entries: [] }
    byDate[d].entries.push(entry)
  }
  const dateGroups = Object.values(byDate)

  // Stats
  const totalTime = entries.reduce((s, e) => s + (e.timeSpentMinutes || 0), 0)
  const totalPhotos = entries.reduce((s, e) => s + (e.fieldNotes?.length || 0), 0)
  const completedCount = entries.filter(e => e.status === 'complete').length
  const issueCount = entries.filter(e => e.status === 'issue').length

  const exportReport = () => {
    const rows = entries.map(e => {
      const st = STATUS_LABELS[e.status] || { label: e.status }
      const time = e.timeSpentMinutes ? formatTime(e.timeSpentMinutes) : '—'
      return `<tr>
        <td style="padding:6px 10px;border:1px solid #ddd">${new Date(e.workDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;font-weight:600">${e.accountName}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${e.accountAddress || ''}${e.accountCity ? ', ' + e.accountCity : ''}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${e.crewName || '—'}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${e.completedByName}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${st.label}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${time}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${e.notes || '—'}</td>
        <td style="padding:6px 10px;border:1px solid #ddd">${e.fieldNotes?.length || 0}</td>
      </tr>`
    }).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Work Log Report</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:32px;color:#1a1a18;font-size:12px}
.header{border-bottom:3px solid #2D7A3A;padding-bottom:12px;margin-bottom:20px}.brand{font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#2D7A3A;font-weight:800}
h1{font-size:22px;margin:4px 0}table{width:100%;border-collapse:collapse;margin-top:12px}
th{background:#f4f4f0;padding:6px 10px;border:1px solid #ddd;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#666}
.footer{margin-top:24px;border-top:2px solid #eee;padding-top:12px;font-size:9px;color:#999}@media print{body{padding:16px}}</style></head><body>
<div class="header"><div class="brand">${APP.name} — Work Log Report</div>
<h1>${startDate} to ${endDate}</h1></div>
<div style="margin-bottom:16px;font-size:13px"><strong>${entries.length}</strong> entries · <strong>${formatTime(totalTime)}</strong> total time · <strong>${totalPhotos}</strong> photos</div>
<table><thead><tr><th>Date</th><th>Account</th><th>Address</th><th>Crew</th><th>By</th><th>Status</th><th>Time</th><th>Notes</th><th>Photos</th></tr></thead><tbody>${rows}</tbody></table>
<div class="footer">Generated by ${APP.name} · ${new Date().toLocaleString()}</div></body></html>`

    const w = window.open('', '_blank', 'width=1000,height=900')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400) }
  }

  return (
    <div>
      <SectionHeader title="Work Log" count={entries.length} />

      {/* Filters */}
      <div style={cardStyle()}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <div style={labelStyle}>Start Date</div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle()} />
          </div>
          <div>
            <div style={labelStyle}>End Date</div>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle()} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <div tabIndex={0} role="button" onClick={() => setFilterCrew('')}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: !filterCrew ? C.accent : '#eee', color: !filterCrew ? '#fff' : C.textMed }}>All Crews</div>
          {crews.map(c => (
            <div key={c.id} tabIndex={0} role="button" onClick={() => setFilterCrew(filterCrew === String(c.id) ? '' : String(c.id))}
              style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: filterCrew === String(c.id) ? C.accent : '#eee',
                color: filterCrew === String(c.id) ? '#fff' : C.textMed }}>{c.name}</div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      {entries.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
          {[
            { label: 'Entries', value: entries.length, color: C.accent },
            { label: 'Total Time', value: formatTime(totalTime) || '0m', color: C.blue },
            { label: 'Photos', value: totalPhotos, color: C.amber },
            { label: 'Issues', value: issueCount, color: issueCount > 0 ? C.red : C.textLight },
          ].map(s => (
            <div key={s.label} style={{ ...cardStyle({ textAlign: 'center', padding: '12px 8px' }) }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Export button */}
      {entries.length > 0 && (
        <button tabIndex={0} onClick={exportReport} style={{ ...btnStyle(C.blue, '#fff', { marginTop: 12 }) }}>
          📄 Export / Print Report
        </button>
      )}

      {/* Entries by date */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>Loading...</div>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textLight, marginTop: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>No work logged in this period</div>
        </div>
      ) : dateGroups.map(group => (
        <div key={group.label} style={{ marginTop: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8, color: C.textMed }}>
            {group.label} — {group.entries.length} entr{group.entries.length !== 1 ? 'ies' : 'y'}
          </div>
          {group.entries.map(entry => {
            const st = STATUS_LABELS[entry.status] || { label: entry.status, color: C.textLight }
            const isExpanded = expanded === entry.id
            return (
              <div key={entry.id} style={{ marginBottom: 8 }}>
                <div tabIndex={0} role="button"
                  onClick={() => setExpanded(isExpanded ? null : entry.id)}
                  onKeyDown={e => e.key === 'Enter' && setExpanded(isExpanded ? null : entry.id)}
                  style={{ ...cardStyle({ marginBottom: 0, cursor: 'pointer' }),
                    borderRadius: isExpanded ? '16px 16px 0 0' : 16,
                    borderLeft: `4px solid ${entry.routeColor || C.accent}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800 }}>{entry.accountName}</div>
                      <div style={{ fontSize: 13, color: C.textMed, marginTop: 2 }}>
                        {entry.crewName || '—'} · {entry.completedByName}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 700,
                        background: `${st.color}15`, color: st.color }}>{st.label}</span>
                      {entry.timeSpentMinutes > 0 && (
                        <div style={{ fontSize: 12, color: C.textLight, marginTop: 4, fontWeight: 600 }}>
                          {formatTime(entry.timeSpentMinutes)}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Quick preview of notes */}
                  {entry.notes && !isExpanded && (
                    <div style={{ fontSize: 13, color: C.textLight, marginTop: 6, fontStyle: 'italic',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.notes}</div>
                  )}
                  <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 12, color: C.textLight, fontWeight: 600 }}>
                    <span>{new Date(entry.completedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                    {entry.fieldNotes?.length > 0 && <span>📷 {entry.fieldNotes.length}</span>}
                    {entry.latitude && <span>📍 GPS</span>}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div style={{ background: '#FAFAF7', border: `1.5px solid ${C.cardBorder}`, borderTop: 'none',
                    borderRadius: '0 0 16px 16px', padding: '14px 18px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                      {[
                        { l: 'Account', v: entry.accountName },
                        { l: 'Address', v: `${entry.accountAddress || ''}${entry.accountCity ? ', ' + entry.accountCity : ''}` },
                        { l: 'Route', v: entry.routeName },
                        { l: 'Crew', v: entry.crewName || '—' },
                        { l: 'Completed By', v: entry.completedByName },
                        { l: 'Time Spent', v: entry.timeSpentMinutes ? formatTime(entry.timeSpentMinutes) : '—' },
                        { l: 'Status', v: st.label },
                        { l: 'Date/Time', v: new Date(entry.completedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) },
                      ].map(f => (
                        <div key={f.l}>
                          <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>{f.l}</div>
                          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{f.v || '—'}</div>
                        </div>
                      ))}
                    </div>

                    {entry.notes && (
                      <>
                        <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Notes</div>
                        <div style={{ fontSize: 14, color: C.textMed, lineHeight: 1.6, marginBottom: 12 }}>{entry.notes}</div>
                      </>
                    )}

                    {entry.latitude && entry.longitude && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>GPS Location</div>
                        <LocationLink location={`${entry.latitude}, ${entry.longitude}`} compact />
                      </div>
                    )}

                    {entry.fieldNotes?.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                          Photos ({entry.fieldNotes.length})
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {entry.fieldNotes.map(fn => (
                            <a key={fn.id} href={`/uploads/${fn.filename}`} target="_blank" rel="noopener noreferrer">
                              <img src={`/uploads/${fn.filename}`} alt={fn.originalName || 'Field note'}
                                style={{ width: 80, height: 80, borderRadius: 10, objectFit: 'cover', border: `1px solid ${C.cardBorder}` }} />
                            </a>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════
// ROUTES LIST + EDITOR (unchanged from Phase 3B)
// ═══════════════════════════════════════════
function RoutesListView({ crews, accounts, onRefresh, showToast }) {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingRouteId, setEditingRouteId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteItem, setDeleteItem] = useState(null)
  const [rName, setRName] = useState(''); const [crewId, setCrewId] = useState('')
  const [dayOfWeek, setDayOfWeek] = useState(''); const [color, setColor] = useState('#2D7A3A')
  const [rNotes, setRNotes] = useState(''); const [editItem, setEditItem] = useState(null)
  const [saving, setSaving] = useState(false); const [filterCrew, setFilterCrew] = useState('')

  const load = useCallback(async () => { try { setRoutes(await getRoutes()) } catch {}; setLoading(false) }, [])
  useEffect(() => { load() }, [load])

  const openForm = (route) => {
    if (route) { setEditItem(route); setRName(route.name); setCrewId(route.crewId ? String(route.crewId) : ''); setDayOfWeek(route.dayOfWeek !== null ? String(route.dayOfWeek) : ''); setColor(route.color || '#2D7A3A'); setRNotes(route.notes || '') }
    else { setEditItem(null); setRName(''); setCrewId(''); setDayOfWeek(''); setColor('#2D7A3A'); setRNotes('') }
    setShowForm(true)
  }

  const save = async () => {
    if (!rName.trim()) return; setSaving(true)
    try {
      const data = { name: rName, crewId: crewId ? parseInt(crewId) : null, dayOfWeek: dayOfWeek !== '' ? parseInt(dayOfWeek) : null, color, notes: rNotes || null }
      if (editItem) await updateRoute(editItem.id, data); else await createRoute(data)
      showToast(editItem ? 'Route updated ✓' : 'Route created ✓'); setShowForm(false); await load()
    } catch { showToast('Failed to save') }; setSaving(false)
  }

  const handleDelete = async () => { try { await deleteRoute(deleteItem.id); showToast('Deleted ✓'); setDeleteItem(null); await load() } catch { showToast('Failed to delete') } }
  const handleFormDelete = () => { setShowForm(false); setDeleteItem(editItem) }

  if (editingRouteId) return <RouteEditor routeId={editingRouteId} accounts={accounts} crews={crews} onBack={() => { setEditingRouteId(null); load() }} showToast={showToast} onRefresh={onRefresh} />

  const filtered = filterCrew ? routes.filter(r => String(r.crewId) === filterCrew) : routes

  return (
    <div>
      <SectionHeader title="Routes" count={routes.length} onAdd={() => openForm(null)} addLabel="New Route" />
      {crews.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          <div tabIndex={0} role="button" onClick={() => setFilterCrew('')} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: !filterCrew ? C.accent : '#eee', color: !filterCrew ? '#fff' : C.textMed }}>All</div>
          {crews.map(c => (<div key={c.id} tabIndex={0} role="button" onClick={() => setFilterCrew(filterCrew === String(c.id) ? '' : String(c.id))} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: filterCrew === String(c.id) ? C.accent : '#eee', color: filterCrew === String(c.id) ? '#fff' : C.textMed }}>{c.name}</div>))}
        </div>
      )}
      {loading ? <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>Loading...</div>
      : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}><div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div><div style={{ fontSize: 16, fontWeight: 700 }}>{routes.length === 0 ? 'No routes yet' : 'No matches'}</div>{routes.length === 0 && <div style={{ fontSize: 13, marginTop: 4 }}>Create your first route and add accounts to it.</div>}</div>
      ) : filtered.map(route => (
        <div key={route.id} tabIndex={0} role="button" onClick={() => setEditingRouteId(route.id)} onKeyDown={e => e.key === 'Enter' && setEditingRouteId(route.id)}
          style={{ ...cardStyle({ cursor: 'pointer' }), transition: 'border-color 0.15s', borderLeft: `4px solid ${route.color}` }}
          onMouseEnter={e => e.currentTarget.style.borderColor = route.color} onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.borderLeftColor = route.color }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{route.name}</div>
              <div style={{ fontSize: 13, color: C.textMed, marginTop: 2 }}>{route.crewName || 'Unassigned'} · {route.stopCount} stop{route.stopCount !== 1 ? 's' : ''}{route.totalMinutes > 0 && ` · ~${Math.round(route.totalMinutes / 60 * 10) / 10}h`}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {route.dayName && <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, fontWeight: 700, background: C.blueLight, color: C.blue }}>{route.dayName}</span>}
              <button tabIndex={0} onClick={e => { e.stopPropagation(); openForm(route) }} onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); openForm(route) } }}
                style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, fontWeight: 700, background: '#eee', color: C.textMed, border: 'none', cursor: 'pointer' }}>✏️</button>
            </div>
          </div>
        </div>
      ))}

      {showForm && (
        <FormModal title={editItem ? 'Edit Route' : 'New Route'} onSave={save} onCancel={() => setShowForm(false)} onDelete={editItem ? handleFormDelete : undefined} saving={saving}>
          <Field label="Route Name" value={rName} onChange={setRName} placeholder="e.g. Monday North Route" required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ marginBottom: 14 }}><div style={labelStyle}>Crew</div><select value={crewId} onChange={e => setCrewId(e.target.value)} style={inputStyle()}><option value="">Unassigned</option>{crews.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div style={{ marginBottom: 14 }}><div style={labelStyle}>Day of Week</div><select value={dayOfWeek} onChange={e => setDayOfWeek(e.target.value)} style={inputStyle()}>{DAY_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select></div>
          </div>
          <div style={{ marginBottom: 14 }}><div style={labelStyle}>Color</div><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{ROUTE_COLORS.map(c => (<div key={c} tabIndex={0} role="button" onClick={() => setColor(c)} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setColor(c)} style={{ width: 32, height: 32, borderRadius: 8, background: c, cursor: 'pointer', border: color === c ? '3px solid #1A1A18' : '3px solid transparent', transition: 'border-color 0.15s' }} />))}</div></div>
          <Field label="Notes" value={rNotes} onChange={setRNotes} placeholder="Route notes..." type="textarea" />
        </FormModal>
      )}
      {deleteItem && <ConfirmDelete name={deleteItem.name} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />}
    </div>
  )
}

// ═══════════════════════════════════════════
// ROUTE EDITOR (unchanged from Phase 3B)
// ═══════════════════════════════════════════
function RouteEditor({ routeId, accounts, crews, onBack, showToast, onRefresh }) {
  const [route, setRoute] = useState(null); const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState(''); const [showSearch, setShowSearch] = useState(false)
  const [savingStop, setSavingStop] = useState(false); const [editingStop, setEditingStop] = useState(null)
  const [stopNotes, setStopNotes] = useState(''); const [stopMinutes, setStopMinutes] = useState('30')
  const [dragFrom, setDragFrom] = useState(null); const [dragOver, setDragOver] = useState(null)

  const load = useCallback(async () => { try { setRoute(await getRoute(routeId)) } catch {}; setLoading(false) }, [routeId])
  useEffect(() => { load() }, [load])

  const handleAddStop = async (account) => { setSavingStop(true); try { await addRouteStop(routeId, { accountId: account.id }); showToast(`Added "${account.name}" ✓`); setShowSearch(false); setSearchQ(''); await load() } catch (e) { showToast(e.message?.includes('duplicate') ? 'Already on this route' : 'Failed to add') }; setSavingStop(false) }
  const handleRemoveStop = async (stopId) => { try { await removeRouteStop(routeId, stopId); showToast('Removed ✓'); await load() } catch { showToast('Failed to remove') } }
  const handleUpdateStop = async () => { if (!editingStop) return; try { await updateRouteStop(routeId, editingStop.id, { estimatedMinutes: parseInt(stopMinutes) || 30, notes: stopNotes || null }); showToast('Updated ✓'); setEditingStop(null); await load() } catch { showToast('Failed to update') } }
  const handleDragStart = (i) => { setDragFrom(i) }; const handleDragEnter = (i) => { setDragOver(i) }
  const handleDragEnd = async () => { if (dragFrom === null || dragOver === null || dragFrom === dragOver || !route?.stops) { setDragFrom(null); setDragOver(null); return }; const stops = [...route.stops]; const [moved] = stops.splice(dragFrom, 1); stops.splice(dragOver, 0, moved); setRoute({ ...route, stops }); setDragFrom(null); setDragOver(null); try { await reorderRouteStops(routeId, stops.map(s => s.id)) } catch { showToast('Reorder failed'); await load() } }

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>Loading...</div>
  if (!route) return <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>Route not found</div>

  const existingAccountIds = new Set((route.stops || []).map(s => s.accountId))
  const availableAccounts = (accounts || []).filter(a => { if (existingAccountIds.has(a.id)) return false; if (!searchQ) return true; const q = searchQ.toLowerCase(); return a.name.toLowerCase().includes(q) || a.address.toLowerCase().includes(q) || (a.city || '').toLowerCase().includes(q) })
  const mapAccounts = (route.stops || []).filter(s => s.account.latitude && s.account.longitude).map((s, i) => ({ id: s.id, name: `${i + 1}. ${s.account.name}`, address: s.account.address, latitude: s.account.latitude, longitude: s.account.longitude, accountType: 'residential', contactName: s.account.contactName, contactPhone: s.account.contactPhone }))
  const crew = crews.find(c => c.id === route.crewId)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button tabIndex={0} onClick={onBack} style={{ fontSize: 13, color: C.blue, cursor: 'pointer', fontWeight: 700, background: 'none', border: 'none', padding: 0 }}>← Back</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 14, height: 14, borderRadius: 4, background: route.color, display: 'inline-block' }} />{route.name}</div>
          <div style={{ fontSize: 13, color: C.textLight }}>{crew?.name || 'Unassigned'} · {route.dayName || 'Unscheduled'} · {(route.stops || []).length} stops</div>
        </div>
      </div>
      {mapAccounts.length > 0 && <div style={{ marginBottom: 14 }}><AccountMap accounts={mapAccounts} height="280px" showTypeColors={false} /></div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={labelStyle}>{(route.stops || []).length} Stops</div>
        <button tabIndex={0} onClick={() => setShowSearch(!showSearch)} style={{ ...btnStyle(C.accent, '#fff', { width: 'auto', padding: '8px 16px', fontSize: 13 }) }}>+ Add Stop</button>
      </div>

      {showSearch && (
        <div style={{ ...cardStyle(), borderColor: C.accentBorder, background: C.accentLight, marginBottom: 12 }}>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search accounts to add..." autoFocus style={inputStyle({ marginBottom: 8 })} />
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {availableAccounts.length === 0 ? <div style={{ fontSize: 13, color: C.textLight, padding: 8, textAlign: 'center' }}>{searchQ ? 'No matching accounts' : 'All accounts are already on this route'}</div>
            : availableAccounts.slice(0, 20).map(a => (
              <div key={a.id} tabIndex={0} role="button" onClick={() => !savingStop && handleAddStop(a)} onKeyDown={e => e.key === 'Enter' && !savingStop && handleAddStop(a)}
                style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div><div style={{ fontSize: 14, fontWeight: 700 }}>{a.name}</div><div style={{ fontSize: 12, color: C.textLight }}>{a.address}{a.city ? `, ${a.city}` : ''}</div></div>
                <span style={{ fontSize: 18, color: C.accent }}>+</span>
              </div>
            ))}
          </div>
          <button tabIndex={0} onClick={() => { setShowSearch(false); setSearchQ('') }} style={{ fontSize: 12, color: C.textLight, cursor: 'pointer', background: 'none', border: 'none', padding: 0, marginTop: 4, fontWeight: 600 }}>Cancel</button>
        </div>
      )}

      {(route.stops || []).length === 0 ? <div style={{ textAlign: 'center', padding: 30, color: C.textLight }}><div style={{ fontSize: 13 }}>No stops yet. Click "Add Stop" to add accounts to this route.</div></div>
      : (route.stops || []).map((stop, index) => (
        <div key={stop.id} draggable onDragStart={() => handleDragStart(index)} onDragEnter={() => handleDragEnter(index)} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()}
          style={{ ...cardStyle({ marginBottom: 8, cursor: 'grab', userSelect: 'none' }), borderLeft: `4px solid ${route.color}`, opacity: dragFrom === index ? 0.5 : 1, borderTop: dragOver === index && dragFrom !== null && dragFrom !== index ? `3px solid ${C.accent}` : undefined }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: C.textLight, minWidth: 28, textAlign: 'center', paddingTop: 2 }}><div style={{ fontSize: 16, cursor: 'grab', marginBottom: 2 }}>⠿</div><div style={{ fontSize: 11, color: route.color, fontWeight: 800 }}>{index + 1}</div></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{stop.account.name}</div>
              <div style={{ fontSize: 13, color: C.textMed, marginTop: 2 }}>{stop.account.address}{stop.account.city ? `, ${stop.account.city}` : ''}</div>
              {stop.notes && <div style={{ fontSize: 12, color: C.textLight, marginTop: 4, fontStyle: 'italic' }}>📝 {stop.notes}</div>}
              <div style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>~{stop.estimatedMinutes}min{stop.account.contactName && ` · 📞 ${stop.account.contactName}`}</div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button tabIndex={0} onClick={() => { setEditingStop(stop); setStopNotes(stop.notes || ''); setStopMinutes(String(stop.estimatedMinutes || 30)) }} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, background: '#eee', border: 'none', cursor: 'pointer', fontWeight: 700, color: C.textMed }}>✏️</button>
              <button tabIndex={0} onClick={() => handleRemoveStop(stop.id)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, background: C.redLight, border: 'none', cursor: 'pointer', fontWeight: 700, color: C.red }}>✕</button>
            </div>
          </div>
        </div>
      ))}

      {editingStop && (
        <FormModal title={`Edit Stop: ${editingStop.account.name}`} onSave={handleUpdateStop} onCancel={() => setEditingStop(null)}>
          <Field label="Estimated Time (minutes)" value={stopMinutes} onChange={setStopMinutes} placeholder="30" type="number" />
          <Field label="Stop Notes" value={stopNotes} onChange={setStopNotes} placeholder="Gate code, special instructions..." type="textarea" />
          <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FAFAF7', border: `1px solid ${C.cardBorder}` }}>
            <div style={{ fontSize: 12, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Address</div>
            <LocationLink location={editingStop.account.address} compact />
          </div>
        </FormModal>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// SCHEDULE VIEW (unchanged from Phase 3B)
// ═══════════════════════════════════════════
function ScheduleView({ crews, showToast }) {
  const [schedule, setSchedule] = useState([]); const [loading, setLoading] = useState(true)
  useEffect(() => { (async () => { try { setSchedule(await getWeekSchedule()) } catch {}; setLoading(false) })() }, [])

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>Loading...</div>
  const workDays = schedule.filter(d => { if (d.day === null) return d.routes.length > 0; if (d.day === 0) return d.routes.length > 0; return d.day >= 1 && d.day <= 6 })
  const totalRoutes = schedule.reduce((sum, d) => sum + d.routes.length, 0)
  const totalStops = schedule.reduce((sum, d) => sum + d.routes.reduce((s2, r) => s2 + r.stopCount, 0), 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div><div style={{ fontSize: 18, fontWeight: 900 }}>Week Schedule</div><div style={{ fontSize: 13, color: C.textLight }}>{totalRoutes} routes · {totalStops} total stops</div></div>
      </div>
      {workDays.length === 0 || totalRoutes === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}><div style={{ fontSize: 40, marginBottom: 12 }}>📅</div><div style={{ fontSize: 16, fontWeight: 700 }}>No routes scheduled</div><div style={{ fontSize: 13, marginTop: 4 }}>Create routes and assign them days to see the schedule.</div></div>
      ) : workDays.map(day => (
        <div key={day.day ?? 'unsched'} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}><span>{day.dayName}</span>{day.routes.length > 0 && <span style={{ fontSize: 12, color: C.textLight, fontWeight: 600 }}>· {day.routes.length} route{day.routes.length !== 1 ? 's' : ''} · {day.routes.reduce((s, r) => s + r.stopCount, 0)} stops</span>}</div>
          {day.routes.length === 0 ? <div style={{ ...cardStyle(), textAlign: 'center', color: C.textLight, fontSize: 13 }}>No routes</div>
          : day.routes.map(route => (
            <div key={route.id} style={{ ...cardStyle({ marginBottom: 6 }), borderLeft: `4px solid ${route.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div><div style={{ fontSize: 14, fontWeight: 700 }}>{route.name}</div><div style={{ fontSize: 12, color: C.textLight }}>{route.crewName || 'Unassigned'} · {route.stopCount} stops</div></div>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: route.color }} />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function formatTime(mins) {
  if (!mins) return ''
  const h = Math.floor(mins / 60); const m = mins % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}
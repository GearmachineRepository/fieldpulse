import { useState, useRef, useEffect } from 'react'
import { APP, C, MONO, SIG_COLORS, cardStyle, labelStyle, inputStyle, btnStyle } from '../config.js'
import { createVehicle, updateVehicle, deleteVehicle, createCrew, updateCrew, deleteCrew,
  createEquipment, updateEquipment, deleteEquipment, createChemical, updateChemical, deleteChemical,
  getVehicles, getEmployees, createEmployee, updateEmployee, deleteEmployee,
  getAllSprayLogs, getPurReport } from '../lib/api.js'
import { openPdf } from '../components/PdfExport.js'

export default function AdminDashboard({ page, chemicals, equipment, crews, employees, logs, onRefresh, showToast, onNav }) {
  if (page === 'admin-home') return <AdminHome logs={logs} crews={crews} employees={employees} chemicals={chemicals} equipment={equipment} onNav={onNav} />
  if (page === 'admin-spraylogs') return <SprayLogsSection logs={logs} />
  if (page === 'admin-vehicles') return <VehiclesSection crews={crews} onRefresh={onRefresh} showToast={showToast} />
  if (page === 'admin-crews') return <CrewsSection crews={crews} onRefresh={onRefresh} showToast={showToast} />
  if (page === 'admin-employees') return <EmployeesSection employees={employees} crews={crews} onRefresh={onRefresh} showToast={showToast} />
  if (page === 'admin-chemicals') return <ChemicalsSection chemicals={chemicals} onRefresh={onRefresh} showToast={showToast} />
  if (page === 'admin-equipment') return <EquipmentSection equipment={equipment} onRefresh={onRefresh} showToast={showToast} />
  return null
}

// ═══════════════════════════════════════════
// SHARED
// ═══════════════════════════════════════════
function SectionHeader({ title, count, onAdd, addLabel }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div><div style={{ fontSize: 18, fontWeight: 900 }}>{title}</div>
        {count !== undefined && <div style={{ fontSize: 13, color: C.textLight }}>{count} total</div>}</div>
      {onAdd && <button tabIndex={0} onClick={onAdd} style={{ ...btnStyle(C.accent, '#fff', { width: 'auto', padding: '10px 20px', fontSize: 14 }) }}>+ {addLabel || 'Add New'}</button>}
    </div>
  )
}

function SubTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 18, background: C.card, borderRadius: 12, border: `1.5px solid ${C.cardBorder}`, padding: 4, overflow: 'hidden' }}>
      {tabs.map(t => (
        <div key={t.key} tabIndex={0} role="button" onClick={() => onChange(t.key)} onKeyDown={e => e.key === 'Enter' && onChange(t.key)}
          style={{ flex: 1, textAlign: 'center', padding: '10px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', borderRadius: 9,
            color: active === t.key ? '#fff' : C.textLight, background: active === t.key ? C.accent : 'transparent', transition: 'all 0.15s' }}>
          {t.label}
        </div>
      ))}
    </div>
  )
}

function FormModal({ title, children, onSave, onCancel, onDelete, saving }) {
  const modalRef = useRef(null)
  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return
    const focusable = modal.querySelectorAll('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
    if (focusable.length) focusable[0].focus()
    const trap = (e) => {
      if (e.key === 'Escape') { onCancel(); return }
      if (e.key !== 'Tab') return
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus() } }
      else { if (document.activeElement === last) { e.preventDefault(); first.focus() } }
    }
    modal.addEventListener('keydown', trap)
    return () => modal.removeEventListener('keydown', trap)
  }, [onCancel])
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}>
      <div ref={modalRef} style={{ background: C.card, borderRadius: 20, padding: 24, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 20 }}>{title}</div>
        {children}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {onDelete && <button tabIndex={0} onClick={onDelete} style={{ ...btnStyle(C.red, '#fff', { width: 'auto', padding: '12px 18px' }) }}>🗑 Delete</button>}
          <div style={{ flex: 1 }} />
          <button tabIndex={0} onClick={onCancel} style={{ ...btnStyle('#eee', C.text, { width: 'auto', padding: '12px 20px', boxShadow: 'none' }) }}>Cancel</button>
          <button tabIndex={0} onClick={onSave} disabled={saving} style={{ ...btnStyle(C.accent, '#fff', { width: 'auto', padding: '12px 20px', opacity: saving ? 0.6 : 1 }) }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDelete({ name, onConfirm, onCancel }) {
  const modalRef = useRef(null)
  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return
    const focusable = modal.querySelectorAll('button, [tabindex]:not([tabindex="-1"])')
    if (focusable.length) focusable[0].focus()
    const trap = (e) => {
      if (e.key === 'Escape') { onCancel(); return }
      if (e.key !== 'Tab') return
      const first = focusable[0], last = focusable[focusable.length - 1]
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus() } }
      else { if (document.activeElement === last) { e.preventDefault(); first.focus() } }
    }
    modal.addEventListener('keydown', trap)
    return () => modal.removeEventListener('keydown', trap)
  }, [onCancel])
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div ref={modalRef} style={{ background: C.card, borderRadius: 20, padding: 24, width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Delete "{name}"?</div>
        <div style={{ fontSize: 14, color: C.textMed, marginBottom: 20 }}>This will deactivate the item. Existing logs are preserved.</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button tabIndex={0} onClick={onCancel} style={{ ...btnStyle('#eee', C.text, { flex: 1, boxShadow: 'none' }) }}>Cancel</button>
          <button tabIndex={0} onClick={onConfirm} style={{ ...btnStyle(C.red, '#fff', { flex: 1 }) }}>Delete</button>
        </div>
      </div>
    </div>
  )
}

const Field = ({ label, value, onChange, placeholder, type, required }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={labelStyle}>{label}{required && <span style={{ color: C.red }}> *</span>}</div>
    {type === 'checkbox' ? (
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} style={{ width: 20, height: 20 }} />
        <span style={{ fontSize: 15 }}>{placeholder}</span>
      </label>
    ) : (
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle()} />
    )}
  </div>
)

// ═══════════════════════════════════════════
// ADMIN HOME
// ═══════════════════════════════════════════
function AdminHome({ logs, crews, employees, chemicals, equipment, onNav }) {
  const today = new Date()
  const todayStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const todaysLogs = logs.filter(l => l.date === todayStr)
  const activeCrews = [...new Set(todaysLogs.map(l => l.crewName).filter(Boolean))]

  // Check for alerts
  const alerts = []
  const currentMonth = today.getMonth() + 1
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const prevMonthName = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][prevMonth]
  if (today.getDate() <= 10) {
    alerts.push({ type: 'warning', icon: '📊', title: `PUR Report Due`, desc: `${prevMonthName} report due by the 10th — submit to County Ag Commissioner` })
  }
  const empsNoCrew = employees.filter(e => !e.default_crew_id)
  if (empsNoCrew.length > 0) {
    alerts.push({ type: 'info', icon: '👷', title: `${empsNoCrew.length} Employee${empsNoCrew.length > 1 ? 's' : ''} Unassigned`, desc: 'Employees without a default crew' })
  }
  const empsNoLicense = employees.filter(e => !e.license_number)
  if (empsNoLicense.length > 0) {
    alerts.push({ type: 'info', icon: '📋', title: `${empsNoLicense.length} Missing License #`, desc: 'Employees without a license/cert on file' })
  }
  if (crews.length === 0) alerts.push({ type: 'warning', icon: '👥', title: 'No Crews Set Up', desc: 'Create crews to organize your team' })
  if (chemicals.length === 0) alerts.push({ type: 'warning', icon: '🧪', title: 'No Chemicals Added', desc: 'Add your chemical inventory for spray logs' })

  const h = today.getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: C.textLight, fontWeight: 600 }}>{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.text, marginTop: 2 }}>{greeting}</div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              ...cardStyle({ marginBottom: 8 }),
              background: a.type === 'warning' ? C.amberLight : C.blueLight,
              borderColor: a.type === 'warning' ? C.amberBorder : C.blueBorder,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: a.type === 'warning' ? C.amber : C.blue }}>{a.title}</div>
                  <div style={{ fontSize: 13, color: C.textMed }}>{a.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Logs Today', value: todaysLogs.length, color: C.accent, icon: '📋' },
          { label: 'Crews Active', value: activeCrews.length, color: C.blue, icon: '👥' },
          { label: 'Total Logs', value: logs.length, color: C.textMed, icon: '📊' },
        ].map(s => (
          <div key={s.label} style={cardStyle({ textAlign: 'center', padding: '16px 12px' })}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div style={cardStyle()}>
        <div style={labelStyle}>Quick Links</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          {[
            { k: 'admin-spraylogs', icon: '📋', label: 'Spray Logs', count: logs.length },
            { k: 'admin-employees', icon: '👷', label: 'Employees', count: employees.length },
            { k: 'admin-crews', icon: '👥', label: 'Crews', count: crews.length },
            { k: 'admin-vehicles', icon: '🚛', label: 'Vehicles' },
            { k: 'admin-chemicals', icon: '🧪', label: 'Chemicals', count: chemicals.length },
            { k: 'admin-equipment', icon: '🔧', label: 'Equipment', count: equipment.length },
          ].map(link => (
            <div key={link.k} tabIndex={0} role="button" onClick={() => onNav(link.k)} onKeyDown={e => e.key === 'Enter' && onNav(link.k)}
              style={{ padding: '14px 16px', borderRadius: 12, background: '#FAFAF7', border: `1.5px solid ${C.cardBorder}`, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10, transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent} onMouseLeave={e => e.currentTarget.style.borderColor = C.cardBorder}>
              <span style={{ fontSize: 20 }}>{link.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{link.label}</div>
                {link.count !== undefined && <div style={{ fontSize: 12, color: C.textLight }}>{link.count} total</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Logs */}
      <div style={cardStyle()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={labelStyle}>Recent Spray Logs</div>
          <div tabIndex={0} role="button" onClick={() => onNav('admin-spraylogs')} onKeyDown={e => e.key === 'Enter' && onNav('admin-spraylogs')}
            style={{ fontSize: 13, color: C.accent, fontWeight: 700, cursor: 'pointer' }}>View All →</div>
        </div>
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: C.textLight, fontSize: 14 }}>No spray logs yet.</div>
        ) : logs.slice(0, 6).map(log => (
          <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.cardBorder}` }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{log.property}</div>
              <div style={{ fontSize: 12, color: C.textLight }}>{log.crewName} · {log.crewLead} · {log.products.length} product{log.products.length !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{log.date}</div>
              <div style={{ fontSize: 11, color: C.textLight }}>{log.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// SPRAY LOGS — sub-tabs: All Logs | Reports
// ═══════════════════════════════════════════
function SprayLogsSection({ logs }) {
  const [subTab, setSubTab] = useState('logs')
  return (
    <div>
      <SubTabs tabs={[{ key: 'logs', label: '📋 All Logs' }, { key: 'reports', label: '📊 Reports' }]} active={subTab} onChange={setSubTab} />
      {subTab === 'logs' && <AllLogsView logs={logs} />}
      {subTab === 'reports' && <ReportsView />}
    </div>
  )
}

function AllLogsView({ logs }) {
  const [expanded, setExpanded] = useState(null)
  const [filterCrew, setFilterCrew] = useState('')
  const filtered = filterCrew ? logs.filter(l => l.crewName === filterCrew) : logs
  const crewNames = [...new Set(logs.map(l => l.crewName).filter(Boolean))]

  return (
    <div>
      <SectionHeader title="All Spray Logs" count={filtered.length} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div tabIndex={0} role="button" onClick={() => setFilterCrew('')} onKeyDown={e => e.key === 'Enter' && setFilterCrew('')}
          style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: !filterCrew ? C.accent : '#eee', color: !filterCrew ? '#fff' : C.textMed }}>All Crews</div>
        {crewNames.map(c => (
          <div key={c} tabIndex={0} role="button" onClick={() => setFilterCrew(c)} onKeyDown={e => e.key === 'Enter' && setFilterCrew(c)}
            style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: filterCrew === c ? C.accent : '#eee', color: filterCrew === c ? '#fff' : C.textMed }}>{c}</div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}><div style={{ fontSize: 40, marginBottom: 12 }}>📋</div><div style={{ fontSize: 16, fontWeight: 700 }}>No logs found</div></div>
      ) : filtered.map(log => (
        <div key={log.id} style={{ marginBottom: 10 }}>
          <div tabIndex={0} role="button" onClick={() => setExpanded(expanded === log.id ? null : log.id)} onKeyDown={e => e.key === 'Enter' && setExpanded(expanded === log.id ? null : log.id)}
            style={{ ...cardStyle({ marginBottom: 0, cursor: 'pointer' }), borderRadius: expanded === log.id ? '16px 16px 0 0' : 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div><div style={{ fontSize: 17, fontWeight: 800 }}>{log.property}</div>
                <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>{log.crewName} · {log.crewLead} · {log.products.length} product{log.products.length !== 1 ? 's' : ''}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{log.date}</div><div style={{ fontSize: 12, color: C.textLight }}>{log.time}</div></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 13, color: C.textLight, fontWeight: 600, flexWrap: 'wrap' }}>
              <span>🌡 {log.weather.temp}°F</span><span>💨 {log.weather.windSpeed} mph</span><span>🔧 {log.equipment}</span>
              {log.photos && log.photos.length > 0 && <span>📷 {log.photos.length}</span>}
              {log.members && log.members.length > 0 && <span>👷 {log.members.length}</span>}
            </div>
          </div>
          {expanded === log.id && (
            <div style={{ background: '#FAFAF7', border: `1.5px solid ${C.cardBorder}`, borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '16px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                {[{ l: 'Crew', v: log.crewName }, { l: 'Crew Lead', v: log.crewLead }, { l: 'License', v: log.license }, { l: 'Equipment', v: log.equipment },
                  { l: 'Mix Volume', v: log.totalMixVol }, { l: 'Location', v: log.location }, { l: 'Target Pest', v: log.targetPest }].map(f => (
                  <div key={f.l}><div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>{f.l}</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{f.v || '—'}</div></div>
                ))}
              </div>
              {log.members && log.members.length > 0 && (
                <><div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Crew Members ({log.members.length})</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {log.members.map(m => <span key={m.id} style={{ padding: '6px 12px', borderRadius: 8, background: C.blueLight, border: `1px solid ${C.blueBorder}`, fontSize: 13, fontWeight: 600, color: C.blue }}>{m.name}</span>)}
                </div></>
              )}
              <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Products</div>
              {log.products.map((p, i) => (
                <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: C.card, border: `1px solid ${C.cardBorder}`, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <div><div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: 12, color: C.textLight }}>EPA: {p.epa}</div></div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: C.accent, fontFamily: MONO }}>{p.ozConcentrate}</div>
                </div>
              ))}
              {log.photos && log.photos.length > 0 && (
                <><div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 14, marginBottom: 6 }}>Photos ({log.photos.length})</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {log.photos.map(ph => (
                    <a key={ph.id} href={`/uploads/${ph.filename}`} target="_blank" rel="noopener noreferrer"
                      style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.cardBorder}` }}>
                      <img src={`/uploads/${ph.filename}`} alt={ph.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </a>
                  ))}
                </div></>
              )}
              {log.notes && <><div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Notes</div>
                <div style={{ fontSize: 14, color: C.textMed, marginBottom: 14 }}>{log.notes}</div></>}
              <button tabIndex={0} onClick={() => openPdf(log)} style={{ ...btnStyle(C.blue, '#fff', { fontSize: 14, marginTop: 8 }) }}>📄 Export PDF</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── REPORTS (generic date range, replaces PUR-only) ──
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

  const getDateRange = () => {
    if (rangeType === 'monthly') {
      return { start: `${year}-${String(month).padStart(2,'0')}-01`, end: new Date(year, month, 1).toISOString().split('T')[0], label: `${monthNames[month]} ${year}` }
    } else if (rangeType === 'biweekly') {
      const s = new Date(); s.setDate(s.getDate() - 14)
      return { start: s.toISOString().split('T')[0], end: new Date().toISOString().split('T')[0], label: `Last 14 Days` }
    } else {
      return { start: startDate, end: endDate, label: `${startDate} to ${endDate}` }
    }
  }

  const generate = async () => {
    const range = getDateRange()
    if (!range.start || !range.end) return
    setLoading(true)
    try { setReport(await getPurReport(month, year)) }
    catch { setReport(null) }
    setLoading(false)
  }

  const exportReport = () => {
    if (!report) return
    const range = getDateRange()
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
${rangeType === 'monthly' ? `<div class="note">Submit DPR-PML-060 to County Agricultural Commissioner by the 10th of ${monthNames[month % 12 + 1] || 'January'} ${month===12?year+1:year}.</div>` : ''}
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

        <div style={labelStyle}>Report Period</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[{ k: 'monthly', l: 'Monthly' }, { k: 'biweekly', l: 'Bi-Weekly' }, { k: 'custom', l: 'Custom Range' }].map(r => (
            <div key={r.k} tabIndex={0} role="button" onClick={() => setRangeType(r.k)} onKeyDown={e => e.key === 'Enter' && setRangeType(r.k)}
              style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                background: rangeType === r.k ? C.accent : '#eee', color: rangeType === r.k ? '#fff' : C.textMed }}>
              {r.l}
            </div>
          ))}
        </div>

        {rangeType === 'monthly' && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1 }}><div style={labelStyle}>Month</div>
              <select value={month} onChange={e => setMonth(Number(e.target.value))} style={inputStyle()}>
                {monthNames.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}</select></div>
            <div style={{ flex: 1 }}><div style={labelStyle}>Year</div>
              <select value={year} onChange={e => setYear(Number(e.target.value))} style={inputStyle()}>
                {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}</select></div>
          </div>
        )}

        {rangeType === 'biweekly' && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: C.blueLight, border: `1.5px solid ${C.blueBorder}`, marginBottom: 16, fontSize: 14, color: C.blue, fontWeight: 600 }}>
            Last 14 days from today
          </div>
        )}

        {rangeType === 'custom' && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1 }}><div style={labelStyle}>Start Date</div>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle()} /></div>
            <div style={{ flex: 1 }}><div style={labelStyle}>End Date</div>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle()} /></div>
          </div>
        )}

        <button tabIndex={0} onClick={generate} disabled={loading} style={btnStyle(C.accent, '#fff', { opacity: loading ? 0.6 : 1 })}>
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {report && (
        <div style={{ marginTop: 16 }}>
          <div style={cardStyle({ background: C.accentLight, borderColor: C.accentBorder })}>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.accent }}>{getDateRange().label}</div>
            <div style={{ fontSize: 14, color: C.textMed, marginTop: 4 }}>{report.totalApplications} application{report.totalApplications !== 1 ? 's' : ''} · {report.products.length} product{report.products.length !== 1 ? 's' : ''}</div>
          </div>
          {report.products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: C.textLight }}>No applications for this period.</div>
          ) : (
            <>
              {report.products.map((p, i) => (
                <div key={i} style={cardStyle()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div><div style={{ fontSize: 16, fontWeight: 800 }}>{p.name}</div><div style={{ fontSize: 12, color: C.textLight }}>EPA: {p.epa}</div></div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: 20, fontWeight: 900, color: C.accent, fontFamily: MONO }}>{p.totalAmount.toFixed(2)} {p.unit}</div>
                      <div style={{ fontSize: 12, color: C.textLight }}>{p.appCount} application{p.appCount !== 1 ? 's' : ''}</div></div>
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

// ═══════════════════════════════════════════
// VEHICLES (standalone)
// ═══════════════════════════════════════════
function VehiclesSection({ crews, onRefresh, showToast }) {
  const [vehicles, setVehicles] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [vName, setVName] = useState('')
  const [vPin, setVPin] = useState('')
  const [vCrew, setVCrew] = useState('')
  const [vPlate, setVPlate] = useState('')
  const [vVin, setVVin] = useState('')
  const [vMakeModel, setVMakeModel] = useState('')
  const [vYear, setVYear] = useState('')
  const [vTruckNum, setVTruckNum] = useState('')

  useEffect(() => { getVehicles().then(setVehicles) }, [])

  const openForm = (v) => {
    if (v) {
      setEditItem(v); setVName(v.name); setVPin(''); setVCrew(v.crew_name || '')
      setVPlate(v.license_plate || ''); setVVin(v.vin || ''); setVMakeModel(v.make_model || '')
      setVYear(v.year ? String(v.year) : ''); setVTruckNum(v.truck_number || '')
    } else {
      setEditItem(null); setVName(''); setVPin(''); setVCrew(''); setVPlate(''); setVVin('')
      setVMakeModel(''); setVYear(''); setVTruckNum('')
    }
    setShowForm(true)
  }

  const save = async () => {
    if (!vName.trim()) return; setSaving(true)
    try {
      const data = { name: vName, crewName: vCrew, licensePlate: vPlate, vin: vVin, makeModel: vMakeModel, year: vYear, truckNumber: vTruckNum }
      if (editItem) { await updateVehicle(editItem.id, { ...data, pin: vPin || undefined }) }
      else {
        if (!vPin || vPin.length < 4) { showToast('PIN must be at least 4 digits'); setSaving(false); return }
        await createVehicle({ ...data, pin: vPin })
      }
      showToast(editItem ? 'Vehicle updated ✓' : 'Vehicle created ✓')
      setShowForm(false); await onRefresh(); setVehicles(await getVehicles())
    } catch { showToast('Failed to save') }
    setSaving(false)
  }

  const handleDelete = async () => {
    try { await deleteVehicle(deleteItem.id); showToast('Deleted ✓'); setDeleteItem(null); await onRefresh(); setVehicles(await getVehicles()) }
    catch { showToast('Failed to delete') }
  }
  const handleFormDelete = () => { setShowForm(false); setDeleteItem(editItem) }

  return (
    <div>
      <SectionHeader title="Vehicles" count={vehicles.length} onAdd={() => openForm(null)} addLabel="Add Vehicle" />
      {vehicles.map(v => (
        <div key={v.id} tabIndex={0} role="button" onClick={() => openForm(v)} onKeyDown={e => e.key === 'Enter' && openForm(v)}
          style={{ ...cardStyle({ cursor: 'pointer' }), transition: 'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.accent} onMouseLeave={e => e.currentTarget.style.borderColor = C.cardBorder}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{v.name}</div>
              <div style={{ fontSize: 13, color: C.textLight }}>
                {v.crew_name || 'No crew'}{v.truck_number ? ` · #${v.truck_number}` : ''}{v.make_model ? ` · ${v.make_model}` : ''}{v.year ? ` ${v.year}` : ''}
              </div>
              {v.license_plate && <div style={{ fontSize: 12, color: C.textLight }}>Plate: {v.license_plate}{v.vin ? ` · VIN: ${v.vin}` : ''}</div>}
            </div>
            <div style={{ fontSize: 13, color: C.textLight, fontWeight: 600 }}>Edit →</div>
          </div>
        </div>
      ))}

      {showForm && (
        <FormModal title={editItem ? 'Edit Vehicle' : 'New Vehicle'} onSave={save} onCancel={() => setShowForm(false)} onDelete={editItem ? handleFormDelete : undefined} saving={saving}>
          <Field label="Vehicle Name" value={vName} onChange={setVName} placeholder="e.g. Truck 2" required />
          <Field label={editItem ? "New PIN (leave blank to keep)" : "PIN (4-6 digits)"} value={vPin} onChange={v => setVPin(v.replace(/\D/g, ''))} placeholder="e.g. 1234" required={!editItem} />
          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Assign to Crew</div>
            <select value={vCrew} onChange={e => setVCrew(e.target.value)} style={inputStyle()}>
              <option value="">No crew</option>
              {crews.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, marginTop: 8, marginBottom: 12, color: C.textMed }}>Vehicle Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Truck #" value={vTruckNum} onChange={setVTruckNum} placeholder="e.g. 3" />
            <Field label="License Plate" value={vPlate} onChange={setVPlate} placeholder="e.g. 8ABC123" />
            <Field label="Make / Model" value={vMakeModel} onChange={setVMakeModel} placeholder="e.g. Ford F-350" />
            <Field label="Year" value={vYear} onChange={setVYear} placeholder="e.g. 2022" />
          </div>
          <Field label="VIN" value={vVin} onChange={setVVin} placeholder="17-character VIN" />
        </FormModal>
      )}
      {deleteItem && <ConfirmDelete name={deleteItem.name} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />}
    </div>
  )
}

// ═══════════════════════════════════════════
// CREWS (standalone)
// ═══════════════════════════════════════════
function CrewsSection({ crews, onRefresh, showToast }) {
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [cName, setCName] = useState('')
  const [cLead, setCLead] = useState('')

  const openForm = (c) => {
    if (c) { setEditItem(c); setCName(c.name); setCLead(c.lead_name || '') }
    else { setEditItem(null); setCName(''); setCLead('') }
    setShowForm(true)
  }

  const save = async () => {
    if (!cName.trim()) return; setSaving(true)
    try {
      if (editItem) await updateCrew(editItem.id, { name: cName, leadName: cLead })
      else await createCrew({ name: cName, leadName: cLead })
      showToast(editItem ? 'Crew updated ✓' : 'Crew created ✓')
      setShowForm(false); await onRefresh()
    } catch { showToast('Failed to save') }
    setSaving(false)
  }

  const handleDelete = async () => {
    try { await deleteCrew(deleteItem.id); showToast('Deleted ✓'); setDeleteItem(null); await onRefresh() }
    catch { showToast('Failed to delete') }
  }
  const handleFormDelete = () => { setShowForm(false); setDeleteItem(editItem) }

  return (
    <div>
      <SectionHeader title="Crews" count={crews.length} onAdd={() => openForm(null)} addLabel="Add Crew" />
      {crews.map(c => (
        <div key={c.id} tabIndex={0} role="button" onClick={() => openForm(c)} onKeyDown={e => e.key === 'Enter' && openForm(c)}
          style={{ ...cardStyle({ cursor: 'pointer' }), transition: 'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.accent} onMouseLeave={e => e.currentTarget.style.borderColor = C.cardBorder}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div><div style={{ fontSize: 16, fontWeight: 800 }}>{c.name}</div>
              {c.lead_name && <div style={{ fontSize: 13, color: C.textLight }}>Lead: {c.lead_name}</div>}</div>
            <div style={{ fontSize: 13, color: C.textLight, fontWeight: 600 }}>Edit →</div>
          </div>
        </div>
      ))}

      {showForm && (
        <FormModal title={editItem ? 'Edit Crew' : 'New Crew'} onSave={save} onCancel={() => setShowForm(false)} onDelete={editItem ? handleFormDelete : undefined} saving={saving}>
          <Field label="Crew Name" value={cName} onChange={setCName} placeholder="e.g. Crew C" required />
          <Field label="Default Lead Name" value={cLead} onChange={setCLead} placeholder="e.g. Carlos M." />
        </FormModal>
      )}
      {deleteItem && <ConfirmDelete name={deleteItem.name} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />}
    </div>
  )
}

// ═══════════════════════════════════════════
// EMPLOYEES
// ═══════════════════════════════════════════
function EmployeesSection({ employees, crews, onRefresh, showToast }) {
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [licenseNum, setLicenseNum] = useState('')
  const [crewId, setCrewId] = useState('')
  const [empPin, setEmpPin] = useState('')
  const [isCrewLead, setIsCrewLead] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const fileRef = useRef(null)

  const openForm = (emp) => {
    if (emp) {
      setEditItem(emp); setFirstName(emp.first_name); setLastName(emp.last_name)
      setPhone(emp.phone || ''); setLicenseNum(emp.license_number || '')
      setCrewId(emp.default_crew_id ? String(emp.default_crew_id) : '')
      setPhotoPreview(emp.photo_filename ? `/uploads/${emp.photo_filename}` : null)
      setIsCrewLead(emp.is_crew_lead || false)
      setEmpPin('')
    } else {
      setEditItem(null); setFirstName(''); setLastName(''); setPhone('')
      setLicenseNum(''); setCrewId(''); setPhotoPreview(null)
      setIsCrewLead(false); setEmpPin('')
    }
    setPhotoFile(null); setShowForm(true)
  }

  const handlePhoto = (e) => {
    const file = e.target.files[0]; if (!file) return
    setPhotoFile(file)
    const r = new FileReader(); r.onload = ev => setPhotoPreview(ev.target.result); r.readAsDataURL(file)
  }

  const save = async () => {
    if (!firstName.trim() || !lastName.trim()) return; setSaving(true)
    try {
      const data = { firstName, lastName, phone, licenseNumber: licenseNum, defaultCrewId: crewId || null, isCrewLead: isCrewLead }
      if (empPin) data.pin = empPin
      if (editItem) await updateEmployee(editItem.id, data, photoFile)
      else await createEmployee(data, photoFile)
      showToast(editItem ? 'Employee updated ✓' : 'Employee added ✓')
      setShowForm(false); await onRefresh()
    } catch { showToast('Failed to save') }
    setSaving(false)
  }

  const handleDelete = async () => {
    try { await deleteEmployee(deleteItem.id); showToast('Deleted ✓'); setDeleteItem(null); await onRefresh() }
    catch { showToast('Failed to delete') }
  }
  const handleFormDelete = () => { setShowForm(false); setDeleteItem(editItem) }

  return (
    <div>
      <SectionHeader title="Employees" count={employees.length} onAdd={() => openForm(null)} addLabel="Add Employee" />
      {employees.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}><div style={{ fontSize: 40, marginBottom: 12 }}>👷</div><div style={{ fontSize: 16, fontWeight: 700 }}>No employees yet</div><div style={{ fontSize: 14, marginTop: 4 }}>Add employees so crew leads can select their daily roster.</div></div>
      ) : employees.map(emp => (
        <div key={emp.id} tabIndex={0} role="button" onClick={() => openForm(emp)} onKeyDown={e => e.key === 'Enter' && openForm(emp)}
          style={{ ...cardStyle({ cursor: 'pointer' }), transition: 'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.accent} onMouseLeave={e => e.currentTarget.style.borderColor = C.cardBorder}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {emp.photo_filename ? (
              <img src={`/uploads/${emp.photo_filename}`} alt="" style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover', border: `2px solid ${C.cardBorder}` }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: 24, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontWeight: 800 }}>
                {emp.first_name[0]}{emp.last_name[0]}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>
                {emp.first_name} {emp.last_name}
                {emp.is_crew_lead && <span style={{ fontSize: 11, color: C.blue, fontWeight: 700, marginLeft: 8, padding: '2px 8px', borderRadius: 6, background: C.blueLight }}>Lead</span>}
              </div>
              <div style={{ fontSize: 13, color: C.textLight }}>
                {emp.crew_name || 'No crew'}{emp.license_number ? ` · ${emp.license_number}` : ''}{emp.phone ? ` · ${emp.phone}` : ''}
                {emp.has_pin ? '' : ' · ⚠️ No PIN'}
              </div>
            </div>
            <div style={{ fontSize: 13, color: C.textLight, fontWeight: 600 }}>Edit →</div>
          </div>
        </div>
      ))}

      {showForm && (
        <FormModal title={editItem ? 'Edit Employee' : 'New Employee'} onSave={save} onCancel={() => setShowForm(false)} onDelete={editItem ? handleFormDelete : undefined} saving={saving}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
            {photoPreview ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={photoPreview} alt="" style={{ width: 80, height: 80, borderRadius: 40, objectFit: 'cover', border: `3px solid ${C.accent}` }} />
                <div onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #fff' }}>
                  <span style={{ color: '#fff', fontSize: 14 }}>📷</span></div>
              </div>
            ) : (
              <div onClick={() => fileRef.current?.click()} style={{ width: 80, height: 80, borderRadius: 40, background: '#eee', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `2px dashed ${C.cardBorder}` }}>
                <span style={{ fontSize: 28 }}>📷</span></div>
            )}
            <div style={{ fontSize: 12, color: C.textLight, marginTop: 6 }}>Tap to {photoPreview ? 'change' : 'add'} photo</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="First Name" value={firstName} onChange={setFirstName} placeholder="e.g. Carlos" required />
            <Field label="Last Name" value={lastName} onChange={setLastName} placeholder="e.g. Martinez" required />
          </div>
          <Field label="Phone" value={phone} onChange={setPhone} placeholder="e.g. (555) 123-4567" />
          <Field label="License / Cert #" value={licenseNum} onChange={setLicenseNum} placeholder="e.g. QAL-48271" />
          <Field label={editItem ? "New PIN (leave blank to keep)" : "Login PIN (4-6 digits)"} value={empPin} onChange={v => setEmpPin(v.replace(/\D/g, ''))} placeholder="e.g. 1234" required={!editItem} />
          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Default Crew</div>
            <select value={crewId} onChange={e => setCrewId(e.target.value)} style={inputStyle()}>
              <option value="">No crew</option>
              {crews.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
          <Field label="Crew Lead" value={isCrewLead} onChange={setIsCrewLead} placeholder="This employee is a crew lead" type="checkbox" />
        </FormModal>
      )}
      {deleteItem && <ConfirmDelete name={`${deleteItem.first_name} ${deleteItem.last_name}`} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />}
    </div>
  )
}

// ═══════════════════════════════════════════
// EQUIPMENT
// ═══════════════════════════════════════════
function EquipmentSection({ equipment, onRefresh, showToast }) {
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('')

  const openForm = (e) => {
    if (e) { setEditItem(e); setName(e.name); setType(e.type || '') }
    else { setEditItem(null); setName(''); setType('') }
    setShowForm(true)
  }

  const save = async () => {
    if (!name.trim()) return; setSaving(true)
    try {
      if (editItem) await updateEquipment(editItem.id, { name, type })
      else await createEquipment({ name, type })
      showToast(editItem ? 'Updated ✓' : 'Created ✓'); setShowForm(false); await onRefresh()
    } catch { showToast('Failed to save') }
    setSaving(false)
  }

  const handleDelete = async () => {
    try { await deleteEquipment(deleteItem.id); showToast('Deleted ✓'); setDeleteItem(null); await onRefresh() }
    catch { showToast('Failed to delete') }
  }
  const handleFormDelete = () => { setShowForm(false); setDeleteItem(editItem) }
  const types = [...new Set(equipment.map(e => e.type).filter(Boolean))]

  return (
    <div>
      <SectionHeader title="Equipment" count={equipment.length} onAdd={() => openForm(null)} addLabel="Add Equipment" />
      {types.map(t => (
        <div key={t}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginTop: 16 }}>{t}</div>
          {equipment.filter(e => e.type === t).map(e => (
            <div key={e.id} tabIndex={0} role="button" onClick={() => openForm(e)} onKeyDown={ev => ev.key === 'Enter' && openForm(e)}
              style={{ ...cardStyle({ cursor: 'pointer' }), transition: 'border-color 0.15s' }}
              onMouseEnter={ev => ev.currentTarget.style.borderColor = C.accent} onMouseLeave={ev => ev.currentTarget.style.borderColor = C.cardBorder}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{e.name}</div>
                <div style={{ fontSize: 13, color: C.textLight, fontWeight: 600 }}>Edit →</div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {showForm && (
        <FormModal title={editItem ? 'Edit Equipment' : 'New Equipment'} onSave={save} onCancel={() => setShowForm(false)} onDelete={editItem ? handleFormDelete : undefined} saving={saving}>
          <Field label="Equipment Name" value={name} onChange={setName} placeholder="e.g. 50 Gal Skid Sprayer" required />
          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Type</div>
            <select value={type} onChange={e => setType(e.target.value)} style={inputStyle()}>
              <option value="">Select type…</option>
              <option value="Backpack">Backpack</option><option value="Truck Mount">Truck Mount</option>
              <option value="Ride-On">Ride-On</option><option value="Hand">Hand</option><option value="Other">Other</option>
            </select>
          </div>
        </FormModal>
      )}
      {deleteItem && <ConfirmDelete name={deleteItem.name} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />}
    </div>
  )
}

// ═══════════════════════════════════════════
// CHEMICALS
// ═══════════════════════════════════════════
function ChemicalsSection({ chemicals, onRefresh, showToast }) {
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [q, setQ] = useState('')
  const [f, setF] = useState({ name: '', type: '', epa: '', ai: '', signal: 'CAUTION', restricted: false, sdsUrl: '', labelUrl: '' })
  const [wx, setWx] = useState({ temp: { on: false, op: '>', value: 90, warn: '' }, humidity: { on: false, op: '<', value: 30, warn: '' }, wind: { on: false, op: '>', value: 10, warn: '' }, conditions: { on: false, op: '==', value: 'Overcast', warn: '' } })

  const openForm = (c) => {
    if (c) {
      setEditItem(c)
      setF({ name: c.name, type: c.type || '', epa: c.epa || '', ai: c.ai || '', signal: c.signal || 'CAUTION', restricted: c.restricted, sdsUrl: c.sdsUrl || '', labelUrl: c.labelUrl || '' })
      const r = c.wxRestrictions || {}
      setWx({
        temp: r.temp ? { on: true, ...r.temp } : { on: false, op: '>', value: 90, warn: '' },
        humidity: r.humidity ? { on: true, ...r.humidity } : { on: false, op: '<', value: 30, warn: '' },
        wind: r.windSpeed ? { on: true, ...r.windSpeed } : { on: false, op: '>', value: 10, warn: '' },
        conditions: r.conditions ? { on: true, ...r.conditions } : { on: false, op: '==', value: 'Overcast', warn: '' },
      })
    } else {
      setEditItem(null)
      setF({ name: '', type: '', epa: '', ai: '', signal: 'CAUTION', restricted: false, sdsUrl: '', labelUrl: '' })
      setWx({ temp: { on: false, op: '>', value: 90, warn: '' }, humidity: { on: false, op: '<', value: 30, warn: '' }, wind: { on: false, op: '>', value: 10, warn: '' }, conditions: { on: false, op: '==', value: 'Overcast', warn: '' } })
    }
    setShowForm(true)
  }

  const save = async () => {
    if (!f.name.trim()) return; setSaving(true)
    const data = { ...f,
      wxTemp: wx.temp.on ? { op: wx.temp.op, value: Number(wx.temp.value), warn: wx.temp.warn } : null,
      wxHumidity: wx.humidity.on ? { op: wx.humidity.op, value: Number(wx.humidity.value), warn: wx.humidity.warn } : null,
      wxWind: wx.wind.on ? { op: wx.wind.op, value: Number(wx.wind.value), warn: wx.wind.warn } : null,
      wxConditions: wx.conditions.on ? { op: wx.conditions.op, value: wx.conditions.value, warn: wx.conditions.warn } : null,
    }
    try {
      if (editItem) await updateChemical(editItem.id, data)
      else await createChemical(data)
      showToast(editItem ? 'Updated ✓' : 'Created ✓'); setShowForm(false); await onRefresh()
    } catch { showToast('Failed to save') }
    setSaving(false)
  }

  const handleDelete = async () => {
    try { await deleteChemical(deleteItem.id); showToast('Deleted ✓'); setDeleteItem(null); await onRefresh() }
    catch { showToast('Failed to delete') }
  }
  const handleFormDelete = () => { setShowForm(false); setDeleteItem(editItem) }
  const filtered = chemicals.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.ai.toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <SectionHeader title="Chemicals" count={chemicals.length} onAdd={() => openForm(null)} addLabel="Add Chemical" />
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search chemicals…" style={inputStyle({ marginBottom: 14 })} />

      {filtered.map(c => {
        const sig = SIG_COLORS[c.signal] || SIG_COLORS.CAUTION
        return (
          <div key={c.id} tabIndex={0} role="button" onClick={() => openForm(c)} onKeyDown={e => e.key === 'Enter' && openForm(c)}
            style={{ ...cardStyle({ cursor: 'pointer', background: sig.bg, borderColor: sig.border }), transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.accent} onMouseLeave={e => e.currentTarget.style.borderColor = sig.border}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: C.textMed }}>{c.type} · EPA: {c.epa}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${sig.badge}18`, color: sig.badge, fontWeight: 800 }}>{c.signal}</span>
                  {c.restricted && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${C.red}15`, color: C.red, fontWeight: 800 }}>RESTRICTED</span>}
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.textLight, fontWeight: 600 }}>Edit →</div>
            </div>
          </div>
        )
      })}

      {showForm && (
        <FormModal title={editItem ? 'Edit Chemical' : 'New Chemical'} onSave={save} onCancel={() => setShowForm(false)} onDelete={editItem ? handleFormDelete : undefined} saving={saving}>
          <Field label="Product Name" value={f.name} onChange={v => setF({...f, name: v})} placeholder="e.g. Barricade 4FL" required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Type" value={f.type} onChange={v => setF({...f, type: v})} placeholder="e.g. Pre-Emergent" />
            <Field label="EPA Reg #" value={f.epa} onChange={v => setF({...f, epa: v})} placeholder="e.g. 100-1139" />
          </div>
          <Field label="Active Ingredient" value={f.ai} onChange={v => setF({...f, ai: v})} placeholder="e.g. Prodiamine 40.7%" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>Signal Word</div>
              <select value={f.signal} onChange={e => setF({...f, signal: e.target.value})} style={inputStyle()}>
                <option value="CAUTION">CAUTION</option><option value="WARNING">WARNING</option><option value="DANGER">DANGER</option>
              </select>
            </div>
            <Field label="Restricted Use" value={f.restricted} onChange={v => setF({...f, restricted: v})} type="checkbox" placeholder="Restricted Use Pesticide" />
          </div>
          <Field label="SDS URL" value={f.sdsUrl} onChange={v => setF({...f, sdsUrl: v})} placeholder="https://..." />
          <Field label="Label URL" value={f.labelUrl} onChange={v => setF({...f, labelUrl: v})} placeholder="https://..." />

          <div style={{ fontSize: 14, fontWeight: 800, marginTop: 10, marginBottom: 10 }}>Weather Restrictions</div>
          {[
            { key: 'temp', label: 'Temperature', icon: '🌡', ops: ['>', '<'], unit: '°F' },
            { key: 'humidity', label: 'Humidity', icon: '💧', ops: ['>', '<'], unit: '%' },
            { key: 'wind', label: 'Wind Speed', icon: '💨', ops: ['>'], unit: 'mph' },
            { key: 'conditions', label: 'Sky Conditions', icon: '☁️', ops: ['=='], unit: '' },
          ].map(cat => (
            <div key={cat.key} style={{ background: wx[cat.key].on ? C.amberLight : '#FAFAF7', border: `1.5px solid ${wx[cat.key].on ? C.amberBorder : C.cardBorder}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: wx[cat.key].on ? 10 : 0 }}>
                <input type="checkbox" checked={wx[cat.key].on} onChange={e => setWx({...wx, [cat.key]: {...wx[cat.key], on: e.target.checked}})} style={{ width: 18, height: 18 }} />
                <span style={{ fontSize: 15, fontWeight: 700 }}>{cat.icon} {cat.label}</span>
              </label>
              {wx[cat.key].on && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {cat.key !== 'conditions' ? (
                    <>
                      <select value={wx[cat.key].op} onChange={e => setWx({...wx, [cat.key]: {...wx[cat.key], op: e.target.value}})} style={inputStyle({ width: 60 })}>
                        {cat.ops.map(o => <option key={o} value={o}>{o}</option>)}</select>
                      <input type="number" value={wx[cat.key].value} onChange={e => setWx({...wx, [cat.key]: {...wx[cat.key], value: e.target.value}})} style={inputStyle({ width: 80 })} />
                      <span style={{ alignSelf: 'center', fontSize: 14, color: C.textLight, fontWeight: 700 }}>{cat.unit}</span>
                    </>
                  ) : (
                    <select value={wx[cat.key].value} onChange={e => setWx({...wx, [cat.key]: {...wx[cat.key], value: e.target.value}})} style={inputStyle({ flex: 1 })}>
                      {['Clear','Partly Cloudy','Overcast','Hazy','Foggy','Rainy'].map(c => <option key={c}>{c}</option>)}</select>
                  )}
                  <input value={wx[cat.key].warn} onChange={e => setWx({...wx, [cat.key]: {...wx[cat.key], warn: e.target.value}})} placeholder="Warning message" spellCheck={true}
                    style={inputStyle({ flex: '1 1 100%' })} />
                </div>
              )}
            </div>
          ))}
        </FormModal>
      )}
      {deleteItem && <ConfirmDelete name={deleteItem.name} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />}
    </div>
  )
}

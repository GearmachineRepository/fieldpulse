import { useState } from 'react'
import { APP, C, MONO, SIG_COLORS, cardStyle, labelStyle, inputStyle, btnStyle } from '../config.js'
import { createVehicle, updateVehicle, deleteVehicle, createCrew, updateCrew, deleteCrew,
  createEquipment, updateEquipment, deleteEquipment, createChemical, updateChemical, deleteChemical,
  getAllSprayLogs, getPurReport } from '../lib/api.js'
import { openPdf } from '../components/PdfExport.js'

export default function AdminDashboard({ page, chemicals, equipment, crews, logs, onRefresh, showToast }) {
  if (page === 'admin-logs') return <LogsSection logs={logs} onRefresh={onRefresh} />
  if (page === 'admin-vehicles') return <VehiclesCrewsSection crews={crews} onRefresh={onRefresh} showToast={showToast} />
  if (page === 'admin-chemicals') return <ChemicalsSection chemicals={chemicals} onRefresh={onRefresh} showToast={showToast} />
  if (page === 'admin-equipment') return <EquipmentSection equipment={equipment} onRefresh={onRefresh} showToast={showToast} />
  if (page === 'admin-pur') return <PurSection />
  return null
}

// ═══════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════

function SectionHeader({ title, count, onAdd, addLabel }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 900, color: C.text }}>{title}</div>
        {count !== undefined && <div style={{ fontSize: 13, color: C.textLight }}>{count} total</div>}
      </div>
      {onAdd && (
        <button onClick={onAdd} style={{ ...btnStyle(C.accent, '#fff', { width: 'auto', padding: '10px 20px', fontSize: 14 }) }}>
          + {addLabel || 'Add New'}
        </button>
      )}
    </div>
  )
}

function FormModal({ title, children, onSave, onCancel, saving }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: C.card, borderRadius: 20, padding: 24, width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.text, marginBottom: 20 }}>{title}</div>
        {children}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onCancel} style={{ ...btnStyle('#eee', C.text, { flex: 1, boxShadow: 'none' }) }}>Cancel</button>
          <button onClick={onSave} disabled={saving} style={{ ...btnStyle(C.accent, '#fff', { flex: 1, opacity: saving ? 0.6 : 1 }) }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDelete({ name, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: C.card, borderRadius: 20, padding: 24, width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>Delete "{name}"?</div>
        <div style={{ fontSize: 14, color: C.textMed, marginBottom: 20 }}>This will deactivate the item. Existing spray logs referencing it will be preserved.</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ ...btnStyle('#eee', C.text, { flex: 1, boxShadow: 'none' }) }}>Cancel</button>
          <button onClick={onConfirm} style={{ ...btnStyle(C.red, '#fff', { flex: 1 }) }}>Delete</button>
        </div>
      </div>
    </div>
  )
}

const Field = ({ label, value, onChange, placeholder, type, required }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={labelStyle}>{label}{required && <span style={{ color: C.red }}> *</span>}</div>
    {type === 'select' ? (
      <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle()}>{placeholder}</select>
    ) : type === 'checkbox' ? (
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} style={{ width: 20, height: 20 }} />
        <span style={{ fontSize: 15, color: C.text }}>{placeholder}</span>
      </label>
    ) : (
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle()} />
    )}
  </div>
)

// ═══════════════════════════════════════════
// ALL SPRAY LOGS
// ═══════════════════════════════════════════

function LogsSection({ logs, onRefresh }) {
  const [expanded, setExpanded] = useState(null)
  const [filterCrew, setFilterCrew] = useState('')

  const filtered = filterCrew ? logs.filter(l => l.crewName === filterCrew) : logs
  const crewNames = [...new Set(logs.map(l => l.crewName).filter(Boolean))]

  return (
    <div>
      <SectionHeader title="All Spray Logs" count={filtered.length} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div onClick={() => setFilterCrew('')}
          style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: !filterCrew ? C.accent : '#eee', color: !filterCrew ? '#fff' : C.textMed }}>
          All Crews
        </div>
        {crewNames.map(c => (
          <div key={c} onClick={() => setFilterCrew(c)}
            style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              background: filterCrew === c ? C.accent : '#eee', color: filterCrew === c ? '#fff' : C.textMed }}>
            {c}
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>No logs found</div>
        </div>
      ) : filtered.map(log => (
        <div key={log.id} style={{ marginBottom: 10 }}>
          <div onClick={() => setExpanded(expanded === log.id ? null : log.id)}
            style={{ ...cardStyle({ marginBottom: 0, cursor: 'pointer' }), borderRadius: expanded === log.id ? '16px 16px 0 0' : 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: C.text }}>{log.property}</div>
                <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>
                  {log.crewName} · {log.crewLead} · {log.products.length} product{log.products.length !== 1 ? 's' : ''} · {log.totalMixVol}
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
            </div>
          </div>
          {expanded === log.id && (
            <div style={{ background: '#FAFAF7', border: `1.5px solid ${C.cardBorder}`, borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '16px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                {[
                  { l: 'Crew', v: log.crewName }, { l: 'Crew Lead', v: log.crewLead },
                  { l: 'License', v: log.license }, { l: 'Equipment', v: log.equipment },
                  { l: 'Mix Volume', v: log.totalMixVol }, { l: 'Location', v: log.location },
                  { l: 'Target Pest', v: log.targetPest },
                ].map(f => (
                  <div key={f.l}>
                    <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>{f.l}</div>
                    <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{f.v || '—'}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Products</div>
              {log.products.map((p, i) => (
                <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: C.card, border: `1px solid ${C.cardBorder}`, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <div><div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: 12, color: C.textLight }}>EPA: {p.epa}</div></div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: C.accent, fontFamily: MONO }}>{p.ozConcentrate}</div>
                </div>
              ))}
              {log.photos && log.photos.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 14, marginBottom: 6 }}>Photos ({log.photos.length})</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {log.photos.map(ph => (
                      <a key={ph.id} href={`/uploads/${ph.filename}`} target="_blank" rel="noopener noreferrer"
                        style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.cardBorder}` }}>
                        <img src={`/uploads/${ph.filename}`} alt={ph.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </a>
                    ))}
                  </div>
                </>
              )}
              {log.notes && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Notes</div>
                  <div style={{ fontSize: 14, color: C.textMed }}>{log.notes}</div>
                </div>
              )}
              <button onClick={() => openPdf(log)} style={{ ...btnStyle(C.blue, '#fff', { fontSize: 14, marginTop: 14 }) }}>
                📄 Export PDF
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════
// VEHICLES & CREWS
// ═══════════════════════════════════════════

function VehiclesCrewsSection({ crews, onRefresh, showToast }) {
  const [vehicles, setVehicles] = useState([])
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [showCrewForm, setShowCrewForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [saving, setSaving] = useState(false)

  // Vehicle form
  const [vName, setVName] = useState('')
  const [vPin, setVPin] = useState('')
  const [vCrew, setVCrew] = useState('')

  // Crew form
  const [cName, setCName] = useState('')
  const [cLead, setCLead] = useState('')

  useState(() => {
    import('../lib/api.js').then(m => m.getVehicles()).then(setVehicles)
  })

  const openVehicleForm = (v) => {
    if (v) { setEditItem(v); setVName(v.name); setVPin(''); setVCrew(v.crew_name || '') }
    else { setEditItem(null); setVName(''); setVPin(''); setVCrew('') }
    setShowVehicleForm(true)
  }

  const saveVehicle = async () => {
    if (!vName.trim()) return
    setSaving(true)
    try {
      if (editItem) {
        await updateVehicle(editItem.id, { name: vName, pin: vPin || undefined, crewName: vCrew })
      } else {
        if (!vPin || vPin.length < 4) { showToast('PIN must be at least 4 digits'); setSaving(false); return }
        await createVehicle({ name: vName, pin: vPin, crewName: vCrew })
      }
      showToast(editItem ? 'Vehicle updated ✓' : 'Vehicle created ✓')
      setShowVehicleForm(false)
      await onRefresh()
      import('../lib/api.js').then(m => m.getVehicles()).then(setVehicles)
    } catch { showToast('Failed to save') }
    setSaving(false)
  }

  const openCrewForm = (c) => {
    if (c) { setEditItem(c); setCName(c.name); setCLead(c.lead_name || '') }
    else { setEditItem(null); setCName(''); setCLead('') }
    setShowCrewForm(true)
  }

  const saveCrew = async () => {
    if (!cName.trim()) return
    setSaving(true)
    try {
      if (editItem) await updateCrew(editItem.id, { name: cName, leadName: cLead })
      else await createCrew({ name: cName, leadName: cLead })
      showToast(editItem ? 'Crew updated ✓' : 'Crew created ✓')
      setShowCrewForm(false)
      await onRefresh()
    } catch { showToast('Failed to save') }
    setSaving(false)
  }

  const handleDelete = async () => {
    try {
      if (deleteItem.type === 'vehicle') await deleteVehicle(deleteItem.id)
      else await deleteCrew(deleteItem.id)
      showToast('Deleted ✓')
      setDeleteItem(null)
      await onRefresh()
      import('../lib/api.js').then(m => m.getVehicles()).then(setVehicles)
    } catch { showToast('Failed to delete') }
  }

  return (
    <div>
      {/* Crews */}
      <SectionHeader title="Crews" count={crews.length} onAdd={() => openCrewForm(null)} addLabel="Add Crew" />
      {crews.map(c => (
        <div key={c.id} style={cardStyle({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{c.name}</div>
            {c.lead_name && <div style={{ fontSize: 13, color: C.textLight }}>Lead: {c.lead_name}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div onClick={() => openCrewForm(c)} style={{ padding: '6px 14px', borderRadius: 8, background: C.blueLight, color: C.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Edit</div>
            <div onClick={() => setDeleteItem({ ...c, type: 'crew' })} style={{ padding: '6px 14px', borderRadius: 8, background: C.redLight, color: C.red, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Delete</div>
          </div>
        </div>
      ))}

      <div style={{ height: 24 }} />

      {/* Vehicles */}
      <SectionHeader title="Vehicles" count={vehicles.length} onAdd={() => openVehicleForm(null)} addLabel="Add Vehicle" />
      {vehicles.map(v => (
        <div key={v.id} style={cardStyle({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{v.name}</div>
            <div style={{ fontSize: 13, color: C.textLight }}>{v.crew_name || 'No crew assigned'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div onClick={() => openVehicleForm(v)} style={{ padding: '6px 14px', borderRadius: 8, background: C.blueLight, color: C.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Edit</div>
            <div onClick={() => setDeleteItem({ ...v, type: 'vehicle' })} style={{ padding: '6px 14px', borderRadius: 8, background: C.redLight, color: C.red, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Delete</div>
          </div>
        </div>
      ))}

      {/* Vehicle Form Modal */}
      {showVehicleForm && (
        <FormModal title={editItem ? 'Edit Vehicle' : 'New Vehicle'} onSave={saveVehicle} onCancel={() => setShowVehicleForm(false)} saving={saving}>
          <Field label="Vehicle Name" value={vName} onChange={setVName} placeholder="e.g. Truck 2" required />
          <Field label={editItem ? "New PIN (leave blank to keep current)" : "PIN (4-6 digits)"} value={vPin} onChange={v => setVPin(v.replace(/\D/g, ''))} placeholder="e.g. 1234" required={!editItem} />
          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Assign to Crew</div>
            <select value={vCrew} onChange={e => setVCrew(e.target.value)} style={inputStyle()}>
              <option value="">No crew</option>
              {crews.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </FormModal>
      )}

      {/* Crew Form Modal */}
      {showCrewForm && (
        <FormModal title={editItem ? 'Edit Crew' : 'New Crew'} onSave={saveCrew} onCancel={() => setShowCrewForm(false)} saving={saving}>
          <Field label="Crew Name" value={cName} onChange={setCName} placeholder="e.g. Crew C" required />
          <Field label="Default Lead Name" value={cLead} onChange={setCLead} placeholder="e.g. Carlos M." />
        </FormModal>
      )}

      {deleteItem && <ConfirmDelete name={deleteItem.name} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />}
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
    if (!name.trim()) return
    setSaving(true)
    try {
      if (editItem) await updateEquipment(editItem.id, { name, type })
      else await createEquipment({ name, type })
      showToast(editItem ? 'Updated ✓' : 'Created ✓')
      setShowForm(false); await onRefresh()
    } catch { showToast('Failed to save') }
    setSaving(false)
  }

  const handleDelete = async () => {
    try { await deleteEquipment(deleteItem.id); showToast('Deleted ✓'); setDeleteItem(null); await onRefresh() }
    catch { showToast('Failed to delete') }
  }

  const types = [...new Set(equipment.map(e => e.type).filter(Boolean))]

  return (
    <div>
      <SectionHeader title="Equipment" count={equipment.length} onAdd={() => openForm(null)} addLabel="Add Equipment" />
      {types.map(t => (
        <div key={t}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginTop: 16 }}>{t}</div>
          {equipment.filter(e => e.type === t).map(e => (
            <div key={e.id} style={cardStyle({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{e.name}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div onClick={() => openForm(e)} style={{ padding: '6px 14px', borderRadius: 8, background: C.blueLight, color: C.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Edit</div>
                <div onClick={() => setDeleteItem(e)} style={{ padding: '6px 14px', borderRadius: 8, background: C.redLight, color: C.red, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Delete</div>
              </div>
            </div>
          ))}
        </div>
      ))}
      {equipment.filter(e => !e.type).length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, marginTop: 16 }}>Other</div>
          {equipment.filter(e => !e.type).map(e => (
            <div key={e.id} style={cardStyle({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' })}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{e.name}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div onClick={() => openForm(e)} style={{ padding: '6px 14px', borderRadius: 8, background: C.blueLight, color: C.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Edit</div>
                <div onClick={() => setDeleteItem(e)} style={{ padding: '6px 14px', borderRadius: 8, background: C.redLight, color: C.red, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Delete</div>
              </div>
            </div>
          ))}
        </>
      )}

      {showForm && (
        <FormModal title={editItem ? 'Edit Equipment' : 'New Equipment'} onSave={save} onCancel={() => setShowForm(false)} saving={saving}>
          <Field label="Equipment Name" value={name} onChange={setName} placeholder="e.g. 50 Gal Skid Sprayer" required />
          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Type</div>
            <select value={type} onChange={e => setType(e.target.value)} style={inputStyle()}>
              <option value="">Select type…</option>
              <option value="Backpack">Backpack</option>
              <option value="Truck Mount">Truck Mount</option>
              <option value="Ride-On">Ride-On</option>
              <option value="Hand">Hand</option>
              <option value="Other">Other</option>
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

  // Form fields
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
    if (!f.name.trim()) return
    setSaving(true)
    const data = { ...f,
      wxTemp: wx.temp.on ? { op: wx.temp.op, value: Number(wx.temp.value), warn: wx.temp.warn } : null,
      wxHumidity: wx.humidity.on ? { op: wx.humidity.op, value: Number(wx.humidity.value), warn: wx.humidity.warn } : null,
      wxWind: wx.wind.on ? { op: wx.wind.op, value: Number(wx.wind.value), warn: wx.wind.warn } : null,
      wxConditions: wx.conditions.on ? { op: wx.conditions.op, value: wx.conditions.value, warn: wx.conditions.warn } : null,
    }
    try {
      if (editItem) await updateChemical(editItem.id, data)
      else await createChemical(data)
      showToast(editItem ? 'Updated ✓' : 'Created ✓')
      setShowForm(false); await onRefresh()
    } catch { showToast('Failed to save') }
    setSaving(false)
  }

  const handleDelete = async () => {
    try { await deleteChemical(deleteItem.id); showToast('Deleted ✓'); setDeleteItem(null); await onRefresh() }
    catch { showToast('Failed to delete') }
  }

  const filtered = chemicals.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.ai.toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <SectionHeader title="Chemicals" count={chemicals.length} onAdd={() => openForm(null)} addLabel="Add Chemical" />

      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search chemicals…" style={inputStyle({ marginBottom: 14 })} />

      {filtered.map(c => {
        const sig = SIG_COLORS[c.signal] || SIG_COLORS.CAUTION
        return (
          <div key={c.id} style={cardStyle({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: sig.bg, borderColor: sig.border })}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{c.name}</div>
              <div style={{ fontSize: 12, color: C.textMed }}>{c.type} · EPA: {c.epa}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${sig.badge}18`, color: sig.badge, fontWeight: 800 }}>{c.signal}</span>
                {c.restricted && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: `${C.red}15`, color: C.red, fontWeight: 800 }}>RESTRICTED</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <div onClick={() => openForm(c)} style={{ padding: '6px 14px', borderRadius: 8, background: C.blueLight, color: C.blue, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Edit</div>
              <div onClick={() => setDeleteItem(c)} style={{ padding: '6px 14px', borderRadius: 8, background: C.redLight, color: C.red, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Delete</div>
            </div>
          </div>
        )
      })}

      {showForm && (
        <FormModal title={editItem ? 'Edit Chemical' : 'New Chemical'} onSave={save} onCancel={() => setShowForm(false)} saving={saving}>
          <Field label="Product Name" value={f.name} onChange={v => setF({ ...f, name: v })} placeholder="e.g. Barricade 4FL" required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Type" value={f.type} onChange={v => setF({ ...f, type: v })} placeholder="e.g. Pre-Emergent" />
            <Field label="EPA Reg #" value={f.epa} onChange={v => setF({ ...f, epa: v })} placeholder="e.g. 100-1139" />
          </div>
          <Field label="Active Ingredient" value={f.ai} onChange={v => setF({ ...f, ai: v })} placeholder="e.g. Prodiamine 40.7%" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={labelStyle}>Signal Word</div>
              <select value={f.signal} onChange={e => setF({ ...f, signal: e.target.value })} style={inputStyle()}>
                <option value="CAUTION">CAUTION</option>
                <option value="WARNING">WARNING</option>
                <option value="DANGER">DANGER</option>
              </select>
            </div>
            <Field label="Restricted Use" value={f.restricted} onChange={v => setF({ ...f, restricted: v })} type="checkbox" placeholder="Restricted Use Pesticide" />
          </div>
          <Field label="SDS URL" value={f.sdsUrl} onChange={v => setF({ ...f, sdsUrl: v })} placeholder="https://..." />
          <Field label="Label URL" value={f.labelUrl} onChange={v => setF({ ...f, labelUrl: v })} placeholder="https://..." />

          {/* Weather Restrictions */}
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginTop: 10, marginBottom: 10 }}>Weather Restrictions</div>
          {[
            { key: 'temp', label: 'Temperature', icon: '🌡', ops: ['>', '<'], unit: '°F' },
            { key: 'humidity', label: 'Humidity', icon: '💧', ops: ['>', '<'], unit: '%' },
            { key: 'wind', label: 'Wind Speed', icon: '💨', ops: ['>'], unit: 'mph' },
            { key: 'conditions', label: 'Sky Conditions', icon: '☁️', ops: ['=='], unit: '' },
          ].map(cat => (
            <div key={cat.key} style={{ background: wx[cat.key].on ? C.amberLight : '#FAFAF7', border: `1.5px solid ${wx[cat.key].on ? C.amberBorder : C.cardBorder}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: wx[cat.key].on ? 10 : 0 }}>
                <input type="checkbox" checked={wx[cat.key].on} onChange={e => setWx({ ...wx, [cat.key]: { ...wx[cat.key], on: e.target.checked } })} style={{ width: 18, height: 18 }} />
                <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{cat.icon} {cat.label}</span>
              </label>
              {wx[cat.key].on && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {cat.key !== 'conditions' ? (
                    <>
                      <select value={wx[cat.key].op} onChange={e => setWx({ ...wx, [cat.key]: { ...wx[cat.key], op: e.target.value } })} style={inputStyle({ width: 60 })}>
                        {cat.ops.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                      <input type="number" value={wx[cat.key].value} onChange={e => setWx({ ...wx, [cat.key]: { ...wx[cat.key], value: e.target.value } })} style={inputStyle({ width: 80 })} />
                      <span style={{ alignSelf: 'center', fontSize: 14, color: C.textLight, fontWeight: 700 }}>{cat.unit}</span>
                    </>
                  ) : (
                    <select value={wx[cat.key].value} onChange={e => setWx({ ...wx, [cat.key]: { ...wx[cat.key], value: e.target.value } })} style={inputStyle({ flex: 1 })}>
                      {['Clear', 'Partly Cloudy', 'Overcast', 'Hazy', 'Foggy', 'Rainy'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                  <input value={wx[cat.key].warn} onChange={e => setWx({ ...wx, [cat.key]: { ...wx[cat.key], warn: e.target.value } })} placeholder="Warning message shown to crew"
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

// ═══════════════════════════════════════════
// PUR MONTHLY REPORT
// ═══════════════════════════════════════════

function PurSection() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const generate = async () => {
    setLoading(true)
    try {
      const r = await getPurReport(month, year)
      setReport(r)
    } catch { setReport(null) }
    setLoading(false)
  }

  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

  const exportPur = () => {
    if (!report) return
    const prodRows = report.products.map(p => `
      <tr>
        <td style="padding:8px 12px;border:1px solid #ddd;font-weight:600">${p.name}</td>
        <td style="padding:8px 12px;border:1px solid #ddd">${p.epa}</td>
        <td style="padding:8px 12px;border:1px solid #ddd;font-weight:700;color:#2D7A3A">${p.totalAmount.toFixed(2)} ${p.unit}</td>
        <td style="padding:8px 12px;border:1px solid #ddd;text-align:center">${p.appCount}</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>PUR Summary — ${monthNames[month]} ${year}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:32px;color:#1a1a18;font-size:13px}
      .header{border-bottom:3px solid #2D7A3A;padding-bottom:12px;margin-bottom:20px}
      .brand{font-size:11px;text-transform:uppercase;letter-spacing:3px;color:#2D7A3A;font-weight:800}
      h1{font-size:22px;margin:4px 0}h2{font-size:12px;color:#666}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      th{background:#f4f4f0;padding:8px 12px;border:1px solid #ddd;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#666}
      .note{background:#E8F5EA;border:1.5px solid #B8DEC0;border-radius:6px;padding:12px 16px;margin-top:20px;font-size:12px;color:#2D7A3A}
      .footer{margin-top:24px;border-top:2px solid #eee;padding-top:12px;font-size:9px;color:#999}
      @media print{body{padding:16px}}</style></head><body>
      <div class="header">
        <div class="brand">${APP.name} — Monthly Pesticide Use Report Summary</div>
        <h1>${monthNames[month]} ${year}</h1>
        <h2>Use Code 30 — Landscape Maintenance · Form DPR-PML-060</h2>
      </div>
      <div style="margin-bottom:16px;font-size:14px">
        <strong>Total Applications:</strong> ${report.totalApplications} ·
        <strong>Products Used:</strong> ${report.products.length}
      </div>
      <table><thead><tr><th>Product / Manufacturer</th><th>EPA Reg #</th><th>Total Concentrate Used</th><th># Applications</th></tr></thead>
      <tbody>${prodRows}</tbody></table>
      <div class="note">This summary aggregates all pesticide applications logged during ${monthNames[month]} ${year}.
      Submit completed DPR-PML-060 to your County Agricultural Commissioner by the 10th of ${monthNames[month % 12 + 1] || 'January'} ${month === 12 ? year + 1 : year}.</div>
      <div class="footer">Generated by ${APP.name} · ${new Date().toLocaleString()} · Retain records for minimum 2 years per CA DPR.</div>
      </body></html>`

    const w = window.open('', '_blank', 'width=800,height=900')
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400) }
  }

  return (
    <div>
      <SectionHeader title="Monthly PUR Summary" />
      <div style={{ ...cardStyle(), padding: 20 }}>
        <div style={{ fontSize: 14, color: C.textMed, marginBottom: 16, lineHeight: 1.6 }}>
          Generate your monthly Pesticide Use Report summary for DPR-PML-060. Aggregates total concentrate used per product across all crews.
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Month</div>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} style={inputStyle()}>
              {monthNames.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <div style={labelStyle}>Year</div>
            <select value={year} onChange={e => setYear(Number(e.target.value))} style={inputStyle()}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <button onClick={generate} disabled={loading} style={btnStyle(C.accent, '#fff', { opacity: loading ? 0.6 : 1 })}>
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {report && (
        <div style={{ marginTop: 16 }}>
          <div style={cardStyle({ background: C.accentLight, borderColor: C.accentBorder })}>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.accent }}>{monthNames[report.month]} {report.year}</div>
            <div style={{ fontSize: 14, color: C.textMed, marginTop: 4 }}>
              {report.totalApplications} total application{report.totalApplications !== 1 ? 's' : ''} · {report.products.length} product{report.products.length !== 1 ? 's' : ''}
            </div>
          </div>

          {report.products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: C.textLight }}>No applications logged for this month.</div>
          ) : (
            <>
              {report.products.map((p, i) => (
                <div key={i} style={cardStyle()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: C.textLight }}>EPA: {p.epa}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: C.accent, fontFamily: MONO }}>{p.totalAmount.toFixed(2)} {p.unit}</div>
                      <div style={{ fontSize: 12, color: C.textLight }}>{p.appCount} application{p.appCount !== 1 ? 's' : ''}</div>
                    </div>
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

              <button onClick={exportPur} style={btnStyle(C.blue, '#fff')}>
                📄 Export / Print PUR Summary
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

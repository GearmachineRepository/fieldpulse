// ═══════════════════════════════════════════
// Inventory Section — Chemicals + Equipment
// ═══════════════════════════════════════════

import { useState } from 'react'
import { C, MONO, SIG_COLORS, cardStyle, labelStyle, inputStyle, btnStyle } from '../../config.js'
import { createChemical, updateChemical, deleteChemical, createEquipment, updateEquipment, deleteEquipment } from '../../lib/api.js'
import { SectionHeader, SubTabs, FormModal, ConfirmDelete, Field } from '../../components/admin/SharedAdmin.jsx'

export default function InventorySection({ chemicals, equipment, onRefresh, showToast }) {
  const [subTab, setSubTab] = useState('chemicals')
  return (
    <div>
      <SubTabs tabs={[{ key: 'chemicals', label: '🧪 Chemicals' }, { key: 'equipment', label: '🔧 Equipment' }]} active={subTab} onChange={setSubTab} />
      {subTab === 'chemicals' && <ChemicalsView chemicals={chemicals} onRefresh={onRefresh} showToast={showToast} />}
      {subTab === 'equipment' && <EquipmentView equipment={equipment} onRefresh={onRefresh} showToast={showToast} />}
    </div>
  )
}

// ═══════════════════════════════════════════
// CHEMICALS VIEW
// ═══════════════════════════════════════════
function ChemicalsView({ chemicals, onRefresh, showToast }) {
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  // Form fields
  const [cName, setCName] = useState('')
  const [cType, setCType] = useState('')
  const [epa, setEpa] = useState('')
  const [ai, setAi] = useState('')
  const [signal, setSignal] = useState('CAUTION')
  const [restricted, setRestricted] = useState(false)
  const [sdsUrl, setSdsUrl] = useState('')
  const [labelUrl, setLabelUrl] = useState('')
  const [wxTemp, setWxTemp] = useState({ on: false, op: '>', value: '', warn: '' })
  const [wxHumidity, setWxHumidity] = useState({ on: false, op: '<', value: '', warn: '' })
  const [wxWind, setWxWind] = useState({ on: false, op: '>', value: '', warn: '' })
  const [wxConditions, setWxConditions] = useState({ on: false, op: '==', value: '', warn: '' })

  const openForm = (chem) => {
    if (chem) {
      setEditItem(chem); setCName(chem.name); setCType(chem.type); setEpa(chem.epa)
      setAi(chem.ai); setSignal(chem.signal || 'CAUTION'); setRestricted(chem.restricted || false)
      setSdsUrl(chem.sdsUrl || ''); setLabelUrl(chem.labelUrl || '')
      const r = chem.wxRestrictions || {}
      setWxTemp(r.temp ? { on: true, ...r.temp } : { on: false, op: '>', value: '', warn: '' })
      setWxHumidity(r.humidity ? { on: true, ...r.humidity } : { on: false, op: '<', value: '', warn: '' })
      setWxWind(r.windSpeed ? { on: true, ...r.windSpeed } : { on: false, op: '>', value: '', warn: '' })
      setWxConditions(r.conditions ? { on: true, ...r.conditions } : { on: false, op: '==', value: '', warn: '' })
    } else {
      setEditItem(null); setCName(''); setCType(''); setEpa(''); setAi(''); setSignal('CAUTION')
      setRestricted(false); setSdsUrl(''); setLabelUrl('')
      setWxTemp({ on: false, op: '>', value: '', warn: '' })
      setWxHumidity({ on: false, op: '<', value: '', warn: '' })
      setWxWind({ on: false, op: '>', value: '', warn: '' })
      setWxConditions({ on: false, op: '==', value: '', warn: '' })
    }
    setShowForm(true)
  }

  const save = async () => {
    if (!cName.trim()) return; setSaving(true)
    try {
      const wxRestrictions = {}
      if (wxTemp.on && wxTemp.value) wxRestrictions.temp = { op: wxTemp.op, value: Number(wxTemp.value), warn: wxTemp.warn }
      if (wxHumidity.on && wxHumidity.value) wxRestrictions.humidity = { op: wxHumidity.op, value: Number(wxHumidity.value), warn: wxHumidity.warn }
      if (wxWind.on && wxWind.value) wxRestrictions.windSpeed = { op: wxWind.op, value: Number(wxWind.value), warn: wxWind.warn }
      if (wxConditions.on && wxConditions.value) wxRestrictions.conditions = { op: wxConditions.op, value: wxConditions.value, warn: wxConditions.warn }
      const data = { name: cName, type: cType, epa, activeIngredient: ai, signalWord: signal, restrictedUse: restricted, sdsUrl, labelUrl, wxRestrictions }
      if (editItem) await updateChemical(editItem.id, data)
      else await createChemical(data)
      showToast(editItem ? 'Chemical updated ✓' : 'Chemical added ✓')
      setShowForm(false); await onRefresh()
    } catch { showToast('Failed to save') }
    setSaving(false)
  }

  const handleDelete = async () => {
    try { await deleteChemical(deleteItem.id); showToast('Deleted ✓'); setDeleteItem(null); await onRefresh() }
    catch { showToast('Failed to delete') }
  }
  const handleFormDelete = () => { setShowForm(false); setDeleteItem(editItem) }

  const filtered = chemicals.filter(c =>
    c.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    c.ai.toLowerCase().includes(searchQ.toLowerCase()) ||
    c.type.toLowerCase().includes(searchQ.toLowerCase()))

  const WxRow = ({ label, icon, state, setState, ops }) => (
    <div style={{ padding: '10px 14px', borderRadius: 10, background: state.on ? C.amberLight : '#FAFAF7', border: `1px solid ${state.on ? C.amberBorder : C.cardBorder}`, marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: state.on ? 10 : 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{icon} {label}</div>
        <div tabIndex={0} role="button" onClick={() => setState({ ...state, on: !state.on })}
          style={{ width: 44, height: 24, borderRadius: 12, background: state.on ? C.accent : '#ccc', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
          <div style={{ width: 20, height: 20, borderRadius: 10, background: '#fff', position: 'absolute', top: 2, left: state.on ? 22 : 2, transition: 'left 0.2s' }} />
        </div>
      </div>
      {state.on && (
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 8, marginBottom: 8 }}>
          <select value={state.op} onChange={e => setState({ ...state, op: e.target.value })} style={inputStyle({ padding: '8px', fontSize: 14 })}>
            {ops.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <input value={state.value} onChange={e => setState({ ...state, value: e.target.value })} placeholder="Value" style={inputStyle({ padding: '8px 12px', fontSize: 14 })} />
          <div style={{ gridColumn: '1 / -1' }}>
            <input value={state.warn} onChange={e => setState({ ...state, warn: e.target.value })} placeholder="Warning message" style={inputStyle({ padding: '8px 12px', fontSize: 13 })} />
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div>
      <SectionHeader title="Chemicals" count={chemicals.length} onAdd={() => openForm(null)} addLabel="Add Chemical" />
      <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search chemicals..." style={inputStyle({ marginBottom: 14 })} />

      {filtered.map(chem => {
        const sig = SIG_COLORS[chem.signal] || SIG_COLORS.CAUTION
        return (
          <div key={chem.id} tabIndex={0} role="button" onClick={() => openForm(chem)} onKeyDown={e => e.key === 'Enter' && openForm(chem)}
            style={{ ...cardStyle({ cursor: 'pointer' }), borderColor: sig.border, background: sig.bg, transition: 'border-color 0.15s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{chem.name}</div>
                <div style={{ fontSize: 13, color: C.textMed, marginTop: 2 }}>{chem.type} · {chem.ai}</div>
                <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>EPA: {chem.epa}</div>
              </div>
              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 800, background: sig.badge, color: '#fff' }}>
                {chem.signal}
              </span>
            </div>
          </div>
        )
      })}

      {showForm && (
        <FormModal title={editItem ? 'Edit Chemical' : 'New Chemical'} onSave={save} onCancel={() => setShowForm(false)} onDelete={editItem ? handleFormDelete : undefined} saving={saving}>
          <Field label="Name" value={cName} onChange={setCName} placeholder="e.g. Roundup Pro Max" required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Type" value={cType} onChange={setCType} placeholder="Herbicide" />
            <Field label="EPA Reg #" value={epa} onChange={setEpa} placeholder="524-579" />
          </div>
          <Field label="Active Ingredient" value={ai} onChange={setAi} placeholder="Glyphosate 50.2%" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <div style={labelStyle}>Signal Word</div>
              <select value={signal} onChange={e => setSignal(e.target.value)} style={inputStyle()}>
                <option value="CAUTION">CAUTION</option>
                <option value="WARNING">WARNING</option>
                <option value="DANGER">DANGER</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
              <Field label="Restricted Use" value={restricted} onChange={setRestricted} type="checkbox" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="SDS URL" value={sdsUrl} onChange={setSdsUrl} placeholder="https://..." />
            <Field label="Label URL" value={labelUrl} onChange={setLabelUrl} placeholder="https://..." />
          </div>
          <div style={{ ...labelStyle, marginTop: 8, marginBottom: 8, fontSize: 13 }}>Weather Restrictions</div>
          <WxRow label="Temperature" icon="🌡" state={wxTemp} setState={setWxTemp} ops={['>', '<', '>=', '<=']} />
          <WxRow label="Humidity" icon="💧" state={wxHumidity} setState={setWxHumidity} ops={['<', '>', '<=', '>=']} />
          <WxRow label="Wind Speed" icon="💨" state={wxWind} setState={setWxWind} ops={['>', '>=', '<', '<=']} />
          <WxRow label="Conditions" icon="☁️" state={wxConditions} setState={setWxConditions} ops={['==', '!=']} />
        </FormModal>
      )}
      {deleteItem && <ConfirmDelete name={deleteItem.name} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />}
    </div>
  )
}

// ═══════════════════════════════════════════
// EQUIPMENT VIEW
// ═══════════════════════════════════════════
function EquipmentView({ equipment, onRefresh, showToast }) {
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [eName, setEName] = useState('')
  const [eType, setEType] = useState('Backpack')

  const TYPES = ['Backpack', 'Truck Mount', 'Ride-On', 'Hand', 'Other']

  const openForm = (eq) => {
    if (eq) { setEditItem(eq); setEName(eq.name); setEType(eq.type) }
    else { setEditItem(null); setEName(''); setEType('Backpack') }
    setShowForm(true)
  }

  const save = async () => {
    if (!eName.trim()) return; setSaving(true)
    try {
      if (editItem) await updateEquipment(editItem.id, { name: eName, type: eType })
      else await createEquipment({ name: eName, type: eType })
      showToast(editItem ? 'Equipment updated ✓' : 'Equipment added ✓')
      setShowForm(false); await onRefresh()
    } catch { showToast('Failed to save') }
    setSaving(false)
  }

  const handleDelete = async () => {
    try { await deleteEquipment(deleteItem.id); showToast('Deleted ✓'); setDeleteItem(null); await onRefresh() }
    catch { showToast('Failed to delete') }
  }
  const handleFormDelete = () => { setShowForm(false); setDeleteItem(editItem) }

  const grouped = TYPES.reduce((acc, t) => {
    const items = equipment.filter(eq => eq.type === t)
    if (items.length > 0) acc.push({ type: t, items })
    return acc
  }, [])

  return (
    <div>
      <SectionHeader title="Equipment" count={equipment.length} onAdd={() => openForm(null)} addLabel="Add Equipment" />

      {grouped.map(g => (
        <div key={g.type} style={{ marginBottom: 14 }}>
          <div style={{ ...labelStyle, marginBottom: 8 }}>{g.type} ({g.items.length})</div>
          {g.items.map(eq => (
            <div key={eq.id} tabIndex={0} role="button" onClick={() => openForm(eq)} onKeyDown={e => e.key === 'Enter' && openForm(eq)}
              style={{ ...cardStyle({ cursor: 'pointer' }), transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent} onMouseLeave={e => e.currentTarget.style.borderColor = C.cardBorder}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{eq.name}</div>
                <div style={{ fontSize: 13, color: C.textLight, fontWeight: 600 }}>Edit →</div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {showForm && (
        <FormModal title={editItem ? 'Edit Equipment' : 'New Equipment'} onSave={save} onCancel={() => setShowForm(false)} onDelete={editItem ? handleFormDelete : undefined} saving={saving}>
          <Field label="Name" value={eName} onChange={setEName} placeholder="e.g. Stihl SR200" required />
          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Type</div>
            <select value={eType} onChange={e => setEType(e.target.value)} style={inputStyle()}>
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </FormModal>
      )}
      {deleteItem && <ConfirmDelete name={deleteItem.name} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />}
    </div>
  )
}
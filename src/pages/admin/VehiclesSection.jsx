// ═══════════════════════════════════════════
// Vehicles Section
// ═══════════════════════════════════════════

import { useState, useEffect } from 'react'
import { C, cardStyle, labelStyle, inputStyle } from '../../config.js'
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../../lib/api.js'
import { SectionHeader, FormModal, ConfirmDelete, Field } from '../../components/admin/SharedAdmin.jsx'

export default function VehiclesSection({ crews, onRefresh, showToast }) {
  const [vehicles, setVehicles] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [vName, setVName] = useState('')
  const [vCrew, setVCrew] = useState('')
  const [vPlate, setVPlate] = useState('')
  const [vVin, setVVin] = useState('')
  const [vMakeModel, setVMakeModel] = useState('')
  const [vYear, setVYear] = useState('')
  const [vTruckNum, setVTruckNum] = useState('')

  useEffect(() => { getVehicles().then(setVehicles) }, [])

  const openForm = (v) => {
    if (v) {
      setEditItem(v); setVName(v.name); setVCrew(v.crew_name || '')
      setVPlate(v.license_plate || ''); setVVin(v.vin || ''); setVMakeModel(v.make_model || '')
      setVYear(v.year ? String(v.year) : ''); setVTruckNum(v.truck_number || '')
    } else {
      setEditItem(null); setVName(''); setVCrew(''); setVPlate(''); setVVin('')
      setVMakeModel(''); setVYear(''); setVTruckNum('')
    }
    setShowForm(true)
  }

  const save = async () => {
    if (!vName.trim()) return; setSaving(true)
    try {
      const data = { name: vName, crewName: vCrew, licensePlate: vPlate, vin: vVin, makeModel: vMakeModel, year: vYear, truckNumber: vTruckNum }
      if (editItem) { await updateVehicle(editItem.id, data) }
      else { await createVehicle(data) }
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
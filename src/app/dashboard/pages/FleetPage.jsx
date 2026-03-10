// ═══════════════════════════════════════════
// Fleet Page — Vehicle management
// ═══════════════════════════════════════════

import { useState } from "react"
import { Truck, Plus, Edit3 } from "lucide-react"
import { T } from "@/app/tokens.js"
import { useData } from "@/context/DataProvider.jsx"
import {
  Modal, ModalFooter, ConfirmModal, FormField, SelectField,
  PageHeader, AddButton, SearchBar, ClickableCard, IconButton,
  LoadingSpinner, EmptyMessage,
} from "@/app/dashboard/components/PageUI.jsx"

export default function FleetPage({ isMobile }) {
  const { vehicles, crews, toast } = useData()
  const [editing, setEditing] = useState(null)
  const [searchQ, setSearchQ] = useState("")

  const filtered = vehicles.data.filter(v => {
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return v.name.toLowerCase().includes(q) || (v.crew_name || "").toLowerCase().includes(q) ||
      (v.license_plate || "").toLowerCase().includes(q) || (v.make_model || "").toLowerCase().includes(q)
  })

  const handleSave = async (data) => {
    try {
      if (editing.id) { await vehicles.update(editing.id, data); toast.show("Updated ✓") }
      else { await vehicles.create(data); toast.show("Added ✓") }
      setEditing(null)
    } catch (err) { toast.show(err.message || "Failed to save") }
  }

  const handleDelete = async (id) => {
    try { await vehicles.remove(id); toast.show("Removed ✓"); setEditing(null) }
    catch { toast.show("Failed to remove") }
  }

  return (
    <div>
      <PageHeader title="Fleet" count={vehicles.data.length} countLabel={`vehicle${vehicles.data.length !== 1 ? "s" : ""}`}
        action={<AddButton label="Add Vehicle" icon={Plus} onClick={() => setEditing({})} />} />

      {vehicles.data.length > 3 && <SearchBar value={searchQ} onChange={setSearchQ} placeholder="Search vehicles..." />}

      {vehicles.loading && !vehicles.data.length ? <LoadingSpinner /> :
       filtered.length === 0 ? <EmptyMessage text={searchQ ? "No matches." : "No vehicles yet."} /> : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
          {filtered.map(v => (
            <ClickableCard key={v.id} onClick={() => setEditing(v)} style={{ padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${T.accent}10`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Truck size={20} color={T.accent} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>{v.name}</div>
                    {v.crew_name && <div style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>{v.crew_name}</div>}
                  </div>
                </div>
                <IconButton icon={Edit3} onClick={() => setEditing(v)} title="Edit" />
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: T.textLight }}>
                {v.make_model && <span>{v.make_model}{v.year ? ` · ${v.year}` : ""}</span>}
                {v.license_plate && <span>Plate: {v.license_plate}</span>}
                {v.truck_number && <span>#{v.truck_number}</span>}
                {!v.make_model && !v.license_plate && !v.truck_number && <span>No details added</span>}
              </div>
            </ClickableCard>
          ))}
        </div>
      )}

      {editing !== null && <VehicleModal vehicle={editing} crews={crews.data} onClose={() => setEditing(null)}
        onSave={handleSave} onDelete={editing.id ? () => handleDelete(editing.id) : undefined} />}
    </div>
  )
}

function VehicleModal({ vehicle, crews, onClose, onSave, onDelete }) {
  const isEdit = !!vehicle.id
  const [name, setName]           = useState(vehicle.name || "")
  const [crewName, setCrewName]   = useState(vehicle.crew_name || "")
  const [plate, setPlate]         = useState(vehicle.license_plate || "")
  const [vin, setVin]             = useState(vehicle.vin || "")
  const [makeModel, setMakeModel] = useState(vehicle.make_model || "")
  const [year, setYear]           = useState(vehicle.year ? String(vehicle.year) : "")
  const [truckNum, setTruckNum]   = useState(vehicle.truck_number || "")
  const [saving, setSaving]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return; setSaving(true)
    await onSave({ name: name.trim(), crewName: crewName || undefined, licensePlate: plate || undefined,
      vin: vin || undefined, makeModel: makeModel || undefined, year: year || undefined, truckNumber: truckNum || undefined })
    setSaving(false)
  }

  if (confirmDelete) {
    return <ConfirmModal title={`Remove "${vehicle.name}"?`} message="This will deactivate the vehicle."
      onConfirm={onDelete} onCancel={() => setConfirmDelete(false)} />
  }

  return (
    <Modal title={isEdit ? "Edit Vehicle" : "Add Vehicle"} onClose={onClose}>
      <FormField label="Vehicle Name *" value={name} onChange={setName} autoFocus placeholder="e.g. Truck 1" />
      <SelectField label="Assigned Crew" value={crewName} onChange={setCrewName} placeholder="Unassigned"
        options={crews.map(c => ({ value: c.name, label: c.name }))} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="Make / Model" value={makeModel} onChange={setMakeModel} placeholder="e.g. Ford F-150" />
        <FormField label="Year" value={year} onChange={setYear} placeholder="e.g. 2022" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="License Plate" value={plate} onChange={setPlate} />
        <FormField label="Truck #" value={truckNum} onChange={setTruckNum} />
      </div>
      <FormField label="VIN" value={vin} onChange={setVin} placeholder="Optional" />
      <ModalFooter onClose={onClose} onSave={handleSubmit} saving={saving} disabled={!name.trim()}
        onDelete={onDelete ? () => setConfirmDelete(true) : undefined} />
    </Modal>
  )
}

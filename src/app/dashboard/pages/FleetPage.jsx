// ═══════════════════════════════════════════
// Fleet Page — Phase 3B: Card Grid + SlidePanel
// Uses usePageData, skeleton cards, vehicle detail panel
// ═══════════════════════════════════════════

import { useState } from "react"
import {
  Truck, Plus, Search, ChevronRight, Edit3, Trash2,
  Hash, Calendar, CreditCard, Wrench,
} from "lucide-react"
import usePageData from "@/hooks/usePageData.js"
import useToast from "@/hooks/useToast.js"
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from "@/lib/api/vehicles.js"
import { getCrews } from "@/lib/api/crews.js"
import PageShell from "../components/PageShell.jsx"
import SlidePanel from "../components/SlidePanel.jsx"
import StatusBadge from "../components/StatusBadge.jsx"
import {
  Modal, ModalFooter, ConfirmModal, FormField, SelectField,
} from "../components/PageUI.jsx"
import s from "./FleetPage.module.css"

export default function FleetPage() {
  const toast = useToast()
  const vehicles = usePageData("vehicles", {
    fetchFn: getVehicles,
    createFn: createVehicle,
    updateFn: updateVehicle,
    deleteFn: deleteVehicle,
  })
  const crews = usePageData("crews", { fetchFn: getCrews })

  const [searchQ, setSearchQ] = useState("")
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(null)

  const selectedVehicle = vehicles.data.find(v => v.id === selectedId) || null

  const filtered = vehicles.data.filter(v => {
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return v.name.toLowerCase().includes(q)
      || (v.crew_name || "").toLowerCase().includes(q)
      || (v.license_plate || "").toLowerCase().includes(q)
      || (v.make_model || "").toLowerCase().includes(q)
  })

  const handleSave = async (data) => {
    try {
      if (editing.id) {
        await vehicles.update(editing.id, data)
        toast.show("Updated")
      } else {
        await vehicles.create(data)
        toast.show("Added")
      }
      setEditing(null)
    } catch (err) {
      toast.show(err.message || "Failed to save")
    }
  }

  const handleDelete = async (id) => {
    try {
      await vehicles.remove(id)
      toast.show("Removed")
      setEditing(null)
      if (selectedId === id) setSelectedId(null)
    } catch {
      toast.show("Failed to remove")
    }
  }

  return (
    <PageShell
      title="Fleet"
      count={vehicles.data.length}
      countLabel={`vehicle${vehicles.data.length !== 1 ? "s" : ""}`}
      loading={vehicles.loading && !vehicles.data.length}
      skeleton="cards"
      empty={vehicles.data.length === 0}
      emptyIcon={Truck}
      emptyTitle="No vehicles yet"
      emptyDescription="Add your fleet vehicles to track assignments and inspections."
      emptyCta={
        <button className={s.addBtn} onClick={() => setEditing({})}>
          <Plus size={14} /> Add First Vehicle
        </button>
      }
      actions={
        <button className={s.addBtn} onClick={() => setEditing({})}>
          <Plus size={15} /> Add Vehicle
        </button>
      }
    >
      {/* Search bar */}
      {vehicles.data.length > 3 && (
        <div className={s.searchWrap}>
          <Search size={15} className={s.searchIcon} />
          <input
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search vehicles..."
            className={s.searchInput}
          />
        </div>
      )}

      {/* Card grid */}
      <div className={s.grid}>
        {filtered.map(v => (
          <div
            key={v.id}
            className={`${s.card} ${selectedId === v.id ? s.cardSelected : ""}`}
            onClick={() => setSelectedId(v.id)}
          >
            <div className={s.cardTop}>
              <div className={s.cardIconWrap}>
                <Truck size={20} color="var(--amb)" />
              </div>
              <div className={s.cardInfo}>
                <div className={s.cardName}>{v.name}</div>
                {v.crew_name && (
                  <StatusBadge variant="amber">{v.crew_name}</StatusBadge>
                )}
              </div>
              <ChevronRight size={16} color="var(--t3)" className={s.cardChevron} />
            </div>
            <div className={s.cardMeta}>
              {v.make_model && <span>{v.make_model}{v.year ? ` · ${v.year}` : ""}</span>}
              {v.license_plate && <span>Plate: {v.license_plate}</span>}
              {v.truck_number && <span>#{v.truck_number}</span>}
              {!v.make_model && !v.license_plate && !v.truck_number && (
                <span className={s.noDetails}>No details added</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Vehicle Detail SlidePanel */}
      <SlidePanel
        open={!!selectedVehicle}
        onClose={() => setSelectedId(null)}
        title={selectedVehicle?.name || "Vehicle"}
      >
        {selectedVehicle && (
          <VehicleDetail
            vehicle={selectedVehicle}
            onEdit={() => setEditing(selectedVehicle)}
            onDelete={() => handleDelete(selectedVehicle.id)}
          />
        )}
      </SlidePanel>

      {/* Create / Edit modal */}
      {editing !== null && (
        <VehicleModal
          vehicle={editing}
          crews={crews.data}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={editing.id ? () => handleDelete(editing.id) : undefined}
        />
      )}

      {toast.message && (
        <div className={s.toast} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </PageShell>
  )
}


// ===================================================
// Vehicle Detail — shown in SlidePanel
// ===================================================
function VehicleDetail({ vehicle, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (confirmDelete) {
    return (
      <ConfirmModal
        title={`Remove "${vehicle.name}"?`}
        message="This will deactivate the vehicle."
        onConfirm={() => { onDelete(); setConfirmDelete(false) }}
        onCancel={() => setConfirmDelete(false)}
      />
    )
  }

  return (
    <div className={s.detailContent}>
      <div className={s.detailActions}>
        <button className={s.editBtn} onClick={onEdit}>
          <Edit3 size={14} /> Edit
        </button>
        <button className={s.deleteBtn} onClick={() => setConfirmDelete(true)}>
          <Trash2 size={14} />
        </button>
      </div>

      <div className={s.fieldList}>
        <DetailField icon={Truck} label="Make / Model" value={vehicle.make_model} />
        <DetailField icon={Calendar} label="Year" value={vehicle.year} mono />
        <DetailField icon={CreditCard} label="License Plate" value={vehicle.license_plate} mono />
        <DetailField icon={Hash} label="Truck #" value={vehicle.truck_number} mono />
        <DetailField icon={Wrench} label="VIN" value={vehicle.vin} mono />
        <DetailField icon={Hash} label="Assigned Crew" value={vehicle.crew_name} />
      </div>
    </div>
  )
}

function DetailField({ icon: Icon, label, value, mono }) {
  return (
    <div className={s.fieldRow}>
      <div className={s.fieldIcon}>
        <Icon size={16} color="var(--t3)" />
      </div>
      <div>
        <div className={s.fieldLabel}>{label}</div>
        <div className={`${s.fieldValue} ${mono ? s.mono : ""}`}>
          {value || "\u2014"}
        </div>
      </div>
    </div>
  )
}


// ===================================================
// Vehicle Modal — Create / Edit
// ===================================================
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
    if (!name.trim()) return
    setSaving(true)
    await onSave({
      name: name.trim(),
      crewName: crewName || undefined,
      licensePlate: plate || undefined,
      vin: vin || undefined,
      makeModel: makeModel || undefined,
      year: year || undefined,
      truckNumber: truckNum || undefined,
    })
    setSaving(false)
  }

  if (confirmDelete) {
    return (
      <ConfirmModal
        title={`Remove "${vehicle.name}"?`}
        message="This will deactivate the vehicle."
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    )
  }

  return (
    <Modal title={isEdit ? "Edit Vehicle" : "Add Vehicle"} onClose={onClose}>
      <FormField label="Vehicle Name *" value={name} onChange={setName} autoFocus placeholder="e.g. Truck 1" />
      <SelectField
        label="Assigned Crew"
        value={crewName}
        onChange={setCrewName}
        placeholder="Unassigned"
        options={crews.map(c => ({ value: c.name, label: c.name }))}
      />
      <div className={s.formRow}>
        <FormField label="Make / Model" value={makeModel} onChange={setMakeModel} placeholder="e.g. Ford F-150" />
        <FormField label="Year" value={year} onChange={setYear} placeholder="e.g. 2022" />
      </div>
      <div className={s.formRow}>
        <FormField label="License Plate" value={plate} onChange={setPlate} />
        <FormField label="Truck #" value={truckNum} onChange={setTruckNum} />
      </div>
      <FormField label="VIN" value={vin} onChange={setVin} placeholder="Optional" />
      <ModalFooter
        onClose={onClose}
        onSave={handleSubmit}
        saving={saving}
        disabled={!name.trim()}
        onDelete={onDelete ? () => setConfirmDelete(true) : undefined}
      />
    </Modal>
  )
}

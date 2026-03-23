// ═══════════════════════════════════════════
// Fleet Page — FilterBar + DataTable + SlidePanel
// Matches EquipmentPage pattern with vehicle-specific columns
// ═══════════════════════════════════════════

import { useState } from "react"
import {
  Truck, Plus, Search, Edit3, Trash2,
  Hash, Calendar, CreditCard, Wrench, Users, Settings,
} from "lucide-react"
import usePageData from "@/hooks/usePageData.js"
import useToast from "@/hooks/useToast.js"
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from "@/lib/api/vehicles.js"
import { getCrews } from "@/lib/api/crews.js"
import PageShell from "../components/PageShell.jsx"
import DataTable from "../components/DataTable.jsx"
import SlidePanel from "../components/SlidePanel.jsx"
import StatusBadge from "../components/StatusBadge.jsx"
import TabBar from "../components/TabBar.jsx"
import {
  Modal, ModalFooter, ConfirmModal, FormField, SelectField,
} from "../components/PageUI.jsx"
import s from "./FleetPage.module.css"

const ts = DataTable.s

const STATUSES = ["Active", "Out of Service", "Retired"]

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
  const [crewFilter, setCrewFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(null)

  const selectedVehicle = vehicles.data.find(v => v.id === selectedId) || null

  const filtered = vehicles.data.filter(v => {
    if (searchQ) {
      const q = searchQ.toLowerCase()
      if (
        !v.name.toLowerCase().includes(q) &&
        !(v.make_model || "").toLowerCase().includes(q) &&
        !(v.license_plate || "").toLowerCase().includes(q) &&
        !(v.truck_number || "").toLowerCase().includes(q)
      ) return false
    }
    if (crewFilter && (v.crew_name || "") !== crewFilter) return false
    if (statusFilter && (v.status || "Active") !== statusFilter) return false
    return true
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

  const getStatusVariant = (status) => {
    switch (status) {
      case "Active": return "green"
      case "Out of Service": return "amber"
      case "Retired": return "gray"
      default: return "green"
    }
  }

  // Build unique crew names for the filter dropdown
  const crewNames = [...new Set(vehicles.data.map(v => v.crew_name).filter(Boolean))].sort()

  return (
    <>
      <PageShell
        title="Fleet"
        count={vehicles.data.length}
        countLabel={`vehicle${vehicles.data.length !== 1 ? "s" : ""}`}
        loading={vehicles.loading && !vehicles.data.length}
        skeleton="table"
        empty={vehicles.data.length === 0}
        emptyIcon={Truck}
        emptyTitle="No vehicles yet"
        emptyDescription="Add your fleet vehicles to track assignments and inspections."
        emptyCta="Add First Vehicle"
        onEmptyCta={() => setEditing({})}
        actions={
          <button className={s.addBtn} onClick={() => setEditing({})}>
            <Plus size={15} /> Add Vehicle
          </button>
        }
      >
        {/* Filter Bar */}
        <div className={s.filterBar}>
          <div className={s.searchWrap}>
            <Search size={15} className={s.searchIcon} />
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search by name, plate, or make..."
              className={s.searchInput}
            />
          </div>
          <select
            value={crewFilter}
            onChange={e => setCrewFilter(e.target.value)}
            className={s.filterSelect}
          >
            <option value="">All Crews</option>
            {crewNames.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={s.filterSelect}
          >
            <option value="">All Statuses</option>
            {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>

        {/* Data Table */}
        <DataTable
          headers={[
            { label: "Vehicle" },
            { label: "Make / Model" },
            { label: "Year" },
            { label: "License Plate" },
            { label: "Assigned Crew" },
            { label: "Status" },
          ]}
        >
          {filtered.length === 0 ? (
            <tr><td colSpan={6} className={ts.empty}>No vehicles match your filters.</td></tr>
          ) : (
            filtered.map(v => (
              <tr
                key={v.id}
                className={ts.tr}
                onClick={() => setSelectedId(v.id)}
                style={{ cursor: "pointer" }}
              >
                <td className={ts.td}>
                  <div className={s.nameCell}>
                    <div className={s.nameIcon}>
                      <Truck size={16} color="var(--amb)" />
                    </div>
                    <div>
                      <span style={{ fontWeight: "var(--font-semibold)" }}>{v.name}</span>
                      {v.truck_number && (
                        <div className={s.truckNum}>#{v.truck_number}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className={ts.td}>
                  {v.make_model || <span className={ts.tdMuted}>—</span>}
                </td>
                <td className={`${ts.td} ${ts.tdMono}`}>
                  {v.year || "—"}
                </td>
                <td className={`${ts.td} ${ts.tdMono}`}>
                  {v.license_plate || "—"}
                </td>
                <td className={ts.td}>
                  {v.crew_name || <span className={ts.tdMuted}>Unassigned</span>}
                </td>
                <td className={ts.td}>
                  <StatusBadge variant={getStatusVariant(v.status || "Active")}>
                    {v.status || "Active"}
                  </StatusBadge>
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </PageShell>

      {/* Vehicle Detail SlidePanel — outside PageShell so it renders during empty state */}
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

      {/* Create / Edit Modal */}
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
    </>
  )
}


// ===================================================
// Vehicle Detail — shown in SlidePanel with tabs
// ===================================================
function VehicleDetail({ vehicle, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [tab, setTab] = useState("info")

  const tabs = [
    { key: "info", label: "Info" },
    { key: "inspections", label: "Inspections" },
    { key: "maintenance", label: "Maintenance" },
  ]

  if (confirmDelete) {
    return (
      <ConfirmModal
        title={`Remove "${vehicle.name}"?`}
        message="This will deactivate the vehicle. Logs are preserved."
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

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === "info" && (
        <div className={s.fieldList}>
          <DetailField icon={Truck} label="Make / Model" value={vehicle.make_model} />
          <DetailField icon={Calendar} label="Year" value={vehicle.year} mono />
          <DetailField icon={CreditCard} label="License Plate" value={vehicle.license_plate} mono />
          <DetailField icon={Hash} label="Truck #" value={vehicle.truck_number} mono />
          <DetailField icon={Wrench} label="VIN" value={vehicle.vin} mono />
          <DetailField icon={Users} label="Assigned Crew" value={vehicle.crew_name} />
          <DetailField icon={Settings} label="Status" value={vehicle.status || "Active"} />
        </div>
      )}

      {tab === "inspections" && (
        <div className={s.emptyTab}>
          <Settings size={28} strokeWidth={1} className={s.emptyTabIcon} />
          <div className={s.emptyTabTitle}>No inspections recorded</div>
          <div className={s.emptyTabDesc}>Vehicle inspection history will appear here.</div>
        </div>
      )}

      {tab === "maintenance" && (
        <div className={s.emptyTab}>
          <Wrench size={28} strokeWidth={1} className={s.emptyTabIcon} />
          <div className={s.emptyTabTitle}>No maintenance logs yet</div>
          <div className={s.emptyTabDesc}>Service records and work orders will appear here.</div>
        </div>
      )}
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
  const [status, setStatus]       = useState(vehicle.status || "Active")
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
      status: status || "Active",
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
      <div className={s.formRow}>
        <FormField label="Make / Model" value={makeModel} onChange={setMakeModel} placeholder="e.g. Ford F-150" />
        <FormField label="Year" value={year} onChange={setYear} placeholder="e.g. 2022" />
      </div>
      <div className={s.formRow}>
        <FormField label="License Plate" value={plate} onChange={setPlate} />
        <FormField label="Truck #" value={truckNum} onChange={setTruckNum} />
      </div>
      <FormField label="VIN" value={vin} onChange={setVin} placeholder="Optional" />
      <div className={s.formRow}>
        <SelectField
          label="Assigned Crew"
          value={crewName}
          onChange={setCrewName}
          placeholder="Unassigned"
          options={crews.map(c => ({ value: c.name, label: c.name }))}
        />
        <SelectField
          label="Status"
          value={status}
          onChange={setStatus}
          options={STATUSES.map(st => ({ value: st, label: st }))}
        />
      </div>
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

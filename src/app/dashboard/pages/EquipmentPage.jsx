// ═══════════════════════════════════════════
// Equipment Page — FilterBar + DataTable + SlidePanel
// Full CRUD with category filtering, maintenance log
// ═══════════════════════════════════════════

import { useState } from "react"
import {
  Wrench, Plus, Search, Edit3, Trash2,
  Hash, Calendar, Tag, Users, Settings, Settings2,
} from "lucide-react"
import usePageData from "@/hooks/usePageData.js"
import useToast from "@/hooks/useToast.js"
import useCategories from "@/hooks/useCategories.js"
import { getEquipment, createEquipment, updateEquipment, deleteEquipment } from "@/lib/api/equipment.js"
import { getCrews } from "@/lib/api/crews.js"
import PageShell from "../components/PageShell.jsx"
import DataTable from "../components/DataTable.jsx"
import SlidePanel from "../components/SlidePanel.jsx"
import StatusBadge from "../components/StatusBadge.jsx"
import TabBar from "../components/TabBar.jsx"
import CategoryManager from "../components/CategoryManager.jsx"
import {
  Modal, ModalFooter, ConfirmModal, FormField, SelectField,
} from "../components/PageUI.jsx"
import s from "./EquipmentPage.module.css"

const ts = DataTable.s

const FALLBACK_CATEGORIES = ["Mowers", "Trenchers", "Compactors", "Blowers", "Other"]
const STATUSES = ["Active", "Out of Service", "Retired"]

export default function EquipmentPage() {
  const toast = useToast()
  const equipment = usePageData("equipment", {
    fetchFn: getEquipment,
    createFn: createEquipment,
    updateFn: updateEquipment,
    deleteFn: deleteEquipment,
  })
  const crews = usePageData("crews", { fetchFn: getCrews })
  const categories = useCategories("equipment")

  const [searchQ, setSearchQ] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [manageOpen, setManageOpen] = useState(false)

  const categoryNames = categories.data.length > 0
    ? categories.data.map(c => c.name)
    : FALLBACK_CATEGORIES

  const selectedItem = equipment.data.find(e => e.id === selectedId) || null

  const filtered = equipment.data.filter(e => {
    if (searchQ) {
      const q = searchQ.toLowerCase()
      if (
        !e.name.toLowerCase().includes(q) &&
        !(e.serial_number || "").toLowerCase().includes(q)
      ) return false
    }
    if (categoryFilter && (e.category || "Other") !== categoryFilter) return false
    if (statusFilter && (e.status || "Active") !== statusFilter) return false
    return true
  })

  const handleSave = async (data) => {
    try {
      if (editing.id) {
        await equipment.update(editing.id, data)
        toast.show("Updated")
      } else {
        await equipment.create(data)
        toast.show("Added")
      }
      setEditing(null)
    } catch (err) {
      toast.show(err.message || "Failed to save")
    }
  }

  const handleDelete = async (id) => {
    try {
      await equipment.remove(id)
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

  return (
    <>
    <PageShell
      title="Equipment"
      count={equipment.data.length}
      countLabel={`item${equipment.data.length !== 1 ? "s" : ""}`}
      loading={equipment.loading && !equipment.data.length}
      skeleton="table"
      empty={equipment.data.length === 0}
      emptyIcon={Wrench}
      emptyTitle="No equipment added yet"
      emptyDescription="Add your first piece of equipment to start tracking maintenance."
      emptyCta="Add Equipment"
      onEmptyCta={() => setEditing({})}
      actions={
        <button className={s.addBtn} onClick={() => setEditing({})}>
          <Plus size={15} /> Add Equipment
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
            placeholder="Search by name or serial number..."
            className={s.searchInput}
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className={s.filterSelect}
        >
          <option value="">All Categories</option>
          {categoryNames.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className={s.filterSelect}
        >
          <option value="">All Statuses</option>
          {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
        </select>
        <button
          className={s.manageBtn}
          onClick={() => setManageOpen(true)}
          title="Manage categories"
        >
          <Settings2 size={16} />
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        headers={[
          { label: "Name" },
          { label: "Category" },
          { label: "Serial #" },
          { label: "Assigned Crew" },
          { label: "Last Service" },
          { label: "Status" },
        ]}
      >
        {filtered.length === 0 ? (
          <tr><td colSpan={6} className={ts.empty}>No equipment matches your filters.</td></tr>
        ) : (
          filtered.map(item => (
            <tr
              key={item.id}
              className={ts.tr}
              onClick={() => setSelectedId(item.id)}
              style={{ cursor: "pointer" }}
            >
              <td className={ts.td}>
                <div className={s.nameCell}>
                  <div className={s.nameIcon}>
                    <Wrench size={16} color="var(--amb)" />
                  </div>
                  <span style={{ fontWeight: "var(--font-semibold)" }}>{item.name}</span>
                </div>
              </td>
              <td className={ts.td}>
                <StatusBadge variant="gray">{item.category || "Other"}</StatusBadge>
              </td>
              <td className={`${ts.td} ${ts.tdMono}`}>
                {item.serial_number || "\u2014"}
              </td>
              <td className={ts.td}>
                {item.crew_name || <span className={ts.tdMuted}>Unassigned</span>}
              </td>
              <td className={`${ts.td} ${ts.tdMono}`}>
                {item.last_service ? new Date(item.last_service).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "\u2014"}
              </td>
              <td className={ts.td}>
                <StatusBadge variant={getStatusVariant(item.status || "Active")}>
                  {item.status || "Active"}
                </StatusBadge>
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </PageShell>

    {/* Detail SlidePanel — outside PageShell so it renders during empty state */}
    <SlidePanel
      open={!!selectedItem}
      onClose={() => setSelectedId(null)}
      title={selectedItem?.name || "Equipment"}
    >
      {selectedItem && (
        <EquipmentDetail
          item={selectedItem}
          onEdit={() => setEditing(selectedItem)}
          onDelete={() => handleDelete(selectedItem.id)}
        />
      )}
    </SlidePanel>

    {/* Create / Edit Modal */}
    {editing !== null && (
      <EquipmentModal
        item={editing}
        crews={crews.data}
        categoryNames={categoryNames}
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

    <CategoryManager
      open={manageOpen}
      onClose={() => setManageOpen(false)}
      categories={categories}
      scopeLabel="Equipment Categories"
    />
  </>
  )
}


// ===================================================
// Equipment Detail — shown in SlidePanel with tabs
// ===================================================
function EquipmentDetail({ item, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [tab, setTab] = useState("info")

  const tabs = [
    { key: "info", label: "Info" },
    { key: "maintenance", label: "Maintenance Log" },
    { key: "inspections", label: "Inspection History" },
  ]

  if (confirmDelete) {
    return (
      <ConfirmModal
        title={`Remove "${item.name}"?`}
        message="This will deactivate the equipment. Logs are preserved."
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
          <DetailField icon={Wrench} label="Name" value={item.name} />
          <DetailField icon={Tag} label="Category" value={item.category || "Other"} />
          <DetailField icon={Hash} label="Serial #" value={item.serial_number} mono />
          <DetailField icon={Users} label="Assigned Crew" value={item.crew_name} />
          <DetailField icon={Calendar} label="Last Service" value={item.last_service ? new Date(item.last_service).toLocaleDateString("en-US") : null} mono />
          <DetailField icon={Settings} label="Status" value={item.status || "Active"} />
        </div>
      )}

      {tab === "maintenance" && (
        <div className={s.emptyTab}>
          <Wrench size={28} strokeWidth={1} className={s.emptyTabIcon} />
          <div className={s.emptyTabTitle}>No maintenance logs yet</div>
          <div className={s.emptyTabDesc}>Service records will appear here as they are logged.</div>
        </div>
      )}

      {tab === "inspections" && (
        <div className={s.emptyTab}>
          <Settings size={28} strokeWidth={1} className={s.emptyTabIcon} />
          <div className={s.emptyTabTitle}>No inspections recorded</div>
          <div className={s.emptyTabDesc}>Inspection history will appear here.</div>
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
// Equipment Modal — Create / Edit
// ===================================================
function EquipmentModal({ item, crews, categoryNames, onClose, onSave, onDelete }) {
  const isEdit = !!item.id
  const [name, setName] = useState(item.name || "")
  const [category, setCategory] = useState(item.category || "")
  const [serialNumber, setSerialNumber] = useState(item.serial_number || "")
  const [crewName, setCrewName] = useState(item.crew_name || "")
  const [status, setStatus] = useState(item.status || "Active")
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave({
      name: name.trim(),
      type: category || undefined,
      category: category || undefined,
      serialNumber: serialNumber || undefined,
      crewName: crewName || undefined,
      status: status || "Active",
    })
    setSaving(false)
  }

  if (confirmDelete) {
    return (
      <ConfirmModal
        title={`Remove "${item.name}"?`}
        message="This will deactivate the equipment."
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    )
  }

  return (
    <Modal title={isEdit ? "Edit Equipment" : "Add Equipment"} onClose={onClose}>
      <FormField label="Equipment Name *" value={name} onChange={setName} autoFocus placeholder="e.g. John Deere Z540R" />
      <div className={s.formRow}>
        <SelectField
          label="Category"
          value={category}
          onChange={setCategory}
          placeholder="Select category"
          options={categoryNames.map(c => ({ value: c, label: c }))}
        />
        <SelectField
          label="Status"
          value={status}
          onChange={setStatus}
          options={STATUSES.map(st => ({ value: st, label: st }))}
        />
      </div>
      <FormField label="Serial Number" value={serialNumber} onChange={setSerialNumber} placeholder="Optional" />
      <SelectField
        label="Assigned Crew"
        value={crewName}
        onChange={setCrewName}
        placeholder="Unassigned"
        options={crews.map(c => ({ value: c.name, label: c.name }))}
      />
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

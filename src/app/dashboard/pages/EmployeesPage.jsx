// ═══════════════════════════════════════════
// Employees Page — Phase 3B: List-Detail Layout
// Uses DetailLayout, usePageData, skeleton loading
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import {
  UserPlus, Edit3, Shield, Eye, EyeOff, Search,
  ChevronRight, Trash2, Phone, Mail, Hash, Award,
} from "lucide-react"
import usePageData from "@/hooks/usePageData.js"
import useToast from "@/hooks/useToast.js"
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from "@/lib/api/employees.js"
import { getCrews } from "@/lib/api/crews.js"
import DetailLayout from "../components/DetailLayout.jsx"
import StatusBadge from "../components/StatusBadge.jsx"
import {
  Modal, ModalFooter, ConfirmModal, FormField, SelectField,
} from "../components/PageUI.jsx"
import s from "./EmployeesPage.module.css"

export default function EmployeesPage() {
  const toast = useToast()
  const employees = usePageData("employees", { fetchFn: getEmployees })
  const crews = usePageData("crews", { fetchFn: getCrews })

  const [selectedId, setSelectedId] = useState(null)
  const [searchQ, setSearchQ] = useState("")
  const [activeTab, setActiveTab] = useState("details")
  const [editing, setEditing] = useState(null)

  const selectedEmployee = employees.data.find(e => e.id === selectedId) || null

  useEffect(() => { setActiveTab("details") }, [selectedId])

  const filtered = employees.data.filter(e => {
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return `${e.first_name} ${e.last_name}`.toLowerCase().includes(q)
      || (e.phone || "").toLowerCase().includes(q)
  })

  const handleSave = async (data, photoFile) => {
    try {
      if (editing.id) {
        await updateEmployee(editing.id, data, photoFile)
        await employees.refresh()
        toast.show("Updated")
      } else {
        await createEmployee(data, photoFile)
        await employees.refresh()
        toast.show("Added")
      }
      setEditing(null)
    } catch (err) {
      toast.show(err.message || "Failed to save")
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteEmployee(id)
      await employees.refresh()
      toast.show("Removed")
      setEditing(null)
      if (selectedId === id) setSelectedId(null)
    } catch {
      toast.show("Failed to remove")
    }
  }

  const detailTabs = [
    { key: "details", label: "Details" },
    { key: "certifications", label: "Certifications" },
  ]

  // -- Sidebar --
  const sidebar = (
    <div className={s.sidebarInner}>
      <div className={s.searchWrap}>
        <Search size={15} className={s.searchIcon} />
        <input
          type="text"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="Search employees..."
          className={s.searchInput}
        />
      </div>

      <div className={s.listScroll}>
        {employees.loading && !employees.data.length ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={s.skeletonItem}>
              <div className={s.skeletonAvatar} />
              <div className={s.skeletonLines}>
                <div className={s.skeletonLine} />
                <div className={s.skeletonLineSm} />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className={s.listEmpty}>
            {searchQ ? "No matches." : "No employees yet."}
          </div>
        ) : (
          filtered.map(emp => {
            const crew = crews.data.find(c => c.id === emp.default_crew_id)
            const isActive = selectedId === emp.id
            return (
              <button
                key={emp.id}
                className={`${s.listItem} ${isActive ? s.listItemActive : ""}`}
                onClick={() => setSelectedId(emp.id)}
                type="button"
              >
                {isActive && <div className={s.activeBar} />}
                {emp.photo_filename ? (
                  <img src={`/uploads/${emp.photo_filename}`} alt="" className={s.listAvatar} />
                ) : (
                  <div
                    className={s.listAvatarFallback}
                    style={{ background: emp.is_crew_lead ? "var(--amb)" : "var(--blu)" }}
                  >
                    {emp.first_name[0]}{emp.last_name[0]}
                  </div>
                )}
                <div className={s.listItemContent}>
                  <div className={s.listItemName}>
                    {emp.first_name} {emp.last_name}
                    {emp.is_crew_lead && (
                      <span className={s.leadBadge}>LEAD</span>
                    )}
                  </div>
                  <div className={s.listItemSub}>
                    {crew ? crew.name : "Unassigned"}
                  </div>
                </div>
                <ChevronRight size={14} className={s.listChevron} />
              </button>
            )
          })
        )}
      </div>

      <div className={s.sidebarFooter}>
        <button className={s.addBtn} onClick={() => setEditing({})}>
          <UserPlus size={15} /> Add Employee
        </button>
      </div>
    </div>
  )

  return (
    <div className={s.page}>
      <DetailLayout
        sidebar={sidebar}
        tabs={detailTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasSelection={!!selectedEmployee}
        onBack={() => setSelectedId(null)}
        emptyMessage="Select an employee to view details."
      >
        {selectedEmployee && activeTab === "details" && (
          <DetailsTab
            employee={selectedEmployee}
            crews={crews.data}
            onEdit={() => setEditing(selectedEmployee)}
            onDelete={() => handleDelete(selectedEmployee.id)}
          />
        )}
        {selectedEmployee && activeTab === "certifications" && (
          <div className={s.certEmpty}>
            <Award size={28} className={s.certIcon} />
            <div className={s.certText}>Certification tracking coming soon.</div>
          </div>
        )}
      </DetailLayout>

      {editing !== null && (
        <EmployeeModal
          employee={editing}
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
    </div>
  )
}


// ===================================================
// Details Tab — Read-only view
// ===================================================
function DetailsTab({ employee, crews, onEdit, onDelete }) {
  const crew = crews.find(c => c.id === employee.default_crew_id)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (confirmDelete) {
    return (
      <ConfirmModal
        title={`Remove ${employee.first_name} ${employee.last_name}?`}
        message="This deactivates the employee. Existing logs preserved."
        onConfirm={() => { onDelete(); setConfirmDelete(false) }}
        onCancel={() => setConfirmDelete(false)}
      />
    )
  }

  return (
    <div className={s.detailRead}>
      <div className={s.detailHeader}>
        <div className={s.detailHeaderLeft}>
          {employee.photo_filename ? (
            <img src={`/uploads/${employee.photo_filename}`} alt="" className={s.detailPhoto} />
          ) : (
            <div
              className={s.detailAvatarLg}
              style={{ background: employee.is_crew_lead ? "var(--amb)" : "var(--blu)" }}
            >
              {employee.first_name[0]}{employee.last_name[0]}
            </div>
          )}
          <div>
            <h2 className={s.detailTitle}>
              {employee.first_name} {employee.last_name}
            </h2>
            <div className={s.detailSubRow}>
              {employee.is_crew_lead && (
                <StatusBadge variant="amber">Crew Lead</StatusBadge>
              )}
              <span className={s.detailCrew}>{crew ? crew.name : "Unassigned"}</span>
            </div>
          </div>
        </div>
        <div className={s.detailActions}>
          <button className={s.editBtn} onClick={onEdit}>
            <Edit3 size={14} /> Edit
          </button>
          <button className={s.deleteBtn} onClick={() => setConfirmDelete(true)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className={s.fieldGrid}>
        <ReadField icon={Phone} label="Phone" value={employee.phone} mono />
        <ReadField icon={Shield} label="Crew" value={crew?.name || "Unassigned"} />
        <ReadField icon={Hash} label="License #" value={employee.license_number} mono />
        <ReadField icon={Award} label="Cert #" value={employee.cert_number} mono />
      </div>
    </div>
  )
}

function ReadField({ icon: Icon, label, value, mono }) {
  return (
    <div className={s.readFieldWrap}>
      <div className={s.readFieldIcon}>
        <Icon size={16} color="var(--t3)" />
      </div>
      <div>
        <div className={s.readLabel}>{label}</div>
        <div className={`${s.readValue} ${mono ? s.mono : ""}`}>
          {value || "\u2014"}
        </div>
      </div>
    </div>
  )
}


// ===================================================
// Employee Modal — Create / Edit
// ===================================================
function EmployeeModal({ employee, crews, onClose, onSave, onDelete }) {
  const isEdit = !!employee.id
  const [firstName, setFirstName] = useState(employee.first_name || "")
  const [lastName, setLastName]   = useState(employee.last_name || "")
  const [phone, setPhone]         = useState(employee.phone || "")
  const [licenseNum, setLicenseNum] = useState(employee.license_number || "")
  const [certNum, setCertNum]     = useState(employee.cert_number || "")
  const [crewId, setCrewId]       = useState(employee.default_crew_id ? String(employee.default_crew_id) : "")
  const [pin, setPin]             = useState("")
  const [showPin, setShowPin]     = useState(false)
  const [isLead, setIsLead]       = useState(employee.is_crew_lead || false)
  const [saving, setSaving]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) return
    if (!isEdit && !pin) return
    setSaving(true)
    const data = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone || undefined,
      licenseNumber: licenseNum || undefined,
      certNumber: certNum || undefined,
      defaultCrewId: crewId || undefined,
      isCrewLead: isLead,
    }
    if (pin) data.pin = pin
    await onSave(data)
    setSaving(false)
  }

  if (confirmDelete) {
    return (
      <ConfirmModal
        title={`Remove ${firstName} ${lastName}?`}
        message="This deactivates the employee. Existing logs preserved."
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    )
  }

  return (
    <Modal title={isEdit ? "Edit Employee" : "Add Employee"} onClose={onClose}>
      <div className={s.formGrid}>
        <FormField label="First Name *" value={firstName} onChange={setFirstName} autoFocus />
        <FormField label="Last Name *" value={lastName} onChange={setLastName} />
      </div>
      <FormField label="Phone" value={phone} onChange={setPhone} type="tel" />
      <div className={s.formGrid}>
        <FormField label="License #" value={licenseNum} onChange={setLicenseNum} />
        <FormField label="Cert #" value={certNum} onChange={setCertNum} />
      </div>
      <SelectField
        label="Crew"
        value={crewId}
        onChange={setCrewId}
        placeholder="Unassigned"
        options={crews.map(c => ({ value: String(c.id), label: c.name }))}
      />

      <div className={s.pinGroup}>
        <label className={s.label}>{isEdit ? "New PIN (blank to keep)" : "PIN *"}</label>
        <div className={s.pinWrapper}>
          <input
            type={showPin ? "text" : "password"}
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder={isEdit ? "••••" : "4-6 digits"}
            className={s.pinInput}
          />
          <button onClick={() => setShowPin(!showPin)} className={s.pinToggle} type="button">
            {showPin ? <EyeOff size={16} color="var(--t3)" /> : <Eye size={16} color="var(--t3)" />}
          </button>
        </div>
      </div>

      <button onClick={() => setIsLead(!isLead)} className={s.checkRow} type="button">
        <div
          className={s.checkbox}
          style={{
            border: `2px solid ${isLead ? "var(--amb)" : "var(--bd)"}`,
            background: isLead ? "var(--amb)" : "transparent",
          }}
        >
          {isLead && <span className={s.checkMark}>✓</span>}
        </div>
        <span className={s.checkLabel}>Crew Lead</span>
        <Shield size={16} color={isLead ? "var(--amb)" : "var(--t3)"} />
      </button>

      <ModalFooter
        onClose={onClose}
        onSave={handleSubmit}
        saving={saving}
        disabled={!firstName.trim() || !lastName.trim()}
        onDelete={onDelete ? () => setConfirmDelete(true) : undefined}
      />
    </Modal>
  )
}

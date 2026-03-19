// ═══════════════════════════════════════════
// Employees Page — Employee management
// Split from TeamPage.jsx
// ═══════════════════════════════════════════

import { useState } from "react"
import { UserPlus, Edit3, Shield, Eye, EyeOff } from "lucide-react"
import { useData } from "@/context/DataProvider.jsx"
import { createEmployee, updateEmployee } from "@/lib/api/employees.js"
import {
  Modal, ModalFooter, ConfirmModal, FormField, SelectField,
  PageHeader, AddButton, SearchBar, ClickableCard, IconButton,
  LoadingSpinner, EmptyMessage,
} from "@/app/dashboard/components/PageUI.jsx"
import s from "./TeamPage.module.css"

export default function EmployeesPage() {
  const { employees, crews, toast } = useData()
  const [searchQ, setSearchQ] = useState("")
  const [editing, setEditing] = useState(null)

  const filtered = employees.data.filter(e => {
    if (!searchQ) return true
    return `${e.first_name} ${e.last_name}`.toLowerCase().includes(searchQ.toLowerCase())
  })

  return (
    <div>
      <PageHeader title="Employees" count={employees.data.length}
        action={<AddButton label="Add Employee" icon={UserPlus} onClick={() => setEditing({})} />} />
      {employees.data.length > 3 && <SearchBar value={searchQ} onChange={setSearchQ} placeholder="Search employees..." />}

      {employees.loading && !employees.data.length ? <LoadingSpinner /> :
       filtered.length === 0 ? <EmptyMessage text={searchQ ? "No matches." : "No employees yet."} /> : (
        <div className={s.list}>
          {filtered.map(emp => {
            const crew = crews.data.find(c => c.id === emp.default_crew_id)
            return (
              <ClickableCard key={emp.id} onClick={() => setEditing(emp)} style={{ padding: "14px 18px" }}>
                <div className={s.empRow}>
                  {emp.photo_filename ? (
                    <img src={`/uploads/${emp.photo_filename}`} alt="" className={s.empPhoto} />
                  ) : (
                    <div className={s.empAvatar} style={{ background: emp.is_crew_lead ? "var(--amb)" : "var(--blu)" }}>
                      {emp.first_name[0]}{emp.last_name[0]}
                    </div>
                  )}
                  <div className={s.empInfo}>
                    <div className={s.empNameRow}>
                      <div className={s.empName}>{emp.first_name} {emp.last_name}</div>
                      {emp.is_crew_lead && <span className={s.leadBadge}>LEAD</span>}
                    </div>
                    <div className={s.empSub}>{crew ? crew.name : "Unassigned"}{emp.phone && ` · ${emp.phone}`}</div>
                  </div>
                  <IconButton icon={Edit3} onClick={() => setEditing(emp)} title="Edit" />
                </div>
              </ClickableCard>
            )
          })}
        </div>
      )}

      {editing !== null && <EmployeeModal employee={editing} crews={crews.data}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); employees.refresh(); toast.show(editing.id ? "Updated ✓" : "Added ✓") }}
        onDeleted={() => { setEditing(null); employees.refresh(); toast.show("Removed ✓") }}
        onError={msg => toast.show(msg)} />}
    </div>
  )
}

function EmployeeModal({ employee, crews, onClose, onSaved, onDeleted, onError }) {
  const { employees } = useData()
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

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) { onError("Name required"); return }
    if (!isEdit && !pin) { onError("PIN required"); return }
    setSaving(true)
    try {
      const data = { firstName: firstName.trim(), lastName: lastName.trim(), phone: phone || undefined,
        licenseNumber: licenseNum || undefined, certNumber: certNum || undefined,
        defaultCrewId: crewId || undefined, isCrewLead: isLead }
      if (pin) data.pin = pin
      if (isEdit) await updateEmployee(employee.id, data)
      else await createEmployee(data)
      onSaved()
    } catch (err) { onError(err.message || "Failed to save") }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    try { await employees.remove(employee.id); onDeleted() }
    catch { onError("Failed to remove") }
  }

  if (confirmDelete) {
    return <ConfirmModal title={`Remove ${firstName} ${lastName}?`}
      message="This deactivates the employee. Existing logs preserved."
      onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} />
  }

  return (
    <Modal title={isEdit ? "Edit Employee" : "Add Employee"} onClose={onClose}>
      <div className={s.formGrid}>
        <FormField label="First Name *" value={firstName} onChange={setFirstName} autoFocus />
        <FormField label="Last Name *" value={lastName} onChange={setLastName} />
      </div>
      <FormField label="Phone" value={phone} onChange={setPhone} type="tel" />
      <div className={s.formGridNoMargin}>
        <FormField label="License #" value={licenseNum} onChange={setLicenseNum} />
        <FormField label="Cert #" value={certNum} onChange={setCertNum} />
      </div>
      <SelectField label="Crew" value={crewId} onChange={setCrewId} placeholder="Unassigned"
        options={crews.map(c => ({ value: String(c.id), label: c.name }))} />

      <div className={s.pinGroup}>
        <label className={s.label}>{isEdit ? "New PIN (blank to keep)" : "PIN *"}</label>
        <div className={s.pinWrapper}>
          <input type={showPin ? "text" : "password"} inputMode="numeric" maxLength={6}
            value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder={isEdit ? "••••" : "4-6 digits"} className={s.pinInput} />
          <button onClick={() => setShowPin(!showPin)} className={s.pinToggle}>
            {showPin ? <EyeOff size={16} color="var(--t3)" /> : <Eye size={16} color="var(--t3)" />}
          </button>
        </div>
      </div>

      <button onClick={() => setIsLead(!isLead)} className={s.checkRow}>
        <div className={s.checkbox} style={{ border: `2px solid ${isLead ? "var(--amb)" : "var(--bd)"}`, background: isLead ? "var(--amb)" : "transparent" }}>
          {isLead && <span className={s.checkMark}>✓</span>}
        </div>
        <span className={s.checkLabel}>Crew Lead</span>
        <Shield size={16} color={isLead ? "var(--amb)" : "var(--t3)"} />
      </button>

      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving}
        disabled={!firstName.trim() || !lastName.trim()}
        onDelete={isEdit ? () => setConfirmDelete(true) : undefined} />
    </Modal>
  )
}

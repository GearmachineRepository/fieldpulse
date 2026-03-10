// ═══════════════════════════════════════════
// Team Page — Employees + Crews
// ═══════════════════════════════════════════

import { useState } from "react"
import { Users, UserPlus, Edit3, Shield, Plus, Eye, EyeOff } from "lucide-react"
import { T } from "@/app/tokens.js"
import { useData } from "@/context/DataProvider.jsx"
import { createEmployee, updateEmployee } from "@/lib/api/employees.js"
import {
  Modal, ModalFooter, ConfirmModal, FormField, SelectField,
  PageHeader, AddButton, SearchBar, ClickableCard, IconButton,
  LoadingSpinner, EmptyMessage, labelStyle, inputStyle,
} from "@/app/dashboard/components/PageUI.jsx"

export default function TeamPage({ isMobile }) {
  const [tab, setTab] = useState("employees")
  return (
    <div>
      <div style={{ display: "flex", gap: 4, background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, padding: 4, marginBottom: 24, width: "fit-content" }}>
        {[{ k: "employees", l: "Employees", icon: Users }, { k: "crews", l: "Crews", icon: Users }].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 600, fontFamily: T.font, background: tab === t.k ? T.accent : "transparent", color: tab === t.k ? "#fff" : T.textMed,
          }}><t.icon size={16} /> {t.l}</button>
        ))}
      </div>
      {tab === "employees" ? <EmployeesTab isMobile={isMobile} /> : <CrewsTab isMobile={isMobile} />}
    </div>
  )
}

// ── Employees ──
function EmployeesTab({ isMobile }) {
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
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(emp => {
            const crew = crews.data.find(c => c.id === emp.default_crew_id)
            return (
              <ClickableCard key={emp.id} onClick={() => setEditing(emp)} style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {emp.photo_filename ? (
                    <img src={`/uploads/${emp.photo_filename}`} alt="" style={{ width: 44, height: 44, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: emp.is_crew_lead ? T.accent : T.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff" }}>
                      {emp.first_name[0]}{emp.last_name[0]}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{emp.first_name} {emp.last_name}</div>
                      {emp.is_crew_lead && <span style={{ fontSize: 10, fontWeight: 700, background: T.accentLight, color: T.accent, padding: "2px 6px", borderRadius: 4 }}>LEAD</span>}
                    </div>
                    <div style={{ fontSize: 12, color: T.textLight, marginTop: 2 }}>{crew ? crew.name : "Unassigned"}{emp.phone && ` · ${emp.phone}`}</div>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <FormField label="First Name *" value={firstName} onChange={setFirstName} autoFocus />
        <FormField label="Last Name *" value={lastName} onChange={setLastName} />
      </div>
      <FormField label="Phone" value={phone} onChange={setPhone} type="tel" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FormField label="License #" value={licenseNum} onChange={setLicenseNum} />
        <FormField label="Cert #" value={certNum} onChange={setCertNum} />
      </div>
      <SelectField label="Crew" value={crewId} onChange={setCrewId} placeholder="Unassigned"
        options={crews.map(c => ({ value: String(c.id), label: c.name }))} />

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>{isEdit ? "New PIN (blank to keep)" : "PIN *"}</label>
        <div style={{ position: "relative" }}>
          <input type={showPin ? "text" : "password"} inputMode="numeric" maxLength={6}
            value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder={isEdit ? "••••" : "4-6 digits"} style={{ ...inputStyle, paddingRight: 44 }} />
          <button onClick={() => setShowPin(!showPin)} style={{
            position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
            border: "none", background: "none", cursor: "pointer", padding: 4,
          }}>{showPin ? <EyeOff size={16} color={T.textLight} /> : <Eye size={16} color={T.textLight} />}</button>
        </div>
      </div>

      <button onClick={() => setIsLead(!isLead)} style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 0", marginBottom: 4,
        border: "none", background: "none", cursor: "pointer", fontFamily: T.font, width: "100%",
      }}>
        <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${isLead ? T.accent : T.border}`,
          background: isLead ? T.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isLead && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Crew Lead</span>
        <Shield size={16} color={isLead ? T.accent : T.textLight} />
      </button>

      <ModalFooter onClose={onClose} onSave={handleSave} saving={saving}
        disabled={!firstName.trim() || !lastName.trim()}
        onDelete={isEdit ? () => setConfirmDelete(true) : undefined} />
    </Modal>
  )
}

// ── Crews ──
function CrewsTab({ isMobile }) {
  const { crews, employees, toast } = useData()
  const [editing, setEditing] = useState(null)

  const handleSave = async (name, leadName) => {
    try {
      if (editing.id) await crews.update(editing.id, { name, leadName })
      else await crews.create({ name, leadName })
      toast.show(editing.id ? "Updated ✓" : "Added ✓"); setEditing(null)
    } catch (err) { toast.show(err.message || "Failed to save") }
  }

  const handleDelete = async (id) => {
    try { await crews.remove(id); toast.show("Removed ✓"); setEditing(null) }
    catch { toast.show("Failed to remove") }
  }

  return (
    <div>
      <PageHeader title="Crews" count={crews.data.length}
        action={<AddButton label="Add Crew" icon={Plus} onClick={() => setEditing({})} />} />

      {crews.data.length === 0 ? <EmptyMessage text="No crews yet." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {crews.data.map(crew => {
            const members = employees.data.filter(e => e.default_crew_id === crew.id)
            return (
              <ClickableCard key={crew.id} onClick={() => setEditing(crew)} style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 800 }}>{crew.name}</div>
                    <div style={{ fontSize: 13, color: T.textLight, marginTop: 2 }}>
                      {members.length} member{members.length !== 1 ? "s" : ""}{crew.lead_name && ` · Lead: ${crew.lead_name}`}
                    </div>
                  </div>
                  <IconButton icon={Edit3} onClick={() => setEditing(crew)} title="Edit" />
                </div>
                {members.length > 0 && (
                  <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                    {members.map(emp => (
                      <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: T.bg, borderRadius: 8, fontSize: 12, fontWeight: 600, color: T.textMed }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: emp.is_crew_lead ? T.accent : T.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                        {emp.first_name} {emp.last_name}
                        {emp.is_crew_lead && <Shield size={11} color={T.accent} />}
                      </div>
                    ))}
                  </div>
                )}
              </ClickableCard>
            )
          })}
        </div>
      )}

      {editing !== null && <CrewModal crew={editing} onClose={() => setEditing(null)} onSave={handleSave} onDelete={editing.id ? () => handleDelete(editing.id) : undefined} />}
    </div>
  )
}

function CrewModal({ crew, onClose, onSave, onDelete }) {
  const [name, setName] = useState(crew.name || "")
  const [leadName, setLeadName] = useState(crew.lead_name || "")
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSubmit = async () => { if (!name.trim()) return; setSaving(true); await onSave(name.trim(), leadName.trim() || null); setSaving(false) }

  if (confirmDelete) {
    return <ConfirmModal title={`Remove "${crew.name}"?`} message="Existing logs preserved."
      onConfirm={onDelete} onCancel={() => setConfirmDelete(false)} />
  }

  return (
    <Modal title={crew.id ? "Edit Crew" : "Add Crew"} onClose={onClose} size="sm">
      <FormField label="Crew Name *" value={name} onChange={setName} autoFocus />
      <FormField label="Lead Name" value={leadName} onChange={setLeadName} placeholder="Optional" />
      <ModalFooter onClose={onClose} onSave={handleSubmit} saving={saving} disabled={!name.trim()}
        onDelete={onDelete ? () => setConfirmDelete(true) : undefined} />
    </Modal>
  )
}

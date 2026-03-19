// ═══════════════════════════════════════════
// Crews Page — Crew management
// Split from TeamPage.jsx
// ═══════════════════════════════════════════

import { useState } from "react"
import { Edit3, Shield, Plus } from "lucide-react"
import { useData } from "@/context/DataProvider.jsx"
import {
  Modal, ModalFooter, ConfirmModal, FormField,
  PageHeader, AddButton, ClickableCard, IconButton,
  EmptyMessage,
} from "@/app/dashboard/components/PageUI.jsx"
import s from "./TeamPage.module.css"

export default function CrewsPage() {
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
        <div className={s.list}>
          {crews.data.map(crew => {
            const members = employees.data.filter(e => e.default_crew_id === crew.id)
            return (
              <ClickableCard key={crew.id} onClick={() => setEditing(crew)} style={{ padding: "18px 20px" }}>
                <div className={s.crewHeader}>
                  <div>
                    <div className={s.crewName}>{crew.name}</div>
                    <div className={s.crewSub}>
                      {members.length} member{members.length !== 1 ? "s" : ""}{crew.lead_name && ` · Lead: ${crew.lead_name}`}
                    </div>
                  </div>
                  <IconButton icon={Edit3} onClick={() => setEditing(crew)} title="Edit" />
                </div>
                {members.length > 0 && (
                  <div className={s.memberChips}>
                    {members.map(emp => (
                      <div key={emp.id} className={s.memberChip}>
                        <div className={s.memberAvatar} style={{ background: emp.is_crew_lead ? "var(--amb)" : "var(--blu)" }}>
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                        {emp.first_name} {emp.last_name}
                        {emp.is_crew_lead && <Shield size={11} color="var(--amb)" />}
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

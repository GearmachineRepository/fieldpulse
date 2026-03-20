// ═══════════════════════════════════════════
// Crews Page — Phase 3B: Card Grid Layout
// Uses usePageData, skeleton cards, crew member display
// ═══════════════════════════════════════════

import { useState } from "react"
import { Plus, Edit3, Shield, Users, ChevronRight } from "lucide-react"
import usePageData from "@/hooks/usePageData.js"
import useToast from "@/hooks/useToast.js"
import { getCrews, createCrew, updateCrew, deleteCrew } from "@/lib/api/crews.js"
import { getEmployees } from "@/lib/api/employees.js"
import useNavigation from "@/hooks/useNavigation.js"
import PageShell from "../components/PageShell.jsx"
import StatusBadge from "../components/StatusBadge.jsx"
import {
  Modal, ModalFooter, ConfirmModal, FormField,
} from "../components/PageUI.jsx"
import s from "./CrewsPage.module.css"

export default function CrewsPage() {
  const toast = useToast()
  const { navigate: onNavigate } = useNavigation()
  const crews = usePageData("crews", {
    fetchFn: getCrews,
    createFn: createCrew,
    updateFn: updateCrew,
    deleteFn: deleteCrew,
  })
  const employees = usePageData("employees", { fetchFn: getEmployees })

  const [editing, setEditing] = useState(null)

  const handleSave = async (name, leadName) => {
    try {
      if (editing.id) {
        await crews.update(editing.id, { name, leadName })
        toast.show("Updated")
      } else {
        await crews.create({ name, leadName })
        toast.show("Added")
      }
      setEditing(null)
    } catch (err) {
      toast.show(err.message || "Failed to save")
    }
  }

  const handleDelete = async (id) => {
    try {
      await crews.remove(id)
      toast.show("Removed")
      setEditing(null)
    } catch {
      toast.show("Failed to remove")
    }
  }

  return (
    <PageShell
      title="Crews"
      count={crews.data.length}
      countLabel={`crew${crews.data.length !== 1 ? "s" : ""}`}
      loading={crews.loading && !crews.data.length}
      skeleton="cards"
      empty={crews.data.length === 0}
      emptyIcon={Users}
      emptyTitle="No crews yet"
      emptyDescription="Create crews to organize your employees."
      emptyCta={
        <button className={s.emptyCta} onClick={() => setEditing({})}>
          <Plus size={14} /> Create First Crew
        </button>
      }
      actions={
        <button className={s.addBtn} onClick={() => setEditing({})}>
          <Plus size={15} /> Add Crew
        </button>
      }
    >
      <div className={s.grid}>
        {crews.data.map(crew => {
          const members = employees.data.filter(e => e.default_crew_id === crew.id)
          const lead = members.find(m => m.is_crew_lead)
          return (
            <div
              key={crew.id}
              className={s.card}
              onClick={() => setEditing(crew)}
            >
              <div className={s.cardTop}>
                <div className={s.cardIconWrap}>
                  <Users size={20} color="var(--amb)" />
                </div>
                <div className={s.cardInfo}>
                  <div className={s.cardName}>{crew.name}</div>
                  <div className={s.cardMeta}>
                    <span className={s.mono}>{members.length}</span>
                    {" "}member{members.length !== 1 ? "s" : ""}
                    {lead && (
                      <>
                        {" · Lead: "}
                        <span className={s.leadName}>{lead.first_name} {lead.last_name}</span>
                      </>
                    )}
                    {!lead && crew.lead_name && (
                      <>
                        {" · Lead: "}
                        <span className={s.leadName}>{crew.lead_name}</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} color="var(--t3)" className={s.cardChevron} />
              </div>

              {members.length > 0 && (
                <div className={s.memberList}>
                  {members.slice(0, 6).map(emp => (
                    <div key={emp.id} className={s.memberChip}>
                      <div
                        className={s.memberAvatar}
                        style={{ background: emp.is_crew_lead ? "var(--amb)" : "var(--blu)" }}
                      >
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                      <span className={s.memberName}>{emp.first_name}</span>
                      {emp.is_crew_lead && <Shield size={11} color="var(--amb)" />}
                    </div>
                  ))}
                  {members.length > 6 && (
                    <div className={s.memberMore}>+{members.length - 6}</div>
                  )}
                </div>
              )}

              {members.length === 0 && (
                <div className={s.noMembers}>
                  No members assigned
                </div>
              )}
            </div>
          )
        })}
      </div>

      {editing !== null && (
        <CrewModal
          crew={editing}
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
// Crew Modal — Create / Edit
// ===================================================
function CrewModal({ crew, onClose, onSave, onDelete }) {
  const [name, setName] = useState(crew.name || "")
  const [leadName, setLeadName] = useState(crew.lead_name || "")
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave(name.trim(), leadName.trim() || null)
    setSaving(false)
  }

  if (confirmDelete) {
    return (
      <ConfirmModal
        title={`Remove "${crew.name}"?`}
        message="Existing logs preserved."
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    )
  }

  return (
    <Modal title={crew.id ? "Edit Crew" : "Add Crew"} onClose={onClose} size="sm">
      <FormField label="Crew Name *" value={name} onChange={setName} autoFocus />
      <FormField label="Lead Name" value={leadName} onChange={setLeadName} placeholder="Optional" />
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

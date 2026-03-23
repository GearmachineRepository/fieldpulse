// ═══════════════════════════════════════════
// Crews Page — Phase 3B: Card Grid + Member Management
// Uses usePageData, skeleton cards, crew member display,
// SlidePanel for member assign/unassign
// ═══════════════════════════════════════════

import { useState, useMemo } from "react"
import { Plus, Edit3, Shield, Users, ChevronRight, Search, X, UserPlus, UserMinus } from "lucide-react"
import usePageData from "@/hooks/usePageData.js"
import useToast from "@/hooks/useToast.js"
import { getCrews, createCrew, updateCrew, deleteCrew } from "@/lib/api/crews.js"
import { getEmployees, updateEmployee } from "@/lib/api/employees.js"
import useNavigation from "@/hooks/useNavigation.js"
import PageShell from "../components/PageShell.jsx"
import SlidePanel from "../components/SlidePanel.jsx"
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
  const [detailCrew, setDetailCrew] = useState(null)

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
      setDetailCrew(null)
    } catch {
      toast.show("Failed to remove")
    }
  }

  const handleAssign = async (empId, crewId) => {
    try {
      await updateEmployee(empId, { defaultCrewId: String(crewId) })
      await Promise.all([crews.refresh(), employees.refresh()])
      toast.show("Member assigned")
    } catch {
      toast.show("Failed to assign member")
    }
  }

  const handleUnassign = async (empId) => {
    try {
      // Send empty string — server converts "" to null via `defaultCrewId || null`
      await updateEmployee(empId, { defaultCrewId: "" })
      await Promise.all([crews.refresh(), employees.refresh()])
      toast.show("Member removed")
    } catch {
      toast.show("Failed to remove member")
    }
  }

  const handleSetLead = async (emp, crew) => {
    try {
      // Unset current lead if any
      const currentLead = employees.data.find(
        e => e.default_crew_id === crew.id && e.is_crew_lead
      )
      if (currentLead && currentLead.id !== emp.id) {
        await updateEmployee(currentLead.id, { isCrewLead: "false" })
      }

      // Toggle: if clicking the current lead, demote them
      const isAlreadyLead = emp.is_crew_lead
      await updateEmployee(emp.id, { isCrewLead: isAlreadyLead ? "false" : "true" })

      // Update crew lead_name
      const newLeadName = isAlreadyLead ? "" : `${emp.first_name} ${emp.last_name}`
      await crews.update(crew.id, { leadName: newLeadName || null })

      await Promise.all([crews.refresh(), employees.refresh()])
      toast.show(isAlreadyLead ? "Lead removed" : "Lead set")
    } catch {
      toast.show("Failed to update lead")
    }
  }

  // Keep detailCrew in sync with refreshed data
  const activeCrew = detailCrew
    ? crews.data.find(c => c.id === detailCrew.id) || detailCrew
    : null

  return (
    <>
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
        emptyCta="Create First Crew"
        onEmptyCta={() => setEditing({})}
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
                onClick={() => setDetailCrew(crew)}
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
      </PageShell>

      {/* Crew Detail Panel */}
      <SlidePanel
        open={activeCrew !== null}
        onClose={() => setDetailCrew(null)}
        title={activeCrew?.name || "Crew"}
        width={460}
      >
        {activeCrew && (
          <CrewDetail
            crew={activeCrew}
            employees={employees.data}
            onEdit={() => { setEditing(activeCrew); }}
            onAssign={handleAssign}
            onUnassign={handleUnassign}
            onSetLead={handleSetLead}
          />
        )}
      </SlidePanel>

      {/* Edit / Create Modal */}
      {editing !== null && (
        <CrewModal
          crew={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={editing.id ? () => handleDelete(editing.id) : undefined}
        />
      )}

      {/* Toast */}
      {toast.message && (
        <div className={s.toast} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </>
  )
}


// ===================================================
// Crew Detail — SlidePanel content
// ===================================================
function CrewDetail({ crew, employees, onEdit, onAssign, onUnassign, onSetLead }) {
  const [search, setSearch] = useState("")

  const members = useMemo(
    () => employees.filter(e => e.default_crew_id === crew.id),
    [employees, crew.id]
  )

  const lead = members.find(m => m.is_crew_lead)

  const unassigned = useMemo(() => {
    const q = search.toLowerCase().trim()
    return employees
      .filter(e => e.default_crew_id !== crew.id)
      .filter(e => {
        if (!q) return true
        const full = `${e.first_name} ${e.last_name}`.toLowerCase()
        return full.includes(q)
      })
  }, [employees, crew.id, search])

  return (
    <div className={s.detail}>
      {/* Header summary */}
      <div className={s.detailHeader}>
        <div className={s.detailInfo}>
          <div className={s.detailMeta}>
            <span className={s.mono}>{members.length}</span>
            {" "}member{members.length !== 1 ? "s" : ""}
            {lead && (
              <>
                {" · Lead: "}
                <span className={s.leadName}>{lead.first_name} {lead.last_name}</span>
              </>
            )}
          </div>
        </div>
        <button className={s.editBtn} onClick={onEdit} type="button">
          <Edit3 size={14} /> Edit
        </button>
      </div>

      {/* Current Members */}
      <div className={s.detailSection}>
        <div className={s.sectionTitle}>
          <Users size={14} />
          Members
        </div>
        {members.length === 0 && (
          <div className={s.sectionEmpty}>No members assigned to this crew.</div>
        )}
        <div className={s.memberRows}>
          {members.map(emp => (
            <div key={emp.id} className={s.memberRow}>
              <div
                className={s.memberAvatarLg}
                style={{ background: emp.is_crew_lead ? "var(--amb)" : "var(--blu)" }}
              >
                {emp.first_name[0]}{emp.last_name[0]}
              </div>
              <div className={s.memberRowInfo}>
                <div className={s.memberRowName}>
                  {emp.first_name} {emp.last_name}
                </div>
                {emp.is_crew_lead && (
                  <StatusBadge variant="amber">Lead</StatusBadge>
                )}
              </div>
              <div className={s.memberRowActions}>
                <button
                  className={`${s.memberActionBtn} ${emp.is_crew_lead ? s.memberActionActive : ""}`}
                  onClick={() => onSetLead(emp, crew)}
                  type="button"
                  title={emp.is_crew_lead ? "Remove as lead" : "Set as lead"}
                >
                  <Shield size={14} />
                </button>
                <button
                  className={s.memberRemoveBtn}
                  onClick={() => onUnassign(emp.id)}
                  type="button"
                  title="Remove from crew"
                >
                  <UserMinus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Members */}
      <div className={s.detailSection}>
        <div className={s.sectionTitle}>
          <UserPlus size={14} />
          Add Members
        </div>

        <div className={s.searchWrap}>
          <Search size={14} className={s.searchIcon} />
          <input
            className={s.searchInput}
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              className={s.searchClear}
              onClick={() => setSearch("")}
              type="button"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {unassigned.length === 0 && (
          <div className={s.sectionEmpty}>
            {search ? "No matching employees." : "All employees are assigned to crews."}
          </div>
        )}

        <div className={s.memberRows}>
          {unassigned.map(emp => (
            <div key={emp.id} className={s.memberRow}>
              <div
                className={s.memberAvatarLg}
                style={{ background: "var(--s3)" }}
              >
                {emp.first_name[0]}{emp.last_name[0]}
              </div>
              <div className={s.memberRowInfo}>
                <div className={s.memberRowName}>
                  {emp.first_name} {emp.last_name}
                </div>
                {emp.crew_name && (
                  <span className={s.memberRowCrew}>{emp.crew_name}</span>
                )}
              </div>
              <button
                className={s.memberAddBtn}
                onClick={() => onAssign(emp.id, crew.id)}
                type="button"
                title="Add to crew"
              >
                <Plus size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
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

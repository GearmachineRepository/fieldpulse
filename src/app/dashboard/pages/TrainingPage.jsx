// ═══════════════════════════════════════════
// Training Page — Sessions, Signoffs, Compliance
// Cal OSHA compliance tracking with digital signatures
// ═══════════════════════════════════════════

import { useState, useCallback } from "react"
import {
  GraduationCap, Plus, Search, Clock, MapPin,
  User, Calendar, FileCheck, Edit3, Trash2,
} from "lucide-react"
import usePageData from "@/hooks/usePageData.js"
import useToast from "@/hooks/useToast.js"
import { getEmployees } from "@/lib/api/employees.js"
import {
  getTrainingSessions, getTrainingSession,
  createTrainingSession, updateTrainingSession, deleteTrainingSession,
  addSignoff,
} from "@/lib/api/training.js"
import PageShell from "../components/PageShell.jsx"
import DataTable from "../components/DataTable.jsx"
import SlidePanel from "../components/SlidePanel.jsx"
import StatusBadge from "../components/StatusBadge.jsx"
import {
  Modal, ModalFooter, ConfirmModal, FormField, TextareaField, SelectField,
} from "../components/PageUI.jsx"
import s from "./TrainingPage.module.css"

const ts = DataTable.s

const TYPES = [
  "Safety", "Heat Illness Prevention", "Pesticide Safety",
  "IIPP Orientation", "Equipment Operation", "Tailgate Meeting",
  "Video Training", "Other",
]

const STATUSES = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
]

function getStatusVariant(status) {
  switch (status) {
    case "completed": return "green"
    case "in-progress": return "blue"
    case "scheduled": return "gray"
    default: return "gray"
  }
}

function getStatusLabel(status) {
  switch (status) {
    case "completed": return "Completed"
    case "in-progress": return "In Progress"
    case "scheduled": return "Scheduled"
    default: return status || "Scheduled"
  }
}

function formatDate(d) {
  if (!d) return "\u2014"
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function TrainingPage() {
  const toast = useToast()
  const sessions = usePageData("training", {
    fetchFn: getTrainingSessions,
    createFn: createTrainingSession,
    updateFn: updateTrainingSession,
    deleteFn: deleteTrainingSession,
  })
  const employees = usePageData("employees", { fetchFn: getEmployees })

  const [searchQ, setSearchQ] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [selectedId, setSelectedId] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [editing, setEditing] = useState(null)
  const [signoffModal, setSignoffModal] = useState(null)

  const selectedItem = sessions.data.find(s => s.id === selectedId) || null

  const filtered = sessions.data.filter(item => {
    if (searchQ) {
      const q = searchQ.toLowerCase()
      if (
        !item.title.toLowerCase().includes(q) &&
        !(item.trainer || "").toLowerCase().includes(q)
      ) return false
    }
    if (statusFilter && (item.status || "scheduled") !== statusFilter) return false
    if (typeFilter && (item.type || "") !== typeFilter) return false
    return true
  })

  const handleSelect = useCallback(async (id) => {
    setSelectedId(id)
    try {
      const data = await getTrainingSession(id)
      setDetailData(data)
    } catch {
      setDetailData(null)
    }
  }, [])

  const handleSave = async (data) => {
    try {
      if (editing.id) {
        await sessions.update(editing.id, data)
        toast.show("Session updated")
        if (selectedId === editing.id) handleSelect(editing.id)
      } else {
        await sessions.create(data)
        toast.show("Session created")
      }
      setEditing(null)
    } catch (err) {
      toast.show(err.message || "Failed to save")
    }
  }

  const handleDelete = async (id) => {
    try {
      await sessions.remove(id)
      toast.show("Session removed")
      setEditing(null)
      if (selectedId === id) {
        setSelectedId(null)
        setDetailData(null)
      }
    } catch {
      toast.show("Failed to remove")
    }
  }

  const handleSignoff = async (sessionId, employeeId) => {
    try {
      await addSignoff(sessionId, employeeId)
      toast.show("Sign-off recorded")
      setSignoffModal(null)
      handleSelect(sessionId)
      sessions.refresh()
    } catch (err) {
      toast.show(err.message || "Failed to record sign-off")
    }
  }

  return (
    <>
    <PageShell
      title="Training"
      count={sessions.data.length}
      countLabel={`session${sessions.data.length !== 1 ? "s" : ""}`}
      loading={sessions.loading && !sessions.data.length}
      skeleton="table"
      empty={sessions.data.length === 0}
      emptyIcon={GraduationCap}
      emptyTitle="No training sessions recorded"
      emptyDescription="Log training sessions to track Cal OSHA compliance requirements including Heat Illness Prevention, Pesticide Safety, and IIPP Orientation."
      emptyCta="Log Training Session"
      onEmptyCta={() => setEditing({})}
      actions={
        <button className={s.addBtn} onClick={() => setEditing({})}>
          <Plus size={15} /> Log Training
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
            placeholder="Search by title or trainer..."
            className={s.searchInput}
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className={s.filterSelect}
        >
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className={s.filterSelect}
        >
          <option value="">All Statuses</option>
          {STATUSES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
        </select>
      </div>

      {/* Data Table */}
      <DataTable
        headers={[
          { label: "Title" },
          { label: "Date" },
          { label: "Trainer" },
          { label: "Type" },
          { label: "Duration" },
          { label: "Sign-offs", right: true },
          { label: "Status" },
        ]}
      >
        {filtered.length === 0 ? (
          <tr><td colSpan={7} className={ts.empty}>No sessions match your filters.</td></tr>
        ) : (
          filtered.map(item => (
            <tr
              key={item.id}
              className={ts.tr}
              onClick={() => handleSelect(item.id)}
              style={{ cursor: "pointer" }}
            >
              <td className={ts.td}>
                <div className={s.nameCell}>
                  <div className={s.nameIcon}>
                    <GraduationCap size={16} color="var(--amb)" />
                  </div>
                  <span className={s.nameText}>{item.title}</span>
                </div>
              </td>
              <td className={`${ts.td} ${ts.tdMono}`}>
                {formatDate(item.training_date)}
              </td>
              <td className={ts.td}>
                {item.trainer || <span className={ts.tdMuted}>--</span>}
              </td>
              <td className={ts.td}>
                {item.type ? <StatusBadge variant="gray">{item.type}</StatusBadge> : "\u2014"}
              </td>
              <td className={`${ts.td} ${ts.tdMono}`}>
                {item.duration_hours ? `${item.duration_hours}h` : "\u2014"}
              </td>
              <td className={`${ts.td} ${ts.tdMono}`} style={{ textAlign: "right" }}>
                {item.signoff_count || 0}
              </td>
              <td className={ts.td}>
                <StatusBadge variant={getStatusVariant(item.status)}>
                  {getStatusLabel(item.status)}
                </StatusBadge>
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </PageShell>

    {/* Detail SlidePanel */}
    <SlidePanel
      open={!!selectedItem}
      onClose={() => { setSelectedId(null); setDetailData(null) }}
      title={selectedItem?.title || "Training Session"}
    >
      {selectedItem && (
        <SessionDetail
          session={selectedItem}
          detail={detailData}
          onEdit={() => setEditing(selectedItem)}
          onDelete={() => handleDelete(selectedItem.id)}
          onAddSignoff={() => setSignoffModal(selectedItem.id)}
        />
      )}
    </SlidePanel>

    {/* Create / Edit Modal */}
    {editing !== null && (
      <SessionModal
        item={editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        onDelete={editing.id ? () => handleDelete(editing.id) : undefined}
      />
    )}

    {/* Signoff Modal */}
    {signoffModal && (
      <SignoffModal
        sessionId={signoffModal}
        employees={employees.data}
        signoffs={detailData?.signoffs || []}
        onClose={() => setSignoffModal(null)}
        onSignoff={handleSignoff}
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
// Session Detail — shown in SlidePanel
// ===================================================
function SessionDetail({ session, detail, onEdit, onDelete, onAddSignoff }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const signoffs = detail?.signoffs || []

  if (confirmDelete) {
    return (
      <ConfirmModal
        title={`Delete "${session.title}"?`}
        message="This will permanently delete the training session and all associated sign-off records."
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
        <DetailField icon={GraduationCap} label="Title" value={session.title} />
        <DetailField icon={Calendar} label="Date" value={formatDate(session.training_date)} mono />
        <DetailField icon={User} label="Trainer" value={session.trainer} />
        <DetailField icon={Clock} label="Duration" value={session.duration_hours ? `${session.duration_hours} hours` : null} />
        <DetailField icon={MapPin} label="Location" value={session.location} />
        <DetailField icon={FileCheck} label="Type" value={session.type} />
        <DetailField icon={FileCheck} label="Status" value={getStatusLabel(session.status)} />
      </div>

      {(session.description || session.notes) && (
        <div className={s.notesSection}>
          {session.description && (
            <>
              <div className={s.notesLabel}>Description</div>
              <div className={s.notesText}>{session.description}</div>
            </>
          )}
          {session.notes && (
            <>
              <div className={s.notesLabel}>Notes</div>
              <div className={s.notesText}>{session.notes}</div>
            </>
          )}
        </div>
      )}

      {/* Sign-offs section */}
      <div className={s.signoffSection}>
        <div className={s.signoffHeader}>
          <div className={s.signoffTitle}>Sign-offs ({signoffs.length})</div>
          <button className={s.signoffBtn} onClick={onAddSignoff}>
            <Plus size={14} /> Record Sign-off
          </button>
        </div>
        {signoffs.length === 0 ? (
          <div className={s.signoffEmpty}>No sign-offs recorded yet.</div>
        ) : (
          <div className={s.signoffList}>
            {signoffs.map(so => (
              <div key={so.id} className={s.signoffRow}>
                <div className={s.signoffName}>
                  {so.first_name} {so.last_name}
                </div>
                <div className={s.signoffDate}>
                  {new Date(so.signed_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                    hour: "numeric", minute: "2-digit",
                  })}
                </div>
                {so.notes && <div className={s.signoffNote}>{so.notes}</div>}
              </div>
            ))}
          </div>
        )}
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
// Session Modal — Create / Edit
// ===================================================
function SessionModal({ item, onClose, onSave, onDelete }) {
  const isEdit = !!item.id
  const [title, setTitle] = useState(item.title || "")
  const [description, setDescription] = useState(item.description || "")
  const [trainer, setTrainer] = useState(item.trainer || "")
  const [trainingDate, setTrainingDate] = useState(
    item.training_date ? new Date(item.training_date).toISOString().split("T")[0] : ""
  )
  const [durationHours, setDurationHours] = useState(item.duration_hours || "")
  const [location, setLocation] = useState(item.location || "")
  const [type, setType] = useState(item.type || "")
  const [status, setStatus] = useState(item.status || "scheduled")
  const [notes, setNotes] = useState(item.notes || "")
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !trainingDate) return
    setSaving(true)
    await onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      trainer: trainer.trim() || undefined,
      training_date: trainingDate,
      duration_hours: durationHours ? parseFloat(durationHours) : undefined,
      location: location.trim() || undefined,
      type: type || undefined,
      status,
      notes: notes.trim() || undefined,
    })
    setSaving(false)
  }

  if (confirmDelete) {
    return (
      <ConfirmModal
        title={`Delete "${item.title}"?`}
        message="This will permanently delete the training session and all sign-off records."
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    )
  }

  return (
    <Modal title={isEdit ? "Edit Training Session" : "Log Training Session"} onClose={onClose}>
      <FormField label="Title *" value={title} onChange={setTitle} autoFocus placeholder="e.g. Heat Illness Prevention" />
      <div className={s.formRow}>
        <FormField label="Date *" value={trainingDate} onChange={setTrainingDate} type="date" />
        <FormField label="Duration (hours)" value={durationHours} onChange={setDurationHours} type="number" placeholder="e.g. 1.5" />
      </div>
      <div className={s.formRow}>
        <FormField label="Trainer" value={trainer} onChange={setTrainer} placeholder="Instructor name" />
        <FormField label="Location" value={location} onChange={setLocation} placeholder="e.g. Main Office" />
      </div>
      <div className={s.formRow}>
        <SelectField
          label="Type"
          value={type}
          onChange={setType}
          placeholder="Select type"
          options={TYPES.map(t => ({ value: t, label: t }))}
        />
        <SelectField
          label="Status"
          value={status}
          onChange={setStatus}
          options={STATUSES}
        />
      </div>
      <TextareaField label="Description" value={description} onChange={setDescription} placeholder="Training session details..." rows={2} />
      <TextareaField label="Notes" value={notes} onChange={setNotes} placeholder="Additional notes..." rows={2} />
      <ModalFooter
        onClose={onClose}
        onSave={handleSubmit}
        saving={saving}
        disabled={!title.trim() || !trainingDate}
        onDelete={onDelete ? () => setConfirmDelete(true) : undefined}
      />
    </Modal>
  )
}


// ===================================================
// Signoff Modal — Select employee to sign off
// ===================================================
function SignoffModal({ sessionId, employees, signoffs, onClose, onSignoff }) {
  const [searchQ, setSearchQ] = useState("")
  const [saving, setSaving] = useState(false)

  const signedIds = new Set(signoffs.map(so => so.employee_id))
  const available = employees.filter(e => !signedIds.has(e.id))

  const filtered = available.filter(e => {
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return `${e.first_name} ${e.last_name}`.toLowerCase().includes(q)
  })

  const handleSelect = async (employeeId) => {
    setSaving(true)
    await onSignoff(sessionId, employeeId)
    setSaving(false)
  }

  return (
    <Modal title="Record Sign-off" onClose={onClose} size="sm">
      <div className={s.signoffModalDesc}>
        Select an employee to record their sign-off. This action cannot be undone.
      </div>
      {available.length === 0 ? (
        <div className={s.signoffModalEmpty}>All employees have signed off.</div>
      ) : (
        <>
          <div className={s.signoffSearchWrap}>
            <Search size={15} className={s.signoffSearchIcon} />
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search employees..."
              className={s.signoffSearchInput}
              autoFocus
            />
          </div>
          <div className={s.signoffPickList}>
            {filtered.length === 0 ? (
              <div className={s.signoffModalEmpty}>No matching employees.</div>
            ) : (
              filtered.map(e => (
                <button
                  key={e.id}
                  className={s.signoffPickItem}
                  onClick={() => handleSelect(e.id)}
                  disabled={saving}
                >
                  <span className={s.signoffPickName}>{e.first_name} {e.last_name}</span>
                  <FileCheck size={14} color="var(--t3)" />
                </button>
              ))
            )}
          </div>
        </>
      )}
      <div className={s.signoffModalFooter}>
        <button onClick={onClose} className={s.cancelBtn}>Close</button>
      </div>
    </Modal>
  )
}

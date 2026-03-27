// ═══════════════════════════════════════════
// Training Page — 3-Tab Layout
// Sessions | Tailgate Meetings | Video Training
// Cal OSHA compliance tracking with digital signatures
// ═══════════════════════════════════════════

import { useState, useCallback } from "react"
import {
  GraduationCap, Plus, Search, Clock, MapPin,
  User, Calendar, FileCheck, Edit3, Trash2,
  CheckCircle, ChevronDown, ChevronUp, Video,
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
import TabBar from "../components/TabBar.jsx"
import DataTable from "../components/DataTable.jsx"
import SlidePanel from "../components/SlidePanel.jsx"
import StatusBadge from "../components/StatusBadge.jsx"
import {
  Modal, ModalFooter, ConfirmModal, FormField, TextareaField, SelectField,
} from "../components/PageUI.jsx"
import s from "./TrainingPage.module.css"

const ts = DataTable.s

const TABS = [
  { key: "sessions", label: "Sessions" },
  { key: "tailgate", label: "Tailgate Meetings" },
  { key: "video", label: "Video Training" },
]

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
  const [tab, setTab] = useState("sessions")

  // Three separate data loads per plan
  const sessions = usePageData("training-sessions", {
    fetchFn: () => getTrainingSessions({ type_not: "Tailgate Meeting" }),
    createFn: createTrainingSession,
    updateFn: updateTrainingSession,
    deleteFn: deleteTrainingSession,
  })
  const tailgate = usePageData("training-tailgate", {
    fetchFn: () => getTrainingSessions({ type: "Tailgate Meeting" }),
    createFn: createTrainingSession,
    updateFn: updateTrainingSession,
    deleteFn: deleteTrainingSession,
  })
  const video = usePageData("training-video", {
    fetchFn: () => getTrainingSessions({ type: "Video Training" }),
  })
  const employees = usePageData("employees", { fetchFn: getEmployees })

  const [editing, setEditing] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [signoffModal, setSignoffModal] = useState(null)

  const activeData = tab === "sessions" ? sessions : tab === "tailgate" ? tailgate : video

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
        await activeData.update(editing.id, data)
        toast.show("Session updated")
        if (selectedId === editing.id) handleSelect(editing.id)
      } else {
        await activeData.create(data)
        toast.show("Session created")
      }
      setEditing(null)
      // Refresh all tabs since type might have changed
      sessions.refresh()
      tailgate.refresh()
      video.refresh()
    } catch (err) {
      toast.show(err.message || "Failed to save")
    }
  }

  const handleDelete = async (id) => {
    try {
      await activeData.remove(id)
      toast.show("Session removed")
      setEditing(null)
      if (selectedId === id) {
        setSelectedId(null)
        setDetailData(null)
      }
      sessions.refresh()
      tailgate.refresh()
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
      activeData.refresh()
    } catch (err) {
      toast.show(err.message || "Failed to record sign-off")
    }
  }

  const defaultType = tab === "tailgate" ? "Tailgate Meeting" : tab === "video" ? "Video Training" : ""

  return (
    <>
      <PageShell
        title="Training"
        count={activeData.data.length}
        countLabel={`session${activeData.data.length !== 1 ? "s" : ""}`}
        loading={activeData.loading && !activeData.data.length}
        skeleton="table"
        empty={activeData.data.length === 0 && !activeData.loading}
        emptyIcon={GraduationCap}
        emptyTitle={
          tab === "sessions" ? "No training sessions recorded" :
          tab === "tailgate" ? "No tailgate meetings recorded" :
          "No video training sessions"
        }
        emptyDescription={
          tab === "sessions"
            ? "Log training sessions to track Cal OSHA compliance requirements including Heat Illness Prevention, Pesticide Safety, and IIPP Orientation."
            : tab === "tailgate"
            ? "Record brief daily or weekly safety talks. Tailgate meetings help meet Cal OSHA\u2019s IIPP documentation requirements."
            : "Video training tracking coming soon. Log sessions manually for now."
        }
        emptyCta={tab !== "video" ? (tab === "tailgate" ? "New Tailgate Meeting" : "Log Training") : undefined}
        onEmptyCta={tab !== "video" ? () => setEditing({ type: defaultType }) : undefined}
        actions={
          <button className={s.addBtn} onClick={() => setEditing({ type: defaultType })}>
            <Plus size={15} /> {tab === "tailgate" ? "New Tailgate" : "Log Training"}
          </button>
        }
      >
        <TabBar tabs={TABS} active={tab} onChange={setTab} />

        {tab === "sessions" && (
          <SessionsTab
            data={sessions.data}
            onSelect={handleSelect}
            onEdit={setEditing}
          />
        )}
        {tab === "tailgate" && (
          <TailgateTab
            data={tailgate.data}
            onSelect={handleSelect}
            employees={employees.data}
            onSignoff={handleSignoff}
          />
        )}
        {tab === "video" && (
          <VideoTab data={video.data} onSelect={handleSelect} />
        )}
      </PageShell>

      {/* Detail SlidePanel */}
      <SlidePanel
        open={!!selectedId}
        onClose={() => { setSelectedId(null); setDetailData(null) }}
        title={detailData?.title || "Training Session"}
      >
        {detailData && (
          <SessionDetail
            session={detailData}
            detail={detailData}
            onEdit={() => setEditing(detailData)}
            onDelete={() => handleDelete(detailData.id)}
            onAddSignoff={() => setSignoffModal(detailData.id)}
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
// Tab 1: Sessions — DataTable with expandable rows
// ===================================================
function SessionsTab({ data, onSelect, onEdit }) {
  const [searchQ, setSearchQ] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [expandedId, setExpandedId] = useState(null)
  const [expandedDetail, setExpandedDetail] = useState(null)

  const filtered = data.filter(item => {
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

  const handleExpand = async (id) => {
    if (expandedId === id) {
      setExpandedId(null)
      setExpandedDetail(null)
      return
    }
    setExpandedId(id)
    try {
      const detail = await getTrainingSession(id)
      setExpandedDetail(detail)
    } catch {
      setExpandedDetail(null)
    }
  }

  return (
    <>
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
          {TYPES.filter(t => t !== "Tailgate Meeting" && t !== "Video Training").map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
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

      <DataTable
        headers={[
          { label: "Date" },
          { label: "Type" },
          { label: "Topic" },
          { label: "Conducted By" },
          { label: "Attendees", right: true },
          { label: "Status" },
          { label: "" },
        ]}
      >
        {filtered.length === 0 ? (
          <tr><td colSpan={7} className={ts.empty}>No sessions match your filters.</td></tr>
        ) : (
          filtered.map(item => {
            const isExpanded = expandedId === item.id
            const isPending = (item.status || "scheduled") !== "completed"
            const signoffs = isExpanded && expandedDetail?.signoffs ? expandedDetail.signoffs : []

            return (
              <tbody key={item.id}>
                <tr
                  className={`${ts.tr} ${isPending ? s.pendingRow : ""}`}
                  onClick={() => handleExpand(item.id)}
                  style={{ cursor: "pointer" }}
                >
                  <td className={`${ts.td} ${ts.tdMono}`}>
                    {formatDate(item.training_date)}
                  </td>
                  <td className={ts.td}>
                    {item.type ? <StatusBadge variant="gray">{item.type}</StatusBadge> : "\u2014"}
                  </td>
                  <td className={ts.td}>
                    <span className={s.nameText}>{item.title}</span>
                  </td>
                  <td className={ts.td}>
                    {item.trainer || <span className={ts.tdMuted}>--</span>}
                  </td>
                  <td className={`${ts.td} ${ts.tdMono}`} style={{ textAlign: "right" }}>
                    {item.signoff_count || 0}
                  </td>
                  <td className={ts.td}>
                    <StatusBadge variant={getStatusVariant(item.status)}>
                      {getStatusLabel(item.status)}
                    </StatusBadge>
                  </td>
                  <td className={ts.td} style={{ width: 36 }}>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </td>
                </tr>
                {isExpanded && (
                  <tr className={s.expandedRow}>
                    <td colSpan={7} className={s.expandedCell}>
                      <div className={s.expandedContent}>
                        <div className={s.expandedHeader}>
                          <div className={s.expandedLabel}>Attendees ({signoffs.length})</div>
                          <button
                            className={s.editBtn}
                            onClick={e => { e.stopPropagation(); onSelect(item.id) }}
                          >
                            View Details
                          </button>
                        </div>
                        {signoffs.length === 0 ? (
                          <div className={s.expandedEmpty}>No sign-offs recorded.</div>
                        ) : (
                          <div className={s.attendeeList}>
                            {signoffs.map(so => (
                              <div key={so.id} className={s.attendeeRow}>
                                <div className={s.attendeeAvatar}>
                                  {(so.first_name?.[0] || "?").toUpperCase()}
                                </div>
                                <div className={s.attendeeName}>
                                  {so.first_name} {so.last_name}
                                </div>
                                <div className={s.attendeeDate}>
                                  {new Date(so.signed_at).toLocaleDateString("en-US", {
                                    month: "short", day: "numeric",
                                    hour: "numeric", minute: "2-digit",
                                  })}
                                </div>
                                <CheckCircle size={14} color="var(--grn)" />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            )
          })
        )}
      </DataTable>
    </>
  )
}


// ===================================================
// Tab 2: Tailgate Meetings — Card layout with progress
// ===================================================
function TailgateTab({ data, onSelect, employees, onSignoff }) {
  const [searchQ, setSearchQ] = useState("")

  const filtered = data.filter(item => {
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return item.title.toLowerCase().includes(q) || (item.trainer || "").toLowerCase().includes(q)
  })

  return (
    <>
      <div className={s.filterBar}>
        <div className={s.searchWrap}>
          <Search size={15} className={s.searchIcon} />
          <input
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search tailgate meetings..."
            className={s.searchInput}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={s.emptyInline}>No tailgate meetings match your search.</div>
      ) : (
        <div className={s.tailgateGrid}>
          {filtered.map(item => (
            <TailgateCard
              key={item.id}
              item={item}
              totalEmployees={employees.length}
              onSelect={() => onSelect(item.id)}
            />
          ))}
        </div>
      )}
    </>
  )
}

function TailgateCard({ item, totalEmployees, onSelect }) {
  const signed = item.signoff_count || 0
  const total = totalEmployees || 1
  const pct = Math.min((signed / total) * 100, 100)
  const isComplete = signed >= total

  return (
    <div className={s.tailgateCard} onClick={onSelect} role="button" tabIndex={0}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect())}
    >
      <div className={s.tailgateTop}>
        <div className={s.tailgateTitle}>{item.title}</div>
        <StatusBadge variant={isComplete ? "green" : "amber"}>
          {isComplete ? "Complete" : "In Progress"}
        </StatusBadge>
      </div>
      <div className={s.tailgateMeta}>
        <span className={s.mono}>{formatDate(item.training_date)}</span>
        {item.trainer && <span> &middot; {item.trainer}</span>}
      </div>
      <div className={s.progressWrap}>
        <div className={s.progressBar}>
          <div
            className={s.progressFill}
            style={{ width: `${pct}%`, background: isComplete ? "var(--grn)" : "var(--amb)" }}
          />
        </div>
        <div className={s.progressLabel}>
          {signed} of {total} signed
        </div>
      </div>
    </div>
  )
}


// ===================================================
// Tab 3: Video Training — Card grid (placeholder)
// ===================================================
function VideoTab({ data, onSelect }) {
  if (data.length === 0) return null // empty state handled by PageShell

  return (
    <div className={s.videoGrid}>
      {data.map(item => (
        <div key={item.id} className={s.videoCard} onClick={() => onSelect(item.id)}
          role="button" tabIndex={0}
          onKeyDown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(item.id))}
        >
          <div className={s.videoIconWrap}>
            <Video size={24} color="var(--amb)" />
          </div>
          <div className={s.videoInfo}>
            <div className={s.videoTitle}>{item.title}</div>
            <div className={s.videoMeta}>
              <span className={s.mono}>{formatDate(item.training_date)}</span>
              {item.trainer && <span> &middot; {item.trainer}</span>}
            </div>
          </div>
          <div className={s.videoSignoffs}>
            <div className={s.videoSignoffCount}>{item.signoff_count || 0}</div>
            <div className={s.videoSignoffLabel}>completed</div>
          </div>
        </div>
      ))}
    </div>
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

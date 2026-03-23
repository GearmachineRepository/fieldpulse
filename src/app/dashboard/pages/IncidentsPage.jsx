// ═══════════════════════════════════════════
// Incidents Page — Full CRUD with locking
// Compliance-first incident reporting with
// severity/status badges, detail panel, and
// irreversible report locking.
// ═══════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react"
import {
  AlertTriangle, Plus, Search, Edit3, Trash2, Lock,
  Calendar, MapPin, Shield, FileText, Users, Eye,
  Camera, X, Upload, Image as ImageIcon,
} from "lucide-react"
import AddressLink from "../components/AddressLink.jsx"
import usePageData from "@/hooks/usePageData.js"
import useToast from "@/hooks/useToast.js"
import {
  getIncidents, createIncident, updateIncident, deleteIncident, lockIncident,
  getIncidentPhotos, uploadIncidentPhoto, deleteIncidentPhoto,
} from "@/lib/api/incidents.js"
import { getEmployees } from "@/lib/api/employees.js"
import PageShell from "../components/PageShell.jsx"
import DataTable from "../components/DataTable.jsx"
import SlidePanel from "../components/SlidePanel.jsx"
import StatusBadge from "../components/StatusBadge.jsx"
import TabBar from "../components/TabBar.jsx"
import {
  Modal, ModalFooter, ConfirmModal, FormField, SelectField, TextareaField,
} from "../components/PageUI.jsx"
import s from "./IncidentsPage.module.css"

const ts = DataTable.s

const SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
]

const TYPES = [
  { value: "injury", label: "Injury" },
  { value: "near-miss", label: "Near Miss" },
  { value: "property-damage", label: "Property Damage" },
  { value: "environmental", label: "Environmental" },
  { value: "other", label: "Other" },
]

const STATUSES = [
  { value: "open", label: "Open" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
]

function getSeverityVariant(sev) {
  switch (sev) {
    case "critical": return "red"
    case "high": return "amber"
    case "medium": return "amber"
    case "low": default: return "gray"
  }
}

function getStatusVariant(status) {
  switch (status) {
    case "open": return "amber"
    case "investigating": return "blue"
    case "resolved": return "green"
    case "closed": return "gray"
    default: return "gray"
  }
}

function formatDate(d) {
  if (!d) return "\u2014"
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function reporterName(row) {
  if (row.reporter_first_name && row.reporter_last_name) {
    return `${row.reporter_first_name} ${row.reporter_last_name}`
  }
  return null
}

function typeLabel(val) {
  const match = TYPES.find(t => t.value === val)
  return match ? match.label : val || "\u2014"
}

/** Build a URL for an uploaded file (mirrors /uploads/:filename redirect) */
function photoUrl(filename) {
  return `/uploads/${filename}`
}

export default function IncidentsPage() {
  const toast = useToast()
  const incidents = usePageData("incidents", {
    fetchFn: getIncidents,
    createFn: createIncident,
    updateFn: updateIncident,
    deleteFn: deleteIncident,
  })
  const employees = usePageData("employees", { fetchFn: getEmployees })

  const [searchQ, setSearchQ] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(null)

  const selectedItem = incidents.data.find(i => i.id === selectedId) || null

  // Stats
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const totalYTD = incidents.data.filter(i => new Date(i.incident_date) >= yearStart).length
  const openUnresolved = incidents.data.filter(i => i.status === "open" || i.status === "investigating").length
  const withInjury = incidents.data.filter(i => i.injury_occurred).length

  // Filtering
  const filtered = incidents.data.filter(i => {
    if (searchQ) {
      const q = searchQ.toLowerCase()
      if (
        !i.title.toLowerCase().includes(q) &&
        !(i.location || "").toLowerCase().includes(q) &&
        !(reporterName(i) || "").toLowerCase().includes(q)
      ) return false
    }
    if (typeFilter && i.type !== typeFilter) return false
    if (statusFilter && i.status !== statusFilter) return false
    return true
  })

  const handleSave = async (data) => {
    try {
      if (editing.id) {
        await incidents.update(editing.id, data)
        toast.show("Incident updated")
      } else {
        await incidents.create(data)
        toast.show("Incident reported")
      }
      setEditing(null)
    } catch (err) {
      toast.show(err.message || "Failed to save")
    }
  }

  const handleDelete = async (id) => {
    try {
      await incidents.remove(id)
      toast.show("Incident removed")
      setEditing(null)
      if (selectedId === id) setSelectedId(null)
    } catch (err) {
      toast.show(err.message || "Failed to remove")
    }
  }

  const handleLock = async (id) => {
    try {
      await lockIncident(id)
      await incidents.refresh()
      toast.show("Report locked")
    } catch (err) {
      toast.show(err.message || "Failed to lock report")
    }
  }

  return (
    <>
    <PageShell
      title="Incidents"
      count={incidents.data.length}
      countLabel={`incident${incidents.data.length !== 1 ? "s" : ""}`}
      loading={incidents.loading && !incidents.data.length}
      skeleton="table"
      empty={incidents.data.length === 0}
      emptyIcon={AlertTriangle}
      emptyTitle="No incidents reported"
      emptyDescription="Report workplace incidents to maintain compliance. All reports can be locked for immutability."
      emptyCta="Report Incident"
      onEmptyCta={() => setEditing({})}
      actions={
        <button className={s.addBtn} onClick={() => setEditing({})}>
          <Plus size={15} /> Report Incident
        </button>
      }
    >
      {/* Stat Row */}
      <div className={s.statsRow}>
        <div className={s.statCard}>
          <div className={s.statLabel}>Total This Year</div>
          <div className={s.statValue}>{totalYTD}</div>
        </div>
        <div className={s.statCard}>
          <div className={s.statLabel}>Open / Unresolved</div>
          <div className={s.statValue}>{openUnresolved}</div>
        </div>
        <div className={s.statCard}>
          <div className={s.statLabel}>Involving Injury</div>
          <div className={`${s.statValue} ${withInjury > 0 ? s.statDanger : ""}`}>{withInjury}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={s.filterBar}>
        <div className={s.searchWrap}>
          <Search size={15} className={s.searchIcon} />
          <input
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search incidents..."
            className={s.searchInput}
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className={s.filterSelect}
        >
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
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
          { label: "Severity" },
          { label: "Type" },
          { label: "Reporter" },
          { label: "Status" },
          { label: "", width: "40px" },
        ]}
      >
        {filtered.length === 0 ? (
          <tr><td colSpan={7} className={ts.empty}>No incidents match your filters.</td></tr>
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
                    <AlertTriangle size={16} color="var(--amb)" />
                  </div>
                  <span className={s.titleText}>{item.title}</span>
                </div>
              </td>
              <td className={`${ts.td} ${ts.tdMono}`}>
                {formatDate(item.incident_date)}
              </td>
              <td className={ts.td}>
                <StatusBadge variant={getSeverityVariant(item.severity)}>
                  {(item.severity || "low").charAt(0).toUpperCase() + (item.severity || "low").slice(1)}
                </StatusBadge>
              </td>
              <td className={ts.td}>
                {typeLabel(item.type)}
              </td>
              <td className={ts.td}>
                {reporterName(item) || <span className={ts.tdMuted}>Unknown</span>}
              </td>
              <td className={ts.td}>
                <StatusBadge variant={getStatusVariant(item.status)}>
                  {(item.status || "open").charAt(0).toUpperCase() + (item.status || "open").slice(1)}
                </StatusBadge>
              </td>
              <td className={ts.td}>
                {item.report_locked && (
                  <span className={s.lockedBadge} title="Report locked">
                    <Lock size={13} />
                  </span>
                )}
              </td>
            </tr>
          ))
        )}
      </DataTable>
    </PageShell>

    {/* Detail SlidePanel */}
    <SlidePanel
      open={!!selectedItem}
      onClose={() => setSelectedId(null)}
      title={selectedItem?.title || "Incident"}
    >
      {selectedItem && (
        <IncidentDetail
          item={selectedItem}
          onEdit={() => setEditing(selectedItem)}
          onDelete={() => handleDelete(selectedItem.id)}
          onLock={() => handleLock(selectedItem.id)}
          toast={toast}
          onRefresh={() => incidents.refresh()}
        />
      )}
    </SlidePanel>

    {/* Create / Edit Modal */}
    {editing !== null && (
      <IncidentModal
        item={editing}
        employees={employees.data}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        onDelete={editing.id && !editing.report_locked ? () => handleDelete(editing.id) : undefined}
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
// Incident Detail — shown in SlidePanel with tabs
// ===================================================
function IncidentDetail({ item, onEdit, onDelete, onLock, toast, onRefresh }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmLock, setConfirmLock] = useState(false)
  const [tab, setTab] = useState("info")

  // Photo state
  const [photos, setPhotos] = useState([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [photoCount, setPhotoCount] = useState(item.photo_count || 0)

  const loadPhotos = useCallback(async () => {
    setPhotosLoading(true)
    try {
      const data = await getIncidentPhotos(item.id)
      setPhotos(data)
      setPhotoCount(data.length)
    } catch {
      setPhotos([])
    } finally {
      setPhotosLoading(false)
    }
  }, [item.id])

  // Load photos when switching to photos tab or when item changes
  useEffect(() => {
    if (tab === "photos") {
      loadPhotos()
    }
  }, [tab, item.id, loadPhotos])

  // Initialize photo count from item data
  useEffect(() => {
    setPhotoCount(item.photo_count || 0)
  }, [item.photo_count])

  const tabs = [
    { key: "info", label: "Info" },
    { key: "investigation", label: "Investigation" },
    { key: "photos", label: `Photos${photoCount > 0 ? ` (${photoCount})` : ""}` },
  ]

  if (confirmDelete) {
    return (
      <ConfirmModal
        title={`Delete "${item.title}"?`}
        message="This will permanently remove the incident report."
        onConfirm={() => { onDelete(); setConfirmDelete(false) }}
        onCancel={() => setConfirmDelete(false)}
      />
    )
  }

  if (confirmLock) {
    return (
      <ConfirmModal
        title="Lock this report?"
        message="Locking is irreversible. Once locked, the report cannot be edited or deleted. This is a compliance requirement."
        confirmLabel="Lock Report"
        confirmColor="var(--amb)"
        onConfirm={() => { onLock(); setConfirmLock(false) }}
        onCancel={() => setConfirmLock(false)}
      />
    )
  }

  return (
    <div className={s.detailContent}>
      <div className={s.detailActions}>
        {!item.report_locked && (
          <>
            <button className={s.editBtn} onClick={onEdit}>
              <Edit3 size={14} /> Edit
            </button>
            <button className={s.deleteBtn} onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} />
            </button>
          </>
        )}
        {item.report_locked ? (
          <div className={s.lockedIndicator}>
            <Lock size={14} /> Report Locked
          </div>
        ) : (
          <button className={s.lockBtn} onClick={() => setConfirmLock(true)}>
            <Lock size={14} /> Lock Report
          </button>
        )}
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === "info" && (
        <div className={s.fieldList}>
          <DetailField icon={FileText} label="Title" value={item.title} />
          <DetailField icon={Calendar} label="Date" value={formatDate(item.incident_date)} mono />
          <DetailField icon={MapPin} label="Location" value={item.location ? <AddressLink location={item.location} /> : "—"} />
          <DetailField icon={Shield} label="Severity" value={item.severity ? item.severity.charAt(0).toUpperCase() + item.severity.slice(1) : "Low"} />
          <DetailField icon={AlertTriangle} label="Type" value={typeLabel(item.type)} />
          <DetailField icon={Users} label="Reported By" value={reporterName(item)} />
          <DetailField icon={Eye} label="Status" value={item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : "Open"} />
          {item.description && (
            <DetailField icon={FileText} label="Description" value={item.description} />
          )}
          {item.injury_occurred && (
            <DetailField icon={Shield} label="Injury Description" value={item.injury_description || "Injury occurred (no details provided)"} />
          )}
          {item.witnesses && (
            <DetailField icon={Users} label="Witnesses" value={item.witnesses} />
          )}
        </div>
      )}

      {tab === "investigation" && (
        <div className={s.fieldList}>
          {item.investigation_notes ? (
            <DetailField icon={FileText} label="Investigation Notes" value={item.investigation_notes} />
          ) : (
            <div className={s.emptyTab}>
              <FileText size={28} strokeWidth={1} className={s.emptyTabIcon} />
              <div className={s.emptyTabTitle}>No investigation notes</div>
              <div className={s.emptyTabDesc}>Edit the incident to add investigation notes and corrective actions.</div>
            </div>
          )}
          {item.corrective_actions && (
            <DetailField icon={Shield} label="Corrective Actions" value={item.corrective_actions} />
          )}
        </div>
      )}

      {tab === "photos" && (
        <PhotosTab
          incidentId={item.id}
          locked={item.report_locked}
          photos={photos}
          loading={photosLoading}
          onRefresh={() => { loadPhotos(); onRefresh() }}
          toast={toast}
        />
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
// Photos Tab — upload, grid, lightbox, delete
// ===================================================
function PhotosTab({ incidentId, locked, photos, loading, onRefresh, toast }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so same file can be selected again
    e.target.value = ""

    setUploading(true)
    try {
      await uploadIncidentPhoto(incidentId, file)
      toast.show("Photo uploaded")
      onRefresh()
    } catch (err) {
      toast.show(err.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (photoId) => {
    try {
      await deleteIncidentPhoto(incidentId, photoId)
      toast.show("Photo removed")
      setConfirmDeleteId(null)
      onRefresh()
    } catch (err) {
      toast.show(err.message || "Failed to remove photo")
    }
  }

  if (confirmDeleteId) {
    return (
      <ConfirmModal
        title="Delete this photo?"
        message="This will permanently remove the photo from the incident report."
        onConfirm={() => handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    )
  }

  if (lightboxPhoto) {
    return (
      <div className={s.lightboxOverlay} onClick={() => setLightboxPhoto(null)}>
        <div className={s.lightboxContent} onClick={e => e.stopPropagation()}>
          <button className={s.lightboxClose} onClick={() => setLightboxPhoto(null)}>
            <X size={18} />
          </button>
          <img
            src={photoUrl(lightboxPhoto.filename)}
            alt={lightboxPhoto.originalName || "Incident photo"}
            className={s.lightboxImage}
          />
          {lightboxPhoto.caption && (
            <div className={s.lightboxCaption}>{lightboxPhoto.caption}</div>
          )}
          <div className={s.lightboxMeta}>
            {lightboxPhoto.originalName}
            {lightboxPhoto.uploaderName && ` — ${lightboxPhoto.uploaderName}`}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={s.photosTab}>
      {locked && (
        <div className={s.lockedNotice}>
          <Lock size={14} />
          Report is locked — photos cannot be added or removed.
        </div>
      )}

      {!locked && (
        <div className={s.photoUploadBar}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/heic"
            onChange={handleFileSelect}
            className={s.hiddenInput}
          />
          <button
            className={s.uploadBtn}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Upload size={14} className={s.uploadingIcon} /> Uploading...
              </>
            ) : (
              <>
                <Camera size={14} /> Add Photo
              </>
            )}
          </button>
        </div>
      )}

      {loading ? (
        <div className={s.emptyTab}>
          <div className={s.emptyTabDesc}>Loading photos...</div>
        </div>
      ) : photos.length === 0 ? (
        <div className={s.emptyTab}>
          <ImageIcon size={28} strokeWidth={1} className={s.emptyTabIcon} />
          <div className={s.emptyTabTitle}>No photos</div>
          <div className={s.emptyTabDesc}>
            {locked
              ? "No photos were added before this report was locked."
              : "Add photos to document the incident scene, damage, or conditions."}
          </div>
        </div>
      ) : (
        <div className={s.photoGrid}>
          {photos.map(photo => (
            <div key={photo.id} className={s.photoCard}>
              <div
                className={s.photoThumb}
                onClick={() => setLightboxPhoto(photo)}
              >
                <img
                  src={photoUrl(photo.filename)}
                  alt={photo.caption || photo.originalName || "Incident photo"}
                  className={s.photoImage}
                />
              </div>
              <div className={s.photoInfo}>
                <div className={s.photoName} title={photo.originalName}>
                  {photo.caption || photo.originalName}
                </div>
                {!locked && (
                  <button
                    className={s.photoDeleteBtn}
                    onClick={() => setConfirmDeleteId(photo.id)}
                    title="Delete photo"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// ===================================================
// Incident Modal — Create / Edit
// ===================================================
function IncidentModal({ item, employees, onClose, onSave, onDelete }) {
  const isEdit = !!item.id
  const [title, setTitle] = useState(item.title || "")
  const [description, setDescription] = useState(item.description || "")
  const [incidentDate, setIncidentDate] = useState(
    item.incident_date ? new Date(item.incident_date).toISOString().slice(0, 16) : ""
  )
  const [location, setLocation] = useState(item.location || "")
  const [severity, setSeverity] = useState(item.severity || "low")
  const [type, setType] = useState(item.type || "")
  const [reportedBy, setReportedBy] = useState(item.reported_by ? String(item.reported_by) : "")
  const [status, setStatus] = useState(item.status || "open")
  const [injuryOccurred, setInjuryOccurred] = useState(item.injury_occurred || false)
  const [injuryDescription, setInjuryDescription] = useState(item.injury_description || "")
  const [investigationNotes, setInvestigationNotes] = useState(item.investigation_notes || "")
  const [correctiveActions, setCorrectiveActions] = useState(item.corrective_actions || "")
  const [witnesses, setWitnesses] = useState(item.witnesses || "")
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !incidentDate) return
    setSaving(true)
    await onSave({
      title: title.trim(),
      description: description || undefined,
      incidentDate,
      location: location || undefined,
      severity,
      type: type || undefined,
      reportedBy: reportedBy ? parseInt(reportedBy) : undefined,
      status,
      injuryOccurred,
      injuryDescription: injuryOccurred ? injuryDescription : undefined,
      investigationNotes: investigationNotes || undefined,
      correctiveActions: correctiveActions || undefined,
      witnesses: witnesses || undefined,
    })
    setSaving(false)
  }

  if (confirmDelete) {
    return (
      <ConfirmModal
        title={`Delete "${item.title}"?`}
        message="This will permanently remove the incident report."
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    )
  }

  return (
    <Modal title={isEdit ? "Edit Incident" : "Report Incident"} onClose={onClose} size="lg">
      <FormField label="Title *" value={title} onChange={setTitle} autoFocus placeholder="Brief incident title" />
      <FormField label="Date & Time *" value={incidentDate} onChange={setIncidentDate} type="datetime-local" />
      <div className={s.formRow}>
        <SelectField
          label="Severity"
          value={severity}
          onChange={setSeverity}
          options={SEVERITIES}
        />
        <SelectField
          label="Type"
          value={type}
          onChange={setType}
          placeholder="Select type"
          options={TYPES}
        />
      </div>
      <FormField label="Location" value={location} onChange={setLocation} placeholder="e.g. Job site, warehouse" />
      <SelectField
        label="Reported By"
        value={reportedBy}
        onChange={setReportedBy}
        placeholder="Select employee"
        options={employees.map(e => ({ value: String(e.id), label: `${e.first_name} ${e.last_name}` }))}
      />
      <TextareaField label="Description" value={description} onChange={setDescription} placeholder="What happened?" rows={3} />

      {/* Injury */}
      <div className={s.checkRow}>
        <label className={s.checkLabel}>
          <input
            type="checkbox"
            checked={injuryOccurred}
            onChange={e => setInjuryOccurred(e.target.checked)}
            className={s.checkbox}
          />
          Injury Occurred
        </label>
      </div>
      {injuryOccurred && (
        <TextareaField
          label="Injury Description"
          value={injuryDescription}
          onChange={setInjuryDescription}
          placeholder="Describe the injury..."
          rows={2}
        />
      )}

      <TextareaField label="Witnesses" value={witnesses} onChange={setWitnesses} placeholder="Names of witnesses" rows={2} />

      {isEdit && (
        <>
          <SelectField
            label="Status"
            value={status}
            onChange={setStatus}
            options={STATUSES}
          />
          <TextareaField label="Investigation Notes" value={investigationNotes} onChange={setInvestigationNotes} placeholder="Investigation findings..." rows={3} />
          <TextareaField label="Corrective Actions" value={correctiveActions} onChange={setCorrectiveActions} placeholder="Steps taken to prevent recurrence..." rows={3} />
        </>
      )}

      <ModalFooter
        onClose={onClose}
        onSave={handleSubmit}
        saving={saving}
        disabled={!title.trim() || !incidentDate}
        onDelete={onDelete ? () => setConfirmDelete(true) : undefined}
      />
    </Modal>
  )
}

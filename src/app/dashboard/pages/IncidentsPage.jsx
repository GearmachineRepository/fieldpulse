// ═══════════════════════════════════════════
// Incidents Page — Stat row + DataTable + 5-step Wizard
// Compliance-first incident reporting with locking
// ═══════════════════════════════════════════

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  AlertTriangle, Plus, Search, Edit3, Trash2, Lock,
  Calendar, MapPin, Shield, FileText, Users, Eye,
  Camera, X, Upload, Image as ImageIcon, Car, HardHat,
  Zap, Building, CircleDot, CheckCircle2, Clock,
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
import StatCard from "../components/StatCard.jsx"
import DataTable from "../components/DataTable.jsx"
import SlidePanel from "../components/SlidePanel.jsx"
import StatusBadge from "../components/StatusBadge.jsx"
import TabBar from "../components/TabBar.jsx"
import WizardLayout from "../components/WizardLayout.jsx"
import {
  Modal, ModalFooter, ConfirmModal, FormField, SelectField, TextareaField,
} from "../components/PageUI.jsx"
import s from "./IncidentsPage.module.css"

const ts = DataTable.s

const INCIDENT_TYPES = [
  { value: "vehicle-accident", label: "Vehicle Accident", icon: Car },
  { value: "injury", label: "Workplace Injury", icon: HardHat },
  { value: "near-miss", label: "Near Miss", icon: Zap },
  { value: "equipment", label: "Equipment Incident", icon: CircleDot },
  { value: "property-damage", label: "Property Damage", icon: Building },
]

const SEVERITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
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
  const match = INCIDENT_TYPES.find(t => t.value === val)
  return match ? match.label : val || "\u2014"
}

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
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardInitial, setWizardInitial] = useState(null) // null = new, object = edit

  const selectedItem = incidents.data.find(i => i.id === selectedId) || null

  // Stats
  const stats = useMemo(() => {
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)
    return {
      totalYTD: incidents.data.filter(i => new Date(i.incident_date) >= yearStart).length,
      openUnresolved: incidents.data.filter(i => i.status === "open" || i.status === "investigating").length,
      withInjury: incidents.data.filter(i => i.injury_occurred).length,
    }
  }, [incidents.data])

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

  const handleWizardSave = async (data) => {
    try {
      if (wizardInitial?.id) {
        await incidents.update(wizardInitial.id, data)
        toast.show("Incident updated")
      } else {
        const result = await incidents.create(data)
        toast.show("Incident reported")
        // Auto-lock if submitted with signature confirmation
        if (data._lock && result?.id) {
          try { await lockIncident(result.id); incidents.refresh() } catch {}
        }
      }
      setWizardOpen(false)
      setWizardInitial(null)
    } catch (err) {
      toast.show(err.message || "Failed to save")
    }
  }

  const handleDelete = async (id) => {
    try {
      await incidents.remove(id)
      toast.show("Incident removed")
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

  const openEditWizard = (item) => {
    if (item.report_locked) return
    setWizardInitial(item)
    setWizardOpen(true)
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
        onEmptyCta={() => { setWizardInitial(null); setWizardOpen(true) }}
        actions={
          <button className={s.addBtn} onClick={() => { setWizardInitial(null); setWizardOpen(true) }}>
            <Plus size={15} /> Report Incident
          </button>
        }
      >
        {/* Stat Row */}
        <div className={s.statsRow}>
          <StatCard label="Total This Year" value={stats.totalYTD} color="var(--amb)" icon={AlertTriangle} />
          <StatCard label="Open / Unresolved" value={stats.openUnresolved} color="var(--amb)" icon={Clock} />
          <div className={stats.withInjury > 0 ? s.statRedTint : undefined}>
            <StatCard label="Involving Injury" value={stats.withInjury} color="var(--red)" icon={Shield} />
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
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className={s.filterSelect}>
            <option value="">All Types</option>
            {INCIDENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={s.filterSelect}>
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
            filtered.map(item => {
              const rowAccent = item.injury_occurred ? s.rowInjury
                : (item.status === "open" || item.status === "investigating") ? s.rowOpen
                : ""
              return (
                <tr
                  key={item.id}
                  className={`${ts.tr} ${rowAccent}`}
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
                  <td className={`${ts.td} ${ts.tdMono}`}>{formatDate(item.incident_date)}</td>
                  <td className={ts.td}>
                    <StatusBadge variant={getSeverityVariant(item.severity)}>
                      {(item.severity || "low").charAt(0).toUpperCase() + (item.severity || "low").slice(1)}
                    </StatusBadge>
                  </td>
                  <td className={ts.td}>{typeLabel(item.type)}</td>
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
                      <span className={s.lockedBadge} title="Report locked"><Lock size={13} /></span>
                    )}
                  </td>
                </tr>
              )
            })
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
            onEdit={() => openEditWizard(selectedItem)}
            onDelete={() => handleDelete(selectedItem.id)}
            onLock={() => handleLock(selectedItem.id)}
            toast={toast}
            onRefresh={() => incidents.refresh()}
          />
        )}
      </SlidePanel>

      {/* 5-Step Wizard */}
      {wizardOpen && (
        <IncidentWizard
          initialData={wizardInitial}
          employees={employees.data}
          onClose={() => { setWizardOpen(false); setWizardInitial(null) }}
          onSave={handleWizardSave}
        />
      )}

      {toast.message && (
        <div className={s.toast} role="status" aria-live="polite">{toast.message}</div>
      )}
    </>
  )
}


// ===================================================
// 5-Step Incident Wizard
// ===================================================
const WIZARD_STEPS = [
  { key: "type", label: "Type & Info" },
  { key: "parties", label: "Parties" },
  { key: "photos", label: "Photos" },
  { key: "response", label: "Response" },
  { key: "review", label: "Review" },
]

function IncidentWizard({ initialData, employees, onClose, onSave }) {
  const isEdit = !!initialData?.id
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Single formState object
  const [form, setForm] = useState(() => ({
    incidentType: initialData?.type || "",
    title: initialData?.title || "",
    description: initialData?.description || "",
    incidentDate: initialData?.incident_date
      ? new Date(initialData.incident_date).toISOString().slice(0, 16) : "",
    location: initialData?.location || "",
    severity: initialData?.severity || "low",
    reportedBy: initialData?.reported_by ? String(initialData.reported_by) : "",
    injuryOccurred: initialData?.injury_occurred || false,
    injuryDescription: initialData?.injury_description || "",
    // Parties
    witnesses: initialData?.witnesses || "",
    otherDriverName: initialData?.other_driver_name || "",
    otherDriverPhone: initialData?.other_driver_phone || "",
    otherDriverInsurance: initialData?.other_driver_insurance || "",
    equipmentDescription: initialData?.equipment_description || "",
    medicalTreatment: initialData?.medical_treatment || false,
    // Photos (handled by existing upload system after create)
    photoSlots: [],
    // Response
    supervisorNotified: initialData?.supervisor_notified || false,
    supervisorName: initialData?.supervisor_name || "",
    lawEnforcement: initialData?.law_enforcement || false,
    lawEnforcementReport: initialData?.law_enforcement_report || "",
    emergencyMedical: initialData?.emergency_medical || false,
    followUpActions: initialData?.corrective_actions || "",
    confirmed: false,
    // Review
    signatureName: "",
  }))

  const updateForm = (updates) => {
    setForm(prev => ({ ...prev, ...updates }))
  }

  // Step validation
  const canAdvance = useMemo(() => {
    switch (step) {
      case 0: return !!(form.incidentType && form.title.trim() && form.incidentDate)
      case 1: return true // parties step always allows advance
      case 2: return true // photos optional
      case 3: return form.confirmed
      case 4: return true
      default: return false
    }
  }, [step, form])

  const handleSubmit = async () => {
    setSubmitting(true)
    await onSave({
      title: form.title.trim(),
      description: form.description || undefined,
      incidentDate: form.incidentDate,
      location: form.location || undefined,
      severity: form.severity,
      type: form.incidentType || undefined,
      reportedBy: form.reportedBy ? parseInt(form.reportedBy) : undefined,
      status: "open",
      injuryOccurred: form.injuryOccurred,
      injuryDescription: form.injuryOccurred ? form.injuryDescription : undefined,
      witnesses: form.witnesses || undefined,
      correctiveActions: form.followUpActions || undefined,
      _lock: form.confirmed && !isEdit, // auto-lock on new report
    })
    setSubmitting(false)
  }

  return (
    <Modal title={isEdit ? "Edit Incident" : "Report Incident"} onClose={onClose} size="lg">
      <WizardLayout
        steps={WIZARD_STEPS}
        activeStep={step}
        canAdvance={canAdvance}
        onBack={() => setStep(s => Math.max(0, s - 1))}
        onNext={() => setStep(s => Math.min(WIZARD_STEPS.length - 1, s + 1))}
        onSubmit={handleSubmit}
        submitting={submitting}
      >
        {step === 0 && <WizardStep1 form={form} updateForm={updateForm} employees={employees} />}
        {step === 1 && <WizardStep2 form={form} updateForm={updateForm} />}
        {step === 2 && <WizardStep3 form={form} updateForm={updateForm} />}
        {step === 3 && <WizardStep4 form={form} updateForm={updateForm} />}
        {step === 4 && <WizardStep5 form={form} />}
      </WizardLayout>
    </Modal>
  )
}

// Step 1: Type + Basic Info
function WizardStep1({ form, updateForm, employees }) {
  return (
    <div className={s.wizardStep}>
      <div className={s.wizardStepTitle}>Incident Type</div>
      <div className={s.typeGrid}>
        {INCIDENT_TYPES.map(t => {
          const Icon = t.icon
          const isActive = form.incidentType === t.value
          return (
            <button
              key={t.value}
              className={`${s.typeCard} ${isActive ? s.typeCardActive : ""}`}
              onClick={() => updateForm({ incidentType: t.value })}
              type="button"
            >
              <Icon size={20} />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      <FormField label="Title *" value={form.title} onChange={v => updateForm({ title: v })} placeholder="Brief incident title" />
      <FormField label="Date & Time *" value={form.incidentDate} onChange={v => updateForm({ incidentDate: v })} type="datetime-local" />
      <div className={s.formRow}>
        <FormField label="Location" value={form.location} onChange={v => updateForm({ location: v })} placeholder="e.g. Job site, warehouse" />
        <SelectField
          label="Severity"
          value={form.severity}
          onChange={v => updateForm({ severity: v })}
          options={SEVERITIES}
        />
      </div>
      <SelectField
        label="Reported By"
        value={form.reportedBy}
        onChange={v => updateForm({ reportedBy: v })}
        placeholder="Select employee"
        options={employees.map(e => ({ value: String(e.id), label: `${e.first_name} ${e.last_name}` }))}
      />
      <TextareaField label="Description" value={form.description} onChange={v => updateForm({ description: v })} placeholder="What happened?" rows={3} />

      <div className={s.checkRow}>
        <label className={s.checkLabel}>
          <input type="checkbox" checked={form.injuryOccurred} onChange={e => updateForm({ injuryOccurred: e.target.checked })} className={s.checkbox} />
          Injury occurred
        </label>
      </div>
      {form.injuryOccurred && (
        <TextareaField label="Injury Description" value={form.injuryDescription} onChange={v => updateForm({ injuryDescription: v })} placeholder="Describe the injury..." rows={2} />
      )}
    </div>
  )
}

// Step 2: Parties Involved (adapts to type)
function WizardStep2({ form, updateForm }) {
  const isVehicle = form.incidentType === "vehicle-accident"
  const isEquipment = form.incidentType === "equipment"

  return (
    <div className={s.wizardStep}>
      <div className={s.wizardStepTitle}>Parties Involved</div>

      {isVehicle && (
        <>
          <div className={s.wizardSubtitle}>Other Driver Information</div>
          <div className={s.formRow}>
            <FormField label="Name" value={form.otherDriverName} onChange={v => updateForm({ otherDriverName: v })} placeholder="Full name" />
            <FormField label="Phone" value={form.otherDriverPhone} onChange={v => updateForm({ otherDriverPhone: v })} placeholder="(555) 000-0000" />
          </div>
          <FormField label="Insurance Info" value={form.otherDriverInsurance} onChange={v => updateForm({ otherDriverInsurance: v })} placeholder="Insurance company and policy #" />
        </>
      )}

      {isEquipment && (
        <TextareaField label="Equipment Description" value={form.equipmentDescription} onChange={v => updateForm({ equipmentDescription: v })} placeholder="Equipment make, model, ID number..." rows={2} />
      )}

      <TextareaField label="Witnesses" value={form.witnesses} onChange={v => updateForm({ witnesses: v })} placeholder="Names and contact info of witnesses" rows={3} />

      {(form.incidentType === "injury" || form.injuryOccurred) && (
        <div className={s.checkRow}>
          <label className={s.checkLabel}>
            <input type="checkbox" checked={form.medicalTreatment} onChange={e => updateForm({ medicalTreatment: e.target.checked })} className={s.checkbox} />
            Medical treatment administered
          </label>
        </div>
      )}
    </div>
  )
}

// Step 3: Scene Photos
function WizardStep3({ form, updateForm }) {
  const isVehicle = form.incidentType === "vehicle-accident"

  const slots = useMemo(() => {
    const base = []
    if (isVehicle) {
      base.push({ label: "Damage to company vehicle", required: true })
      base.push({ label: "Damage to other vehicle", required: true })
    }
    base.push({ label: "Scene overview", required: true })
    base.push({ label: "Location landmarks", required: false })
    return base
  }, [isVehicle])

  return (
    <div className={s.wizardStep}>
      <div className={s.wizardStepTitle}>Scene Photos</div>
      <div className={s.wizardStepDesc}>
        Photos will be uploaded after the report is created. Use the labeled slots below as a guide for what to capture.
      </div>
      <div className={s.photoSlotGrid}>
        {slots.map((slot, i) => (
          <div key={i} className={s.photoSlot}>
            <Camera size={20} color="var(--t3)" />
            <div className={s.photoSlotLabel}>{slot.label}</div>
            {slot.required && <span className={s.photoSlotRequired}>Required</span>}
          </div>
        ))}
        <div className={`${s.photoSlot} ${s.photoSlotAdd}`}>
          <Plus size={20} color="var(--t3)" />
          <div className={s.photoSlotLabel}>Additional photos</div>
        </div>
      </div>
    </div>
  )
}

// Step 4: Supervisor & Response
function WizardStep4({ form, updateForm }) {
  return (
    <div className={s.wizardStep}>
      <div className={s.wizardStepTitle}>Supervisor & Response</div>

      <div className={s.checkRow}>
        <label className={s.checkLabel}>
          <input type="checkbox" checked={form.supervisorNotified} onChange={e => updateForm({ supervisorNotified: e.target.checked })} className={s.checkbox} />
          Supervisor notified
        </label>
      </div>
      {form.supervisorNotified && (
        <FormField label="Supervisor Name" value={form.supervisorName} onChange={v => updateForm({ supervisorName: v })} placeholder="Name of supervisor notified" />
      )}

      <div className={s.checkRow}>
        <label className={s.checkLabel}>
          <input type="checkbox" checked={form.lawEnforcement} onChange={e => updateForm({ lawEnforcement: e.target.checked })} className={s.checkbox} />
          Law enforcement contacted
        </label>
      </div>
      {form.lawEnforcement && (
        <FormField label="Report # / Department" value={form.lawEnforcementReport} onChange={v => updateForm({ lawEnforcementReport: v })} placeholder="Police report number and department" />
      )}

      <div className={s.checkRow}>
        <label className={s.checkLabel}>
          <input type="checkbox" checked={form.emergencyMedical} onChange={e => updateForm({ emergencyMedical: e.target.checked })} className={s.checkbox} />
          Emergency medical services called
        </label>
      </div>

      <TextareaField label="Follow-up Actions" value={form.followUpActions} onChange={v => updateForm({ followUpActions: v })} placeholder="Steps taken or planned to prevent recurrence..." rows={3} />

      <div className={s.confirmBox}>
        <label className={s.checkLabel}>
          <input type="checkbox" checked={form.confirmed} onChange={e => updateForm({ confirmed: e.target.checked })} className={s.checkbox} />
          <span>I confirm all information in this report is accurate to the best of my knowledge.</span>
        </label>
      </div>
    </div>
  )
}

// Step 5: Review + Submit
function WizardStep5({ form }) {
  return (
    <div className={s.wizardStep}>
      <div className={s.wizardStepTitle}>Review & Submit</div>
      <div className={s.reviewCard}>
        <div className={s.reviewRow}>
          <span className={s.reviewLabel}>Type</span>
          <span>{typeLabel(form.incidentType)}</span>
        </div>
        <div className={s.reviewRow}>
          <span className={s.reviewLabel}>Title</span>
          <span>{form.title}</span>
        </div>
        <div className={s.reviewRow}>
          <span className={s.reviewLabel}>Date</span>
          <span className={s.mono}>{form.incidentDate ? new Date(form.incidentDate).toLocaleString() : "\u2014"}</span>
        </div>
        <div className={s.reviewRow}>
          <span className={s.reviewLabel}>Location</span>
          <span>{form.location || "\u2014"}</span>
        </div>
        <div className={s.reviewRow}>
          <span className={s.reviewLabel}>Severity</span>
          <span>{form.severity}</span>
        </div>
        {form.injuryOccurred && (
          <div className={s.reviewRow}>
            <span className={s.reviewLabel}>Injury</span>
            <span>{form.injuryDescription || "Yes"}</span>
          </div>
        )}
        {form.witnesses && (
          <div className={s.reviewRow}>
            <span className={s.reviewLabel}>Witnesses</span>
            <span>{form.witnesses}</span>
          </div>
        )}
        {form.description && (
          <div className={s.reviewRow}>
            <span className={s.reviewLabel}>Description</span>
            <span>{form.description}</span>
          </div>
        )}
      </div>
      <div className={s.reviewNotice}>
        By submitting, this report will be created and can be locked for compliance immutability.
        Photos can be uploaded from the incident detail panel after submission.
      </div>
    </div>
  )
}


// ===================================================
// Incident Detail — shown in SlidePanel with tabs
// ===================================================
function IncidentDetail({ item, onEdit, onDelete, onLock, toast, onRefresh }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmLock, setConfirmLock] = useState(false)
  const [tab, setTab] = useState("info")
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

  useEffect(() => {
    if (tab === "photos") loadPhotos()
  }, [tab, item.id, loadPhotos])

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
            <button className={s.editBtn} onClick={onEdit}><Edit3 size={14} /> Edit</button>
            <button className={s.deleteBtn} onClick={() => setConfirmDelete(true)}><Trash2 size={14} /></button>
          </>
        )}
        {item.report_locked ? (
          <div className={s.lockedIndicator}><Lock size={14} /> Report Locked</div>
        ) : (
          <button className={s.lockBtn} onClick={() => setConfirmLock(true)}><Lock size={14} /> Lock Report</button>
        )}
      </div>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === "info" && (
        <div className={s.fieldList}>
          <DetailField icon={FileText} label="Title" value={item.title} />
          <DetailField icon={Calendar} label="Date" value={formatDate(item.incident_date)} mono />
          <DetailField icon={MapPin} label="Location" value={item.location ? <AddressLink location={item.location} /> : "\u2014"} />
          <DetailField icon={Shield} label="Severity" value={item.severity ? item.severity.charAt(0).toUpperCase() + item.severity.slice(1) : "Low"} />
          <DetailField icon={AlertTriangle} label="Type" value={typeLabel(item.type)} />
          <DetailField icon={Users} label="Reported By" value={reporterName(item)} />
          <DetailField icon={Eye} label="Status" value={item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : "Open"} />
          {item.description && <DetailField icon={FileText} label="Description" value={item.description} />}
          {item.injury_occurred && <DetailField icon={Shield} label="Injury Description" value={item.injury_description || "Injury occurred (no details provided)"} />}
          {item.witnesses && <DetailField icon={Users} label="Witnesses" value={item.witnesses} />}
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
          {item.corrective_actions && <DetailField icon={Shield} label="Corrective Actions" value={item.corrective_actions} />}
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
      <div className={s.fieldIcon}><Icon size={16} color="var(--t3)" /></div>
      <div>
        <div className={s.fieldLabel}>{label}</div>
        <div className={`${s.fieldValue} ${mono ? s.mono : ""}`}>{value || "\u2014"}</div>
      </div>
    </div>
  )
}


// ===================================================
// Photos Tab (unchanged from existing)
// ===================================================
function PhotosTab({ incidentId, locked, photos, loading, onRefresh, toast }) {
  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
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
          <button className={s.lightboxClose} onClick={() => setLightboxPhoto(null)}><X size={18} /></button>
          <img src={photoUrl(lightboxPhoto.filename)} alt={lightboxPhoto.originalName || "Incident photo"} className={s.lightboxImage} />
          {lightboxPhoto.caption && <div className={s.lightboxCaption}>{lightboxPhoto.caption}</div>}
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
        <div className={s.lockedNotice}><Lock size={14} /> Report is locked — photos cannot be added or removed.</div>
      )}
      {!locked && (
        <div className={s.photoUploadBar}>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/heic" onChange={handleFileSelect} className={s.hiddenInput} />
          <button className={s.uploadBtn} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? (<><Upload size={14} className={s.uploadingIcon} /> Uploading...</>) : (<><Camera size={14} /> Add Photo</>)}
          </button>
        </div>
      )}
      {loading ? (
        <div className={s.emptyTab}><div className={s.emptyTabDesc}>Loading photos...</div></div>
      ) : photos.length === 0 ? (
        <div className={s.emptyTab}>
          <ImageIcon size={28} strokeWidth={1} className={s.emptyTabIcon} />
          <div className={s.emptyTabTitle}>No photos</div>
          <div className={s.emptyTabDesc}>
            {locked ? "No photos were added before this report was locked." : "Add photos to document the incident scene, damage, or conditions."}
          </div>
        </div>
      ) : (
        <div className={s.photoGrid}>
          {photos.map(photo => (
            <div key={photo.id} className={s.photoCard}>
              <div className={s.photoThumb} onClick={() => setLightboxPhoto(photo)}>
                <img src={photoUrl(photo.filename)} alt={photo.caption || photo.originalName || "Incident photo"} className={s.photoImage} />
              </div>
              <div className={s.photoInfo}>
                <div className={s.photoName} title={photo.originalName}>{photo.caption || photo.originalName}</div>
                {!locked && (
                  <button className={s.photoDeleteBtn} onClick={() => setConfirmDeleteId(photo.id)} title="Delete photo"><Trash2 size={12} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

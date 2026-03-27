// ═══════════════════════════════════════════
// Certifications Page — Stat row + Dual view (Table / Timeline)
// All employee credentials in one audit-ready view
// ═══════════════════════════════════════════

import { useState, useMemo } from "react"
import {
  Award, Search, Download, AlertTriangle, CheckCircle2,
  Clock, Plus, Trash2, Edit3, LayoutList, CalendarRange,
} from "lucide-react"
import usePageData from "@/hooks/usePageData.js"
import useToast from "@/hooks/useToast.js"
import { getEmployees } from "@/lib/api/employees.js"
import {
  getCertifications, createCertification, updateCertification, deleteCertification,
} from "@/lib/api/certifications.js"
import PageShell from "../components/PageShell.jsx"
import StatCard from "../components/StatCard.jsx"
import DataTable from "../components/DataTable.jsx"
import StatusBadge from "../components/StatusBadge.jsx"
import {
  Modal, ModalFooter, ConfirmModal, FormField, SelectField,
} from "../components/PageUI.jsx"
import s from "./CertificationsPage.module.css"

const ts = DataTable.s

const CERT_TYPES = [
  "CDL", "Pesticide Applicator", "Forklift Operator", "OSHA 10", "OSHA 30",
  "First Aid / CPR", "Confined Space", "Fall Protection", "Crane Operator",
  "Hazmat", "Welding", "Electrical", "Custom",
]

function getExpiryStatus(expiryDate) {
  if (!expiryDate) return { variant: "gray", label: "No Expiry" }
  const now = new Date()
  const expiry = new Date(expiryDate)
  const daysUntil = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
  if (daysUntil < 0) return { variant: "red", label: "Expired", days: daysUntil }
  if (daysUntil <= 30) return { variant: "amber", label: "Expiring Soon", days: daysUntil }
  return { variant: "green", label: "Valid", days: daysUntil }
}

function formatDate(d) {
  if (!d) return "\u2014"
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function CertificationsPage() {
  const toast = useToast()
  const employees = usePageData("employees", { fetchFn: getEmployees })
  const certs = usePageData("certifications", {
    fetchFn: getCertifications,
    createFn: createCertification,
    updateFn: updateCertification,
    deleteFn: deleteCertification,
  })

  const [searchQ, setSearchQ] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [viewMode, setViewMode] = useState("table") // "table" | "timeline"
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const enriched = useMemo(() =>
    certs.data.map(c => ({
      ...c,
      employeeName: `${c.first_name || ""} ${c.last_name || ""}`.trim(),
      expiryStatus: getExpiryStatus(c.expiry_date),
    })),
    [certs.data]
  )

  const filtered = useMemo(() =>
    enriched.filter(c => {
      if (searchQ) {
        const q = searchQ.toLowerCase()
        if (!c.employeeName.toLowerCase().includes(q) && !(c.name || "").toLowerCase().includes(q)) return false
      }
      if (statusFilter) {
        const sv = c.expiryStatus.variant
        if (statusFilter === "valid" && sv !== "green") return false
        if (statusFilter === "expiring" && sv !== "amber") return false
        if (statusFilter === "expired" && sv !== "red") return false
      }
      if (typeFilter && (c.cert_type || "") !== typeFilter) return false
      return true
    }),
    [enriched, searchQ, statusFilter, typeFilter]
  )

  const stats = useMemo(() => {
    const s = { valid: 0, expiring: 0, expired: 0 }
    for (const c of enriched) {
      if (c.expiryStatus.variant === "green") s.valid++
      else if (c.expiryStatus.variant === "amber") s.expiring++
      else if (c.expiryStatus.variant === "red") s.expired++
    }
    return s
  }, [enriched])

  const handleAdd = async (data) => {
    try {
      await certs.create(data)
      toast.show("Certification added")
      setShowAdd(false)
    } catch (err) {
      toast.show(err.message || "Failed to add certification")
    }
  }

  const handleUpdate = async (data) => {
    try {
      await certs.update(editing.id, data)
      toast.show("Certification updated")
      setEditing(null)
    } catch (err) {
      toast.show(err.message || "Failed to update certification")
    }
  }

  const handleDelete = async (id) => {
    try {
      await certs.remove(id)
      toast.show("Certification removed")
      setConfirmDelete(null)
      setEditing(null)
    } catch {
      toast.show("Failed to remove certification")
    }
  }

  const isEmpty = !certs.loading && certs.data.length === 0

  return (
    <PageShell
      title="Certifications"
      count={certs.data.length}
      countLabel="certifications"
      loading={certs.loading && certs.data.length === 0}
      actions={
        <div className={s.headerActions}>
          <div className={s.viewToggle}>
            <button
              className={`${s.viewBtn} ${viewMode === "table" ? s.viewBtnActive : ""}`}
              onClick={() => setViewMode("table")}
              title="Table view"
            >
              <LayoutList size={14} />
            </button>
            <button
              className={`${s.viewBtn} ${viewMode === "timeline" ? s.viewBtnActive : ""}`}
              onClick={() => setViewMode("timeline")}
              title="Timeline view"
            >
              <CalendarRange size={14} />
            </button>
          </div>
          <button className={s.addBtn} onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Add Certification
          </button>
        </div>
      }
    >
      {/* Stat Row */}
      <div className={s.statsRow}>
        <StatCard label="Valid" value={stats.valid} color="var(--grn)" icon={CheckCircle2} />
        <StatCard label="Expiring Within 30 Days" value={stats.expiring} color="var(--amb)" icon={Clock} />
        <div className={stats.expired > 0 ? s.statRedTint : undefined}>
          <StatCard label="Expired" value={stats.expired} color="var(--red)" icon={AlertTriangle} />
        </div>
      </div>

      {/* Filter Bar */}
      <div className={s.filterBar}>
        <div className={s.filterField}>
          <label className={s.filterLabel}>Search</label>
          <div className={s.searchWrap}>
            <Search size={15} className={s.searchIcon} />
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search employees or certs..."
              className={s.searchInput}
            />
          </div>
        </div>
        <div className={s.filterField}>
          <label className={s.filterLabel}>Status</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={s.filterSelect}
          >
            <option value="">All</option>
            <option value="valid">Valid</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>
        <div className={s.filterField}>
          <label className={s.filterLabel}>Type</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className={s.filterSelect}
          >
            <option value="">All Types</option>
            {CERT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className={s.filterFieldExport}>
          <button className={s.exportBtn} title="Export (coming soon)">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className={s.emptyState}>
          <Award size={48} strokeWidth={1} className={s.emptyIcon} />
          <div className={s.emptyTitle}>No certifications tracked yet</div>
          <div className={s.emptyDesc}>
            Add employee certifications to track expiration dates,
            receive renewal alerts, and maintain audit-ready compliance records.
          </div>
          <button className={s.addBtn} onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add First Certification
          </button>
        </div>
      ) : viewMode === "table" ? (
        <CertTable
          filtered={filtered}
          onEdit={setEditing}
          onDelete={setConfirmDelete}
        />
      ) : (
        <CertTimeline filtered={filtered} onEdit={setEditing} />
      )}

      {/* Add Modal */}
      {showAdd && (
        <CertModal
          employees={employees.data}
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
        />
      )}

      {/* Edit Modal */}
      {editing && (
        <CertModal
          employees={employees.data}
          item={editing}
          onClose={() => setEditing(null)}
          onSave={handleUpdate}
          onDelete={() => setConfirmDelete(editing)}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title={`Remove "${confirmDelete.name}"?`}
          message={`This will permanently remove this certification${confirmDelete.employeeName ? ` from ${confirmDelete.employeeName}` : ""}.`}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
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
// Table View
// ===================================================
function CertTable({ filtered, onEdit, onDelete }) {
  return (
    <DataTable
      headers={[
        { label: "Employee" },
        { label: "Credential" },
        { label: "Issued" },
        { label: "Expires" },
        { label: "Days Left" },
        { label: "Status" },
        { label: "Actions", right: true },
      ]}
    >
      {filtered.length === 0 ? (
        <tr><td colSpan={7} className={ts.empty}>No certifications match your filters.</td></tr>
      ) : (
        filtered.map(cert => {
          const rowClass = cert.expiryStatus.variant === "red"
            ? `${ts.tr} ${s.rowExpired}`
            : cert.expiryStatus.variant === "amber"
              ? `${ts.tr} ${s.rowExpiring}`
              : ts.tr
          return (
            <tr key={cert.id} className={rowClass} style={{ cursor: "pointer" }} onClick={() => onEdit(cert)}>
              <td className={ts.td}>
                <div className={s.employeeCell}>
                  <div className={s.employeeAvatar}>
                    {(cert.first_name?.[0] || "?").toUpperCase()}
                  </div>
                  <span>{cert.employeeName}</span>
                </div>
              </td>
              <td className={ts.td}>
                <div>{cert.name}</div>
                {cert.issuing_authority && (
                  <div className={s.cellSub}>{cert.issuing_authority}</div>
                )}
              </td>
              <td className={`${ts.td} ${ts.tdMono}`}>{formatDate(cert.issued_date)}</td>
              <td className={`${ts.td} ${ts.tdMono}`}>{formatDate(cert.expiry_date)}</td>
              <td className={`${ts.td} ${ts.tdMono}`}>
                {cert.expiryStatus.days !== undefined ? (
                  <span style={{ color: `var(--${cert.expiryStatus.variant === "green" ? "grn" : cert.expiryStatus.variant === "amber" ? "amb" : "red"})` }}>
                    {cert.expiryStatus.days < 0 ? `${Math.abs(cert.expiryStatus.days)}d ago` : `${cert.expiryStatus.days}d`}
                  </span>
                ) : "\u2014"}
              </td>
              <td className={ts.td}>
                <StatusBadge variant={cert.expiryStatus.variant}>{cert.expiryStatus.label}</StatusBadge>
              </td>
              <td className={ts.tdAction} onClick={e => e.stopPropagation()}>
                <button className={s.rowActionBtn} onClick={() => onEdit(cert)} title="Edit">
                  <Edit3 size={14} />
                </button>
                <button className={s.rowDeleteBtn} onClick={() => onDelete(cert)} title="Remove">
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          )
        })
      )}
    </DataTable>
  )
}


// ===================================================
// Timeline View — 12-month horizontal axis
// ===================================================
function CertTimeline({ filtered, onEdit }) {
  const now = new Date()
  // 6 months back, 6 months forward
  const startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1)
  const endDate = new Date(now.getFullYear(), now.getMonth() + 6, 0)
  const totalMs = endDate.getTime() - startDate.getTime()

  // Generate month labels
  const months = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1)
    months.push({
      label: d.toLocaleDateString("en-US", { month: "short" }),
      year: d.getFullYear(),
      pct: ((d.getTime() - startDate.getTime()) / totalMs) * 100,
    })
  }

  // Today marker position
  const todayPct = ((now.getTime() - startDate.getTime()) / totalMs) * 100

  // Group by employee
  const grouped = {}
  for (const cert of filtered) {
    const name = cert.employeeName || "Unknown"
    if (!grouped[name]) grouped[name] = []
    grouped[name].push(cert)
  }

  const dateToPercent = (d) => {
    const ms = new Date(d).getTime()
    return ((ms - startDate.getTime()) / totalMs) * 100
  }

  return (
    <div className={s.timelineWrap}>
      {/* Month headers */}
      <div className={s.timelineHeader}>
        <div className={s.timelineNameCol} />
        <div className={s.timelineAxis}>
          {months.map((m, i) => (
            <div key={i} className={s.timelineMonth} style={{ left: `${m.pct}%` }}>
              {m.label}
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className={s.timelineBody}>
        {Object.entries(grouped).map(([name, empCerts]) => (
          <div key={name} className={s.timelineRow}>
            <div className={s.timelineNameCol}>
              <div className={s.timelineEmployeeName}>{name}</div>
            </div>
            <div className={s.timelineAxis}>
              {/* Today line */}
              <div className={s.todayLine} style={{ left: `${todayPct}%` }} />
              {/* Cert bars */}
              {empCerts.map(cert => {
                const hasIssued = !!cert.issued_date
                const hasExpiry = !!cert.expiry_date

                let left, width, barClass, label

                if (hasIssued && hasExpiry) {
                  left = Math.max(0, dateToPercent(cert.issued_date))
                  const right = Math.min(100, dateToPercent(cert.expiry_date))
                  width = Math.max(1, right - left)
                  barClass = s[`bar_${cert.expiryStatus.variant}`]
                } else if (!hasIssued && hasExpiry) {
                  // Missing issued_date: gray bar from today to expiry
                  left = Math.max(0, todayPct)
                  const right = Math.min(100, dateToPercent(cert.expiry_date))
                  width = Math.max(1, right - left)
                  barClass = s.bar_gray
                  label = "?"
                } else if (hasIssued && !hasExpiry) {
                  // No expiry: bar from issued to right edge
                  left = Math.max(0, dateToPercent(cert.issued_date))
                  width = Math.max(1, 100 - left)
                  barClass = s.bar_noexpiry
                } else {
                  // Neither date — skip
                  return null
                }

                return (
                  <div
                    key={cert.id}
                    className={`${s.timelineBar} ${barClass}`}
                    style={{ left: `${left}%`, width: `${width}%` }}
                    onClick={() => onEdit(cert)}
                    title={`${cert.name}: ${formatDate(cert.issued_date)} → ${formatDate(cert.expiry_date)}`}
                  >
                    {label && <span className={s.timelineBarLabel}>{label}</span>}
                    <span className={s.timelineBarText}>{cert.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {Object.keys(grouped).length === 0 && (
        <div className={s.timelineEmpty}>No certifications match your filters.</div>
      )}
    </div>
  )
}


// ===================================================
// Certification Modal — Add / Edit
// ===================================================
function CertModal({ employees, item, onClose, onSave, onDelete }) {
  const isEdit = !!item?.id
  const [employeeId, setEmployeeId] = useState(item?.employee_id ? String(item.employee_id) : "")
  const [name, setName] = useState(item?.name || "")
  const [certType, setCertType] = useState(item?.cert_type || "")
  const [certNumber, setCertNumber] = useState(item?.cert_number || "")
  const [issuingAuthority, setIssuingAuthority] = useState(item?.issuing_authority || "")
  const [issuedDate, setIssuedDate] = useState(
    item?.issued_date ? new Date(item.issued_date).toISOString().split("T")[0] : ""
  )
  const [expiryDate, setExpiryDate] = useState(
    item?.expiry_date ? new Date(item.expiry_date).toISOString().split("T")[0] : ""
  )
  const [notes, setNotes] = useState(item?.notes || "")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || (!isEdit && !employeeId)) return
    setSaving(true)
    const data = {
      name: name.trim(),
      certNumber: certNumber || undefined,
      issuingAuthority: issuingAuthority || undefined,
      issuedDate: issuedDate || undefined,
      expiryDate: expiryDate || undefined,
      notes: notes || undefined,
      certType: certType || undefined,
    }
    if (!isEdit) data.employeeId = parseInt(employeeId)
    await onSave(data)
    setSaving(false)
  }

  return (
    <Modal title={isEdit ? "Edit Certification" : "Add Certification"} onClose={onClose}>
      {!isEdit && (
        <SelectField
          label="Employee *"
          value={employeeId}
          onChange={setEmployeeId}
          placeholder="Select employee..."
          options={employees.map(e => ({
            value: String(e.id),
            label: `${e.first_name} ${e.last_name}`,
          }))}
        />
      )}
      <FormField label="Certification Name *" value={name} onChange={setName} autoFocus placeholder="e.g. CDL Class A" />
      <div className={s.formGrid}>
        <SelectField
          label="Certification Type"
          value={certType}
          onChange={setCertType}
          placeholder="Select type..."
          options={CERT_TYPES.map(t => ({ value: t, label: t }))}
        />
        <FormField label="Cert Number" value={certNumber} onChange={setCertNumber} />
      </div>
      <FormField label="Issuing Authority" value={issuingAuthority} onChange={setIssuingAuthority} placeholder="e.g. State of California" />
      <div className={s.formGrid}>
        <FormField label="Issued Date" value={issuedDate} onChange={setIssuedDate} type="date" />
        <FormField label="Expiry Date" value={expiryDate} onChange={setExpiryDate} type="date" />
      </div>
      <FormField label="Notes" value={notes} onChange={setNotes} />
      <ModalFooter
        onClose={onClose}
        onSave={handleSubmit}
        saving={saving}
        disabled={!name.trim() || (!isEdit && !employeeId)}
        onDelete={onDelete ? () => onDelete() : undefined}
      />
    </Modal>
  )
}

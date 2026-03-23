// ═══════════════════════════════════════════
// Certifications Page — Stat row + FilterBar + DataTable
// All employee credentials in one audit-ready view
// ═══════════════════════════════════════════

import { useState, useEffect, useMemo } from "react"
import {
  Award, Search, Download, AlertTriangle, CheckCircle2,
  Clock, Plus, Trash2, Edit3,
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

function getExpiryStatus(expiryDate) {
  if (!expiryDate) return { variant: "gray", label: "No Expiry" }
  const now = new Date()
  const expiry = new Date(expiryDate)
  const daysUntil = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
  if (daysUntil < 0) return { variant: "red", label: "Expired" }
  if (daysUntil <= 30) return { variant: "amber", label: "Expiring Soon" }
  return { variant: "green", label: "Valid" }
}

function formatDate(d) {
  if (!d) return "\u2014"
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function CertificationsPage() {
  const toast = useToast()
  const employees = usePageData("employees", { fetchFn: getEmployees })
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchCerts = async () => {
    try {
      setLoading(true)
      const data = await getCertifications()
      setCerts(data)
    } catch {
      toast.show("Failed to load certifications")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCerts() }, [])

  const enriched = useMemo(() =>
    certs.map(c => ({
      ...c,
      employeeName: `${c.first_name || ""} ${c.last_name || ""}`.trim(),
      expiryStatus: getExpiryStatus(c.expiry_date),
    })),
    [certs]
  )

  const filtered = useMemo(() =>
    enriched.filter(c => {
      if (searchQ) {
        const q = searchQ.toLowerCase()
        if (!c.employeeName.toLowerCase().includes(q) && !(c.name || "").toLowerCase().includes(q)) {
          return false
        }
      }
      if (statusFilter) {
        const sv = c.expiryStatus.variant
        if (statusFilter === "valid" && sv !== "green") return false
        if (statusFilter === "expiring" && sv !== "amber") return false
        if (statusFilter === "expired" && sv !== "red") return false
      }
      return true
    }),
    [enriched, searchQ, statusFilter]
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
      await createCertification(data)
      await fetchCerts()
      toast.show("Certification added")
      setShowAdd(false)
    } catch (err) {
      toast.show(err.message || "Failed to add certification")
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteCertification(id)
      await fetchCerts()
      toast.show("Certification removed")
      setConfirmDelete(null)
    } catch {
      toast.show("Failed to remove certification")
    }
  }

  const isEmpty = !loading && certs.length === 0

  return (
    <PageShell
      title="Certifications"
      count={certs.length}
      countLabel="certifications"
      loading={loading && certs.length === 0}
      actions={
        <div className={s.headerActions}>
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
        <StatCard label="Expired" value={stats.expired} color="var(--red)" icon={AlertTriangle} />
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
      ) : (
        <DataTable
          headers={[
            { label: "Employee" },
            { label: "Credential" },
            { label: "Cert #" },
            { label: "Issued" },
            { label: "Expires" },
            { label: "Status" },
            { label: "Actions", right: true },
          ]}
        >
          {filtered.map(cert => {
            const rowClass = cert.expiryStatus.variant === "red"
              ? `${ts.tr} ${s.rowExpired}`
              : cert.expiryStatus.variant === "amber"
                ? `${ts.tr} ${s.rowExpiring}`
                : ts.tr
            return (
              <tr key={cert.id} className={rowClass}>
                <td className={ts.td}>{cert.employeeName}</td>
                <td className={ts.td}>
                  <div>{cert.name}</div>
                  {cert.issuing_authority && (
                    <div className={s.cellSub}>{cert.issuing_authority}</div>
                  )}
                </td>
                <td className={`${ts.td} ${ts.tdMono}`}>{cert.cert_number || "\u2014"}</td>
                <td className={`${ts.td} ${ts.tdMuted}`}>{formatDate(cert.issued_date)}</td>
                <td className={`${ts.td} ${ts.tdMuted}`}>{formatDate(cert.expiry_date)}</td>
                <td className={ts.td}>
                  <StatusBadge variant={cert.expiryStatus.variant}>{cert.expiryStatus.label}</StatusBadge>
                </td>
                <td className={ts.tdAction}>
                  <button
                    className={s.rowDeleteBtn}
                    onClick={() => setConfirmDelete(cert)}
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            )
          })}
          {filtered.length === 0 && (
            <tr className={ts.tr}>
              <td className={ts.td} colSpan={7} style={{ textAlign: "center", color: "var(--t3)" }}>
                No certifications match your filters.
              </td>
            </tr>
          )}
        </DataTable>
      )}

      {showAdd && (
        <AddCertModal
          employees={employees.data}
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title={`Remove "${confirmDelete.name}"?`}
          message={`This will permanently remove this certification from ${confirmDelete.employeeName}.`}
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
// Add Certification Modal (page-level — includes employee picker)
// ===================================================
function AddCertModal({ employees, onClose, onSave }) {
  const [employeeId, setEmployeeId] = useState("")
  const [name, setName] = useState("")
  const [certNumber, setCertNumber] = useState("")
  const [issuingAuthority, setIssuingAuthority] = useState("")
  const [issuedDate, setIssuedDate] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !employeeId) return
    setSaving(true)
    await onSave({
      employeeId: parseInt(employeeId),
      name: name.trim(),
      certNumber: certNumber || undefined,
      issuingAuthority: issuingAuthority || undefined,
      issuedDate: issuedDate || undefined,
      expiryDate: expiryDate || undefined,
      notes: notes || undefined,
    })
    setSaving(false)
  }

  return (
    <Modal title="Add Certification" onClose={onClose}>
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
      <FormField label="Certification Name *" value={name} onChange={setName} autoFocus />
      <div className={s.formGrid}>
        <FormField label="Cert Number" value={certNumber} onChange={setCertNumber} />
        <FormField label="Issuing Authority" value={issuingAuthority} onChange={setIssuingAuthority} />
      </div>
      <div className={s.formGrid}>
        <FormField label="Issued Date" value={issuedDate} onChange={setIssuedDate} type="date" />
        <FormField label="Expiry Date" value={expiryDate} onChange={setExpiryDate} type="date" />
      </div>
      <FormField label="Notes" value={notes} onChange={setNotes} />
      <ModalFooter
        onClose={onClose}
        onSave={handleSubmit}
        saving={saving}
        disabled={!name.trim() || !employeeId}
      />
    </Modal>
  )
}

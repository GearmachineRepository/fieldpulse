// ═══════════════════════════════════════════
// Compliance Report Page — Aggregated compliance view
// Export bar + Compliance score + Stat row + 3 data sections
// Gets printed and shown to Cal OSHA inspectors
// ═══════════════════════════════════════════

import { useMemo, useCallback } from "react"
import {
  ClipboardCheck, Download, Printer, Users,
  CheckCircle2, AlertTriangle, Shield,
  Award, GraduationCap, Clock, XCircle,
} from "lucide-react"
import usePageData from "@/hooks/usePageData.js"
import { getEmployees } from "@/lib/api/employees.js"
import { getCertifications } from "@/lib/api/certifications.js"
import { getTrainingSessions } from "@/lib/api/training.js"
import { getIncidents } from "@/lib/api/incidents.js"
import PageShell from "../components/PageShell.jsx"
import StatCard from "../components/StatCard.jsx"
import StatusBadge from "../components/StatusBadge.jsx"
import s from "./ComplianceReportPage.module.css"

// ── Helpers ──

function getExpiryStatus(expiryDate) {
  if (!expiryDate) return "valid"
  const now = new Date()
  const expiry = new Date(expiryDate)
  const daysUntil = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
  if (daysUntil < 0) return "expired"
  if (daysUntil <= 30) return "expiring"
  return "valid"
}

function formatDate(d) {
  if (!d) return "\u2014"
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  })
}

function downloadCSV(filename, headers, rows) {
  const escape = (v) => {
    const str = String(v ?? "")
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str
  }
  const lines = [
    headers.map(escape).join(","),
    ...rows.map(r => r.map(escape).join(",")),
  ]
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Component ──

export default function ComplianceReportPage() {
  const employees = usePageData("employees", { fetchFn: getEmployees })
  const certs = usePageData("certifications", { fetchFn: getCertifications })
  const training = usePageData("training", { fetchFn: getTrainingSessions })
  const incidents = usePageData("incidents", { fetchFn: getIncidents })

  const loading = employees.loading || certs.loading || training.loading || incidents.loading

  // ── Certification Stats ──
  const certStats = useMemo(() => {
    const all = certs.data
    let valid = 0, expiring = 0, expired = 0
    for (const c of all) {
      const status = getExpiryStatus(c.expiry_date)
      if (status === "valid") valid++
      else if (status === "expiring") expiring++
      else expired++
    }
    return { total: all.length, valid, expiring, expired }
  }, [certs.data])

  // ── Training Stats ──
  const trainingStats = useMemo(() => {
    const all = training.data
    const completed = all.filter(t => t.status === "completed").length
    const scheduled = all.filter(t => t.status === "scheduled").length
    // Unique employees with signoffs (signoff_count > 0 on completed sessions)
    const totalSignoffs = all
      .filter(t => t.status === "completed")
      .reduce((sum, t) => sum + (t.signoff_count || 0), 0)
    return { total: all.length, completed, scheduled, totalSignoffs }
  }, [training.data])

  // ── Incident Stats ──
  const incidentStats = useMemo(() => {
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const ytd = incidents.data.filter(i => new Date(i.incident_date) >= yearStart)
    const open = ytd.filter(i => i.status === "open" || i.status === "investigating").length
    const withInjury = ytd.filter(i => i.injury_occurred).length

    const severity = { low: 0, medium: 0, high: 0, critical: 0 }
    for (const i of ytd) {
      const sev = i.severity || "low"
      if (severity[sev] !== undefined) severity[sev]++
    }
    return { totalYTD: ytd.length, open, withInjury, severity }
  }, [incidents.data])

  // ── Compliance Score ──
  const complianceScore = useMemo(() => {
    // Score based on: valid certs / total certs (weighted 60%) + completed training / total training (weighted 40%)
    const certRatio = certStats.total > 0
      ? (certStats.valid + certStats.expiring) / certStats.total
      : 1
    const trainingRatio = trainingStats.total > 0
      ? trainingStats.completed / trainingStats.total
      : 1

    // If no data at all, show N/A
    if (certStats.total === 0 && trainingStats.total === 0) return null

    const score = Math.round(certRatio * 60 + trainingRatio * 40)
    return Math.min(100, Math.max(0, score))
  }, [certStats, trainingStats])

  // ── Top-level employee compliance ──
  const topStats = useMemo(() => {
    const total = employees.data.length
    // Fully compliant = has at least 1 cert and none expired
    // This is a simplified heuristic since we don't have per-employee cert requirements
    const employeeCertMap = new Map()
    for (const c of certs.data) {
      const empId = c.employee_id
      if (!employeeCertMap.has(empId)) {
        employeeCertMap.set(empId, { hasExpired: false, hasExpiring: false, count: 0 })
      }
      const entry = employeeCertMap.get(empId)
      entry.count++
      const status = getExpiryStatus(c.expiry_date)
      if (status === "expired") entry.hasExpired = true
      if (status === "expiring") entry.hasExpiring = true
    }

    let fullyCompliant = 0, partial = 0, nonCompliant = 0
    for (const [, entry] of employeeCertMap) {
      if (entry.hasExpired) nonCompliant++
      else if (entry.hasExpiring) partial++
      else fullyCompliant++
    }
    // Employees with no certs tracked at all are not counted as non-compliant
    // unless we have cert data in the system
    const uncovered = total - employeeCertMap.size
    return { total, fullyCompliant, partial, nonCompliant, uncovered }
  }, [employees.data, certs.data])

  // ── Export CSV ──
  const handleExportCSV = useCallback(() => {
    const headers = [
      "Section", "Metric", "Value",
    ]
    const rows = [
      ["Overview", "Total Employees", topStats.total],
      ["Overview", "Fully Compliant", topStats.fullyCompliant],
      ["Overview", "Partial Compliance", topStats.partial],
      ["Overview", "Non-Compliant", topStats.nonCompliant],
      ["Overview", "Compliance Score", complianceScore != null ? `${complianceScore}%` : "N/A"],
      ["Certifications", "Total", certStats.total],
      ["Certifications", "Valid", certStats.valid],
      ["Certifications", "Expiring (30 days)", certStats.expiring],
      ["Certifications", "Expired", certStats.expired],
      ["Training", "Total Sessions", trainingStats.total],
      ["Training", "Completed", trainingStats.completed],
      ["Training", "Scheduled", trainingStats.scheduled],
      ["Training", "Total Signoffs", trainingStats.totalSignoffs],
      ["Incidents YTD", "Total", incidentStats.totalYTD],
      ["Incidents YTD", "Open / Unresolved", incidentStats.open],
      ["Incidents YTD", "Involving Injury", incidentStats.withInjury],
      ["Incidents YTD", "Low Severity", incidentStats.severity.low],
      ["Incidents YTD", "Medium Severity", incidentStats.severity.medium],
      ["Incidents YTD", "High Severity", incidentStats.severity.high],
      ["Incidents YTD", "Critical Severity", incidentStats.severity.critical],
    ]

    // Also append individual cert rows
    for (const c of certs.data) {
      const empName = `${c.first_name || ""} ${c.last_name || ""}`.trim()
      const status = getExpiryStatus(c.expiry_date)
      rows.push([
        "Cert Detail", empName, `${c.name} — ${status} — expires ${formatDate(c.expiry_date)}`,
      ])
    }

    const today = new Date().toISOString().slice(0, 10)
    downloadCSV(`compliance-report-${today}.csv`, headers, rows)
  }, [topStats, certStats, trainingStats, incidentStats, complianceScore, certs.data])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  // ── Severity variant helper ──
  function sevVariant(sev) {
    if (sev === "critical") return "red"
    if (sev === "high") return "amber"
    if (sev === "medium") return "amber"
    return "gray"
  }

  return (
    <PageShell title="Compliance Report" loading={loading && certs.data.length === 0}>
      {/* Export Bar — pinned below topbar */}
      <div className={s.exportBar}>
        <div className={s.exportBarLabel}>
          <ClipboardCheck size={16} color="var(--amb)" />
          <span>Compliance Report — ready for export</span>
        </div>
        <div className={s.exportActions}>
          <button className={s.csvBtn} onClick={handleExportCSV}>
            <Download size={15} /> Export CSV
          </button>
          <button className={s.pdfBtn} onClick={handlePrint}>
            <Printer size={15} /> Print Report
          </button>
        </div>
      </div>

      {/* Compliance Score Banner */}
      {complianceScore != null && (
        <div className={s.scoreBanner}>
          <div className={s.scoreRing}>
            <svg viewBox="0 0 36 36" className={s.scoreSvg}>
              <path
                className={s.scoreTrack}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={s.scoreFill}
                strokeDasharray={`${complianceScore}, 100`}
                style={{
                  stroke: complianceScore >= 80 ? "var(--grn)" : complianceScore >= 60 ? "var(--amb)" : "var(--red)",
                }}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className={s.scoreValue}>{complianceScore}%</span>
          </div>
          <div className={s.scoreInfo}>
            <div className={s.scoreTitle}>Compliance Score</div>
            <div className={s.scoreDesc}>
              Based on certification validity (60%) and training completion (40%).
              {certStats.expired > 0 && (
                <span className={s.scoreWarn}> {certStats.expired} expired cert{certStats.expired !== 1 ? "s" : ""} need attention.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stat Row */}
      <div className={s.statsRow}>
        <StatCard label="Total Employees" value={topStats.total} color="var(--amb)" icon={Users} />
        <StatCard label="Fully Compliant" value={topStats.fullyCompliant} color="var(--grn)" icon={CheckCircle2} />
        <StatCard label="Partial Compliance" value={topStats.partial} color="var(--amb)" icon={AlertTriangle} />
        <StatCard label="Non-Compliant" value={topStats.nonCompliant} color="var(--red)" icon={Shield} />
      </div>

      {/* Section 1 — Certifications */}
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <Award size={18} color="var(--amb)" />
          <h3 className={s.sectionTitle}>Certifications</h3>
          <span className={s.sectionCount}>{certStats.total}</span>
        </div>
        <div className={s.sectionContent}>
          {certStats.total === 0 ? (
            <div className={s.emptySection}>
              <Award size={32} strokeWidth={1} className={s.emptySectionIcon} />
              <div className={s.emptySectionTitle}>No certifications tracked</div>
              <div className={s.emptySectionDesc}>
                Certification records will appear here sorted by urgency — expired first.
              </div>
            </div>
          ) : (
            <>
              <div className={s.miniStats}>
                <div className={s.miniStat}>
                  <CheckCircle2 size={14} color="var(--grn)" />
                  <span className={s.miniStatLabel}>Valid</span>
                  <span className={s.miniStatValue}>{certStats.valid}</span>
                </div>
                <div className={s.miniStat}>
                  <Clock size={14} color="var(--amb)" />
                  <span className={s.miniStatLabel}>Expiring (30d)</span>
                  <span className={s.miniStatValue}>{certStats.expiring}</span>
                </div>
                <div className={s.miniStat}>
                  <XCircle size={14} color="var(--red)" />
                  <span className={s.miniStatLabel}>Expired</span>
                  <span className={s.miniStatValue}>{certStats.expired}</span>
                </div>
              </div>
              <div className={s.certList}>
                {[...certs.data]
                  .sort((a, b) => {
                    // Expired first, then expiring, then valid
                    const order = { expired: 0, expiring: 1, valid: 2 }
                    return (order[getExpiryStatus(a.expiry_date)] ?? 2) - (order[getExpiryStatus(b.expiry_date)] ?? 2)
                  })
                  .map(c => {
                    const status = getExpiryStatus(c.expiry_date)
                    const variant = status === "expired" ? "red" : status === "expiring" ? "amber" : "green"
                    const label = status === "expired" ? "Expired" : status === "expiring" ? "Expiring" : "Valid"
                    const empName = `${c.first_name || ""} ${c.last_name || ""}`.trim()
                    return (
                      <div key={c.id} className={s.certRow}>
                        <div className={s.certName}>
                          <span className={s.certTitle}>{c.name}</span>
                          {empName && <span className={s.certEmployee}>{empName}</span>}
                        </div>
                        <span className={s.certExpiry}>{formatDate(c.expiry_date)}</span>
                        <StatusBadge variant={variant}>{label}</StatusBadge>
                      </div>
                    )
                  })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Section 2 — Training Completion */}
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <GraduationCap size={18} color="var(--amb)" />
          <h3 className={s.sectionTitle}>Training Completion</h3>
          <span className={s.sectionCount}>{trainingStats.total}</span>
        </div>
        <div className={s.sectionContent}>
          {trainingStats.total === 0 ? (
            <div className={s.emptySection}>
              <GraduationCap size={32} strokeWidth={1} className={s.emptySectionIcon} />
              <div className={s.emptySectionTitle}>No training data</div>
              <div className={s.emptySectionDesc}>
                Per-course progress bars will show completion rates across all employees.
              </div>
            </div>
          ) : (
            <>
              <div className={s.miniStats}>
                <div className={s.miniStat}>
                  <CheckCircle2 size={14} color="var(--grn)" />
                  <span className={s.miniStatLabel}>Completed</span>
                  <span className={s.miniStatValue}>{trainingStats.completed}</span>
                </div>
                <div className={s.miniStat}>
                  <Clock size={14} color="var(--t3)" />
                  <span className={s.miniStatLabel}>Scheduled</span>
                  <span className={s.miniStatValue}>{trainingStats.scheduled}</span>
                </div>
                <div className={s.miniStat}>
                  <Users size={14} color="var(--amb)" />
                  <span className={s.miniStatLabel}>Total Signoffs</span>
                  <span className={s.miniStatValue}>{trainingStats.totalSignoffs}</span>
                </div>
              </div>
              {/* Per-session progress bars */}
              {training.data.map(session => {
                const pct = trainingStats.total > 0 && session.status === "completed" ? 100
                  : session.status === "in-progress" ? 50 : 0
                return (
                  <div key={session.id} className={s.progressRow}>
                    <div className={s.progressLabel}>
                      <span>{session.title}</span>
                      <span className={s.progressSub}>{session.training_type || "General"}</span>
                    </div>
                    <div className={s.progressBarWrap}>
                      <div
                        className={s.progressBarFill}
                        style={{
                          width: `${pct}%`,
                          background: pct === 100 ? "var(--grn)" : "var(--amb)",
                        }}
                      />
                    </div>
                    <span className={s.progressPercent}>
                      {session.signoff_count || 0} sign{session.signoff_count === 1 ? "" : "s"}
                    </span>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>

      {/* Section 3 — Incidents YTD */}
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <AlertTriangle size={18} color="var(--amb)" />
          <h3 className={s.sectionTitle}>Incidents — Year to Date</h3>
          <span className={s.sectionCount}>{incidentStats.totalYTD}</span>
        </div>
        <div className={s.sectionContent}>
          {incidentStats.totalYTD === 0 ? (
            <div className={s.emptySection}>
              <AlertTriangle size={32} strokeWidth={1} className={s.emptySectionIcon} />
              <div className={s.emptySectionTitle}>No incidents this year</div>
              <div className={s.emptySectionDesc}>
                Incident counts by type, with open vs closed breakdown, will appear here.
              </div>
            </div>
          ) : (
            <>
              <div className={s.miniStats}>
                <div className={s.miniStat}>
                  <AlertTriangle size={14} color="var(--amb)" />
                  <span className={s.miniStatLabel}>Total YTD</span>
                  <span className={s.miniStatValue}>{incidentStats.totalYTD}</span>
                </div>
                <div className={s.miniStat}>
                  <Clock size={14} color="var(--amb)" />
                  <span className={s.miniStatLabel}>Open / Unresolved</span>
                  <span className={s.miniStatValue}>{incidentStats.open}</span>
                </div>
                <div className={s.miniStat}>
                  <Shield size={14} color="var(--red)" />
                  <span className={s.miniStatLabel}>Involving Injury</span>
                  <span className={s.miniStatValue}>{incidentStats.withInjury}</span>
                </div>
              </div>
              {/* Severity Breakdown */}
              <div className={s.severityGrid}>
                {["critical", "high", "medium", "low"].map(sev => {
                  const count = incidentStats.severity[sev]
                  return (
                    <div key={sev} className={s.severityItem}>
                      <StatusBadge variant={sevVariant(sev)}>
                        {sev.charAt(0).toUpperCase() + sev.slice(1)}
                      </StatusBadge>
                      <span className={s.severityCount}>{count}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </PageShell>
  )
}

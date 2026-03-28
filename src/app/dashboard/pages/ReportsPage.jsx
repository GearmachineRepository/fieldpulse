// ═══════════════════════════════════════════
// Reports Page — Quick-access report generator
// Click a report → set filters → generate → export
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import {
  Users, CheckCircle2, FileText, ShieldCheck, Droplets,
  Download, Printer, ArrowLeft, Calendar, Loader2, X,
  ClipboardCheck, AlertTriangle, GraduationCap,
} from "lucide-react"
import usePageData from "@/hooks/usePageData.js"
import useModules from "@/hooks/useModules.jsx"
import { getCrews } from "@/lib/api/crews.js"
import { getRosterReport, getCompletionReport, getSprayLogsReport } from "@/lib/api/reports.js"
import { getCertifications } from "@/lib/api/certifications.js"
import { getTrainingSessions } from "@/lib/api/training.js"
import { getIncidents } from "@/lib/api/incidents.js"
import { getFieldDocs } from "@/lib/api/fieldDocs.js"
import { PageHeader, LoadingSpinner, EmptyMessage, Modal } from "@/app/dashboard/components/PageUI.jsx"
import s from "./ReportsPage.module.css"

// ── Date helpers ──
function toISO(d) { return d.toLocaleDateString("en-CA") }
function getMonthStart(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01` }
function getMonthEnd(d) { return toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0)) }
function fmtDate(iso) { return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }
function fmtShort(iso) { return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) }

// ── Report definitions ──
const REPORTS = [
  {
    key: "attendance",
    label: "Attendance",
    desc: "Crew clock-in rosters, absences, daily headcounts",
    icon: Users,
    color: "#3B82F6",
    filters: ["dateRange", "crew"],
  },
  {
    key: "work-log",
    label: "Work Log",
    desc: "Route stop completions, crew productivity, time on site",
    icon: CheckCircle2,
    color: "#F59E0B",
    filters: ["dateRange", "crew"],
  },
  {
    key: "inspections",
    label: "Inspections",
    desc: "Field inspections, pass/fail results, flagged items",
    icon: ClipboardCheck,
    color: "#8B5CF6",
    filters: ["dateRange"],
  },
  {
    key: "incidents",
    label: "Incidents",
    desc: "Incident reports, severity, status, corrective actions",
    icon: AlertTriangle,
    color: "#EF4444",
    filters: ["dateRange"],
  },
  {
    key: "certifications",
    label: "Certifications",
    desc: "Employee certifications, expiry dates, compliance status",
    icon: ShieldCheck,
    color: "#059669",
    filters: [],
  },
  {
    key: "training",
    label: "Training",
    desc: "Training sessions, signoffs, completion rates",
    icon: GraduationCap,
    color: "#D97706",
    filters: ["dateRange"],
  },
]

export default function ReportsPage() {
  const crews = usePageData("crews", { fetchFn: getCrews })
  const { enabledModules } = useModules()
  const [activeReport, setActiveReport] = useState(null)
  const [dateStart, setDateStart] = useState(() => getMonthStart(new Date()))
  const [dateEnd, setDateEnd] = useState(() => getMonthEnd(new Date()))
  const [crewFilter, setCrewFilter] = useState("")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generated, setGenerated] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  // Reset when switching reports
  useEffect(() => {
    setData(null)
    setGenerated(false)
    setLoading(false)
  }, [activeReport])

  // Map module keys to dedicated report keys when a real endpoint exists
  const MODULE_REPORT_OVERRIDES = {
    spray: { key: "spray-log", label: "Spray Logs", desc: "Chemical applications, products used, amounts, locations" },
  }
  const moduleReports = (enabledModules || []).map(mod => {
    const override = MODULE_REPORT_OVERRIDES[mod.key]
    return {
      key: override?.key || `mod-${mod.key}`,
      moduleKey: mod.key,
      label: override?.label || mod.label,
      desc: override?.desc || mod.desc,
      icon: mod.icon,
      color: mod.color,
      filters: ["dateRange", "crew"],
      isModule: !override,
    }
  })

  const allReports = [...REPORTS, ...moduleReports]
  const report = allReports.find(r => r.key === activeReport)

  // ── Generate report ──
  const generate = async () => {
    setLoading(true)
    setData(null)
    try {
      const crewId = crewFilter ? crews.data.find(c => c.name === crewFilter)?.id : undefined
      switch (activeReport) {
        case "attendance":
          setData(await getRosterReport(dateStart, dateEnd))
          break
        case "work-log":
          setData(await getCompletionReport({ start: dateStart, end: dateEnd, crewId, limit: 500 }))
          break
        case "spray-log":
          setData(await getSprayLogsReport({ start: dateStart, end: dateEnd, crewId, limit: 500 }))
          break
        case "inspections":
          setData(await getFieldDocs({ type: "inspection", start: dateStart, end: dateEnd }))
          break
        case "incidents":
          setData(await getIncidents({ start: dateStart, end: dateEnd }))
          break
        case "certifications":
          setData(await getCertifications())
          break
        case "training":
          setData(await getTrainingSessions({ start: dateStart, end: dateEnd }))
          break
        default:
          // Module reports — no dedicated endpoint yet
          if (report?.isModule) {
            setData({ _moduleStub: true, moduleKey: report.moduleKey, label: report.label })
          }
          break
      }
      setGenerated(true)
    } catch (err) { console.error("Report fetch failed:", err) }
    finally { setLoading(false) }
  }

  // ── CSV export ──
  const exportCsv = () => {
    const rows = getCsvRows()
    if (rows.length === 0) return
    const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${activeReport}-report-${dateStart}-to-${dateEnd}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getCsvRows = () => {
    if (!data) return []
    switch (activeReport) {
      case "attendance":
        return [
          ["Crew", "Days Worked", "Members", "Absences"],
          ...(data?.crews || []).map(c => [c.crewName, c.daysWorked, c.totalMembers, c.totalAbsences]),
        ]
      case "work-log":
        return [
          ["Date", "Route", "Account", "Crew", "Completed By", "Status"],
          ...(Array.isArray(data) ? data : []).map(c => [c.workDate, c.routeName, c.accountName, c.crewName, c.completedByName, c.status]),
        ]
      case "spray-log": {
        const logs = Array.isArray(data) ? data : data?.logs || []
        return [
          ["Date", "Property", "Crew", "Products", "Total Volume"],
          ...logs.map(l => [l.date || l.applicationDate || "", l.property || l.accountName || "", l.crewName || "", (l.products || []).map(p => p.name || p.chemicalName || "").join("; "), l.totalMixVol || l.totalMixVolume || ""]),
        ]
      }
      case "inspections": {
        const docs = Array.isArray(data) ? data : data?.docs || []
        return [
          ["Date", "Title", "Inspector", "Status", "Location"],
          ...docs.map(d => [(d.createdAt || d.created_at || "").slice(0, 10), d.title, d.employeeName || d.employee_name || "", d.status, d.location]),
        ]
      }
      case "incidents": {
        const list = Array.isArray(data) ? data : data?.incidents || []
        return [
          ["Date", "Title", "Type", "Severity", "Status"],
          ...list.map(i => [i.incidentDate || i.incident_date || i.created_at?.slice(0, 10), i.title, i.incidentType || i.incident_type, i.severity, i.status]),
        ]
      }
      case "certifications": {
        const certs = Array.isArray(data) ? data : data?.certifications || []
        return [
          ["Employee", "Certification", "Issuer", "Cert #", "Issued", "Expires", "Status"],
          ...certs.map(c => {
            const exp = c.expiryDate || c.expiry_date
            const status = !exp ? "No Expiry" : new Date(exp) < new Date() ? "Expired" : "Valid"
            return [`${c.first_name || c.firstName || ""} ${c.last_name || c.lastName || ""}`.trim() || c.employeeName || "", c.name || c.certName || c.cert_name || "", c.issuing_authority || c.issuer || "", c.cert_number || c.certNumber || "", c.issued_date || c.issuedDate || "", exp, status]
          }),
        ]
      }
      case "training": {
        const sessions = Array.isArray(data) ? data : data?.sessions || []
        return [
          ["Date", "Title", "Type", "Trainer", "Signoffs"],
          ...sessions.map(t => [t.training_date || t.sessionDate || t.created_at?.slice(0, 10), t.title, t.type, t.trainer, t.signoff_count || t.signoffCount || 0]),
        ]
      }
      default: return []
    }
  }

  // ── Date presets ──
  const presets = [
    { label: "This Month", fn: () => { const n = new Date(); setDateStart(getMonthStart(n)); setDateEnd(getMonthEnd(n)) } },
    { label: "Last Month", fn: () => { const n = new Date(); n.setMonth(n.getMonth() - 1); setDateStart(getMonthStart(n)); setDateEnd(getMonthEnd(n)) } },
    { label: "This Year", fn: () => { const n = new Date(); setDateStart(`${n.getFullYear()}-01-01`); setDateEnd(getMonthEnd(n)) } },
    { label: "Last 90 Days", fn: () => { const n = new Date(); const past = new Date(n); past.setDate(past.getDate() - 90); setDateStart(toISO(past)); setDateEnd(toISO(n)) } },
  ]

  // ═══════════════════════════════════════════
  // Report picker (no report selected)
  // ═══════════════════════════════════════════
  if (!activeReport) {
    return (
      <div>
        <PageHeader title="Reports" />
        <div className={s.reportGrid}>
          {REPORTS.map(r => (
            <button key={r.key} className={s.reportCard} onClick={() => setActiveReport(r.key)}>
              <div className={s.reportCardIcon} style={{ background: `${r.color}14`, color: r.color }}>
                <r.icon size={20} />
              </div>
              <div className={s.reportCardBody}>
                <div className={s.reportCardLabel}>{r.label}</div>
                <div className={s.reportCardDesc}>{r.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {moduleReports.length > 0 && (
          <>
            <div className={s.moduleSectionHeader}>Module Reports</div>
            <div className={s.reportGrid}>
              {moduleReports.map(r => (
                <button key={r.key} className={s.reportCard} onClick={() => setActiveReport(r.key)}>
                  <div className={s.reportCardIcon} style={{ background: `${r.color}14`, color: r.color }}>
                    <r.icon size={20} />
                  </div>
                  <div className={s.reportCardBody}>
                    <div className={s.reportCardLabel}>{r.label}</div>
                    <div className={s.reportCardDesc}>{r.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════
  // Active report view
  // ═══════════════════════════════════════════
  const hasDateRange = report?.filters.includes("dateRange")
  const hasCrew = report?.filters.includes("crew")
  const rangeLabel = `${fmtDate(dateStart)} — ${fmtDate(dateEnd)}`

  return (
    <div>
      <PageHeader title={report.label + " Report"} action={
        generated && data ? (
          <div className={s.headerActions}>
            <button onClick={exportCsv} className={s.csvBtn}><Download size={14} /> CSV</button>
            <button onClick={() => window.print()} className={s.printBtn}><Printer size={14} /> Print</button>
          </div>
        ) : null
      } />

      {/* Back to picker */}
      <button className={s.backBtn} onClick={() => setActiveReport(null)}>
        <ArrowLeft size={14} /> All Reports
      </button>

      {/* Filters + Generate */}
      {!generated && (
        <div className={s.filterPanel}>
          <div className={s.filterPanelHeader}>
            <report.icon size={16} style={{ color: report.color }} />
            <span>{report.label}</span>
          </div>

          {hasDateRange && (
            <>
              <div className={s.filterRow}>
                <div className={s.filterField}>
                  <label className={s.filterLabel}>From</label>
                  <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className={s.filterInput} />
                </div>
                <div className={s.filterField}>
                  <label className={s.filterLabel}>To</label>
                  <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className={s.filterInput} />
                </div>
                {hasCrew && (
                  <div className={s.filterField}>
                    <label className={s.filterLabel}>Crew</label>
                    <select value={crewFilter} onChange={e => setCrewFilter(e.target.value)} className={s.filterInput}>
                      <option value="">All Crews</option>
                      {crews.data.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className={s.presetRow}>
                {presets.map(p => (
                  <button key={p.label} onClick={p.fn} className={s.presetBtn}>{p.label}</button>
                ))}
              </div>
            </>
          )}

          {!hasDateRange && (
            <div className={s.filterNote}>This report shows all current records.</div>
          )}

          <button onClick={generate} disabled={loading} className={s.generateBtn} style={{ background: report.color }}>
            {loading ? <><Loader2 size={14} className={s.spin} /> Generating…</> : <><FileText size={14} /> Generate Report</>}
          </button>
        </div>
      )}

      {/* Results */}
      {generated && (
        <div id="report-printable">
          {/* Print header */}
          <div className={s.printOnly}>
            <div className={s.printTitle}>CruPoint — {report.label} Report</div>
            <div className={s.printSubtitle}>
              {hasDateRange ? rangeLabel : "All Records"}{crewFilter && ` · ${crewFilter}`}
            </div>
          </div>

          {/* Regenerate bar */}
          <div className={s.resultBar}>
            <div className={s.resultBarInfo}>
              <Calendar size={13} />
              <span>{hasDateRange ? rangeLabel : "All Records"}</span>
              {crewFilter && <span className={s.resultBarCrewBadge}>{crewFilter}</span>}
            </div>
            <button onClick={() => setGenerated(false)} className={s.changeFiltersBtn}>
              <X size={12} /> Change Filters
            </button>
          </div>

          {loading ? <LoadingSpinner /> : (
            <ReportResults reportKey={activeReport} data={data} onSelect={setSelectedItem} />
          )}
        </div>
      )}

      {/* Detail modal */}
      {selectedItem && (
        <ReportDetailModal
          reportKey={activeReport}
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Report Results — renders data for each type
// ═══════════════════════════════════════════
function ReportResults({ reportKey, data, onSelect }) {
  switch (reportKey) {
    case "attendance": return <AttendanceResults data={data} />
    case "work-log": return <WorkLogResults data={data} onSelect={onSelect} />
    case "spray-log": return <SprayLogResults data={data} onSelect={onSelect} />
    case "inspections": return <InspectionResults data={data} onSelect={onSelect} />
    case "incidents": return <IncidentResults data={data} onSelect={onSelect} />
    case "certifications": return <CertificationResults data={data} />
    case "training": return <TrainingResults data={data} onSelect={onSelect} />
    default:
      if (data?._moduleStub) return <ModuleStubResults data={data} />
      return <EmptyMessage text="Report type not recognized." />
  }
}

// ── Stat card ──
function Stat({ label, value, color }) {
  return (
    <div className={s.statCard} style={color ? { borderTopColor: color } : undefined}>
      <div className={s.statValue}>{value}</div>
      <div className={s.statLabel}>{label}</div>
    </div>
  )
}

// ── Attendance ──
function AttendanceResults({ data }) {
  const crewList = data?.crews || []
  return (
    <div>
      <div className={s.statsRow}>
        <Stat label="Total Rosters" value={data?.totalRosters || 0} color="#3B82F6" />
        <Stat label="Crews Active" value={crewList.length} color="#2F6FED" />
        <Stat label="Total Absences" value={crewList.reduce((s, c) => s + (c.totalAbsences || 0), 0)} color="#EF4444" />
      </div>
      {crewList.length === 0 ? <EmptyMessage text="No attendance records found." /> : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr className={s.tableHeadRow}>
              {["Crew", "Days Worked", "Members", "Absences"].map(h => <th key={h} className={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {crewList.map((c, i) => (
                <tr key={i} className={s.tableRow}>
                  <td className={`${s.cell} ${s.cellBold}`}>{c.crewName}</td>
                  <td className={`${s.cell} ${s.cellMono}`}>{c.daysWorked}</td>
                  <td className={`${s.cell} ${s.cellMono}`}>{c.totalMembers}</td>
                  <td className={`${s.cell} ${s.cellMono}`} style={c.totalAbsences > 0 ? { color: "var(--red)" } : undefined}>{c.totalAbsences}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Work Log ──
function WorkLogResults({ data, onSelect }) {
  const rows = Array.isArray(data) ? data : []
  return (
    <div>
      <div className={s.statsRow}>
        <Stat label="Stops Completed" value={rows.length} color="#F59E0B" />
        <Stat label="Routes" value={new Set(rows.map(r => r.routeName)).size} color="#2F6FED" />
        <Stat label="Properties" value={new Set(rows.map(r => r.accountName)).size} color="#3B82F6" />
      </div>
      {rows.length === 0 ? <EmptyMessage text="No work completions found." /> : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr className={s.tableHeadRow}>
              {["Date", "Route", "Account", "Crew", "Completed By", "Status"].map(h => <th key={h} className={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={c.id || i} className={s.tableRow} style={{ cursor: "pointer" }} onClick={() => onSelect?.(c)}>
                  <td className={`${s.cell} ${s.cellMono}`}>{fmtShort(c.workDate)}</td>
                  <td className={`${s.cell} ${s.cellBold}`}>{c.routeName}</td>
                  <td className={s.cell}>{c.accountName}</td>
                  <td className={`${s.cell} ${s.cellTextMed}`}>{c.crewName}</td>
                  <td className={s.cell}>{c.completedByName}</td>
                  <td className={s.cell}>
                    <span className={c.status === "complete" ? s.statusComplete : s.statusPending}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Spray Logs ──
function SprayLogResults({ data, onSelect }) {
  const logs = Array.isArray(data) ? data : data?.logs || []
  const totalVolume = logs.reduce((s, l) => s + (parseFloat(l.totalMixVol || l.totalMixVolume) || 0), 0)
  return (
    <div>
      <div className={s.statsRow}>
        <Stat label="Applications" value={logs.length} color="#059669" />
        <Stat label="Total Volume" value={`${totalVolume.toFixed(1)} gal`} color="#3B82F6" />
        <Stat label="Properties" value={new Set(logs.map(l => l.property || l.accountName)).size} color="#F59E0B" />
      </div>
      {logs.length === 0 ? <EmptyMessage text="No spray logs found." /> : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr className={s.tableHeadRow}>
              {["Date", "Property", "Crew", "Products", "Volume"].map(h => <th key={h} className={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {logs.map((l, i) => (
                <tr key={l.id || i} className={s.tableRow} style={{ cursor: "pointer" }} onClick={() => onSelect?.(l)}>
                  <td className={`${s.cell} ${s.cellMono}`}>{l.date || fmtShort(l.applicationDate || "")}</td>
                  <td className={`${s.cell} ${s.cellBold}`}>{l.property || l.accountName}</td>
                  <td className={`${s.cell} ${s.cellTextMed}`}>{l.crewName}</td>
                  <td className={s.cell}>
                    {(l.products || []).map((p, j) => (
                      <div key={j} className={s.productLine}>
                        <span className={s.productName}>{p.name || p.chemicalName}</span>
                        {p.epa && <span className={s.productDetail}> — EPA {p.epa}</span>}
                        {p.ozConcentrate && <span className={s.productDetail}> · {p.ozConcentrate} oz</span>}
                      </div>
                    ))}
                  </td>
                  <td className={`${s.cell} ${s.cellMono}`}>{l.totalMixVol || l.totalMixVolume || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Inspections ──
function InspectionResults({ data, onSelect }) {
  const docs = Array.isArray(data) ? data : data?.docs || []
  const flagged = docs.filter(d => d.status === "flagged").length
  return (
    <div>
      <div className={s.statsRow}>
        <Stat label="Inspections" value={docs.length} color="#8B5CF6" />
        <Stat label="Flagged" value={flagged} color="#EF4444" />
        <Stat label="Passed" value={docs.length - flagged} color="#059669" />
      </div>
      {docs.length === 0 ? <EmptyMessage text="No inspections found." /> : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr className={s.tableHeadRow}>
              {["Date", "Title", "Inspector", "Location", "Status"].map(h => <th key={h} className={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {docs.map((d, i) => (
                <tr key={d.id || i} className={s.tableRow} style={{ cursor: "pointer" }} onClick={() => onSelect?.(d)}>
                  <td className={`${s.cell} ${s.cellMono}`}>{fmtShort((d.createdAt || d.created_at || "").slice(0, 10))}</td>
                  <td className={`${s.cell} ${s.cellBold}`}>{d.title}</td>
                  <td className={s.cell}>{d.employeeName || d.employee_name || d.submitted_by_name || "—"}</td>
                  <td className={`${s.cell} ${s.cellTextMed}`}>{d.location || "—"}</td>
                  <td className={s.cell}>
                    <span className={d.status === "flagged" ? s.statusFlagged : s.statusComplete}>
                      {d.status === "flagged" ? "Flagged" : "Passed"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Incidents ──
function IncidentResults({ data, onSelect }) {
  const list = Array.isArray(data) ? data : data?.incidents || []
  const open = list.filter(i => i.status === "open" || i.status === "investigating").length
  return (
    <div>
      <div className={s.statsRow}>
        <Stat label="Total Incidents" value={list.length} color="#EF4444" />
        <Stat label="Open / Investigating" value={open} color="#F59E0B" />
        <Stat label="Resolved" value={list.filter(i => i.status === "resolved" || i.status === "closed").length} color="#059669" />
      </div>
      {list.length === 0 ? <EmptyMessage text="No incidents found." /> : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr className={s.tableHeadRow}>
              {["Date", "Title", "Type", "Severity", "Status"].map(h => <th key={h} className={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {list.map((inc, i) => (
                <tr key={inc.id || i} className={s.tableRow} style={{ cursor: "pointer" }} onClick={() => onSelect?.(inc)}>
                  <td className={`${s.cell} ${s.cellMono}`}>{fmtShort(inc.incidentDate || inc.incident_date || inc.created_at?.slice(0, 10))}</td>
                  <td className={`${s.cell} ${s.cellBold}`}>{inc.title}</td>
                  <td className={s.cell}>{inc.incidentType || inc.incident_type}</td>
                  <td className={s.cell}>
                    <span className={s[`severity${(inc.severity || "").charAt(0).toUpperCase() + (inc.severity || "").slice(1)}`] || ""}>
                      {inc.severity}
                    </span>
                  </td>
                  <td className={s.cell}>
                    <span className={s[`status${(inc.status || "").charAt(0).toUpperCase() + (inc.status || "").slice(1)}`] || s.statusPending}>
                      {inc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Certifications ──
function CertificationResults({ data }) {
  const certs = Array.isArray(data) ? data : data?.certifications || []
  const now = new Date()
  const expired = certs.filter(c => {
    const exp = c.expiryDate || c.expiry_date
    return exp && new Date(exp) < now
  }).length
  const expiring = certs.filter(c => {
    const exp = c.expiryDate || c.expiry_date
    if (!exp) return false
    const d = new Date(exp)
    return d >= now && d <= new Date(now.getTime() + 30 * 86400000)
  }).length

  return (
    <div>
      <div className={s.statsRow}>
        <Stat label="Total Certs" value={certs.length} color="#059669" />
        <Stat label="Expired" value={expired} color="#EF4444" />
        <Stat label="Expiring Soon" value={expiring} color="#F59E0B" />
      </div>
      {certs.length === 0 ? <EmptyMessage text="No certifications found." /> : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr className={s.tableHeadRow}>
              {["Employee", "Certification", "Issuer", "Cert #", "Expires", "Status"].map(h => <th key={h} className={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {certs.map((c, i) => {
                const exp = c.expiryDate || c.expiry_date
                const isExpired = exp && new Date(exp) < now
                const isExpiring = exp && !isExpired && new Date(exp) <= new Date(now.getTime() + 30 * 86400000)
                const statusCls = isExpired ? s.statusFlagged : isExpiring ? s.statusPending : s.statusComplete
                const statusText = isExpired ? "Expired" : isExpiring ? "Expiring" : exp ? "Valid" : "No Expiry"
                const name = `${c.first_name || c.firstName || ""} ${c.last_name || c.lastName || ""}`.trim() || c.employeeName || ""
                return (
                  <tr key={c.id || i} className={s.tableRow}>
                    <td className={`${s.cell} ${s.cellBold}`}>{name}</td>
                    <td className={s.cell}>{c.name || c.certName || c.cert_name}</td>
                    <td className={`${s.cell} ${s.cellTextMed}`}>{c.issuing_authority || c.issuer || "—"}</td>
                    <td className={`${s.cell} ${s.cellMono}`}>{c.cert_number || c.certNumber || "—"}</td>
                    <td className={`${s.cell} ${s.cellMono}`}>{exp ? fmtShort(exp) : "—"}</td>
                    <td className={s.cell}><span className={statusCls}>{statusText}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Training ──
function TrainingResults({ data }) {
  const sessions = Array.isArray(data) ? data : data?.sessions || []
  const totalSignoffs = sessions.reduce((s, t) => s + (t.signoff_count || t.signoffCount || 0), 0)
  return (
    <div>
      <div className={s.statsRow}>
        <Stat label="Sessions" value={sessions.length} color="#D97706" />
        <Stat label="Total Signoffs" value={totalSignoffs} color="#3B82F6" />
      </div>
      {sessions.length === 0 ? <EmptyMessage text="No training sessions found." /> : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr className={s.tableHeadRow}>
              {["Date", "Title", "Type", "Trainer", "Signoffs"].map(h => <th key={h} className={s.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {sessions.map((t, i) => (
                <tr key={t.id || i} className={s.tableRow} style={{ cursor: "pointer" }} onClick={() => onSelect?.(t)}>
                  <td className={`${s.cell} ${s.cellMono}`}>{fmtShort(t.training_date || t.sessionDate || t.created_at?.slice(0, 10))}</td>
                  <td className={`${s.cell} ${s.cellBold}`}>{t.title}</td>
                  <td className={s.cell}>{t.type}</td>
                  <td className={`${s.cell} ${s.cellTextMed}`}>{t.trainer || "—"}</td>
                  <td className={`${s.cell} ${s.cellMono}`}>{t.signoff_count || t.signoffCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Module stub (no endpoint yet) ──
function ModuleStubResults({ data }) {
  return (
    <div className={s.moduleStub}>
      <FileText size={28} style={{ color: "var(--t3)" }} />
      <div className={s.moduleStubTitle}>{data.label} Reports</div>
      <div className={s.moduleStubDesc}>
        Module-specific reporting for {data.label} is coming soon.
        Log data is being collected — reports will be available here once the module reporting API is built.
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Report Detail Modal — click a row to view full info
// ═══════════════════════════════════════════
function ReportDetailModal({ reportKey, item, onClose }) {
  if (!item) return null

  const renderContent = () => {
    switch (reportKey) {
      case "spray-log": return <SprayLogDetail item={item} />
      case "inspections": return <InspectionDetail item={item} />
      case "incidents": return <IncidentDetail item={item} />
      case "work-log": return <WorkLogDetail item={item} />
      case "training": return <TrainingDetail item={item} />
      default: return <GenericDetail item={item} />
    }
  }

  return (
    <Modal onClose={onClose} size="lg">
      {renderContent()}
    </Modal>
  )
}

// ── Detail field row ──
function DField({ label, value }) {
  if (!value && value !== 0) return null
  return (
    <div className={s.detailField}>
      <div className={s.detailLabel}>{label}</div>
      <div className={s.detailValue}>{value}</div>
    </div>
  )
}

// ── Spray Log Detail ──
function SprayLogDetail({ item }) {
  const l = item
  return (
    <div>
      <div className={s.detailHeader}>
        <div className={s.detailTitle}>{l.property || "Spray Log"}</div>
        <div className={s.detailSub}>{l.date} {l.time && `· ${l.time}`}</div>
      </div>
      <div className={s.detailGrid}>
        <DField label="Crew" value={l.crewName} />
        <DField label="Crew Lead" value={l.crewLead} />
        <DField label="License" value={l.license} />
        <DField label="Location" value={typeof l.location === "string" ? l.location : l.location?.address} />
        <DField label="Equipment" value={l.equipment} />
        <DField label="Total Mix Volume" value={l.totalMixVol} />
        <DField label="Target Pest" value={l.targetPest} />
        <DField label="Status" value={l.status} />
      </div>
      {l.weather && (
        <div className={s.detailSection}>
          <div className={s.detailSectionTitle}>Weather</div>
          <div className={s.detailGrid}>
            <DField label="Temperature" value={l.weather.temp != null ? `${l.weather.temp}°F` : null} />
            <DField label="Humidity" value={l.weather.humidity != null ? `${l.weather.humidity}%` : null} />
            <DField label="Wind" value={l.weather.windSpeed != null ? `${l.weather.windSpeed} mph ${l.weather.windDir || ""}` : null} />
            <DField label="Conditions" value={l.weather.conditions} />
          </div>
        </div>
      )}
      {(l.products || []).length > 0 && (
        <div className={s.detailSection}>
          <div className={s.detailSectionTitle}>Products Applied</div>
          {l.products.map((p, i) => (
            <div key={i} className={s.detailListItem}>
              <strong>{p.name || p.chemicalName}</strong>
              {p.epa && <span> · EPA {p.epa}</span>}
              {p.ozConcentrate && <span> · {p.ozConcentrate} oz concentrate</span>}
            </div>
          ))}
        </div>
      )}
      {(l.members || []).length > 0 && (
        <div className={s.detailSection}>
          <div className={s.detailSectionTitle}>Crew Members Present</div>
          {l.members.map((m, i) => (
            <div key={i} className={s.detailListItem}>{m.employee_name || m.name}</div>
          ))}
        </div>
      )}
      {l.notes && (
        <div className={s.detailSection}>
          <div className={s.detailSectionTitle}>Notes</div>
          <div className={s.detailNotes}>{l.notes}</div>
        </div>
      )}
      {(l.photos || []).length > 0 && (
        <div className={s.detailSection}>
          <div className={s.detailSectionTitle}>Photos ({l.photos.length})</div>
          <div className={s.detailPhotos}>
            {l.photos.map((p, i) => (
              <a key={i} href={`/api/uploads/${p.filename}`} target="_blank" rel="noopener noreferrer" className={s.detailPhotoLink}>
                {p.original_name || p.originalName || `Photo ${i + 1}`}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Inspection Detail ──
function InspectionDetail({ item }) {
  const d = item
  const checklist = d.checklist || []
  const passCount = checklist.filter(c => c.status === "pass").length
  const failCount = checklist.filter(c => c.status === "fail").length
  const naCount = checklist.filter(c => c.status === "na").length

  return (
    <div>
      <div className={s.detailHeader}>
        <div className={s.detailTitle}>{d.title}</div>
        <div className={s.detailSub}>
          {d.date || fmtDate((d.createdAt || d.created_at || "").slice(0, 10))}
          {d.time && ` · ${d.time}`}
          {d.status === "flagged" && <span className={s.statusFlagged} style={{ marginLeft: 8 }}>FLAGGED</span>}
        </div>
      </div>
      <div className={s.detailGrid}>
        <DField label="Inspector" value={d.employeeName || d.employee_name} />
        <DField label="Crew" value={d.crewName} />
        <DField label="Location" value={d.location} />
        <DField label="Template" value={d.metadata?.template} />
      </div>
      {checklist.length > 0 && (
        <div className={s.detailSection}>
          <div className={s.detailSectionTitle}>
            Checklist — {passCount} pass · {failCount} fail · {naCount} N/A
          </div>
          {checklist.map((c, i) => (
            <div key={i} className={s.checklistRow}>
              <span className={
                c.status === "pass" ? s.checkPass :
                c.status === "fail" ? s.checkFail :
                s.checkNA
              }>
                {c.status === "pass" ? "PASS" : c.status === "fail" ? "FAIL" : "N/A"}
              </span>
              <span className={s.checkItem}>{c.item}</span>
              {c.note && <div className={s.checkNote}>{c.note}</div>}
            </div>
          ))}
        </div>
      )}
      {d.body && (
        <div className={s.detailSection}>
          <div className={s.detailSectionTitle}>Notes</div>
          <div className={s.detailNotes}>{d.body}</div>
        </div>
      )}
      {(d.photos || []).length > 0 && (
        <div className={s.detailSection}>
          <div className={s.detailSectionTitle}>Photos ({d.photos.length})</div>
          <div className={s.detailPhotos}>
            {d.photos.map((p, i) => (
              <a key={i} href={`/api/uploads/${p.filename}`} target="_blank" rel="noopener noreferrer" className={s.detailPhotoLink}>
                {p.originalName || p.original_name || `Photo ${i + 1}`}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Incident Detail ──
function IncidentDetail({ item }) {
  const inc = item
  return (
    <div>
      <div className={s.detailHeader}>
        <div className={s.detailTitle}>{inc.title}</div>
        <div className={s.detailSub}>
          {inc.incident_date || inc.incidentDate}
          <span className={s[`severity${(inc.severity || "").charAt(0).toUpperCase() + (inc.severity || "").slice(1)}`] || ""} style={{ marginLeft: 8 }}>
            {inc.severity}
          </span>
        </div>
      </div>
      <div className={s.detailGrid}>
        <DField label="Type" value={inc.incident_type || inc.incidentType} />
        <DField label="Status" value={inc.status} />
        <DField label="Location" value={inc.location} />
        <DField label="Reporter" value={inc.reporter_first_name ? `${inc.reporter_first_name} ${inc.reporter_last_name || ""}` : null} />
        <DField label="Injury Occurred" value={inc.injury_occurred ? "Yes" : "No"} />
      </div>
      {inc.description && (
        <div className={s.detailSection}>
          <div className={s.detailSectionTitle}>Description</div>
          <div className={s.detailNotes}>{inc.description}</div>
        </div>
      )}
      {inc.injury_description && (
        <div className={s.detailSection}>
          <div className={s.detailSectionTitle}>Injury Description</div>
          <div className={s.detailNotes}>{inc.injury_description}</div>
        </div>
      )}
      {inc.witnesses && (
        <div className={s.detailSection}>
          <div className={s.detailSectionTitle}>Witnesses</div>
          <div className={s.detailNotes}>{inc.witnesses}</div>
        </div>
      )}
      {inc.investigation_notes && (
        <div className={s.detailSection}>
          <div className={s.detailSectionTitle}>Investigation Notes</div>
          <div className={s.detailNotes}>{inc.investigation_notes}</div>
        </div>
      )}
      {inc.corrective_actions && (
        <div className={s.detailSection}>
          <div className={s.detailSectionTitle}>Corrective Actions</div>
          <div className={s.detailNotes}>{inc.corrective_actions}</div>
        </div>
      )}
    </div>
  )
}

// ── Work Log Detail ──
function WorkLogDetail({ item }) {
  const c = item
  return (
    <div>
      <div className={s.detailHeader}>
        <div className={s.detailTitle}>{c.accountName}</div>
        <div className={s.detailSub}>{fmtDate(c.workDate)} · {c.routeName}</div>
      </div>
      <div className={s.detailGrid}>
        <DField label="Crew" value={c.crewName} />
        <DField label="Completed By" value={c.completedByName} />
        <DField label="Status" value={c.status} />
        <DField label="Address" value={c.accountAddress} />
        <DField label="City" value={c.accountCity} />
        <DField label="Time Spent" value={c.timeSpentMinutes ? `${c.timeSpentMinutes} min` : null} />
      </div>
      {c.notes && (
        <div className={s.detailSection}>
          <div className={s.detailSectionTitle}>Notes</div>
          <div className={s.detailNotes}>{c.notes}</div>
        </div>
      )}
      {c.fieldNotes && (
        <div className={s.detailSection}>
          <div className={s.detailSectionTitle}>Field Notes</div>
          <div className={s.detailNotes}>{c.fieldNotes}</div>
        </div>
      )}
    </div>
  )
}

// ── Training Detail ──
function TrainingDetail({ item }) {
  const t = item
  return (
    <div>
      <div className={s.detailHeader}>
        <div className={s.detailTitle}>{t.title}</div>
        <div className={s.detailSub}>{t.training_date || t.sessionDate} · {t.type}</div>
      </div>
      <div className={s.detailGrid}>
        <DField label="Trainer" value={t.trainer} />
        <DField label="Duration" value={t.duration_hours ? `${t.duration_hours} hours` : null} />
        <DField label="Location" value={t.location} />
        <DField label="Status" value={t.status} />
        <DField label="Signoffs" value={t.signoff_count || t.signoffCount || 0} />
      </div>
      {t.description && (
        <div className={s.detailSection}>
          <div className={s.detailSectionTitle}>Description</div>
          <div className={s.detailNotes}>{t.description}</div>
        </div>
      )}
      {t.notes && (
        <div className={s.detailSection}>
          <div className={s.detailSectionTitle}>Notes</div>
          <div className={s.detailNotes}>{t.notes}</div>
        </div>
      )}
    </div>
  )
}

// ── Generic Detail (fallback) ──
function GenericDetail({ item }) {
  return (
    <div>
      <div className={s.detailHeader}>
        <div className={s.detailTitle}>{item.title || item.name || "Details"}</div>
      </div>
      <div className={s.detailGrid}>
        {Object.entries(item).filter(([k, v]) => v != null && typeof v !== "object" && k !== "id" && k !== "org_id").map(([k, v]) => (
          <DField key={k} label={k.replace(/_/g, " ")} value={String(v)} />
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Reports Page — Overview, Attendance, Work Log, Compliance, Crew Performance
// Date range + crew filters, CSV/PDF export
// ═══════════════════════════════════════════

import { useState, useEffect, useRef } from "react"
import {
  BarChart3, Download, Printer, Calendar, Users,
  FileText, CheckCircle2, Filter, ChevronDown, Loader2, X,
  ShieldCheck, ArrowRight,
} from "lucide-react"
import usePageData from "@/hooks/usePageData.js"
import { getCrews } from "@/lib/api/crews.js"
import {
  getRosterReport, getCompletionReport,
} from "@/lib/api/reports.js"
import {
  Modal, PageHeader, LoadingSpinner, EmptyMessage,
} from "@/app/dashboard/components/PageUI.jsx"

import { ENABLED_MODULES } from "@/app/modules.js"
import s from "./ReportsPage.module.css"

const REPORT_TABS = [
  { key: "overview", label: "Overview", icon: BarChart3, color: "#D97706" },
  { key: "attendance", label: "Attendance", icon: Users, color: "#3B82F6" },
  { key: "work-log", label: "Work Log", icon: CheckCircle2, color: "#F59E0B" },
  { key: "compliance", label: "Compliance", icon: ShieldCheck, color: "#059669" },
]

// ── Date helpers ──
function getMonthStart(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01` }
function getMonthEnd(date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return d.toLocaleDateString("en-CA")
}
function formatDate(d) { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }

export default function ReportsPage() {
  const crews = usePageData("crews", { fetchFn: getCrews })
  const [activeTab, setActiveTab] = useState("overview")
  const [dateStart, setDateStart] = useState(() => getMonthStart(new Date()))
  const [dateEnd, setDateEnd] = useState(() => getMonthEnd(new Date()))
  const [crewFilter, setCrewFilter] = useState("")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const printRef = useRef(null)

  // ── Fetch data when tab or filters change ──
  const fetchReport = async () => {
    // Overview and compliance don't need data fetching
    if (activeTab === "overview" || activeTab === "compliance") {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setData(null)
    try {
      switch (activeTab) {
        case "attendance":
          setData(await getRosterReport(dateStart, dateEnd))
          break
        case "work-log":
          setData(await getCompletionReport({ start: dateStart, end: dateEnd, crewId: crewFilter ? crews.data.find(c => c.name === crewFilter)?.id : undefined, limit: 500 }))
          break
      }
    } catch (err) { console.error("Report fetch failed:", err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReport() }, [activeTab, dateStart, dateEnd, crewFilter])

  // ── Quick date presets ──
  const setThisMonth = () => { const n = new Date(); setDateStart(getMonthStart(n)); setDateEnd(getMonthEnd(n)) }
  const setLastMonth = () => { const n = new Date(); n.setMonth(n.getMonth() - 1); setDateStart(getMonthStart(n)); setDateEnd(getMonthEnd(n)) }
  const setThisYear = () => { const n = new Date(); setDateStart(`${n.getFullYear()}-01-01`); setDateEnd(getMonthEnd(n)) }

  // ── CSV export ──
  const exportCsv = () => {
    let csv = ""
    const rows = getCsvRows()
    if (rows.length === 0) return

    csv = rows.map(r => r.map(c => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${activeTab}-report-${dateStart}-to-${dateEnd}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getCsvRows = () => {
    if (!data) return []
    switch (activeTab) {
      case "attendance":
        return [
          ["Crew", "Days Worked", "Unique Members", "Total Absences"],
          ...(data?.crews || []).map(c => [c.crewName, c.daysWorked, c.totalMembers, c.totalAbsences])
        ]
      case "work-log":
        return [
          ["Date", "Route", "Crew", "Account", "Completed By", "Status", "Time Spent (min)"],
          ...(data || []).map(c => [c.workDate, c.routeName, c.crewName, c.accountName, c.completedByName, c.status, c.timeSpentMinutes || ""])
        ]
      default: return []
    }
  }

  // ── Print ──
  const handlePrint = () => { window.print() }

  // ── Date range label ──
  const rangeLabel = `${formatDate(dateStart)} — ${formatDate(dateEnd)}`

  // ── Check if current tab needs filters ──
  const showFilters = activeTab === "attendance" || activeTab === "work-log"

  return (
    <div>
      <PageHeader title="Reports" action={
        <div className={s.headerActions}>
          <button onClick={exportCsv} disabled={!data || loading} className={s.csvBtn}>
            <Download size={14} /> CSV
          </button>
          <button onClick={handlePrint} disabled={!data || loading} className={s.printBtn}>
            <Printer size={14} /> Print / PDF
          </button>
        </div>
      } />

      {/* Report type tabs */}
      <div className={s.tabBar}>
        {REPORT_TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={s.tabBtn}
            style={activeTab === tab.key ? {
              borderColor: tab.color,
              background: `${tab.color}10`,
              color: tab.color,
            } : undefined}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Filters bar — only for data-driven tabs */}
      {showFilters && (
        <div className={s.filterBar}>
          <div className={s.filterField}>
            <label className={s.filterLabel}>From</label>
            <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className={s.filterInput} />
          </div>
          <div className={s.filterField}>
            <label className={s.filterLabel}>To</label>
            <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className={s.filterInput} />
          </div>
          <div className={s.filterField}>
            <label className={s.filterLabel}>Crew</label>
            <select value={crewFilter} onChange={e => setCrewFilter(e.target.value)} className={s.filterInput}>
              <option value="">All Crews</option>
              {crews.data.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className={s.presetGroup}>
            <PresetBtn label="This Month" onClick={setThisMonth} />
            <PresetBtn label="Last Month" onClick={setLastMonth} />
            <PresetBtn label="This Year" onClick={setThisYear} />
          </div>
        </div>
      )}

      {/* Report content */}
      <div ref={printRef} id="report-printable">
        {/* Print header — only visible when printing */}
        <div className={s.printOnly}>
          <div className={s.printTitle}>
            CruPoint — {REPORT_TABS.find(t => t.key === activeTab)?.label}
          </div>
          <div className={s.printSubtitle}>
            {rangeLabel}{crewFilter && ` · ${crewFilter}`}
          </div>
        </div>

        {activeTab === "overview" ? (
          <OverviewReport dateStart={dateStart} dateEnd={dateEnd} rangeLabel={rangeLabel} />
        ) : activeTab === "compliance" ? (
          <ComplianceReport />
        ) : loading ? <LoadingSpinner /> : !data ? (
          <EmptyMessage text="Select a date range to generate a report." />
        ) : activeTab === "attendance" ? (
          <AttendanceReport data={data} />
        ) : activeTab === "work-log" ? (
          <WorkLogReport data={data} />
        ) : null}
      </div>

      {/* Module Reports section */}
      <ModuleReportsSection />
    </div>
  )
}

function PresetBtn({ label, onClick }) {
  return (
    <button onClick={onClick} className={s.presetBtn}>{label}</button>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className={s.statCard} style={color ? { borderTopColor: color } : undefined}>
      <div className={s.statValue}>{value}</div>
      <div className={s.statLabel}>{label}</div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Overview Report — summary dashboard
// ═══════════════════════════════════════════
function OverviewReport({ dateStart, dateEnd, rangeLabel }) {
  return (
    <div>
      <div className={s.statsRow}>
        <StatCard label="Report Types" value={REPORT_TABS.length} color="#D97706" />
        <StatCard label="Date Range" value={rangeLabel} color="#3B82F6" />
        <StatCard label="Active Modules" value={ENABLED_MODULES.length} color="#059669" />
      </div>

      <div className={s.overviewInfo}>
        <div className={s.overviewCard}>
          <div className={s.overviewCardTitle}>Available Reports</div>
          <div className={s.overviewList}>
            {REPORT_TABS.filter(t => t.key !== "overview").map(tab => (
              <div key={tab.key} className={s.overviewListItem}>
                <tab.icon size={14} style={{ color: tab.color }} />
                <span className={s.overviewListLabel}>{tab.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={s.overviewCard}>
          <div className={s.overviewCardTitle}>Module Reports</div>
          <div className={s.overviewList}>
            {ENABLED_MODULES.filter(m => m.key === "spray" || m.key === "pest" || m.key === "irrigation").map(mod => (
              <div key={mod.key} className={s.overviewListItem}>
                <mod.icon size={14} style={{ color: mod.color }} />
                <span className={s.overviewListLabel}>{mod.label}</span>
                <span className={s.overviewListSub}>Modules &gt; {mod.label} &gt; Reports</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Compliance Report — placeholder
// ═══════════════════════════════════════════
function ComplianceReport() {
  return (
    <div>
      <div className={s.statsRow}>
        <StatCard label="Data Sources" value="3" color="#059669" />
        <StatCard label="Status" value="Coming Soon" color="#D97706" />
      </div>

      <div className={s.compliancePlaceholder}>
        <ShieldCheck size={32} className={s.complianceIcon} />
        <div className={s.complianceTitle}>Compliance Reporting</div>
        <div className={s.complianceDesc}>
          Compliance reporting will pull from certifications, training, and incident data.
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Module Reports Section — bottom of page
// ═══════════════════════════════════════════
function ModuleReportsSection() {
  const modulesWithReports = ENABLED_MODULES.filter(m =>
    ["spray", "pest", "irrigation"].includes(m.key)
  )

  if (modulesWithReports.length === 0) return null

  return (
    <div className={s.moduleReportsSection}>
      <div className={s.card}>
        <div className={s.cardHeader}>
          <div>
            <div className={s.cardTitle}>Module Reports</div>
            <div className={s.cardSubtitle}>
              Module-specific reports are accessed from within each module.
            </div>
          </div>
        </div>
        <div className={s.cardBody}>
          {modulesWithReports.map((mod, i) => (
            <div key={mod.key} className={i < modulesWithReports.length - 1 ? s.moduleReportRowBorder : s.moduleReportRow}>
              <div className={s.moduleReportLabel}>
                <mod.icon size={14} style={{ color: mod.color }} />
                <span>{mod.label} Reports</span>
              </div>
              <div className={s.moduleReportPath}>
                Modules <ArrowRight size={10} /> {mod.label} <ArrowRight size={10} /> Reports
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Attendance Report
// ═══════════════════════════════════════════
function AttendanceReport({ data }) {
  const crewList = data?.crews || []
  const totalRosters = data?.totalRosters || 0

  return (
    <div>
      <div className={s.statsRow}>
        <StatCard label="Total Rosters" value={totalRosters} color="#3B82F6" />
        <StatCard label="Crews Active" value={crewList.length} color="#2F6FED" />
        <StatCard label="Total Absences" value={crewList.reduce((s, c) => s + c.totalAbsences, 0)} color="#EF4444" />
      </div>

      {crewList.length === 0 ? (
        <EmptyMessage text="No attendance records found for this period." />
      ) : (
        <div className={s.cardList}>
          {crewList.map((crew, i) => (
            <div key={i} className={s.card}>
              <div className={s.cardHeader}>
                <div>
                  <div className={s.cardTitle}>{crew.crewName}</div>
                  <div className={s.cardSubtitle}>
                    {crew.totalMembers} member{crew.totalMembers !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className={s.attendanceStats}>
                  <div>
                    <div className={s.attendanceBigNum}>{crew.daysWorked}</div>
                    <div className={s.attendanceSmallLabel}>Days</div>
                  </div>
                  {crew.totalAbsences > 0 && (
                    <div>
                      <div className={s.attendanceBigNumRed}>{crew.totalAbsences}</div>
                      <div className={s.attendanceSmallLabel}>Absences</div>
                    </div>
                  )}
                </div>
              </div>

              <div className={s.cardBody}>
                {(crew.rosters || []).map((r, j) => (
                  <div key={j} className={j < crew.rosters.length - 1 ? s.rosterRowBorder : s.rosterRow}>
                    <div className={s.rosterDate}>{r.date}</div>
                    <div className={s.rosterLead}>Lead: {r.lead}</div>
                    <div className={s.rosterPresent}>{r.memberCount} present</div>
                    {r.absentCount > 0 && (
                      <div className={s.rosterAbsent}>{r.absentCount} absent</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Work Log Report
// ═══════════════════════════════════════════
function WorkLogReport({ data }) {
  const completions = Array.isArray(data) ? data : []

  const uniqueRoutes = new Set(completions.map(c => c.routeName)).size
  const uniqueAccounts = new Set(completions.map(c => c.accountName)).size

  return (
    <div>
      <div className={s.statsRow}>
        <StatCard label="Stops Completed" value={completions.length} color="#F59E0B" />
        <StatCard label="Routes Active" value={uniqueRoutes} color="#2F6FED" />
        <StatCard label="Properties Visited" value={uniqueAccounts} color="#3B82F6" />
      </div>

      {completions.length === 0 ? (
        <EmptyMessage text="No work completions found for this period." />
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr className={s.tableHeadRow}>
                {["Date", "Route", "Account", "Crew", "Completed By", "Status", "Time"].map(h => (
                  <th key={h} className={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {completions.map((c, i) => (
                <tr key={c.id || i} className={s.tableRow}>
                  <td className={`${s.cell} ${s.cellMono}`}>
                    <div className={s.cellBold}>
                      {new Date(c.workDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </td>
                  <td className={s.cell}>
                    <div className={s.routeIndicator}>
                      <div className={s.routeColorDot} style={c.routeColor ? { background: c.routeColor } : undefined} />
                      <span className={s.routeName}>{c.routeName}</span>
                    </div>
                  </td>
                  <td className={s.cell}>{c.accountName}</td>
                  <td className={`${s.cell} ${s.cellTextMed}`}>{c.crewName}</td>
                  <td className={s.cell}>{c.completedByName}</td>
                  <td className={s.cell}>
                    <span className={c.status === "complete" ? s.statusComplete : s.statusPending}>
                      {c.status}
                    </span>
                  </td>
                  <td className={`${s.cell} ${s.cellTextMed} ${s.cellMono}`}>
                    {c.timeSpentMinutes ? `${c.timeSpentMinutes}m` : "—"}
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

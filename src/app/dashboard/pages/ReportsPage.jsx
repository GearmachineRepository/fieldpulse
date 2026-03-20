// ═══════════════════════════════════════════
// Reports Page — Spray Logs, PUR, Attendance, Work Log
// Date range + crew filters, CSV/PDF export
// ═══════════════════════════════════════════

import { useState, useEffect, useRef } from "react"
import {
  BarChart3, Download, Printer, Calendar, Users, Droplets,
  FileText, CheckCircle2, Filter, ChevronDown, Loader2, X,
} from "lucide-react"
import usePageData from "@/hooks/usePageData.js"
import { getCrews } from "@/lib/api/crews.js"
import {
  getPurReportRange, getRosterReport, getCompletionReport, getSprayLogsReport,
} from "@/lib/api/reports.js"
import {
  Modal, PageHeader, LoadingSpinner, EmptyMessage,
} from "@/app/dashboard/components/PageUI.jsx"

import { ENABLED_MODULES } from "@/app/modules.js"
import s from "./ReportsPage.module.css"

const CORE_TABS = [
  { key: "attendance", label: "Attendance", icon: Users, color: "#3B82F6" },
  { key: "work-log", label: "Work Log", icon: CheckCircle2, color: "#F59E0B" },
]

const MODULE_TABS = [
  { key: "spray", label: "Spray Logs", icon: Droplets, color: "#7C3AED", module: "spray" },
  { key: "pur", label: "PUR Report", icon: FileText, color: "#2F6FED", module: "spray" },
  // Future: { key: "irrigation-log", label: "Irrigation Log", icon: Waves, color: "#0891B2", module: "irrigation" },
]

const REPORT_TABS = [
  ...CORE_TABS,
  ...MODULE_TABS.filter(t => ENABLED_MODULES.some(m => m.key === t.module)),
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
  const [activeTab, setActiveTab] = useState("spray")
  const [dateStart, setDateStart] = useState(() => getMonthStart(new Date()))
  const [dateEnd, setDateEnd] = useState(() => getMonthEnd(new Date()))
  const [crewFilter, setCrewFilter] = useState("")
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const printRef = useRef(null)

  // ── Fetch data when tab or filters change ──
  const fetchReport = async () => {
    setLoading(true)
    setData(null)
    try {
      switch (activeTab) {
        case "spray":
          setData(await getSprayLogsReport({ start: dateStart, end: dateEnd, crewName: crewFilter || undefined, limit: 500 }))
          break
        case "pur":
          setData(await getPurReportRange(dateStart, dateEnd))
          break
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
      case "spray":
        return [
          ["Date", "Time", "Property", "Crew", "Lead", "Products", "Equipment", "Mix Volume", "Weather"],
          ...(data || []).map(l => [l.date, l.time, l.property, l.crewName, l.crewLead,
            (l.products || []).map(p => `${p.name} ${p.ozConcentrate}`).join("; "),
            l.equipment, l.totalMixVol,
            l.weather ? `${l.weather.temp || ""}°F ${l.weather.humidity || ""}% ${l.weather.windSpeed || ""}mph` : ""
          ])
        ]
      case "pur":
        return [
          ["Chemical", "EPA #", "Total Amount", "Unit", "Applications"],
          ...(data?.products || []).map(p => [p.name, p.epa, p.totalAmount.toFixed(2), p.unit, p.appCount])
        ]
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

      {/* Filters bar */}
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

        {loading ? <LoadingSpinner /> : !data ? (
          <EmptyMessage text="Select a date range to generate a report." />
        ) : activeTab === "spray" ? (
          <SprayReport data={data} crewFilter={crewFilter} />
        ) : activeTab === "pur" ? (
          <PurReport data={data} />
        ) : activeTab === "attendance" ? (
          <AttendanceReport data={data} />
        ) : activeTab === "work-log" ? (
          <WorkLogReport data={data} />
        ) : null}
      </div>
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
// Spray Log Report
// ═══════════════════════════════════════════
function SprayReport({ data, crewFilter }) {
  const logs = Array.isArray(data) ? data : []
  const filtered = crewFilter ? logs.filter(l => l.crewName === crewFilter) : logs

  const totalProducts = filtered.reduce((sum, l) => sum + (l.products?.length || 0), 0)
  const uniqueProperties = new Set(filtered.map(l => l.property)).size

  return (
    <div>
      {/* Summary cards */}
      <div className={s.statsRow}>
        <StatCard label="Total Applications" value={filtered.length} color="#7C3AED" />
        <StatCard label="Products Applied" value={totalProducts} color="#3B82F6" />
        <StatCard label="Properties Served" value={uniqueProperties} color="#2F6FED" />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyMessage text="No spray logs found for this period." />
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr className={s.tableHeadRow}>
                {["Date", "Property", "Crew", "Products", "Equipment", "Mix Vol", "Weather"].map(h => (
                  <th key={h} className={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => (
                <tr key={log.id || i} className={s.tableRow}>
                  <td className={s.cell}>
                    <div className={s.cellBold}>{log.date}</div>
                    <div className={s.cellSub}>{log.time}</div>
                  </td>
                  <td className={s.cell}>
                    <div className={s.cellBold}>{log.property}</div>
                  </td>
                  <td className={s.cell}>
                    <div>{log.crewName}</div>
                    <div className={s.cellSub}>{log.crewLead}</div>
                  </td>
                  <td className={s.cell}>
                    {(log.products || []).map((p, j) => (
                      <div key={j} className={s.productLine}>
                        <span className={s.productName}>{p.name}</span>
                        <span className={s.productDetail}> — {p.ozConcentrate}</span>
                      </div>
                    ))}
                  </td>
                  <td className={`${s.cell} ${s.cellSmall}`}>{log.equipment || "—"}</td>
                  <td className={`${s.cell} ${s.cellSmall}`}>{log.totalMixVol || "—"}</td>
                  <td className={`${s.cell} ${s.cellMuted}`}>
                    {log.weather ? `${log.weather.temp || ""}°F · ${log.weather.humidity || ""}% · ${log.weather.windSpeed || ""}mph` : "—"}
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

// ═══════════════════════════════════════════
// PUR Report — Chemical usage summary
// ═══════════════════════════════════════════
function PurReport({ data }) {
  const products = data?.products || []
  const totalApps = data?.totalApplications || 0

  return (
    <div>
      <div className={s.statsRow}>
        <StatCard label="Chemicals Used" value={products.length} color="#2F6FED" />
        <StatCard label="Total Applications" value={totalApps} color="#7C3AED" />
      </div>

      {products.length === 0 ? (
        <EmptyMessage text="No chemical applications found for this period." />
      ) : (
        <div className={s.cardList}>
          {products.map((p, i) => (
            <div key={i} className={s.card}>
              {/* Chemical header */}
              <div className={s.cardHeader}>
                <div>
                  <div className={s.cardTitle}>{p.name}</div>
                  <div className={s.cardSubtitle}>EPA# {p.epa || "N/A"}</div>
                </div>
                <div className={s.textRight}>
                  <div className={s.purAmount}>
                    {p.totalAmount.toFixed(2)} {p.unit}
                  </div>
                  <div className={s.purAppCount}>
                    {p.appCount} application{p.appCount !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {/* Application details */}
              <div className={s.cardBody}>
                {(p.applications || []).map((app, j) => (
                  <div key={j} className={j < p.applications.length - 1 ? s.purAppRowBorder : s.purAppRow}>
                    <div className={s.purAppDate}>{app.date}</div>
                    <div className={s.purAppProperty}>{app.property}</div>
                    <div className={s.purAppCrew}>{app.crew}</div>
                    <div className={s.purAppAmount}>{app.amount}</div>
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
                  <td className={s.cell}>
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
                  <td className={`${s.cell} ${s.cellTextMed}`}>
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

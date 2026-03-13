// ═══════════════════════════════════════════
// Dashboard Home — Real Data
//
// Pulls live data from useData() + specialized
// endpoints. No mock data.
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import {
  Truck, Users, FileText, AlertTriangle, Clock, MapPin,
  BookOpen, ChevronRight, Droplets, Camera, Loader2,
  CheckCircle2, XCircle, RefreshCw,
} from "lucide-react"
import { useData } from "@/context/DataProvider.jsx"
import { getAttendanceToday } from "@/lib/api/rosters.js"
import s from "./DashboardHome.module.css"

export default function DashboardHome({ onNavigate }) {
  const { vehicles, crews, employees, sprayLogs } = useData()
  const [attendance, setAttendance] = useState(null)
  const [loadingAttendance, setLoadingAttendance] = useState(true)

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })

  // ── Fetch attendance (specialized endpoint) ──
  useEffect(() => {
    getAttendanceToday()
      .then(setAttendance)
      .catch(console.error)
      .finally(() => setLoadingAttendance(false))
  }, [])

  // ── Derived stats ──
  const vehicleCount = vehicles.data.length
  const crewCount = crews.data.length
  const employeeCount = employees.data.length
  const totalWorking = attendance?.totalWorking || 0
  const totalEmployees = attendance?.totalEmployees || employeeCount

  // Today's logs (check if date matches today)
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const todayShort = new Date().toLocaleDateString("en-US", { month: "numeric", day: "numeric" })
  const todayLogs = sprayLogs.data.filter(log => {
    // log.date comes as "Mar 9" or similar from formatShortDate
    return log.date === today
  })

  // Rosters submitted today
  const rostersSubmitted = attendance?.crews?.filter(c => c.submitted).length || 0
  const totalCrews = attendance?.crews?.length || crewCount

  // Recent logs (last 5)
  const recentLogs = sprayLogs.data.slice(0, 5)

  // Crews with attendance info
  const crewsWithAttendance = attendance?.crews || crews.data.map(c => ({
    crewId: c.id,
    crewName: c.name,
    submitted: false,
    memberCount: 0,
    members: [],
  }))

  const isLoading = vehicles.loading || crews.loading || employees.loading || sprayLogs.loading

  const statCards = [
    {
      label: "FLEET",
      val: String(vehicleCount),
      sub: `${crewCount} crew${crewCount !== 1 ? "s" : ""} active`,
      icon: Truck,
      color: "var(--color-accent)",
    },
    {
      label: "WORKING",
      val: String(totalWorking),
      sub: `${rostersSubmitted}/${totalCrews} rosters in`,
      icon: Users,
      color: "var(--color-blue)",
    },
    {
      label: "LOGS TODAY",
      val: String(todayLogs.length),
      sub: "Spray applications",
      icon: FileText,
      color: "var(--color-amber)",
    },
    {
      label: "TEAM",
      val: String(employeeCount),
      sub: `Across ${crewCount} crew${crewCount !== 1 ? "s" : ""}`,
      icon: Users,
      color: "var(--color-purple)",
    },
  ]

  const quickActions = [
    { icon: Truck, label: "Fleet", sub: "Track vehicles", page: "fleet" },
    { icon: FileText, label: "Field Docs", sub: "View & export", page: "field-docs" },
    { icon: Clock, label: "Roster", sub: "Today's crews", page: "clock-in" },
    { icon: MapPin, label: "Routes", sub: "Schedule stops", page: "schedule" },
    { icon: BookOpen, label: "Resources", sub: "SDS & docs", page: "resources" },
  ]

  return (
    <div>
      {/* Header */}
      <div className={s.header}>
        <div>
          <div className={s.dateStr}>{dateStr}</div>
          <div className={s.greeting}>{greeting}</div>
        </div>
        {isLoading && (
          <Loader2 size={20} color="var(--color-text-light)" className={s.spinner} />
        )}
      </div>

      {/* Alert — only show if there are rosters not submitted */}
      {!loadingAttendance && totalCrews > 0 && rostersSubmitted < totalCrews && (
        <div className={s.alert}>
          <div className={s.alertIconWrap}>
            <AlertTriangle size={18} color="var(--color-amber)" />
          </div>
          <div className={s.alertContent}>
            <div className={s.alertTitle}>Crews Not Clocked In</div>
            <div className={s.alertSub}>
              {totalCrews - rostersSubmitted} of {totalCrews} crew{totalCrews !== 1 ? "s" : ""} haven't submitted today's roster
            </div>
          </div>
          <ChevronRight size={18} color="#A16207" className={s.alertChevron} />
        </div>
      )}

      {/* Stat cards */}
      <div className={s.statsGrid}>
        {statCards.map((card, i) => (
          <div key={i} className={s.statCard} style={{ borderTop: `3px solid ${card.color}` }}>
            <div className={s.statCardInner}>
              <div className={s.statContent}>
                <div className={s.statLabel}>{card.label}</div>
                <div className={s.statVal}>{card.val}</div>
                <div className={s.statSub}>{card.sub}</div>
              </div>
              <div className={s.statIconWrap} style={{ background: `${card.color}10` }}>
                <card.icon size={20} color={card.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two column */}
      <div className={s.twoCol}>
        {/* Today's Crews */}
        <div className={s.card}>
          <div className={s.cardHeader}>
            <div className={s.cardTitleWrap}>
              <Users size={18} color="var(--color-text-med)" />
              <span className={s.cardTitle}>Today's Crews</span>
            </div>
            <button onClick={() => onNavigate?.("clock-in")} className={s.cardLink}>
              View all <ChevronRight size={14} />
            </button>
          </div>

          {loadingAttendance ? (
            <div className={s.loadingText}>Loading...</div>
          ) : crewsWithAttendance.length === 0 ? (
            <div className={s.emptyText}>No crews set up yet.</div>
          ) : (
            crewsWithAttendance.slice(0, 4).map((c, i) => (
              <div key={i} className={s.crewRow}>
                <div
                  className={s.crewDot}
                  style={{ background: c.submitted ? "var(--color-accent)" : "var(--color-text-light)" }}
                />
                <div className={s.crewInfo}>
                  <div className={s.crewName}>{c.crewName}</div>
                  <div className={s.crewSub}>
                    {c.submitted
                      ? `${c.memberCount} member${c.memberCount !== 1 ? "s" : ""} clocked in`
                      : "Not clocked in yet"
                    }
                  </div>
                </div>
                {c.submitted ? (
                  <CheckCircle2 size={16} color="var(--color-accent)" className={s.flexShrink0} />
                ) : (
                  <XCircle size={16} color="var(--color-text-light)" className={s.flexShrink0} />
                )}
              </div>
            ))
          )}
        </div>

        {/* Recent Spray Logs */}
        <div className={s.card}>
          <div className={s.cardHeader}>
            <div className={s.cardTitleWrap}>
              <FileText size={18} color="var(--color-text-med)" />
              <span className={s.cardTitle}>Recent Spray Logs</span>
            </div>
            <button onClick={() => onNavigate?.("mod-spray")} className={s.cardLink}>
              All Logs <ChevronRight size={14} />
            </button>
          </div>

          {sprayLogs.loading ? (
            <div className={s.loadingText}>Loading...</div>
          ) : recentLogs.length === 0 ? (
            <div className={s.emptyText}>
              No spray logs yet. Crew members can submit them from the field app.
            </div>
          ) : (
            recentLogs.slice(0, 4).map((log, i) => (
              <div key={log.id} className={s.logRow}>
                <div className={s.logIconWrap}>
                  <Droplets size={16} color="var(--color-purple)" />
                </div>
                <div className={s.logInfo}>
                  <div className={s.logProperty}>
                    {log.property}
                  </div>
                  <div className={s.logSub}>
                    {log.crewName} · {log.products.length} product{log.products.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className={s.logDate}>
                  {log.date}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <div className={s.quickActionsTitle}>Quick Actions</div>
        <div className={s.quickActionsGrid}>
          {quickActions.map((a, i) => (
            <div key={i} onClick={() => onNavigate?.(a.page)} className={s.quickActionCard}>
              <a.icon size={24} color="var(--color-text-med)" strokeWidth={1.5} className={s.quickActionIcon} />
              <div className={s.quickActionLabel}>{a.label}</div>
              <div className={s.quickActionSub}>{a.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

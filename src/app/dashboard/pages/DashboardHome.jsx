// ═══════════════════════════════════════════
// Dashboard Home — Command Center
//
// Product: First screen every owner sees.
// Pulls live data from useData() + specialized
// endpoints. No mock data.
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import {
  Truck, Users, FileText, AlertTriangle, Clock, Briefcase,
  BookOpen, ChevronRight, Droplets, ShieldCheck, Loader2,
  CheckCircle2, XCircle,
} from "lucide-react"
import { useData } from "@/context/DataProvider.jsx"
import useNavigation from "@/hooks/useNavigation.js"
import { getAttendanceToday } from "@/lib/api/rosters.js"
import StatCard from "../components/StatCard.jsx"
import s from "./DashboardHome.module.css"

export default function DashboardHome() {
  const { navigate: onNavigate } = useNavigation()
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

  // Today's logs
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
  const recentLogs = sprayLogs.data.slice(0, 5)

  // Rosters submitted today
  const rostersSubmitted = attendance?.crews?.filter(c => c.submitted).length || 0
  const totalCrews = attendance?.crews?.length || crewCount

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
      label: "Active Crews",
      value: String(crewCount),
      sub: `${rostersSubmitted}/${totalCrews} clocked in`,
      icon: Users,
      color: "var(--amb)",
    },
    {
      label: "Working",
      value: String(totalWorking),
      sub: `of ${totalEmployees} employees`,
      icon: Clock,
      color: "var(--blu)",
    },
    {
      label: "Fleet",
      value: String(vehicleCount),
      sub: `${vehicleCount} vehicle${vehicleCount !== 1 ? "s" : ""} tracked`,
      icon: Truck,
      color: "var(--grn)",
    },
    {
      label: "Compliance",
      value: "—",
      sub: "Certs & training",
      icon: ShieldCheck,
      color: "var(--red)",
    },
  ]

  const quickActions = [
    { icon: Briefcase, label: "Jobs",       sub: "Manage sites",      page: "jobs" },
    { icon: Users,     label: "Crews",      sub: "Today's crews",     page: "crews" },
    { icon: Truck,     label: "Fleet",      sub: "Inspections",       page: "vehicles" },
    { icon: ShieldCheck, label: "Compliance", sub: "Certs & training", page: "training" },
    { icon: BookOpen,  label: "Resources",  sub: "SDS & docs",        page: "documents" },
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
          <Loader2 size={20} color="var(--t3)" className={s.spinner} />
        )}
      </div>

      {/* Alert — only show if there are rosters not submitted */}
      {!loadingAttendance && totalCrews > 0 && rostersSubmitted < totalCrews && (
        <div className={s.alert}>
          <div className={s.alertIconWrap}>
            <AlertTriangle size={18} color="var(--amb)" />
          </div>
          <div className={s.alertContent}>
            <div className={s.alertTitle}>Crews Not Clocked In</div>
            <div className={s.alertSub}>
              {totalCrews - rostersSubmitted} of {totalCrews} crew{totalCrews !== 1 ? "s" : ""} haven't submitted today's roster
            </div>
          </div>
          <ChevronRight size={18} color="var(--amb)" className={s.alertChevron} />
        </div>
      )}

      {/* Stat cards */}
      <div className={s.statsGrid}>
        {statCards.map((card, i) => (
          <StatCard
            key={i}
            label={card.label}
            value={card.value}
            sub={card.sub}
            icon={card.icon}
            color={card.color}
          />
        ))}
      </div>

      {/* Two column */}
      <div className={s.twoCol}>
        {/* Today's Crews */}
        <div className={s.card}>
          <div className={s.cardHeader}>
            <div className={s.cardTitleWrap}>
              <Users size={18} color="var(--t2)" />
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
                  style={{ background: c.submitted ? "var(--grn)" : "var(--t3)" }}
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
                  <CheckCircle2 size={16} color="var(--grn)" className={s.flexShrink0} />
                ) : (
                  <XCircle size={16} color="var(--t3)" className={s.flexShrink0} />
                )}
              </div>
            ))
          )}
        </div>

        {/* Recent Spray Logs */}
        <div className={s.card}>
          <div className={s.cardHeader}>
            <div className={s.cardTitleWrap}>
              <FileText size={18} color="var(--t2)" />
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
            recentLogs.slice(0, 4).map((log) => (
              <div key={log.id} className={s.logRow}>
                <div className={s.logIconWrap}>
                  <Droplets size={16} color="var(--blu)" />
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
              <a.icon size={24} color="var(--t2)" strokeWidth={1.5} className={s.quickActionIcon} />
              <div className={s.quickActionLabel}>{a.label}</div>
              <div className={s.quickActionSub}>{a.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

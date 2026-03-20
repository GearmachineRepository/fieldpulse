// ═══════════════════════════════════════════
// Dashboard Home — Command Center (Phase 3A)
//
// Product: First screen every owner sees.
// Uses usePageData for per-domain lazy loading.
// No mock data — all real API.
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import {
  Users, AlertTriangle, Clock, Briefcase,
  ChevronRight, Droplets, ShieldCheck, BookOpen,
  Truck, MapPin, FileText, Inbox,
} from "lucide-react"
import useNavigation from "@/hooks/useNavigation.js"
import usePageData from "@/hooks/usePageData.js"
import { getCrews, getEmployees, getVehicles, getSprayLogs, getAccounts } from "@/lib/api/index.js"
import { getAttendanceToday } from "@/lib/api/rosters.js"
import StatCard from "../components/StatCard.jsx"
import DataTable from "../components/DataTable.jsx"
import StatusBadge from "../components/StatusBadge.jsx"
import s from "./DashboardHome.module.css"

const ts = DataTable.s

export default function DashboardHome() {
  const { navigate: onNavigate } = useNavigation()

  // ── Data domains via usePageData ──
  const crews = usePageData("crews", { fetchFn: getCrews })
  const employees = usePageData("employees", { fetchFn: getEmployees })
  const vehicles = usePageData("vehicles", { fetchFn: getVehicles })
  const sprayLogs = usePageData("sprayLogs", { fetchFn: getSprayLogs })
  const accounts = usePageData("accounts", { fetchFn: getAccounts })

  // ── Attendance (specialized endpoint) ──
  const [attendance, setAttendance] = useState(null)
  const [loadingAttendance, setLoadingAttendance] = useState(true)

  useEffect(() => {
    getAttendanceToday()
      .then(setAttendance)
      .catch(console.error)
      .finally(() => setLoadingAttendance(false))
  }, [])

  // ── Header ──
  const greeting = new Date().getHours() < 12
    ? "Good morning"
    : new Date().getHours() < 18
      ? "Good afternoon"
      : "Good evening"
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  })

  // ── Derived stats ──
  const totalWorking = attendance?.totalWorking || 0
  const totalEmployees = attendance?.totalEmployees || employees.data.length
  const rostersSubmitted = attendance?.crews?.filter(c => c.submitted).length || 0
  const totalCrews = attendance?.crews?.length || crews.data.length

  const crewsWithAttendance = attendance?.crews || crews.data.map(c => ({
    crewId: c.id,
    crewName: c.name,
    submitted: false,
    memberCount: 0,
    clockInTime: null,
    members: [],
  }))

  const recentLogs = sprayLogs.data.slice(0, 5)
  const recentProjects = accounts.data.slice(0, 3)

  const isLoading = crews.loading || employees.loading || vehicles.loading
    || sprayLogs.loading || accounts.loading

  // ── Stat cards config ──
  const statCards = [
    {
      label: "Crews On-Site",
      value: String(rostersSubmitted),
      sub: `${rostersSubmitted}/${totalCrews} clocked in`,
      icon: Users,
      color: "var(--grn)",
    },
    {
      label: "Active Projects",
      value: String(accounts.data.length),
      sub: `${accounts.data.length} project${accounts.data.length !== 1 ? "s" : ""}`,
      icon: Briefcase,
      color: "var(--blu)",
    },
    {
      label: "Working Today",
      value: String(totalWorking),
      sub: `of ${totalEmployees} employees`,
      icon: Clock,
      color: "var(--amb)",
    },
    {
      label: "Compliance",
      value: "\u2014",
      sub: "Certs & training",
      icon: ShieldCheck,
      color: "var(--red)",
    },
  ]

  // ── Quick actions ──
  const quickActions = [
    { icon: Briefcase, label: "Projects", sub: "Manage sites", page: "projects" },
    { icon: Users, label: "Crews", sub: "Today's crews", page: "crews" },
    { icon: Truck, label: "Fleet", sub: "Inspections", page: "vehicles" },
    { icon: ShieldCheck, label: "Compliance", sub: "Certs & training", page: "training" },
    { icon: BookOpen, label: "Resources", sub: "SDS & docs", page: "documents" },
    { icon: FileText, label: "Spray Logs", sub: "Field records", page: "mod-spray" },
  ]

  // ── Crew table ──
  const crewTableHeaders = [
    { label: "Crew" },
    { label: "Members" },
    { label: "Status" },
    { label: "Clock-In", right: true },
  ]

  return (
    <div>
      {/* ── Header ── */}
      <div className={s.header}>
        <div>
          <div className={s.dateStr}>{dateStr}</div>
          <div className={s.greeting}>{greeting}</div>
        </div>
      </div>

      {/* ── Alert — crews not clocked in ── */}
      {!loadingAttendance && totalCrews > 0 && rostersSubmitted < totalCrews && (
        <div className={s.alert} onClick={() => onNavigate?.("clock-in")}>
          <div className={s.alertIconWrap}>
            <AlertTriangle size={18} color="var(--amb)" />
          </div>
          <div className={s.alertContent}>
            <div className={s.alertTitle}>Crews Not Clocked In</div>
            <div className={s.alertSub}>
              {totalCrews - rostersSubmitted} of {totalCrews} crew{totalCrews !== 1 ? "s" : ""} haven't submitted today's roster
            </div>
          </div>
          <ChevronRight size={18} color="var(--amb)" className={s.flexShrink0} />
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className={s.statsGrid}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={s.skeletonCard} />
          ))
        ) : (
          statCards.map((card, i) => (
            <StatCard
              key={i}
              label={card.label}
              value={card.value}
              sub={card.sub}
              icon={card.icon}
              color={card.color}
            />
          ))
        )}
      </div>

      {/* ── Two-column: Crew Activity + Recent Activity ── */}
      <div className={s.twoCol}>
        {/* Crew Activity table */}
        <div className={s.card}>
          <div className={s.cardHeader}>
            <div className={s.cardTitleWrap}>
              <Users size={18} color="var(--t2)" />
              <span className={s.cardTitle}>Crew Activity</span>
            </div>
            <button onClick={() => onNavigate?.("clock-in")} className={s.cardLink}>
              View All <ChevronRight size={14} />
            </button>
          </div>

          {loadingAttendance || crews.loading ? (
            <div className={s.skeletonRows}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={s.skeletonRow} />
              ))}
            </div>
          ) : crewsWithAttendance.length === 0 ? (
            <div className={s.emptyState}>
              <Users size={32} color="var(--t3)" strokeWidth={1.2} />
              <div className={s.emptyTitle}>No crews set up</div>
              <div className={s.emptySub}>Create crews to track daily attendance.</div>
            </div>
          ) : (
            <DataTable headers={crewTableHeaders}>
              {crewsWithAttendance.slice(0, 6).map((c, i) => (
                <tr key={i} className={ts.tr}>
                  <td className={ts.td}>{c.crewName}</td>
                  <td className={`${ts.td} ${ts.tdMono}`}>{c.memberCount || "—"}</td>
                  <td className={ts.td}>
                    <StatusBadge variant={c.submitted ? "green" : "gray"}>
                      {c.submitted ? "Clocked In" : "Pending"}
                    </StatusBadge>
                  </td>
                  <td className={`${ts.td} ${ts.tdMono} ${ts.tdRight}`}>
                    {c.clockInTime || "—"}
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </div>

        {/* Recent Activity (spray logs) */}
        <div className={s.card}>
          <div className={s.cardHeader}>
            <div className={s.cardTitleWrap}>
              <Droplets size={18} color="var(--t2)" />
              <span className={s.cardTitle}>Recent Activity</span>
            </div>
            <button onClick={() => onNavigate?.("mod-spray")} className={s.cardLink}>
              All Logs <ChevronRight size={14} />
            </button>
          </div>

          {sprayLogs.loading ? (
            <div className={s.skeletonRows}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={s.skeletonRow} />
              ))}
            </div>
          ) : recentLogs.length === 0 ? (
            <div className={s.emptyState}>
              <Droplets size={32} color="var(--t3)" strokeWidth={1.2} />
              <div className={s.emptyTitle}>No recent activity</div>
              <div className={s.emptySub}>Spray logs from the field will appear here.</div>
            </div>
          ) : (
            recentLogs.map((log) => (
              <div key={log.id} className={s.logRow}>
                <div className={s.logIconWrap}>
                  <Droplets size={16} color="var(--blu)" />
                </div>
                <div className={s.logInfo}>
                  <div className={s.logProperty}>{log.property}</div>
                  <div className={s.logSub}>
                    {log.crewName} · {log.products.length} product{log.products.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className={s.logDate}>{log.date}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Three-column: Projects + Compliance + Quick Actions ── */}
      <div className={s.threeCol}>
        {/* Active Projects */}
        <div className={s.card}>
          <div className={s.cardHeader}>
            <div className={s.cardTitleWrap}>
              <MapPin size={18} color="var(--t2)" />
              <span className={s.cardTitle}>Active Projects</span>
            </div>
            <button onClick={() => onNavigate?.("projects")} className={s.cardLink}>
              View All <ChevronRight size={14} />
            </button>
          </div>

          {accounts.loading ? (
            <div className={s.skeletonRows}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={s.skeletonRow} />
              ))}
            </div>
          ) : recentProjects.length === 0 ? (
            <div className={s.emptyState}>
              <MapPin size={32} color="var(--t3)" strokeWidth={1.2} />
              <div className={s.emptyTitle}>No projects yet</div>
              <div className={s.emptySub}>Add your first project to get started.</div>
              <button className={s.emptyCta} onClick={() => onNavigate?.("projects")}>
                Add Project
              </button>
            </div>
          ) : (
            recentProjects.map((proj) => (
              <div key={proj.id} className={s.projectCard} onClick={() => onNavigate?.("projects")}>
                <div className={s.projectName}>{proj.name}</div>
                <div className={s.projectAddress}>{proj.address || "No address"}</div>
                <StatusBadge variant={proj.status === "active" ? "green" : "gray"}>
                  {proj.status || "Active"}
                </StatusBadge>
              </div>
            ))
          )}
        </div>

        {/* Compliance Alerts */}
        <div className={s.card}>
          <div className={s.cardHeader}>
            <div className={s.cardTitleWrap}>
              <ShieldCheck size={18} color="var(--t2)" />
              <span className={s.cardTitle}>Compliance Alerts</span>
            </div>
          </div>
          <div className={s.emptyState}>
            <Inbox size={32} color="var(--t3)" strokeWidth={1.2} />
            <div className={s.emptyTitle}>No compliance alerts</div>
            <div className={s.emptySub}>Certificate and training alerts will show here.</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={s.card}>
          <div className={s.cardHeader}>
            <div className={s.cardTitleWrap}>
              <span className={s.cardTitle}>Quick Actions</span>
            </div>
          </div>
          <div className={s.quickGrid}>
            {quickActions.map((a, i) => (
              <div key={i} onClick={() => onNavigate?.(a.page)} className={s.quickActionCard}>
                <a.icon size={20} color="var(--t2)" strokeWidth={1.5} />
                <div className={s.quickActionLabel}>{a.label}</div>
                <div className={s.quickActionSub}>{a.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

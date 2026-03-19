// ═══════════════════════════════════════════
// Clock-In Page — Daily attendance overview
//
// Shows which crews have submitted rosters today,
// who's working, and who hasn't checked in yet.
// Read-only from admin side — crews submit rosters
// from the field app.
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import {
  Clock, Users, CheckCircle2, XCircle, RefreshCw,
  UserCheck, UserX, ChevronDown, ChevronUp,
} from "lucide-react"
import { useData } from "@/context/DataProvider.jsx"
import { getAttendanceToday } from "@/lib/api/rosters.js"
import { PageHeader, LoadingSpinner, EmptyMessage } from "@/app/dashboard/components/PageUI.jsx"
import StatCard from "../components/StatCard.jsx"
import s from "./ClockInPage.module.css"

export default function ClockInPage() {
  const { crews } = useData()
  const [attendance, setAttendance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedCrew, setExpandedCrew] = useState(null)

  const fetchAttendance = async (showRefresh) => {
    if (showRefresh) setRefreshing(true)
    try {
      const data = await getAttendanceToday()
      setAttendance(data)
    } catch (err) {
      console.error("Failed to fetch attendance:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchAttendance(false) }, [])

  if (loading) return <LoadingSpinner />

  const submitted = attendance?.crews?.filter(c => c.submitted) || []
  const notSubmitted = attendance?.crews?.filter(c => !c.submitted) || []
  const totalWorking = attendance?.totalWorking || 0
  const totalEmployees = attendance?.totalEmployees || 0
  const unrostered = attendance?.unrostered || []

  return (
    <div>
      <PageHeader title="Daily Clock-In" action={
        <button
          onClick={() => fetchAttendance(true)}
          disabled={refreshing}
          className={`${s.refreshBtn} ${refreshing ? s.refreshBtnDisabled : ""}`}
        >
          <RefreshCw size={16} className={refreshing ? s.refreshSpin : undefined} />
          Refresh
        </button>
      } />

      {/* Summary cards */}
      <div className={s.summaryGrid}>
        <StatCard
          label="Working Today"
          value={String(totalWorking)}
          sub={`of ${totalEmployees} employees`}
          icon={UserCheck}
          color="var(--amb)"
        />
        <StatCard
          label="Rosters In"
          value={String(submitted.length)}
          sub={`of ${(attendance?.crews || []).length} crews`}
          icon={CheckCircle2}
          color="var(--blu)"
        />
        <StatCard
          label="Not Clocked In"
          value={String(unrostered.length)}
          sub="employees"
          icon={UserX}
          color={unrostered.length > 0 ? "var(--amb)" : "var(--t3)"}
        />
      </div>

      {/* Crews that haven't submitted */}
      {notSubmitted.length > 0 && (
        <div className={s.section}>
          <div className={s.sectionHeader}>
            Waiting on Roster ({notSubmitted.length})
          </div>
          <div className={s.crewList}>
            {notSubmitted.map(crew => (
              <div key={crew.crewId} className={s.waitingRow}>
                <XCircle size={20} color="var(--amb)" className={s.iconShrink} />
                <div className={s.rowBody}>
                  <div className={s.crewName}>{crew.crewName}</div>
                  <div className={s.crewSub}>No roster submitted today</div>
                </div>
                <Clock size={16} color="var(--t3)" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crews that submitted */}
      {submitted.length > 0 && (
        <div className={s.section}>
          <div className={s.sectionHeader}>
            Clocked In ({submitted.length})
          </div>
          <div className={s.crewList}>
            {submitted.map(crew => {
              const isExpanded = expandedCrew === crew.crewId
              return (
                <div key={crew.crewId} className={s.submittedCard}>
                  <button onClick={() => setExpandedCrew(isExpanded ? null : crew.crewId)} className={s.submittedBtn}>
                    <CheckCircle2 size={20} color="var(--grn)" className={s.iconShrink} />
                    <div className={s.rowBody}>
                      <div className={s.submittedCrewName}>{crew.crewName}</div>
                      <div className={s.submittedCrewSub}>
                        {crew.memberCount} member{crew.memberCount !== 1 ? "s" : ""} · Submitted by {crew.submittedBy}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} color="var(--t3)" /> : <ChevronDown size={16} color="var(--t3)" />}
                  </button>

                  {isExpanded && crew.members.length > 0 && (
                    <div className={s.membersPanel}>
                      <div className={s.membersWrap}>
                        {crew.members.map((name, i) => (
                          <div key={i} className={s.memberBadge}>
                            <UserCheck size={14} /> {name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Unrostered employees */}
      {unrostered.length > 0 && (
        <div>
          <div className={s.sectionHeader}>
            Not on Any Roster Today ({unrostered.length})
          </div>
          <div className={s.unrosteredCard}>
            {unrostered.map((emp, i) => (
              <div key={emp.id} className={`${s.unrosteredRow} ${i < unrostered.length - 1 ? s.unrosteredRowBorder : ""}`}>
                <div className={s.avatar}>
                  {emp.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className={s.rowBody}>
                  <div className={s.empName}>{emp.name}</div>
                  {emp.defaultCrew && <div className={s.empDefaultCrew}>Usually: {emp.defaultCrew}</div>}
                </div>
                <UserX size={16} color="var(--t3)" />
              </div>
            ))}
          </div>
        </div>
      )}

      {(attendance?.crews || []).length === 0 && <EmptyMessage text="No crews set up yet." />}
    </div>
  )
}

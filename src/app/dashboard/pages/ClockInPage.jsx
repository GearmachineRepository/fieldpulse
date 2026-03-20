// ═══════════════════════════════════════════
// Clock-In Page — Daily attendance overview
//
// Shows which crews have submitted rosters today,
// who's working, and who hasn't checked in yet.
// Read-only from admin side — crews submit rosters
// from the field app.
//
// Phase 3A: usePageData, PageShell, skeletons,
// design system compliance.
// ═══════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Clock, Users, CheckCircle2, XCircle, RefreshCw,
  UserCheck, UserX, ChevronDown, ChevronUp,
} from "lucide-react"
import usePageData from "@/hooks/usePageData.js"
import { getCrews } from "@/lib/api/index.js"
import { getAttendanceToday } from "@/lib/api/rosters.js"
import PageShell from "../components/PageShell.jsx"
import StatCard from "../components/StatCard.jsx"
import StatusBadge from "../components/StatusBadge.jsx"
import SkeletonRow from "../components/SkeletonRow.jsx"
import s from "./ClockInPage.module.css"

function useRelativeTime(ts) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!ts) return
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [ts])

  if (!ts) return null
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 10) return "just now"
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function ClockInPage() {
  const crews = usePageData("crews", { fetchFn: getCrews })

  const [attendance, setAttendance] = useState(null)
  const [attLoading, setAttLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedCrew, setExpandedCrew] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchAttendance = useCallback(async (showRefresh) => {
    if (showRefresh) setRefreshing(true)
    try {
      const data = await getAttendanceToday()
      setAttendance(data)
      setLastUpdated(Date.now())
    } catch (err) {
      console.error("Failed to fetch attendance:", err)
    } finally {
      setAttLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchAttendance(false) }, [fetchAttendance])

  const relTime = useRelativeTime(lastUpdated)

  const loading = crews.loading || attLoading
  const submitted = attendance?.crews?.filter(c => c.submitted) || []
  const notSubmitted = attendance?.crews?.filter(c => !c.submitted) || []
  const totalWorking = attendance?.totalWorking || 0
  const totalEmployees = attendance?.totalEmployees || 0
  const unrostered = attendance?.unrostered || []
  const noCrews = !loading && (crews.data || []).length === 0

  const actions = (
    <div className={s.actionsRow}>
      {relTime && (
        <span className={s.lastUpdated}>Last updated {relTime}</span>
      )}
      <button
        onClick={() => fetchAttendance(true)}
        disabled={refreshing}
        className={`${s.refreshBtn} ${refreshing ? s.refreshBtnDisabled : ""}`}
      >
        <RefreshCw size={16} className={refreshing ? s.refreshSpin : undefined} />
        Refresh
      </button>
    </div>
  )

  return (
    <PageShell
      title="Daily Clock-In"
      actions={actions}
      loading={false}
      empty={noCrews}
      emptyIcon={Users}
      emptyTitle="No crews set up yet"
      emptyDescription="Create crews and assign employees before tracking attendance."
      emptyCta="Go to Crews"
    >
      {loading ? (
        <div className={s.skeletonWrap}>
          <div className={s.summaryGrid}>
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className={s.skeletonCard}>
                <div className={s.skeletonBar} style={{ width: "60%" }} />
                <div className={s.skeletonBarLg} />
                <div className={s.skeletonBar} style={{ width: "40%" }} />
              </div>
            ))}
          </div>
          <SkeletonRow columns={3} count={4} />
        </div>
      ) : (
        <>
          {/* ── Stat cards ── */}
          <div className={s.summaryGrid}>
            <StatCard
              label="Currently Clocked In"
              value={String(totalWorking)}
              sub={`of ${totalEmployees} employees`}
              icon={UserCheck}
              color="var(--grn)"
            />
            <StatCard
              label="Expected Today"
              value={String(totalEmployees)}
              sub="total employees"
              icon={Users}
              color="var(--blu)"
            />
            <StatCard
              label="Not Yet Clocked In"
              value={String(unrostered.length)}
              sub="employees"
              icon={UserX}
              color={unrostered.length > 0 ? "var(--amb)" : "var(--t3)"}
            />
          </div>

          {/* ── Waiting on Roster ── */}
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
                    <StatusBadge variant="amber">Pending</StatusBadge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Clocked In ── */}
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
                      <button
                        onClick={() => setExpandedCrew(isExpanded ? null : crew.crewId)}
                        className={s.submittedBtn}
                      >
                        <CheckCircle2 size={20} color="var(--grn)" className={s.iconShrink} />
                        <div className={s.rowBody}>
                          <div className={s.submittedCrewName}>{crew.crewName}</div>
                          <div className={s.submittedCrewSub}>
                            <span className={s.mono}>
                              {crew.memberCount}
                            </span>
                            {" "}member{crew.memberCount !== 1 ? "s" : ""} · Submitted by {crew.submittedBy}
                            {crew.submittedAt && (
                              <span className={s.clockTime}>
                                {" "}· <Clock size={12} className={s.inlineIcon} />{" "}
                                <span className={s.mono}>{crew.submittedAt}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <StatusBadge variant="green">Active</StatusBadge>
                        {isExpanded
                          ? <ChevronUp size={16} color="var(--t3)" />
                          : <ChevronDown size={16} color="var(--t3)" />
                        }
                      </button>

                      {isExpanded && crew.members?.length > 0 && (
                        <div className={s.membersPanel}>
                          <div className={s.membersWrap}>
                            {crew.members.map((member, i) => {
                              const name = typeof member === "string" ? member : member.name
                              const time = typeof member === "object" ? member.clockInTime : null
                              return (
                                <div key={i} className={s.memberBadge}>
                                  <UserCheck size={14} />
                                  <span>{name}</span>
                                  {time && (
                                    <span className={s.memberTime}>{time}</span>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Not on Any Roster ── */}
          {unrostered.length > 0 && (
            <div className={s.section}>
              <div className={s.sectionHeader}>
                Not on Any Roster Today ({unrostered.length})
              </div>
              <div className={s.unrosteredCard}>
                {unrostered.map((emp, i) => (
                  <div
                    key={emp.id}
                    className={`${s.unrosteredRow} ${i < unrostered.length - 1 ? s.unrosteredRowBorder : ""}`}
                  >
                    <div className={s.avatar}>
                      {emp.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className={s.rowBody}>
                      <div className={s.empName}>{emp.name}</div>
                      {emp.defaultCrew && (
                        <div className={s.empDefaultCrew}>Usually: {emp.defaultCrew}</div>
                      )}
                    </div>
                    <StatusBadge variant="gray">Unrostered</StatusBadge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </PageShell>
  )
}

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
import { T } from "@/app/tokens.js"
import { useData } from "@/context/DataProvider.jsx"
import { getAttendanceToday } from "@/lib/api/rosters.js"
import { PageHeader, LoadingSpinner, EmptyMessage } from "@/app/dashboard/components/PageUI.jsx"

export default function ClockInPage({ isMobile }) {
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
        <button onClick={() => fetchAttendance(true)} disabled={refreshing} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
          borderRadius: 10, border: `1.5px solid ${T.border}`, cursor: "pointer",
          background: T.card, color: T.textMed, fontSize: 14, fontWeight: 600, fontFamily: T.font,
          opacity: refreshing ? 0.5 : 1,
        }}>
          <RefreshCw size={16} style={refreshing ? { animation: "spin 1s linear infinite" } : {}} />
          Refresh
        </button>
      } />

      {/* Summary cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
        gap: isMobile ? 10 : 14, marginBottom: 28,
      }}>
        <SummaryCard
          label="Working Today"
          value={totalWorking}
          sub={`of ${totalEmployees} employees`}
          icon={UserCheck}
          color={T.accent}
        />
        <SummaryCard
          label="Rosters In"
          value={submitted.length}
          sub={`of ${(attendance?.crews || []).length} crews`}
          icon={CheckCircle2}
          color={T.blue}
        />
        <SummaryCard
          label="Not Clocked In"
          value={unrostered.length}
          sub="employees"
          icon={UserX}
          color={unrostered.length > 0 ? T.amber : T.textLight}
        />
      </div>

      {/* Crews that haven't submitted */}
      {notSubmitted.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
            Waiting on Roster ({notSubmitted.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {notSubmitted.map(crew => (
              <div key={crew.crewId} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
                background: T.card, borderRadius: 12, border: `1px solid ${T.border}`,
                borderLeft: `3px solid ${T.amber}`, boxShadow: T.shadow,
              }}>
                <XCircle size={20} color={T.amber} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{crew.crewName}</div>
                  <div style={{ fontSize: 12, color: T.textLight }}>No roster submitted today</div>
                </div>
                <Clock size={16} color={T.textLight} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Crews that submitted */}
      {submitted.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
            Clocked In ({submitted.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {submitted.map(crew => {
              const isExpanded = expandedCrew === crew.crewId
              return (
                <div key={crew.crewId} style={{
                  background: T.card, borderRadius: 12, border: `1px solid ${T.border}`,
                  borderLeft: `3px solid ${T.accent}`, boxShadow: T.shadow, overflow: "hidden",
                }}>
                  <button onClick={() => setExpandedCrew(isExpanded ? null : crew.crewId)} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
                    width: "100%", border: "none", background: "none", cursor: "pointer",
                    fontFamily: T.font, textAlign: "left",
                  }}>
                    <CheckCircle2 size={20} color={T.accent} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{crew.crewName}</div>
                      <div style={{ fontSize: 12, color: T.textLight }}>
                        {crew.memberCount} member{crew.memberCount !== 1 ? "s" : ""} · Submitted by {crew.submittedBy}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} color={T.textLight} /> : <ChevronDown size={16} color={T.textLight} />}
                  </button>

                  {isExpanded && crew.members.length > 0 && (
                    <div style={{ padding: "0 18px 14px", borderTop: `1px solid ${T.border}` }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, paddingTop: 12 }}>
                        {crew.members.map((name, i) => (
                          <div key={i} style={{
                            display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                            background: T.accentLight, borderRadius: 8, fontSize: 13, fontWeight: 600, color: T.accent,
                          }}>
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
          <div style={{ fontSize: 13, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
            Not on Any Roster Today ({unrostered.length})
          </div>
          <div style={{
            background: T.card, borderRadius: 12, border: `1px solid ${T.border}`,
            boxShadow: T.shadow, overflow: "hidden",
          }}>
            {unrostered.map((emp, i) => (
              <div key={emp.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 18px",
                borderBottom: i < unrostered.length - 1 ? `1px solid ${T.border}` : "none",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: T.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700, color: T.textLight,
                }}>
                  {emp.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{emp.name}</div>
                  {emp.defaultCrew && <div style={{ fontSize: 12, color: T.textLight }}>Usually: {emp.defaultCrew}</div>}
                </div>
                <UserX size={16} color={T.textLight} />
              </div>
            ))}
          </div>
        </div>
      )}

      {(attendance?.crews || []).length === 0 && <EmptyMessage text="No crews set up yet." />}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function SummaryCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div style={{
      background: T.card, borderRadius: 14, padding: "18px 20px",
      border: `1px solid ${T.border}`, borderTop: `3px solid ${color}`, boxShadow: T.shadow,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, marginTop: 6 }}>{value}</div>
          <div style={{ fontSize: 12, color: T.textMed, marginTop: 4 }}>{sub}</div>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color={color} />
        </div>
      </div>
    </div>
  )
}

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
import { T } from "@/app/tokens.js"
import { useData } from "@/context/DataProvider.jsx"
import { getAttendanceToday } from "@/lib/api/rosters.js"

export default function DashboardHome({ isMobile, onNavigate }) {
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

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 14, color: T.textLight }}>{dateStr}</div>
          <div style={{ fontSize: isMobile ? 24 : 28, fontWeight: 800, letterSpacing: "-0.5px" }}>{greeting}</div>
        </div>
        {isLoading && (
          <Loader2 size={20} color={T.textLight} style={{ animation: "spin 1s linear infinite", marginTop: 8 }} />
        )}
      </div>

      {/* Alert — only show if there are rosters not submitted */}
      {!loadingAttendance && totalCrews > 0 && rostersSubmitted < totalCrews && (
        <div style={{
          display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
          background: T.amberLight, border: "1px solid #FDE68A", borderRadius: 12, marginBottom: 24, cursor: "pointer",
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <AlertTriangle size={18} color={T.amber} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#92400E" }}>Crews Not Clocked In</div>
            <div style={{ fontSize: 13, color: "#A16207" }}>
              {totalCrews - rostersSubmitted} of {totalCrews} crew{totalCrews !== 1 ? "s" : ""} haven't submitted today's roster
            </div>
          </div>
          <ChevronRight size={18} color="#A16207" style={{ flexShrink: 0 }} />
        </div>
      )}

      {/* Stat cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
        gap: isMobile ? 10 : 16, marginBottom: 28,
      }}>
        {[
          {
            label: "FLEET",
            val: String(vehicleCount),
            sub: `${crewCount} crew${crewCount !== 1 ? "s" : ""} active`,
            icon: Truck,
            color: T.accent,
          },
          {
            label: "WORKING",
            val: String(totalWorking),
            sub: `${rostersSubmitted}/${totalCrews} rosters in`,
            icon: Users,
            color: T.blue,
          },
          {
            label: "LOGS TODAY",
            val: String(todayLogs.length),
            sub: "Spray applications",
            icon: FileText,
            color: T.amber,
          },
          {
            label: "TEAM",
            val: String(employeeCount),
            sub: `Across ${crewCount} crew${crewCount !== 1 ? "s" : ""}`,
            icon: Users,
            color: T.purple,
          },
        ].map((s, i) => (
          <div key={i} style={{
            background: T.card, borderRadius: 14, padding: isMobile ? "16px" : "20px 22px",
            border: `1px solid ${T.border}`, borderTop: `3px solid ${s.color}`, boxShadow: T.shadow,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                <div style={{ fontSize: isMobile ? 26 : 32, fontWeight: 800, lineHeight: 1, marginTop: 6 }}>{s.val}</div>
                <div style={{ fontSize: isMobile ? 11 : 13, color: T.textMed, marginTop: 4 }}>{s.sub}</div>
              </div>
              {!isMobile && (
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${s.color}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <s.icon size={20} color={s.color} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Two column */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 28 }}>
        {/* Today's Crews */}
        <div style={{ background: T.card, borderRadius: 14, padding: isMobile ? 18 : 22, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={18} color={T.textMed} />
              <span style={{ fontSize: 15, fontWeight: 700 }}>Today's Crews</span>
            </div>
            <button onClick={() => onNavigate?.("clock-in")} style={{ fontSize: 13, color: T.accent, fontWeight: 600, border: "none", background: "none", cursor: "pointer", fontFamily: T.font, display: "flex", alignItems: "center", gap: 4 }}>
              View all <ChevronRight size={14} />
            </button>
          </div>

          {loadingAttendance ? (
            <div style={{ textAlign: "center", padding: 20, color: T.textLight }}>Loading...</div>
          ) : crewsWithAttendance.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: T.textLight, fontSize: 14 }}>No crews set up yet.</div>
          ) : (
            crewsWithAttendance.slice(0, 4).map((c, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                background: T.bg, borderRadius: 10, marginBottom: 8, cursor: "pointer",
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: 4, flexShrink: 0,
                  background: c.submitted ? T.accent : T.textLight,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{c.crewName}</div>
                  <div style={{ fontSize: 12, color: T.textLight }}>
                    {c.submitted
                      ? `${c.memberCount} member${c.memberCount !== 1 ? "s" : ""} clocked in`
                      : "Not clocked in yet"
                    }
                  </div>
                </div>
                {c.submitted ? (
                  <CheckCircle2 size={16} color={T.accent} style={{ flexShrink: 0 }} />
                ) : (
                  <XCircle size={16} color={T.textLight} style={{ flexShrink: 0 }} />
                )}
              </div>
            ))
          )}
        </div>

        {/* Recent Spray Logs */}
        <div style={{ background: T.card, borderRadius: 14, padding: isMobile ? 18 : 22, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={18} color={T.textMed} />
              <span style={{ fontSize: 15, fontWeight: 700 }}>Recent Spray Logs</span>
            </div>
            <button onClick={() => onNavigate?.("mod-spray")} style={{ fontSize: 13, color: T.accent, fontWeight: 600, border: "none", background: "none", cursor: "pointer", fontFamily: T.font, display: "flex", alignItems: "center", gap: 4 }}>
              All Logs <ChevronRight size={14} />
            </button>
          </div>

          {sprayLogs.loading ? (
            <div style={{ textAlign: "center", padding: 20, color: T.textLight }}>Loading...</div>
          ) : recentLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: T.textLight, fontSize: 14 }}>
              No spray logs yet. Crew members can submit them from the field app.
            </div>
          ) : (
            recentLogs.slice(0, 4).map((log, i) => (
              <div key={log.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                background: T.bg, borderRadius: 10, marginBottom: 6, cursor: "pointer",
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${T.purple}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Droplets size={16} color={T.purple} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.property}
                  </div>
                  <div style={{ fontSize: 12, color: T.textLight }}>
                    {log.crewName} · {log.products.length} product{log.products.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: T.textLight, flexShrink: 0 }}>
                  {log.date}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Quick Actions</div>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(5, 1fr)",
          gap: isMobile ? 8 : 12,
        }}>
          {[
            { icon: Truck, label: "Fleet", sub: "Track vehicles", page: "fleet" },
            { icon: FileText, label: "Field Docs", sub: "View & export", page: "field-docs" },
            { icon: Clock, label: "Roster", sub: "Today's crews", page: "clock-in" },
            { icon: MapPin, label: "Routes", sub: "Schedule stops", page: "schedule" },
            { icon: BookOpen, label: "Resources", sub: "SDS & docs", page: "resources" },
          ].map((a, i) => (
            <div key={i} onClick={() => onNavigate?.(a.page)} style={{
              background: T.card, borderRadius: 14, padding: isMobile ? "16px 10px" : "22px 16px",
              textAlign: "center", border: `1px solid ${T.border}`, cursor: "pointer", boxShadow: T.shadow,
              transition: "border-color 0.15s",
            }}>
              <a.icon size={isMobile ? 20 : 24} color={T.textMed} strokeWidth={1.5} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: isMobile ? 12 : 14, fontWeight: 700, marginBottom: 2 }}>{a.label}</div>
              {!isMobile && <div style={{ fontSize: 12, color: T.textLight }}>{a.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ═══════════════════════════════════════════
// Field Schedule — Crew's weekly routes
// Day tabs → route stops → tap to complete
// ═══════════════════════════════════════════

import { useState, useEffect, useCallback } from "react"
import {
  MapPin, CheckCircle2, Circle, Clock, ChevronRight,
  Phone, Navigation, Loader2, AlertCircle, FileText, Camera,
} from "lucide-react"
import { T } from "@/app/tokens.js"
import useAuth from "@/hooks/useAuth.jsx"
import { getCrewRoutes, getRouteDay, completeRouteStop, undoCompletion } from "@/lib/api/routes.js"
import { getScheduleEvents } from "@/lib/api/scheduleEvents.js"

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function getLocalDate() { return new Date().toLocaleDateString("en-CA") }
function getLocalDow() { return new Date().getDay() }
function getDateForDow(dow) {
  const today = new Date()
  const diff = dow - today.getDay()
  const target = new Date(today)
  target.setDate(today.getDate() + diff)
  return target.toLocaleDateString("en-CA")
}

export default function FieldSchedule() {
  const { employee, crew } = useAuth()
  const [allRoutes, setAllRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDow, setSelectedDow] = useState(getLocalDow())
  const [dayStops, setDayStops] = useState([])
  const [loadingStops, setLoadingStops] = useState(false)
  const [events, setEvents] = useState([])

  const crewId = crew?.id
  const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : "Crew"
  const selectedDate = getDateForDow(selectedDow)
  const isToday = selectedDow === getLocalDow()

  // Load all crew routes
  useEffect(() => {
    if (!crewId) { setLoading(false); return }
    getCrewRoutes(crewId).then(setAllRoutes).catch(console.error).finally(() => setLoading(false))
  }, [crewId])

  // Load stops for selected day
  const loadDayStops = useCallback(async () => {
    const dayRoutes = allRoutes.filter(r => r.dayOfWeek === selectedDow && r.stopCount > 0)
    if (dayRoutes.length === 0) { setDayStops([]); return }

    setLoadingStops(true)
    const stops = []
    for (const route of dayRoutes) {
      try {
        const data = await getRouteDay(route.id, selectedDate)
        if (data.stops) {
          data.stops.forEach(s => stops.push({
            ...s, routeId: route.id, routeName: route.name, routeColor: route.color,
          }))
        }
      } catch {}
    }
    setDayStops(stops)
    setLoadingStops(false)
  }, [allRoutes, selectedDow, selectedDate])

  useEffect(() => { if (allRoutes.length > 0) loadDayStops() }, [loadDayStops, allRoutes])

  // Load events for selected day
  useEffect(() => {
    if (!crewId) return
    getScheduleEvents({ startDate: selectedDate, endDate: selectedDate, crewId })
      .then(setEvents).catch(() => setEvents([]))
  }, [crewId, selectedDate])

  // Complete a stop
  const handleComplete = async (stop) => {
    if (stop.completion) {
      // Undo
      try {
        await undoCompletion(stop.completion.id)
        loadDayStops()
      } catch {}
      return
    }
    try {
      await completeRouteStop({
        routeStopId: stop.id, routeId: stop.routeId,
        completedById: employee?.id, completedByName: employeeName,
        workDate: selectedDate, status: "complete",
      })
      loadDayStops()
    } catch {}
  }

  const daysWithRoutes = new Set(allRoutes.filter(r => r.dayOfWeek !== null && r.stopCount > 0).map(r => r.dayOfWeek))
  const completedCount = dayStops.filter(s => s.completion).length

  if (loading) return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <Loader2 size={24} color={T.textLight} style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div>
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 4 }}>My Schedule</div>
        <div style={{ fontSize: 13, color: T.textLight, marginBottom: 16 }}>{crew?.name || "My Crew"}</div>
      </div>

      {/* Day tabs */}
      <div style={{
        display: "flex", gap: 4, padding: "0 20px 16px", overflowX: "auto",
      }}>
        {DAY_LABELS.map((label, i) => {
          const hasRoutes = daysWithRoutes.has(i)
          const isSel = selectedDow === i
          const isTodayTab = i === getLocalDow()
          return (
            <button key={i} onClick={() => setSelectedDow(i)} style={{
              padding: "10px 0", minWidth: 44, borderRadius: 10, border: "none", cursor: "pointer",
              background: isSel ? T.accent : "transparent", fontFamily: T.font,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: isSel ? "#fff" : T.textLight }}>
                {label}
              </span>
              <span style={{
                fontSize: 16, fontWeight: 800,
                color: isSel ? "#fff" : isTodayTab ? T.accent : T.text,
              }}>
                {new Date(new Date().setDate(new Date().getDate() + (i - getLocalDow()))).getDate()}
              </span>
              {hasRoutes && !isSel && (
                <div style={{ width: 5, height: 5, borderRadius: 3, background: T.accent }} />
              )}
            </button>
          )
        })}
      </div>

      <div style={{ padding: "0 20px 20px" }}>
        {/* Progress bar */}
        {dayStops.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.textLight }}>
                {isToday ? "Today's Progress" : DAY_LABELS[selectedDow] + "'s Route"}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: completedCount === dayStops.length ? T.accent : T.textMed }}>
                {completedCount}/{dayStops.length}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: T.border, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3, background: T.accent,
                width: `${dayStops.length > 0 ? (completedCount / dayStops.length) * 100 : 0}%`,
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>
        )}

        {/* Stops */}
        {loadingStops ? (
          <div style={{ textAlign: "center", padding: 30, color: T.textLight }}>
            <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : dayStops.length === 0 && events.length === 0 ? (
          <div style={{
            padding: "32px 16px", background: T.card, borderRadius: 14,
            border: `1px dashed ${T.border}`, textAlign: "center",
          }}>
            <MapPin size={32} color={T.textLight} strokeWidth={1} style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>No stops</div>
            <div style={{ fontSize: 13, color: T.textLight }}>
              {isToday ? "Nothing scheduled for today" : `Nothing scheduled for ${DAY_LABELS[selectedDow]}`}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dayStops.map((stop, i) => {
              const isDone = !!stop.completion
              return (
                <div key={stop.id} style={{
                  background: T.card, borderRadius: 14, overflow: "hidden",
                  border: `1.5px solid ${isDone ? T.accentBorder : T.border}`,
                }}>
                  {/* Main row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
                    {/* Complete button */}
                    <button onClick={() => handleComplete(stop)} style={{
                      border: "none", background: "none", cursor: "pointer", padding: 0, flexShrink: 0,
                    }}>
                      {isDone
                        ? <CheckCircle2 size={24} color={T.accent} />
                        : <Circle size={24} color={T.textLight} />
                      }
                    </button>

                    {/* Stop info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 15, fontWeight: 700,
                        color: isDone ? T.textLight : T.text,
                        textDecoration: isDone ? "line-through" : "none",
                      }}>{stop.account.name}</div>
                      <div style={{ fontSize: 12, color: T.textLight, marginTop: 2 }}>
                        {stop.account.address}{stop.account.city && `, ${stop.account.city}`}
                      </div>
                    </div>

                    {/* Stop number */}
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                      background: isDone ? T.accentLight : (stop.routeColor || T.accent),
                      color: isDone ? T.accent : "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 800,
                    }}>{i + 1}</div>
                  </div>

                  {/* Details row */}
                  <div style={{
                    display: "flex", gap: 12, padding: "0 16px 12px 52px",
                    flexWrap: "wrap",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: T.textLight }}>
                      <Clock size={12} /> {stop.estimatedMinutes}m
                    </div>
                    {stop.account.contactPhone && (
                      <a href={`tel:${stop.account.contactPhone}`} onClick={e => e.stopPropagation()}
                        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: T.blue, textDecoration: "none" }}>
                        <Phone size={12} /> Call
                      </a>
                    )}
                    {stop.account.latitude && stop.account.longitude && (
                      <a href={`https://maps.google.com/?q=${stop.account.latitude},${stop.account.longitude}`}
                        target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: T.accent, textDecoration: "none" }}>
                        <Navigation size={12} /> Navigate
                      </a>
                    )}
                  </div>

                  {/* Completion info */}
                  {isDone && stop.completion && (
                    <div style={{
                      padding: "8px 16px 10px 52px", background: T.accentLight,
                      borderTop: `1px solid ${T.accentBorder}`,
                      fontSize: 12, color: T.accent, fontWeight: 600,
                    }}>
                      Completed by {stop.completion.completedByName}
                      {stop.completion.timeSpentMinutes ? ` · ${stop.completion.timeSpentMinutes}m` : ""}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Events */}
            {events.map(event => (
              <div key={event.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                background: T.card, borderRadius: 14, border: `1px solid ${T.border}`,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: 4, background: event.color || T.blue, flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{event.title}</div>
                  {event.startTime && <div style={{ fontSize: 12, color: T.textLight }}>{event.startTime}{event.endTime ? ` – ${event.endTime}` : ""}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

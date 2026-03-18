// ═══════════════════════════════════════════
// Field Schedule — Crew's weekly routes
// Tappable stops open a detail sheet with
// account info, contact, linked resources,
// and complete/undo toggle.
// ═══════════════════════════════════════════

import { useState, useEffect, useCallback } from "react"
import {
  MapPin, CheckCircle2, Circle, Clock, ChevronRight,
  Phone, Navigation, Loader2, AlertCircle, FileText, Camera,
  ExternalLink, Download, BookOpen, ChevronDown, X,
} from "lucide-react"
import { T } from "@/app/tokens.js"
import useAuth from "@/hooks/useAuth.jsx"
import { getCrewRoutes, getRouteDay, completeRouteStop, undoCompletion } from "@/lib/api/routes.js"
import { getScheduleEvents } from "@/lib/api/scheduleEvents.js"
import { getAccountResources } from "@/lib/api/accounts.js"
import { BottomSheet } from "@/app/field/components/BottomSheet.jsx"

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
  const [detailStop, setDetailStop] = useState(null) // stop to show in bottom sheet

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
      } catch (e) { console.error('Failed to load route stops:', e.message) }
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

  // Complete a stop (can be called from detail sheet or quick-tap)
  const handleComplete = async (stop) => {
    if (stop.completion) {
      try {
        await undoCompletion(stop.completion.id)
        loadDayStops()
      } catch (e) { console.error('Failed to undo completion:', e.message) }
      return
    }
    try {
      await completeRouteStop({
        routeStopId: stop.id, routeId: stop.routeId,
        completedById: employee?.id, completedByName: employeeName,
        workDate: selectedDate, status: "complete",
      })
      loadDayStops()
    } catch (e) { console.error('Failed to complete stop:', e.message) }
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
                <div style={{ width: 5, height: 5, borderRadius: 3, background: T.accent, marginTop: 1 }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Progress bar */}
      {dayStops.length > 0 && (
        <div style={{ padding: "0 20px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.textLight }}>
              {completedCount}/{dayStops.length} stops
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: completedCount === dayStops.length ? T.accent : T.textLight }}>
              {dayStops.length > 0 ? Math.round((completedCount / dayStops.length) * 100) : 0}%
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: T.border }}>
            <div style={{
              height: "100%", borderRadius: 3, background: T.accent,
              width: `${dayStops.length > 0 ? (completedCount / dayStops.length) * 100 : 0}%`,
              transition: "width 0.3s ease",
            }} />
          </div>
        </div>
      )}

      {/* Stop list */}
      <div style={{ padding: "0 20px 20px" }}>
        {loadingStops ? (
          <div style={{ textAlign: "center", padding: 30 }}>
            <Loader2 size={20} color={T.textLight} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : dayStops.length === 0 && events.length === 0 ? (
          <div style={{
            textAlign: "center", padding: 40, background: T.card, borderRadius: 14,
            border: `1.5px dashed ${T.border}`,
          }}>
            <MapPin size={32} color={T.textLight} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: T.textMed }}>
              {isToday ? "Nothing scheduled for today" : `Nothing scheduled for ${DAY_LABELS[selectedDow]}`}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {dayStops.map((stop, i) => (
              <StopCard
                key={stop.id}
                stop={stop}
                index={i}
                onTap={() => setDetailStop(stop)}
                onQuickComplete={() => handleComplete(stop)}
              />
            ))}

            {/* Events */}
            {events.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.textLight, marginTop: 10, marginBottom: 2, paddingLeft: 4 }}>
                  Events & Tasks
                </div>
                {events.map(ev => (
                  <div key={ev.id} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                    background: T.card, borderRadius: 12, border: `1.5px solid ${T.border}`,
                  }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: 5, flexShrink: 0,
                      background: ev.color || T.blue,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14, fontWeight: 700, color: T.text,
                        textDecoration: ev.completed ? "line-through" : "none",
                      }}>{ev.title}</div>
                      {ev.startTime && (
                        <div style={{ fontSize: 12, color: T.textLight }}>
                          {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ""}
                        </div>
                      )}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                      background: `${ev.color || T.blue}15`, color: ev.color || T.blue,
                    }}>{ev.type || "Event"}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Stop Detail Bottom Sheet */}
      {detailStop && (
        <StopDetailSheet
          stop={detailStop}
          onComplete={() => {
            handleComplete(detailStop)
            // Update the detail stop's completion state after toggle
            setDetailStop(prev => prev ? { ...prev, completion: prev.completion ? null : { completedByName: employeeName } } : null)
          }}
          onClose={() => { setDetailStop(null); loadDayStops() }}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}


// ═══════════════════════════════════════════
// Stop Card — Tappable, with quick-complete circle
// ═══════════════════════════════════════════
function StopCard({ stop, index, onTap, onQuickComplete }) {
  const isDone = !!stop.completion

  return (
    <button
      onClick={onTap}
      style={{
        display: "block", width: "100%", textAlign: "left", cursor: "pointer",
        background: T.card, borderRadius: 14, overflow: "hidden",
        border: `1.5px solid ${isDone ? T.accentBorder : T.border}`,
        fontFamily: T.font, padding: 0,
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 0 2px ${T.accentBorder}` }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none" }}
    >
      {/* Main row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
        {/* Quick-complete circle */}
        <div
          onClick={e => { e.stopPropagation(); onQuickComplete() }}
          role="button" tabIndex={0}
          onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); onQuickComplete() } }}
          style={{
            border: "none", background: "none", cursor: "pointer", padding: 0, flexShrink: 0,
          }}
        >
          {isDone
            ? <CheckCircle2 size={24} color={T.accent} />
            : <Circle size={24} color={T.textLight} />
          }
        </div>

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

        {/* Stop number + chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: isDone ? T.accentLight : (stop.routeColor || T.accent),
            color: isDone ? T.accent : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 800,
          }}>{index + 1}</div>
          <ChevronRight size={16} color={T.textLight} />
        </div>
      </div>

      {/* Details row */}
      <div style={{
        display: "flex", gap: 12, padding: "0 16px 12px 52px",
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: T.textLight }}>
          <Clock size={12} /> {stop.account.estimatedMinutes || stop.estimatedMinutes || 30}m
        </div>
        {stop.account.contactPhone && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: T.blue }}>
            <Phone size={12} /> Call
          </div>
        )}
        {stop.account.latitude && stop.account.longitude && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: T.accent }}>
            <Navigation size={12} /> Navigate
          </div>
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
    </button>
  )
}


// ═══════════════════════════════════════════
// Stop Detail Bottom Sheet
// Shows account info, contact, resources, actions
// ═══════════════════════════════════════════
function StopDetailSheet({ stop, onComplete, onClose }) {
  const [resources, setResources] = useState([])
  const [loadingResources, setLoadingResources] = useState(true)
  const isDone = !!stop.completion

  // Fetch resources linked to this account
  useEffect(() => {
    if (!stop.account?.id && !stop.accountId) {
      setLoadingResources(false)
      return
    }
    const accountId = stop.account?.id || stop.accountId
    getAccountResources(accountId)
      .then(setResources)
      .catch(() => setResources([]))
      .finally(() => setLoadingResources(false))
  }, [stop])

  const account = stop.account || {}
  const hasContact = account.contactName || account.contactPhone || account.contactEmail
  const hasGps = account.latitude && account.longitude
  const mapsUrl = hasGps
    ? `https://maps.google.com/?q=${account.latitude},${account.longitude}`
    : `https://maps.google.com/?q=${encodeURIComponent([account.address, account.city, account.state].filter(Boolean).join(", "))}`

  return (
    <BottomSheet open={true} onClose={onClose} title={account.name || "Stop Details"}>
      {/* Complete / Undo button — prominent at the top */}
      <button onClick={onComplete} style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        width: "100%", padding: "14px", borderRadius: 12, border: "none",
        cursor: "pointer", fontFamily: T.font, fontSize: 15, fontWeight: 700,
        marginBottom: 20,
        background: isDone ? T.amberLight : T.accent,
        color: isDone ? T.amber : "#fff",
        transition: "background 0.15s",
      }}>
        {isDone ? (
          <><X size={18} /> Mark Incomplete</>
        ) : (
          <><CheckCircle2 size={18} /> Mark Complete</>
        )}
      </button>

      {/* Address + quick actions */}
      <div style={{
        background: T.bg, borderRadius: 14, padding: 16, marginBottom: 14,
        border: `1px solid ${T.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "start", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: T.accentLight, display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0,
          }}>
            <MapPin size={18} color={T.accent} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 2 }}>
              {account.address || "No address"}
            </div>
            <div style={{ fontSize: 13, color: T.textLight }}>
              {[account.city, account.state, account.zip].filter(Boolean).join(", ")}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer"
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px", borderRadius: 10, border: "none", textDecoration: "none",
              background: T.accent, color: "#fff", fontSize: 13, fontWeight: 700,
              fontFamily: T.font, cursor: "pointer",
            }}>
            <Navigation size={14} /> Navigate
          </a>
          {account.contactPhone && (
            <a href={`tel:${account.contactPhone}`}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "10px", borderRadius: 10, border: `1.5px solid ${T.border}`,
                background: T.card, color: T.blue, fontSize: 13, fontWeight: 700,
                fontFamily: T.font, textDecoration: "none", cursor: "pointer",
              }}>
              <Phone size={14} /> Call
            </a>
          )}
        </div>
      </div>

      {/* Contact info */}
      {hasContact && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
            Contact
          </div>
          <div style={{
            background: T.bg, borderRadius: 12, padding: 14,
            border: `1px solid ${T.border}`,
          }}>
            {account.contactName && (
              <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>
                {account.contactName}
              </div>
            )}
            {account.contactPhone && (
              <div style={{ fontSize: 13, color: T.textMed }}>
                {account.contactPhone}
              </div>
            )}
            {account.contactEmail && (
              <div style={{ fontSize: 13, color: T.textMed }}>
                {account.contactEmail}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Route info */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
          Route Info
        </div>
        <div style={{
          display: "flex", gap: 10,
        }}>
          <div style={{
            flex: 1, background: T.bg, borderRadius: 12, padding: 12,
            border: `1px solid ${T.border}`, textAlign: "center",
          }}>
            <div style={{ fontSize: 11, color: T.textLight, marginBottom: 2 }}>Route</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{stop.routeName || "—"}</div>
          </div>
          <div style={{
            flex: 1, background: T.bg, borderRadius: 12, padding: 12,
            border: `1px solid ${T.border}`, textAlign: "center",
          }}>
            <div style={{ fontSize: 11, color: T.textLight, marginBottom: 2 }}>Est. Time</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{stop.account.estimatedMinutes || stop.estimatedMinutes || 30}m</div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {(account.accountNotes || stop.notes) && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
            Notes
          </div>
          <div style={{
            background: T.bg, borderRadius: 12, padding: 14,
            border: `1px solid ${T.border}`, fontSize: 14, color: T.textMed, lineHeight: 1.5,
          }}>
            {account.accountNotes || stop.notes}
          </div>
        </div>
      )}

      {/* Linked Resources */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
          Site Resources
        </div>
        {loadingResources ? (
          <div style={{ textAlign: "center", padding: 16 }}>
            <Loader2 size={18} color={T.textLight} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : resources.length === 0 ? (
          <div style={{
            textAlign: "center", padding: 20, background: T.bg, borderRadius: 12,
            border: `1.5px dashed ${T.border}`,
          }}>
            <BookOpen size={22} color={T.textLight} style={{ marginBottom: 4 }} />
            <div style={{ fontSize: 13, color: T.textLight }}>No resources attached to this site</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {resources.map(r => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}


// ═══════════════════════════════════════════
// Resource Card — Tappable to open/download
// ═══════════════════════════════════════════
function ResourceCard({ resource }) {
  const r = resource
  const isLink = r.resourceType === "link"
  const href = isLink ? r.url : (r.filename ? `/uploads/${r.filename}` : null)

  return (
    <a
      href={href || "#"}
      target={isLink ? "_blank" : "_self"}
      rel="noopener noreferrer"
      download={!isLink ? (r.originalName || r.title) : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
        background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`,
        textDecoration: "none", cursor: "pointer",
        transition: "background 0.1s",
      }}
      onTouchStart={e => { e.currentTarget.style.background = T.accentLight }}
      onTouchEnd={e => { e.currentTarget.style.background = T.bg }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: r.categoryColor ? `${r.categoryColor}15` : `${T.blue}10`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {isLink
          ? <ExternalLink size={16} color={r.categoryColor || T.blue} />
          : <FileText size={16} color={r.categoryColor || T.blue} />
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: T.text,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{r.title}</div>
        <div style={{ fontSize: 12, color: T.textLight }}>
          {r.categoryName || "Resource"}
        </div>
      </div>
      {isLink
        ? <ExternalLink size={14} color={T.textLight} />
        : <Download size={14} color={T.textLight} />
      }
    </a>
  )
}
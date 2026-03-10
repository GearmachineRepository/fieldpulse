// ═══════════════════════════════════════════
// Schedule Page — Monthly Calendar + Weekly List
// ═══════════════════════════════════════════

import { useState, useEffect, useMemo } from "react"
import {
  Calendar, Plus, Edit3, MapPin, Clock, Users, ChevronLeft,
  ChevronRight, Trash2, CheckCircle2, Circle, ArrowLeft,
  GripVertical, Search, LayoutGrid, List,
} from "lucide-react"
import { T } from "@/app/tokens.js"
import { useData } from "@/context/DataProvider.jsx"
import { getRoute, addRouteStop, removeRouteStop, reorderRouteStops } from "@/lib/api/routes.js"
import { getScheduleEvents, createScheduleEvent, updateScheduleEvent, deleteScheduleEvent } from "@/lib/api/scheduleEvents.js"
import {
  Modal, ModalFooter, ConfirmModal, FormField, SelectField, TextareaField,
  PageHeader, AddButton, ClickableCard, IconButton, LoadingSpinner, EmptyMessage,
} from "@/app/dashboard/components/PageUI.jsx"

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const DAY_HDR = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
const EVENT_TYPES = [
  { value: "task", label: "Task", color: "#3B82F6" },
  { value: "event", label: "Event", color: "#7C3AED" },
  { value: "meeting", label: "Meeting", color: "#F59E0B" },
  { value: "deadline", label: "Deadline", color: "#EF4444" },
  { value: "reminder", label: "Reminder", color: "#0891B2" },
]
const COLORS = ["#3B82F6", "#059669", "#F59E0B", "#EF4444", "#7C3AED", "#0891B2", "#DB2777", "#92400E"]
const ROUTE_COLORS = ["#059669", "#3B82F6", "#F59E0B", "#EF4444", "#7C3AED", "#0891B2", "#DB2777", "#92400E"]

// ── Date helpers ──
function fmtKey(d) { return d.toLocaleDateString("en-CA") }
function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate() }

function getMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  let startDay = first.getDay() - 1 // Monday = 0
  if (startDay < 0) startDay = 6
  const start = new Date(first)
  start.setDate(start.getDate() - startDay)
  const days = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  // Trim trailing row if entirely next month
  const lastRow = days.slice(35)
  if (lastRow.every(d => d.getMonth() !== month)) return days.slice(0, 35)
  return days
}

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // Monday start
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function SchedulePage({ isMobile }) {
  const { routes, crews, accounts, toast } = useData()
  const [view, setView] = useState("calendar")
  const today = new Date()

  // Calendar state
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  // List state
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))

  // Events
  const [events, setEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)

  // Modals
  const [editingEvent, setEditingEvent] = useState(null)
  const [editingRoute, setEditingRoute] = useState(null)
  const [viewingRoute, setViewingRoute] = useState(null)

  // ── Fetch events for visible range ──
  const fetchEvents = async () => {
    setLoadingEvents(true)
    let start, end
    if (view === "calendar") {
      start = new Date(calYear, calMonth, 1)
      start.setDate(start.getDate() - 7) // buffer
      end = new Date(calYear, calMonth + 1, 0)
      end.setDate(end.getDate() + 7)
    } else {
      start = new Date(weekStart)
      end = new Date(weekStart)
      end.setDate(end.getDate() + 6)
    }
    try {
      const data = await getScheduleEvents({ startDate: fmtKey(start), endDate: fmtKey(end) })
      setEvents(data)
    } catch (err) { console.error(err) }
    finally { setLoadingEvents(false) }
  }

  useEffect(() => { fetchEvents() }, [calYear, calMonth, weekStart, view])

  // ── Calendar nav ──
  const calPrev = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) } else setCalMonth(calMonth - 1) }
  const calNext = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) } else setCalMonth(calMonth + 1) }
  const calToday = () => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()) }

  // ── List nav ──
  const listPrev = () => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }
  const listNext = () => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }
  const listToday = () => setWeekStart(getWeekStart(new Date()))

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(d.getDate() + i); return d
  }), [weekStart])

  // ── Calendar grid ──
  const calDays = useMemo(() => getMonthGrid(calYear, calMonth), [calYear, calMonth])
  const monthLabel = new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })

  // ── Helper: get items for a date ──
  const getItemsForDate = (date) => {
    const jsDay = date.getDay()
    const dateKey = fmtKey(date)
    const dayRoutes = routes.data.filter(r => r.dayOfWeek === jsDay)
    const dayEvents = events.filter(e => typeof e.eventDate === "string" && e.eventDate.startsWith(dateKey))
    return { routes: dayRoutes, events: dayEvents }
  }

  // ── Event CRUD ──
  const handleSaveEvent = async (data) => {
    try {
      if (editingEvent.id) { await updateScheduleEvent(editingEvent.id, data); toast.show("Updated ✓") }
      else { await createScheduleEvent(data); toast.show("Added ✓") }
      setEditingEvent(null); fetchEvents()
    } catch (err) { toast.show(err.message || "Failed to save") }
  }
  const handleDeleteEvent = async (id) => {
    try { await deleteScheduleEvent(id); toast.show("Removed ✓"); setEditingEvent(null); fetchEvents() }
    catch { toast.show("Failed") }
  }
  const handleToggleComplete = async (event) => {
    try { await updateScheduleEvent(event.id, { completed: !event.completed }); fetchEvents() }
    catch { toast.show("Failed") }
  }

  // ── Route CRUD ──
  const handleSaveRoute = async (data) => {
    try {
      if (editingRoute.id) { await routes.update(editingRoute.id, data); toast.show("Updated ✓") }
      else { await routes.create(data); toast.show("Created ✓") }
      setEditingRoute(null)
    } catch (err) { toast.show(err.message || "Failed") }
  }
  const handleDeleteRoute = async (id) => {
    try { await routes.remove(id); toast.show("Removed ✓"); setEditingRoute(null); setViewingRoute(null) }
    catch { toast.show("Failed") }
  }

  // ── Route stop view ──
  if (viewingRoute) {
    return <RouteStopManager routeId={viewingRoute.id} routeName={viewingRoute.name} route={viewingRoute}
      accounts={accounts.data} toast={toast} isMobile={isMobile}
      onBack={() => { setViewingRoute(null); routes.refresh() }}
      onEdit={() => setEditingRoute(viewingRoute)} />
  }

  return (
    <div>
      {/* ── Header bar ── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 20, flexWrap: "wrap", gap: 10,
      }}>
        {/* Left: title + nav */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 800, minWidth: 180 }}>
            {view === "calendar" ? monthLabel : (() => {
              const end = new Date(weekStart); end.setDate(end.getDate() + 6)
              return `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
            })()}
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            <NavBtn onClick={view === "calendar" ? calPrev : listPrev}><ChevronLeft size={16} /></NavBtn>
            <NavBtn onClick={view === "calendar" ? calToday : listToday} label="Today" />
            <NavBtn onClick={view === "calendar" ? calNext : listNext}><ChevronRight size={16} /></NavBtn>
          </div>
        </div>

        {/* Right: view toggle + add */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 2, background: T.card, borderRadius: 8, border: `1px solid ${T.border}`, padding: 3 }}>
            <ViewBtn icon={LayoutGrid} label="Calendar" active={view === "calendar"} onClick={() => setView("calendar")} />
            <ViewBtn icon={List} label="List" active={view === "list"} onClick={() => setView("list")} />
          </div>
          <AddButton label="Route" icon={Plus} onClick={() => setEditingRoute({})} />
          <AddButton label="Event" icon={Plus} onClick={() => setEditingEvent({ eventDate: fmtKey(today) })} />
        </div>
      </div>

      {/* ═══ CALENDAR VIEW ═══ */}
      {view === "calendar" && (
        <div style={{
          background: T.card, borderRadius: 14, border: `1px solid ${T.border}`,
          overflow: "hidden", boxShadow: T.shadow,
        }}>
          {/* Day headers */}
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)",
            borderBottom: `1px solid ${T.border}`,
          }}>
            {DAY_HDR.map(d => (
              <div key={d} style={{
                padding: "10px 0", textAlign: "center", fontSize: 11, fontWeight: 700,
                color: T.textLight, textTransform: "uppercase", letterSpacing: 1,
              }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
            {calDays.map((date, i) => {
              const inMonth = date.getMonth() === calMonth
              const isToday = sameDay(date, today)
              const items = getItemsForDate(date)
              const hasContent = items.routes.length > 0 || items.events.length > 0

              return (
                <div key={i} style={{
                  minHeight: isMobile ? 60 : 110, padding: "4px 5px",
                  borderRight: (i % 7 !== 6) ? `1px solid ${T.border}` : "none",
                  borderBottom: `1px solid ${T.border}`,
                  background: !inMonth ? "#FAFBFC" : isToday ? "#F0FDF9" : T.card,
                  opacity: inMonth ? 1 : 0.45,
                }}>
                  {/* Date number */}
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 3, padding: "0 2px",
                  }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 12, fontSize: 12, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: isToday ? T.accent : "transparent",
                      color: isToday ? "#fff" : inMonth ? T.text : T.textLight,
                    }}>
                      {date.getDate()}
                    </div>
                    {inMonth && (
                      <button onClick={() => setEditingEvent({ eventDate: fmtKey(date) })} style={{
                        width: 18, height: 18, borderRadius: 4, border: "none", cursor: "pointer",
                        background: "transparent", color: T.textLight, display: "flex",
                        alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.1s",
                      }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0}
                        className="cal-add-btn"
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>

                  {/* Items */}
                  {!isMobile && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {items.routes.slice(0, 3).map(route => (
                        <button key={`r${route.id}`} onClick={() => setViewingRoute(route)} style={{
                          display: "block", width: "100%", padding: "2px 5px", borderRadius: 4,
                          border: "none", cursor: "pointer", fontFamily: T.font, textAlign: "left",
                          background: `${route.color || T.accent}15`,
                          borderLeft: `2px solid ${route.color || T.accent}`,
                          fontSize: 11, fontWeight: 600, color: route.color || T.accent,
                          lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {route.name}
                        </button>
                      ))}
                      {items.events.slice(0, 3).map(event => (
                        <button key={`e${event.id}`} onClick={() => setEditingEvent(event)} style={{
                          display: "flex", alignItems: "center", gap: 3, width: "100%", padding: "2px 5px",
                          borderRadius: 4, border: "none", cursor: "pointer", fontFamily: T.font,
                          textAlign: "left", background: "transparent",
                          fontSize: 11, color: event.completed ? T.textLight : T.text,
                          textDecoration: event.completed ? "line-through" : "none",
                          lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: 3, flexShrink: 0,
                            background: event.completed ? T.textLight : (event.color || "#3B82F6"),
                          }} />
                          {event.startTime && <span style={{ color: T.textLight, marginRight: 2 }}>{event.startTime.slice(0, 5)}</span>}
                          {event.title}
                        </button>
                      ))}
                      {(items.routes.length + items.events.length) > 3 && (
                        <div style={{ fontSize: 10, color: T.textLight, padding: "1px 5px" }}>
                          +{items.routes.length + items.events.length - 3} more
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mobile: dot indicators */}
                  {isMobile && hasContent && (
                    <div style={{ display: "flex", gap: 3, padding: "2px 4px", flexWrap: "wrap" }}>
                      {items.routes.map(r => (
                        <div key={r.id} style={{ width: 6, height: 6, borderRadius: 3, background: r.color || T.accent }} />
                      ))}
                      {items.events.map(e => (
                        <div key={e.id} style={{ width: 6, height: 6, borderRadius: 3, background: e.completed ? T.textLight : (e.color || "#3B82F6") }} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ═══ LIST VIEW ═══ */}
      {view === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {weekDays.map((date, i) => {
            const isToday = sameDay(date, today)
            const items = getItemsForDate(date)
            const hasItems = items.routes.length > 0 || items.events.length > 0

            return (
              <div key={i}>
                {/* Day header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 8,
                  padding: "0 4px",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    background: isToday ? T.accent : T.bg,
                    fontSize: 16, fontWeight: 800,
                    color: isToday ? "#fff" : T.text,
                  }}>
                    {date.getDate()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isToday ? T.accent : T.text }}>
                      {DAY_NAMES[date.getDay()]}
                    </div>
                    <div style={{ fontSize: 12, color: T.textLight }}>
                      {date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                    </div>
                  </div>
                  {isToday && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: T.accentLight, color: T.accent, padding: "3px 8px", borderRadius: 6 }}>Today</span>
                  )}
                </div>

                {/* Content */}
                {!hasItems ? (
                  <div style={{
                    padding: "14px 18px", background: T.card, borderRadius: 12,
                    border: `1px dashed ${T.border}`, color: T.textLight, fontSize: 13,
                  }}>Nothing scheduled</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {items.routes.map(route => (
                      <ClickableCard key={`r${route.id}`} onClick={() => setViewingRoute(route)} style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 4, height: 36, borderRadius: 2, background: route.color || T.accent, flexShrink: 0 }} />
                          <MapPin size={16} color={route.color || T.accent} style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{route.name}</div>
                            <div style={{ fontSize: 12, color: T.textLight }}>
                              {route.stopCount} stop{route.stopCount !== 1 ? "s" : ""}
                              {route.crewName && ` · ${route.crewName}`}
                              {route.totalMinutes > 0 && ` · ~${Math.round(route.totalMinutes / 60 * 10) / 10}h`}
                            </div>
                          </div>
                          <ChevronRight size={16} color={T.textLight} />
                        </div>
                      </ClickableCard>
                    ))}
                    {items.events.map(event => (
                      <ClickableCard key={`e${event.id}`} onClick={() => setEditingEvent(event)} style={{ padding: "12px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <button onClick={e => { e.stopPropagation(); handleToggleComplete(event) }} style={{
                            border: "none", background: "none", cursor: "pointer", padding: 0, flexShrink: 0,
                          }}>
                            {event.completed ? <CheckCircle2 size={20} color={T.accent} /> : <Circle size={20} color={event.color || "#3B82F6"} />}
                          </button>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 14, fontWeight: 700,
                              textDecoration: event.completed ? "line-through" : "none",
                              color: event.completed ? T.textLight : T.text,
                            }}>{event.title}</div>
                            <div style={{ fontSize: 12, color: T.textLight }}>
                              {event.startTime || ""}{event.endTime ? ` – ${event.endTime}` : ""}
                              {event.crewName && ` · ${event.crewName}`}
                              {event.accountName && ` · ${event.accountName}`}
                            </div>
                          </div>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                            background: `${event.color || "#3B82F6"}12`,
                            color: event.color || "#3B82F6", flexShrink: 0,
                          }}>
                            {EVENT_TYPES.find(t => t.value === event.eventType)?.label || "Task"}
                          </span>
                        </div>
                      </ClickableCard>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modals ── */}
      {editingEvent !== null && (
        <EventModal event={editingEvent} crews={crews.data} accounts={accounts.data}
          onClose={() => setEditingEvent(null)} onSave={handleSaveEvent}
          onDelete={editingEvent.id ? () => handleDeleteEvent(editingEvent.id) : undefined} />
      )}
      {editingRoute !== null && (
        <RouteModal route={editingRoute} crews={crews.data}
          onClose={() => setEditingRoute(null)} onSave={handleSaveRoute}
          onDelete={editingRoute.id ? () => handleDeleteRoute(editingRoute.id) : undefined} />
      )}

      <style>{`
        .cal-add-btn:hover { opacity: 1 !important; }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════
// Small UI Bits
// ═══════════════════════════════════════════
function NavBtn({ onClick, children, label }) {
  return (
    <button onClick={onClick} style={{
      padding: label ? "5px 14px" : "5px 8px", borderRadius: 7,
      border: `1px solid ${T.border}`, background: T.card, cursor: "pointer",
      fontFamily: T.font, color: T.textMed, fontSize: 12, fontWeight: 600,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>{children || label}</button>
  )
}

function ViewBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
      background: active ? T.accent : "transparent", color: active ? "#fff" : T.textLight,
      fontSize: 12, fontWeight: 600, fontFamily: T.font, display: "flex", alignItems: "center", gap: 4,
    }}><Icon size={14} /> {label}</button>
  )
}

// ═══════════════════════════════════════════
// Event Modal
// ═══════════════════════════════════════════
function EventModal({ event, crews, accounts, onClose, onSave, onDelete }) {
  const isEdit = !!event.id
  const [title, setTitle]     = useState(event.title || "")
  const [notes, setNotes]     = useState(event.notes || "")
  const [eventDate, setDate]  = useState(event.eventDate || fmtKey(new Date()))
  const [startTime, setStart] = useState(event.startTime || "")
  const [endTime, setEnd]     = useState(event.endTime || "")
  const [eventType, setType]  = useState(event.eventType || "task")
  const [color, setColor]     = useState(event.color || "#3B82F6")
  const [crewId, setCrewId]   = useState(event.crewId ? String(event.crewId) : "")
  const [accountId, setAcct]  = useState(event.accountId ? String(event.accountId) : "")
  const [saving, setSaving]   = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !eventDate) return; setSaving(true)
    await onSave({ title: title.trim(), notes: notes || null, eventDate,
      startTime: startTime || null, endTime: endTime || null, eventType, color,
      crewId: crewId ? parseInt(crewId) : null, accountId: accountId ? parseInt(accountId) : null })
    setSaving(false)
  }

  if (confirmDel) return <ConfirmModal title={`Delete "${event.title}"?`} message="This removes the event."
    onConfirm={onDelete} onCancel={() => setConfirmDel(false)} />

  return (
    <Modal title={isEdit ? "Edit Event" : "Add Event"} onClose={onClose}>
      <FormField label="Title *" value={title} onChange={setTitle} autoFocus placeholder="e.g. Fertilizer delivery" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <FormField label="Date *" value={eventDate} onChange={setDate} type="date" />
        <FormField label="Start" value={startTime} onChange={setStart} type="time" />
        <FormField label="End" value={endTime} onChange={setEnd} type="time" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <SelectField label="Type" value={eventType} onChange={t => { setType(t); setColor(EVENT_TYPES.find(e => e.value === t)?.color || color) }}
          options={EVENT_TYPES} />
        <SelectField label="Crew" value={crewId} onChange={setCrewId} placeholder="None"
          options={crews.map(c => ({ value: String(c.id), label: c.name }))} />
      </div>
      <SelectField label="Property" value={accountId} onChange={setAcct} placeholder="None"
        options={accounts.map(a => ({ value: String(a.id), label: a.name }))} />
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Color</label>
        <div style={{ display: "flex", gap: 6 }}>
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: 24, height: 24, borderRadius: 6, background: c, border: "none", cursor: "pointer",
              boxShadow: color === c ? `0 0 0 2px ${T.bg}, 0 0 0 3px ${c}` : "none",
            }} />
          ))}
        </div>
      </div>
      <TextareaField label="Notes" value={notes} onChange={setNotes} placeholder="Optional" rows={2} />
      <ModalFooter onClose={onClose} onSave={handleSubmit} saving={saving} disabled={!title.trim() || !eventDate}
        onDelete={onDelete ? () => setConfirmDel(true) : undefined} />
    </Modal>
  )
}

// ═══════════════════════════════════════════
// Route Modal
// ═══════════════════════════════════════════
function RouteModal({ route, crews, onClose, onSave, onDelete }) {
  const isEdit = !!route.id
  const [name, setName]     = useState(route.name || "")
  const [crewId, setCrewId] = useState(route.crewId ? String(route.crewId) : "")
  const [dayOfWeek, setDay] = useState(route.dayOfWeek !== null && route.dayOfWeek !== undefined ? String(route.dayOfWeek) : "")
  const [color, setColor]   = useState(route.color || "#059669")
  const [notes, setNotes]   = useState(route.notes || "")
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return; setSaving(true)
    await onSave({ name: name.trim(), crewId: crewId ? parseInt(crewId) : null,
      dayOfWeek: dayOfWeek !== "" ? parseInt(dayOfWeek) : null, color, notes: notes || null })
    setSaving(false)
  }

  if (confirmDel) return <ConfirmModal title={`Remove "${route.name}"?`} message="All stops removed."
    onConfirm={onDelete} onCancel={() => setConfirmDel(false)} />

  return (
    <Modal title={isEdit ? "Edit Route" : "Create Route"} onClose={onClose}>
      <FormField label="Route Name *" value={name} onChange={setName} autoFocus />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <SelectField label="Day" value={dayOfWeek} onChange={setDay} placeholder="Unscheduled"
          options={DAY_NAMES.map((n, i) => ({ value: String(i), label: n }))} />
        <SelectField label="Crew" value={crewId} onChange={setCrewId} placeholder="None"
          options={crews.map(c => ({ value: String(c.id), label: c.name }))} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Color</label>
        <div style={{ display: "flex", gap: 6 }}>
          {ROUTE_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: 24, height: 24, borderRadius: 6, background: c, border: "none", cursor: "pointer",
              boxShadow: color === c ? `0 0 0 2px ${T.bg}, 0 0 0 3px ${c}` : "none",
            }} />
          ))}
        </div>
      </div>
      <FormField label="Notes" value={notes} onChange={setNotes} placeholder="Optional" />
      <ModalFooter onClose={onClose} onSave={handleSubmit} saving={saving} disabled={!name.trim()}
        onDelete={onDelete ? () => setConfirmDel(true) : undefined} />
    </Modal>
  )
}

// ═══════════════════════════════════════════
// Route Stop Manager
// ═══════════════════════════════════════════
function RouteStopManager({ routeId, routeName, route: routeMeta, accounts, toast, isMobile, onBack, onEdit }) {
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [dragFrom, setDragFrom] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const load = async () => { try { setRoute(await getRoute(routeId)) } catch { toast.show("Failed") } finally { setLoading(false) } }
  useEffect(() => { load() }, [routeId])

  const handleAdd = async (accountId) => {
    try { await addRouteStop(routeId, { accountId }); toast.show("Added ✓"); setShowAdd(false); load() }
    catch (err) { toast.show(err.message || "Already on route") }
  }
  const handleRemove = async (stopId) => {
    try { await removeRouteStop(routeId, stopId); toast.show("Removed ✓"); load() }
    catch { toast.show("Failed") }
  }
  const handleDragEnd = async () => {
    if (dragFrom === null || dragOver === null || dragFrom === dragOver || !route?.stops) { setDragFrom(null); setDragOver(null); return }
    const stops = [...route.stops]; const [m] = stops.splice(dragFrom, 1); stops.splice(dragOver, 0, m)
    setRoute({ ...route, stops }); setDragFrom(null); setDragOver(null)
    try { await reorderRouteStops(routeId, stops.map(s => s.id)) } catch { toast.show("Failed"); load() }
  }

  if (loading) return <LoadingSpinner />
  const existingIds = new Set((route?.stops || []).map(s => s.accountId))

  return (
    <div>
      <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, border: "none", background: "none", cursor: "pointer", fontFamily: T.font, fontSize: 14, color: T.textLight, fontWeight: 600, padding: 0, marginBottom: 20 }}>
        <ArrowLeft size={18} /> Back to Schedule
      </button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 6, height: 36, borderRadius: 3, background: routeMeta?.color || T.accent }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{routeName}</div>
            <div style={{ fontSize: 13, color: T.textLight }}>
              {route?.dayName || "Unscheduled"}{route?.crewName && ` · ${route.crewName}`} · {(route?.stops || []).length} stops
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <AddButton label="Add Stop" icon={Plus} onClick={() => setShowAdd(true)} />
          <IconButton icon={Edit3} onClick={onEdit} title="Edit" />
        </div>
      </div>

      {(route?.stops || []).length === 0 ? <EmptyMessage text="No stops yet." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {(route?.stops || []).map((stop, i) => (
            <div key={stop.id} draggable onDragStart={() => setDragFrom(i)} onDragEnter={() => setDragOver(i)}
              onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                background: T.card, borderRadius: 12,
                border: `1px solid ${dragOver === i && dragFrom !== i ? T.accent : T.border}`,
                boxShadow: T.shadow, opacity: dragFrom === i ? 0.5 : 1,
              }}>
              <div style={{ cursor: "grab", color: T.textLight, flexShrink: 0 }}><GripVertical size={18} /></div>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: routeMeta?.color || T.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{stop.account.name}</div>
                <div style={{ fontSize: 12, color: T.textLight }}>{stop.account.address}{stop.account.city && `, ${stop.account.city}`}</div>
              </div>
              <div style={{ fontSize: 12, color: T.textLight, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} />{stop.estimatedMinutes}m</div>
              <button onClick={() => handleRemove(stop.id)} style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Trash2 size={13} color={T.red} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal title="Add Stop" onClose={() => setShowAdd(false)}>
          <StopSearch accounts={accounts.filter(a => !existingIds.has(a.id))} onAdd={handleAdd} />
        </Modal>
      )}
    </div>
  )
}

function StopSearch({ accounts, onAdd }) {
  const [q, setQ] = useState("")
  const f = accounts.filter(a => !q || a.name.toLowerCase().includes(q.toLowerCase()) || (a.address || "").toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.bg, borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.border}`, marginBottom: 14 }}>
        <Search size={16} color={T.textLight} />
        <input value={q} onChange={e => setQ(e.target.value)} autoFocus placeholder="Search accounts..."
          style={{ flex: 1, border: "none", outline: "none", fontSize: 14, fontFamily: T.font, background: "transparent", color: T.text }} />
      </div>
      <div style={{ maxHeight: 340, overflowY: "auto" }}>
        {f.length === 0 ? <div style={{ padding: 20, textAlign: "center", color: T.textLight, fontSize: 14 }}>No accounts.</div> :
          f.map(a => (
            <button key={a.id} onClick={() => onAdd(a.id)} style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px",
              border: "none", background: "none", cursor: "pointer", fontFamily: T.font, textAlign: "left",
              borderBottom: `1px solid ${T.border}`,
            }} onMouseEnter={e => e.currentTarget.style.background = T.bg} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <MapPin size={16} color={T.accent} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{a.name}</div><div style={{ fontSize: 12, color: T.textLight }}>{a.address}{a.city && `, ${a.city}`}</div></div>
              <Plus size={16} color={T.accent} />
            </button>
          ))
        }
      </div>
    </div>
  )
}

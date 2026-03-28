// ═══════════════════════════════════════════
// Schedule Page — Monthly Calendar + Weekly List
// Phase 3A: usePageData, SlidePanel for routes/events
// ═══════════════════════════════════════════

import { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Edit3,
  MapPin,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckCircle2,
  Circle,
  GripVertical,
  Search,
  LayoutGrid,
  List,
} from 'lucide-react'
import s from './SchedulePage.module.css'
import usePageData from '@/hooks/usePageData.js'
import { useGlobalToast } from '@/hooks/ToastContext.jsx'
import {
  getRoutes,
  createRoute,
  updateRoute,
  deleteRoute,
  getRoute,
  addRouteStop,
  removeRouteStop,
  reorderRouteStops,
  updateRouteStop,
  getScheduleVisits,
} from '@/lib/api/routes.js'
import {
  getScheduleEvents,
  createScheduleEvent,
  updateScheduleEvent,
  deleteScheduleEvent,
} from '@/lib/api/scheduleEvents.js'
import { getCrews } from '@/lib/api/crews.js'
import { getAccounts } from '@/lib/api/accounts.js'
import SlidePanel from '../components/SlidePanel.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import {
  Modal,
  ModalFooter,
  ConfirmModal,
  FormField,
  SelectField,
  TextareaField,
  AddButton,
  ClickableCard,
  LoadingSpinner,
  EmptyMessage,
} from '@/app/dashboard/components/PageUI.jsx'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_HDR = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const EVENT_TYPES = [
  { value: 'task', label: 'Task', color: '#3B82F6', variant: 'blue' },
  { value: 'event', label: 'Event', color: '#7C3AED', variant: 'blue' },
  { value: 'meeting', label: 'Meeting', color: '#F59E0B', variant: 'amber' },
  { value: 'deadline', label: 'Deadline', color: '#EF4444', variant: 'red' },
  { value: 'reminder', label: 'Reminder', color: '#0891B2', variant: 'blue' },
]
const COLORS = [
  '#3B82F6',
  '#2F6FED',
  '#F59E0B',
  '#EF4444',
  '#7C3AED',
  '#0891B2',
  '#DB2777',
  '#92400E',
]
const ROUTE_COLORS = [
  '#2F6FED',
  '#3B82F6',
  '#F59E0B',
  '#EF4444',
  '#7C3AED',
  '#0891B2',
  '#DB2777',
  '#92400E',
]

// ── Date helpers ──
function fmtKey(d) {
  return d.toLocaleDateString('en-CA')
}
function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  let startDay = first.getDay() - 1
  if (startDay < 0) startDay = 6
  const start = new Date(first)
  start.setDate(start.getDate() - startDay)
  const days = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    days.push(d)
  }
  const lastRow = days.slice(35)
  if (lastRow.every((d) => d.getMonth() !== month)) return days.slice(0, 35)
  return days
}

function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function SchedulePage() {
  // ── Data via usePageData ──
  const routes = usePageData('routes', {
    fetchFn: getRoutes,
    createFn: createRoute,
    updateFn: updateRoute,
    deleteFn: deleteRoute,
  })
  const crews = usePageData('crews', { fetchFn: getCrews })
  const accounts = usePageData('accounts', { fetchFn: getAccounts })
  const toast = useGlobalToast()

  const [view, setView] = useState('calendar')
  const today = new Date()

  // Calendar state
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  // List state
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))

  // Events + Visits (date-range filtered, managed directly)
  const [events, setEvents] = useState([])
  const [visits, setVisits] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(true)

  // Modals
  const [editingEvent, setEditingEvent] = useState(null)
  const [editingRoute, setEditingRoute] = useState(null)

  // SlidePanel state
  const [panelRoute, setPanelRoute] = useState(null)
  const [panelEvent, setPanelEvent] = useState(null)

  // ── Fetch events + calculated visits for visible range ──
  const fetchData = async () => {
    setLoadingEvents(true)
    let start, end
    if (view === 'calendar') {
      start = new Date(calYear, calMonth, 1)
      start.setDate(start.getDate() - 7)
      end = new Date(calYear, calMonth + 1, 0)
      end.setDate(end.getDate() + 7)
    } else {
      start = new Date(weekStart)
      end = new Date(weekStart)
      end.setDate(end.getDate() + 6)
    }
    try {
      const [eventsData, visitsData] = await Promise.all([
        getScheduleEvents({ startDate: fmtKey(start), endDate: fmtKey(end) }),
        getScheduleVisits(fmtKey(start), fmtKey(end)).catch(() => []),
      ])
      setEvents(eventsData)
      setVisits(visitsData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingEvents(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [calYear, calMonth, weekStart, view]) // eslint-disable-line react-hooks/exhaustive-deps -- Refetch on calendar navigation; fetchData is stable

  // ── Calendar nav ──
  const calPrev = () => {
    if (calMonth === 0) {
      setCalMonth(11)
      setCalYear(calYear - 1)
    } else setCalMonth(calMonth - 1)
  }
  const calNext = () => {
    if (calMonth === 11) {
      setCalMonth(0)
      setCalYear(calYear + 1)
    } else setCalMonth(calMonth + 1)
  }
  const calToday = () => {
    setCalYear(today.getFullYear())
    setCalMonth(today.getMonth())
  }

  // ── List nav ──
  const listPrev = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }
  const listNext = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }
  const listToday = () => setWeekStart(getWeekStart(new Date()))

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart)
        d.setDate(d.getDate() + i)
        return d
      }),
    [weekStart],
  )

  // ── Calendar grid ──
  const calDays = useMemo(() => getMonthGrid(calYear, calMonth), [calYear, calMonth])
  const monthLabel = new Date(calYear, calMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  // ── Helper: get items for a date ──
  const getItemsForDate = (date) => {
    const jsDay = date.getDay()
    const dateKey = fmtKey(date)
    const dayRoutes = routes.data.filter((r) => r.dayOfWeek === jsDay)
    const dayEvents = events.filter(
      (e) => typeof e.eventDate === 'string' && e.eventDate.startsWith(dateKey),
    )
    const dayVisits = visits.filter((v) => v.date === dateKey && v.status === 'scheduled')

    const enrichedRoutes = dayRoutes.map((r) => {
      const routeVisits = dayVisits.filter((v) => v.routeId === r.id)
      return { ...r, visitCount: routeVisits.length, visits: routeVisits }
    })

    const routeIds = new Set(dayRoutes.map((r) => r.id))
    const standaloneVisits = dayVisits.filter((v) => !routeIds.has(v.routeId))

    return { routes: enrichedRoutes, events: dayEvents, visits: dayVisits, standaloneVisits }
  }

  // ── Event CRUD ──
  const handleSaveEvent = async (data) => {
    try {
      if (editingEvent.id) {
        await updateScheduleEvent(editingEvent.id, data)
        toast.show('Updated')
      } else {
        await createScheduleEvent(data)
        toast.show('Added')
      }
      setEditingEvent(null)
      setPanelEvent(null)
      fetchData()
    } catch (err) {
      toast.show(err.message || 'Failed to save')
    }
  }
  const handleDeleteEvent = async (id) => {
    try {
      await deleteScheduleEvent(id)
      toast.show('Removed')
      setEditingEvent(null)
      setPanelEvent(null)
      fetchData()
    } catch {
      toast.show('Failed')
    }
  }
  const handleToggleComplete = async (event) => {
    try {
      await updateScheduleEvent(event.id, { completed: !event.completed })
      fetchData()
    } catch {
      toast.show('Failed')
    }
  }

  // ── Route CRUD ──
  const handleSaveRoute = async (data) => {
    try {
      if (editingRoute.id) {
        await routes.update(editingRoute.id, data)
        toast.show('Updated')
        setEditingRoute(null)
      } else {
        const newRoute = await routes.create(data)
        toast.show('Created')
        setEditingRoute(null)
        // Auto-open SlidePanel so boss can add stops immediately
        if (newRoute?.id) setPanelRoute(newRoute)
      }
    } catch (err) {
      toast.show(err.message || 'Failed')
    }
  }
  const handleDeleteRoute = async (id) => {
    try {
      await routes.remove(id)
      toast.show('Removed')
      setEditingRoute(null)
      setPanelRoute(null)
    } catch {
      toast.show('Failed')
    }
  }

  // ── Click handlers for SlidePanel ──
  const openRoutePanel = (route) => {
    setPanelEvent(null)
    setPanelRoute(route)
  }
  const openEventPanel = (event) => {
    setPanelRoute(null)
    setPanelEvent(event)
  }

  return (
    <div>
      {/* ── Header bar ── */}
      <div className={s.headerBar}>
        <div className={s.headerLeft}>
          <div className={s.monthLabel}>
            {view === 'calendar'
              ? monthLabel
              : (() => {
                  const end = new Date(weekStart)
                  end.setDate(end.getDate() + 6)
                  return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                })()}
          </div>
          <div className={s.navGroup}>
            <NavBtn onClick={view === 'calendar' ? calPrev : listPrev}>
              <ChevronLeft size={16} />
            </NavBtn>
            <NavBtn onClick={view === 'calendar' ? calToday : listToday} label="Today" />
            <NavBtn onClick={view === 'calendar' ? calNext : listNext}>
              <ChevronRight size={16} />
            </NavBtn>
          </div>
        </div>

        <div className={s.headerRight}>
          <div className={s.viewToggle}>
            <ViewBtn
              icon={LayoutGrid}
              label="Calendar"
              active={view === 'calendar'}
              onClick={() => setView('calendar')}
            />
            <ViewBtn
              icon={List}
              label="List"
              active={view === 'list'}
              onClick={() => setView('list')}
            />
          </div>
          <AddButton label="Route" icon={Plus} onClick={() => setEditingRoute({})} />
          <AddButton
            label="Event"
            icon={Plus}
            onClick={() => setEditingEvent({ eventDate: fmtKey(today) })}
          />
        </div>
      </div>

      {/* ═══ CALENDAR VIEW ═══ */}
      {view === 'calendar' && (
        <div className={s.calendarContainer}>
          <div className={s.calendarHeader}>
            {DAY_HDR.map((d) => (
              <div key={d} className={s.calendarDayHeader}>
                {d}
              </div>
            ))}
          </div>

          <div className={s.calendarGrid}>
            {calDays.map((date, i) => {
              const inMonth = date.getMonth() === calMonth
              const isToday = sameDay(date, today)
              const items = getItemsForDate(date)
              const hasContent =
                items.routes.length > 0 ||
                items.events.length > 0 ||
                items.standaloneVisits.length > 0

              const cellClass = [
                s.calendarCell,
                i % 7 !== 6 ? s.calendarCellBorder : '',
                !inMonth
                  ? s.calendarCellOutOfMonth
                  : isToday
                    ? s.calendarCellToday
                    : s.calendarCellInMonth,
              ]
                .filter(Boolean)
                .join(' ')

              const dayNumClass = isToday
                ? s.dayNumberToday
                : inMonth
                  ? s.dayNumberDefault
                  : s.dayNumberOutOfMonth

              return (
                <div key={i} className={cellClass}>
                  <div className={s.cellHeader}>
                    <div className={dayNumClass}>{date.getDate()}</div>
                    {inMonth && (
                      <button
                        onClick={() => setEditingEvent({ eventDate: fmtKey(date) })}
                        className={s.calAddBtn}
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>

                  {loadingEvents && !hasContent ? (
                    <div className={s.cellLoading}>Loading...</div>
                  ) : (
                    <div className={s.cellContent}>
                      {items.routes.slice(0, 4).map((route) => (
                        <button
                          key={`r${route.id}`}
                          onClick={() => openRoutePanel(route)}
                          className={s.calRouteBtn}
                          style={{
                            background: `${route.color || 'var(--amb)'}15`,
                            borderLeft: `2px solid ${route.color || 'var(--amb)'}`,
                            color: route.color || 'var(--amb)',
                          }}
                        >
                          <span className={s.calRouteName}>{route.name}</span>
                          {route.visitCount > 0 && (
                            <span className={s.calRouteCount}>{route.visitCount}</span>
                          )}
                        </button>
                      ))}
                      {items.events.slice(0, 3).map((event) => (
                        <button
                          key={`e${event.id}`}
                          onClick={() => openEventPanel(event)}
                          className={s.calEventBtn}
                          style={{
                            color: event.completed ? 'var(--t3)' : 'var(--t1)',
                            textDecoration: event.completed ? 'line-through' : 'none',
                          }}
                        >
                          <span
                            className={s.eventDot}
                            style={{
                              background: event.completed
                                ? 'var(--t3)'
                                : event.color || 'var(--blu)',
                            }}
                          />
                          {event.startTime && (
                            <span className={s.eventTime}>{event.startTime.slice(0, 5)}</span>
                          )}
                          {event.title}
                        </button>
                      ))}
                      {items.routes.length + items.events.length > 4 && (
                        <div className={s.moreItems}>
                          +{items.routes.length + items.events.length - 4} more
                        </div>
                      )}
                    </div>
                  )}

                  {hasContent && (
                    <div className={s.mobileDots}>
                      {items.routes.map((r) => (
                        <div
                          key={r.id}
                          className={s.mobileDot}
                          style={{ background: r.color || 'var(--amb)' }}
                        />
                      ))}
                      {items.events.map((e) => (
                        <div
                          key={e.id}
                          className={s.mobileDot}
                          style={{
                            background: e.completed ? 'var(--t3)' : e.color || 'var(--blu)',
                          }}
                        />
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
      {view === 'list' && (
        <div className={s.listView}>
          {weekDays.map((date, i) => {
            const isToday = sameDay(date, today)
            const items = getItemsForDate(date)
            const hasItems = items.routes.length > 0 || items.events.length > 0

            return (
              <div key={i}>
                <div className={s.listDayHeader}>
                  <div className={isToday ? s.listDayNumberToday : s.listDayNumberDefault}>
                    {date.getDate()}
                  </div>
                  <div>
                    <div
                      className={`${s.listDayName} ${isToday ? s.listDayNameToday : s.listDayNameDefault}`}
                    >
                      {DAY_NAMES[date.getDay()]}
                    </div>
                    <div className={s.listDateLabel}>
                      {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  {isToday && <span className={s.todayBadge}>Today</span>}
                </div>

                {!hasItems ? (
                  <div className={s.emptyDay}>Nothing scheduled</div>
                ) : (
                  <div className={s.listItems}>
                    {items.routes.map((route) => (
                      <ClickableCard
                        key={`r${route.id}`}
                        onClick={() => openRoutePanel(route)}
                        style={{ padding: 'var(--space-4) var(--space-5)' }}
                      >
                        <div className={s.routeCardContent}>
                          <div
                            className={s.routeBar}
                            style={{ background: route.color || 'var(--amb)' }}
                          />
                          <MapPin
                            size={16}
                            color={route.color || 'var(--amb)'}
                            style={{ flexShrink: 0 }}
                          />
                          <div style={{ flex: 1 }}>
                            <div className={s.routeTitle}>{route.name}</div>
                            <div className={s.routeSubtext}>
                              {route.visitCount > 0
                                ? `${route.visitCount} stop${route.visitCount !== 1 ? 's' : ''} due`
                                : `${route.stopCount} stop${route.stopCount !== 1 ? 's' : ''}`}
                              {route.crewName && ` · ${route.crewName}`}
                            </div>
                          </div>
                          <ChevronRight size={16} color="var(--t3)" />
                        </div>
                        {route.visitCount > 0 && (
                          <div className={s.routeVisitTags}>
                            {route.visits.map((v, vi) => (
                              <span key={vi} className={s.visitTag}>
                                {v.accountName}
                              </span>
                            ))}
                          </div>
                        )}
                      </ClickableCard>
                    ))}
                    {items.events.map((event) => (
                      <ClickableCard
                        key={`e${event.id}`}
                        onClick={() => openEventPanel(event)}
                        style={{ padding: 'var(--space-3) var(--space-5)' }}
                      >
                        <div className={s.eventCardContent}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleComplete(event)
                            }}
                            className={s.toggleCompleteBtn}
                          >
                            {event.completed ? (
                              <CheckCircle2 size={20} color="var(--amb)" />
                            ) : (
                              <Circle size={20} color={event.color || 'var(--blu)'} />
                            )}
                          </button>
                          <div className={s.eventInfo}>
                            <div
                              className={s.eventTitle}
                              style={{
                                textDecoration: event.completed ? 'line-through' : 'none',
                                color: event.completed ? 'var(--t3)' : 'var(--t1)',
                              }}
                            >
                              {event.title}
                            </div>
                            <div className={s.eventSubtext}>
                              {event.startTime && (
                                <span className={s.monoTime}>{event.startTime}</span>
                              )}
                              {event.endTime && (
                                <span className={s.monoTime}> – {event.endTime}</span>
                              )}
                              {event.crewName && ` · ${event.crewName}`}
                              {event.accountName && ` · ${event.accountName}`}
                            </div>
                          </div>
                          <StatusBadge
                            variant={
                              EVENT_TYPES.find((t) => t.value === event.eventType)?.variant ||
                              'gray'
                            }
                          >
                            {EVENT_TYPES.find((t) => t.value === event.eventType)?.label || 'Task'}
                          </StatusBadge>
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

      {/* ═══ ROUTE SLIDE PANEL ═══ */}
      <SlidePanel
        open={!!panelRoute}
        onClose={() => setPanelRoute(null)}
        title={panelRoute?.name || 'Route'}
        width={460}
      >
        {panelRoute && (
          <RoutePanel
            route={panelRoute}
            accounts={accounts.data}
            toast={toast}
            onRefresh={() => routes.refresh()}
            onEdit={() => setEditingRoute(panelRoute)}
            onClose={() => setPanelRoute(null)}
          />
        )}
      </SlidePanel>

      {/* ═══ EVENT SLIDE PANEL ═══ */}
      <SlidePanel
        open={!!panelEvent && !editingEvent}
        onClose={() => setPanelEvent(null)}
        title="Event Details"
        width={420}
      >
        {panelEvent && (
          <EventPanel
            event={panelEvent}
            onEdit={() => setEditingEvent(panelEvent)}
            onDelete={() => handleDeleteEvent(panelEvent.id)}
            onToggleComplete={() => handleToggleComplete(panelEvent)}
          />
        )}
      </SlidePanel>

      {/* ── Modals ── */}
      {editingEvent !== null && (
        <EventModal
          event={editingEvent}
          crews={crews.data}
          accounts={accounts.data}
          onClose={() => setEditingEvent(null)}
          onSave={handleSaveEvent}
          onDelete={editingEvent.id ? () => handleDeleteEvent(editingEvent.id) : undefined}
        />
      )}
      {editingRoute !== null && (
        <RouteModal
          route={editingRoute}
          crews={crews.data}
          onClose={() => setEditingRoute(null)}
          onSave={handleSaveRoute}
          onDelete={editingRoute.id ? () => handleDeleteRoute(editingRoute.id) : undefined}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Small UI Bits
// ═══════════════════════════════════════════
function NavBtn({ onClick, children, label }) {
  return (
    <button onClick={onClick} className={label ? s.navBtnLabel : s.navBtnIcon}>
      {children || label}
    </button>
  )
}

function ViewBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={active ? s.viewBtnActive : s.viewBtnInactive}>
      <Icon size={14} /> {label}
    </button>
  )
}

// ═══════════════════════════════════════════
// Event Panel — SlidePanel content for event details
// ═══════════════════════════════════════════
function EventPanel({ event, onEdit, onDelete, onToggleComplete }) {
  const typeInfo = EVENT_TYPES.find((t) => t.value === event.eventType) || EVENT_TYPES[0]

  return (
    <div className={s.panelBody}>
      <div className={s.panelSection}>
        <div className={s.panelRow}>
          <StatusBadge variant={typeInfo.variant || 'gray'}>{typeInfo.label}</StatusBadge>
          {event.completed && <StatusBadge variant="green">Completed</StatusBadge>}
        </div>
      </div>

      <div className={s.panelSection}>
        <div className={s.panelLabel}>Date</div>
        <div className={s.panelValueMono}>{event.eventDate}</div>
      </div>

      {(event.startTime || event.endTime) && (
        <div className={s.panelSection}>
          <div className={s.panelLabel}>Time</div>
          <div className={s.panelValueMono}>
            {event.startTime || '—'}
            {event.endTime ? ` – ${event.endTime}` : ''}
          </div>
        </div>
      )}

      {event.crewName && (
        <div className={s.panelSection}>
          <div className={s.panelLabel}>Crew</div>
          <div className={s.panelValue}>
            <Users size={14} className={s.panelIcon} /> {event.crewName}
          </div>
        </div>
      )}

      {event.accountName && (
        <div className={s.panelSection}>
          <div className={s.panelLabel}>Property</div>
          <div className={s.panelValue}>
            <MapPin size={14} className={s.panelIcon} /> {event.accountName}
          </div>
        </div>
      )}

      {event.notes && (
        <div className={s.panelSection}>
          <div className={s.panelLabel}>Notes</div>
          <div className={s.panelValue}>{event.notes}</div>
        </div>
      )}

      <div className={s.panelActions}>
        <button onClick={onToggleComplete} className={s.panelBtnSecondary}>
          {event.completed ? <Circle size={16} /> : <CheckCircle2 size={16} />}
          {event.completed ? 'Mark Incomplete' : 'Mark Complete'}
        </button>
        <button onClick={onEdit} className={s.panelBtnPrimary}>
          <Edit3 size={16} /> Edit
        </button>
        <button onClick={onDelete} className={s.panelBtnDanger}>
          <Trash2 size={16} /> Delete
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Route Panel — SlidePanel content for route details + stops
// ═══════════════════════════════════════════
function RoutePanel({
  route: routeMeta,
  accounts,
  toast,
  onRefresh: _onRefresh,
  onEdit,
  onClose: _onClose,
}) {
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [dragFrom, setDragFrom] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [editingStop, setEditingStop] = useState(null)

  const load = async () => {
    try {
      setRoute(await getRoute(routeMeta.id))
    } catch {
      toast.show('Failed to load route')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    load()
  }, [routeMeta.id]) // eslint-disable-line react-hooks/exhaustive-deps -- Refetch when route changes; load is stable

  const handleAdd = async (accountId) => {
    try {
      await addRouteStop(routeMeta.id, { accountId })
      toast.show('Added')
      setShowAdd(false)
      load()
    } catch (err) {
      toast.show(err.message || 'Already on route')
    }
  }
  const handleRemove = async (stopId) => {
    try {
      await removeRouteStop(routeMeta.id, stopId)
      toast.show('Removed')
      load()
    } catch {
      toast.show('Failed')
    }
  }
  const handleUpdateStop = async (stopId, data) => {
    try {
      await updateRouteStop(routeMeta.id, stopId, data)
      toast.show('Updated')
      setEditingStop(null)
      load()
    } catch {
      toast.show('Failed')
    }
  }
  const handleDragEnd = async () => {
    if (dragFrom === null || dragOver === null || dragFrom === dragOver || !route?.stops) {
      setDragFrom(null)
      setDragOver(null)
      return
    }
    const stops = [...route.stops]
    const [m] = stops.splice(dragFrom, 1)
    stops.splice(dragOver, 0, m)
    setRoute({ ...route, stops })
    setDragFrom(null)
    setDragOver(null)
    try {
      await reorderRouteStops(
        routeMeta.id,
        stops.map((s) => s.id),
      )
    } catch {
      toast.show('Failed')
      load()
    }
  }

  if (loading)
    return (
      <div className={s.panelLoading}>
        <LoadingSpinner />
      </div>
    )

  const existingIds = new Set((route?.stops || []).map((s) => s.accountId))
  const stops = route?.stops || []

  return (
    <div className={s.panelBody}>
      {/* Route info bar */}
      <div className={s.routePanelHeader}>
        <div
          className={s.routePanelColorBar}
          style={{ background: routeMeta?.color || 'var(--amb)' }}
        />
        <div className={s.routePanelInfo}>
          <div className={s.routePanelDay}>{route?.dayName || 'Unscheduled'}</div>
          {route?.crewName && (
            <div className={s.routePanelCrew}>
              <Users size={13} /> {route.crewName}
            </div>
          )}
          <div className={s.routePanelCount}>
            {stops.length} stop{stops.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={s.panelActions}>
        <button onClick={() => setShowAdd(true)} className={s.panelBtnPrimary}>
          <Plus size={16} /> Add Stop
        </button>
        <button onClick={onEdit} className={s.panelBtnSecondary}>
          <Edit3 size={16} /> Edit Route
        </button>
      </div>

      {/* Stop list */}
      {stops.length === 0 ? (
        <EmptyMessage text="No stops yet." />
      ) : (
        <div className={s.stopList}>
          {stops.map((stop, i) => (
            <div
              key={stop.id}
              draggable
              onDragStart={() => setDragFrom(i)}
              onDragEnter={() => setDragOver(i)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className={`${s.stopItem} ${dragOver === i && dragFrom !== i ? s.stopItemDragOver : ''}`}
              style={{ opacity: dragFrom === i ? 0.5 : 1 }}
            >
              <div className={s.stopDragHandle}>
                <GripVertical size={16} />
              </div>
              <div
                className={s.stopNumber}
                style={{ background: routeMeta?.color || 'var(--amb)' }}
              >
                {i + 1}
              </div>
              <div className={s.stopInfo}>
                <div className={s.stopNameRow}>
                  <span className={s.stopName}>{stop.account.name}</span>
                  {stop.frequency && stop.frequency !== 'weekly' && (
                    <span
                      className={s.stopBadge}
                      style={{
                        background:
                          stop.frequency === 'biweekly'
                            ? '#3B82F610'
                            : stop.frequency === 'monthly'
                              ? '#F59E0B10'
                              : '#7C3AED10',
                        color:
                          stop.frequency === 'biweekly'
                            ? '#3B82F6'
                            : stop.frequency === 'monthly'
                              ? '#F59E0B'
                              : '#7C3AED',
                      }}
                    >
                      {stop.frequency === 'biweekly'
                        ? '2wk'
                        : stop.frequency === 'monthly'
                          ? '4wk'
                          : `${stop.intervalWeeks}wk`}
                    </span>
                  )}
                  {stop.seasonStart && (
                    <span
                      className={s.stopBadge}
                      style={{ background: '#0891B210', color: '#0891B2' }}
                    >
                      Seasonal
                    </span>
                  )}
                  {stop.serviceStatus === 'paused' && (
                    <span
                      className={s.stopBadge}
                      style={{ background: '#F59E0B15', color: '#F59E0B' }}
                    >
                      Paused
                    </span>
                  )}
                </div>
                <div className={s.stopAddress}>
                  {stop.account.address}
                  {stop.account.city && `, ${stop.account.city}`}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingStop(stop)
                }}
                className={s.stopEditBtn}
                title="Edit frequency"
              >
                <Clock size={12} />
                <span className={s.monoTime}>{stop.account.estimatedMinutes || 30}m</span>
              </button>
              <button onClick={() => handleRemove(stop.id)} className={s.stopRemoveBtn}>
                <Trash2 size={13} color="var(--red)" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Stop Modal */}
      {showAdd && (
        <Modal title="Add Stop" onClose={() => setShowAdd(false)}>
          <StopSearch accounts={accounts.filter((a) => !existingIds.has(a.id))} onAdd={handleAdd} />
        </Modal>
      )}

      {/* Stop Frequency Modal */}
      {editingStop && (
        <StopFrequencyModal
          stop={editingStop}
          onClose={() => setEditingStop(null)}
          onSave={(data) => handleUpdateStop(editingStop.id, data)}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Event Modal
// ═══════════════════════════════════════════
function EventModal({ event, crews, accounts, onClose, onSave, onDelete }) {
  const isEdit = !!event.id
  const [title, setTitle] = useState(event.title || '')
  const [notes, setNotes] = useState(event.notes || '')
  const [eventDate, setDate] = useState(event.eventDate || fmtKey(new Date()))
  const [startTime, setStart] = useState(event.startTime || '')
  const [endTime, setEnd] = useState(event.endTime || '')
  const [eventType, setType] = useState(event.eventType || 'task')
  const [color, setColor] = useState(event.color || '#3B82F6')
  const [crewId, setCrewId] = useState(event.crewId ? String(event.crewId) : '')
  const [accountId, setAcct] = useState(event.accountId ? String(event.accountId) : '')
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !eventDate) return
    setSaving(true)
    await onSave({
      title: title.trim(),
      notes: notes || null,
      eventDate,
      startTime: startTime || null,
      endTime: endTime || null,
      eventType,
      color,
      crewId: crewId ? parseInt(crewId) : null,
      accountId: accountId ? parseInt(accountId) : null,
    })
    setSaving(false)
  }

  if (confirmDel)
    return (
      <ConfirmModal
        title={`Delete "${event.title}"?`}
        message="This removes the event."
        onConfirm={onDelete}
        onCancel={() => setConfirmDel(false)}
      />
    )

  return (
    <Modal title={isEdit ? 'Edit Event' : 'Add Event'} onClose={onClose}>
      <FormField
        label="Title *"
        value={title}
        onChange={setTitle}
        autoFocus
        placeholder="e.g. Fertilizer delivery"
      />
      <div className={s.modalGrid3}>
        <FormField label="Date *" value={eventDate} onChange={setDate} type="date" />
        <FormField label="Start" value={startTime} onChange={setStart} type="time" />
        <FormField label="End" value={endTime} onChange={setEnd} type="time" />
      </div>
      <div className={s.modalGrid2}>
        <SelectField
          label="Type"
          value={eventType}
          onChange={(t) => {
            setType(t)
            setColor(EVENT_TYPES.find((e) => e.value === t)?.color || color)
          }}
          options={EVENT_TYPES}
        />
        <SelectField
          label="Crew"
          value={crewId}
          onChange={setCrewId}
          placeholder="None"
          options={crews.map((c) => ({ value: String(c.id), label: c.name }))}
        />
      </div>
      <SelectField
        label="Property"
        value={accountId}
        onChange={setAcct}
        placeholder="None"
        options={accounts.map((a) => ({ value: String(a.id), label: a.name }))}
      />
      <div className={s.colorPickerGroup}>
        <label className={s.colorPickerLabel}>Color</label>
        <div className={s.colorSwatches}>
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={s.colorSwatch}
              style={{
                background: c,
                boxShadow: color === c ? `0 0 0 2px var(--s1), 0 0 0 3px ${c}` : 'none',
              }}
            />
          ))}
        </div>
      </div>
      <TextareaField
        label="Notes"
        value={notes}
        onChange={setNotes}
        placeholder="Optional"
        rows={2}
      />
      <ModalFooter
        onClose={onClose}
        onSave={handleSubmit}
        saving={saving}
        disabled={!title.trim() || !eventDate}
        onDelete={onDelete ? () => setConfirmDel(true) : undefined}
      />
    </Modal>
  )
}

// ═══════════════════════════════════════════
// Route Modal
// ═══════════════════════════════════════════
function RouteModal({ route, crews, onClose, onSave, onDelete }) {
  const isEdit = !!route.id
  const [name, setName] = useState(route.name || '')
  const [crewId, setCrewId] = useState(route.crewId ? String(route.crewId) : '')
  const [dayOfWeek, setDay] = useState(
    route.dayOfWeek !== null && route.dayOfWeek !== undefined ? String(route.dayOfWeek) : '',
  )
  const [color, setColor] = useState(route.color || '#2F6FED')
  const [notes, setNotes] = useState(route.notes || '')
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave({
      name: name.trim(),
      crewId: crewId ? parseInt(crewId) : null,
      dayOfWeek: dayOfWeek !== '' ? parseInt(dayOfWeek) : null,
      color,
      notes: notes || null,
    })
    setSaving(false)
  }

  if (confirmDel)
    return (
      <ConfirmModal
        title={`Remove "${route.name}"?`}
        message="All stops removed."
        onConfirm={onDelete}
        onCancel={() => setConfirmDel(false)}
      />
    )

  return (
    <Modal title={isEdit ? 'Edit Route' : 'Create Route'} onClose={onClose}>
      <FormField label="Route Name *" value={name} onChange={setName} autoFocus />
      <div className={s.modalGrid2Wide}>
        <SelectField
          label="Day"
          value={dayOfWeek}
          onChange={setDay}
          placeholder="Unscheduled"
          options={DAY_NAMES.map((n, i) => ({ value: String(i), label: n }))}
        />
        <SelectField
          label="Crew"
          value={crewId}
          onChange={setCrewId}
          placeholder="None"
          options={crews.map((c) => ({ value: String(c.id), label: c.name }))}
        />
      </div>
      <div className={s.colorPickerGroup}>
        <label className={s.colorPickerLabel}>Color</label>
        <div className={s.colorSwatches}>
          {ROUTE_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={s.colorSwatch}
              style={{
                background: c,
                boxShadow: color === c ? `0 0 0 2px var(--s1), 0 0 0 3px ${c}` : 'none',
              }}
            />
          ))}
        </div>
      </div>
      <FormField label="Notes" value={notes} onChange={setNotes} placeholder="Optional" />
      <ModalFooter
        onClose={onClose}
        onSave={handleSubmit}
        saving={saving}
        disabled={!name.trim()}
        onDelete={onDelete ? () => setConfirmDel(true) : undefined}
      />
    </Modal>
  )
}

// ═══════════════════════════════════════════
// Stop Frequency Modal — Edit recurrence settings
// ═══════════════════════════════════════════
const FREQ_OPTIONS = [
  { value: 'weekly', label: 'Every Week' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Every 4 Weeks' },
  { value: 'custom', label: 'Custom' },
]

function StopFrequencyModal({ stop, onClose, onSave }) {
  const [frequency, setFrequency] = useState(stop.frequency || 'weekly')
  const [intervalWeeks, setInterval] = useState(String(stop.intervalWeeks || 1))
  const [seasonStart, setSeasonStart] = useState(stop.seasonStart || '')
  const [seasonEnd, setSeasonEnd] = useState(stop.seasonEnd || '')
  const [notes, setNotes] = useState(stop.notes || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    setSaving(true)
    const interval =
      frequency === 'weekly'
        ? 1
        : frequency === 'biweekly'
          ? 2
          : frequency === 'monthly'
            ? 4
            : parseInt(intervalWeeks) || 1
    await onSave({
      frequency,
      intervalWeeks: interval,
      seasonStart: seasonStart || null,
      seasonEnd: seasonEnd || null,
      notes: notes || null,
    })
    setSaving(false)
  }

  return (
    <Modal title={`Stop Settings — ${stop.account.name}`} onClose={onClose} size="sm">
      <div className={s.freqGroup}>
        <label className={s.freqLabel}>Frequency</label>
        <div className={s.freqOptions}>
          {FREQ_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFrequency(f.value)}
              className={frequency === f.value ? s.freqBtnActive : s.freqBtnInactive}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {frequency === 'custom' && (
        <FormField
          label="Every X Weeks"
          value={intervalWeeks}
          onChange={(v) => setInterval(v.replace(/\D/g, ''))}
          type="number"
        />
      )}

      <div className={s.seasonalSection}>
        <div className={s.seasonalTitle}>Seasonal (optional)</div>
        <div className={s.modalGrid2}>
          <FormField
            label="Start (MM-DD)"
            value={seasonStart}
            onChange={setSeasonStart}
            placeholder="03-01"
          />
          <FormField
            label="End (MM-DD)"
            value={seasonEnd}
            onChange={setSeasonEnd}
            placeholder="11-30"
          />
        </div>
        {!seasonStart && <div className={s.seasonalHint}>Leave blank for year-round service</div>}
      </div>

      <TextareaField
        label="Stop Notes"
        value={notes}
        onChange={setNotes}
        placeholder="Special instructions for this stop"
        rows={2}
      />
      <ModalFooter onClose={onClose} onSave={handleSubmit} saving={saving} />
    </Modal>
  )
}

// ═══════════════════════════════════════════
// Stop Search
// ═══════════════════════════════════════════
function StopSearch({ accounts, onAdd }) {
  const [q, setQ] = useState('')
  const f = accounts.filter(
    (a) =>
      !q ||
      a.name.toLowerCase().includes(q.toLowerCase()) ||
      (a.address || '').toLowerCase().includes(q.toLowerCase()),
  )
  return (
    <div>
      <div className={s.searchBar}>
        <Search size={16} color="var(--t3)" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          placeholder="Search accounts..."
          className={s.searchInput}
        />
      </div>
      <div className={s.searchResults}>
        {f.length === 0 ? (
          <div className={s.searchEmpty}>No accounts.</div>
        ) : (
          f.map((a) => (
            <button key={a.id} onClick={() => onAdd(a.id)} className={s.searchItem}>
              <MapPin size={16} color="var(--amb)" style={{ flexShrink: 0 }} />
              <div className={s.searchItemInfo}>
                <div className={s.searchItemName}>{a.name}</div>
                <div className={s.searchItemAddress}>
                  {a.address}
                  {a.city && `, ${a.city}`}
                </div>
              </div>
              <Plus size={16} color="var(--amb)" />
            </button>
          ))
        )}
      </div>
    </div>
  )
}

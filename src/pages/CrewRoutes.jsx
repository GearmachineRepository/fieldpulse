// ═══════════════════════════════════════════
// Crew Routes — Daily route runner + work log
// Week tabs → Today's Route (ordered) + Ongoing Work (flat account list)
// ═══════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react'
import { C, cardStyle, labelStyle, inputStyle, btnStyle } from '../config.js'
import { getCrewRoutes, getRouteDay, completeRouteStop, undoCompletion, uploadFieldNotes } from '../lib/api.js'
import LocationLink from '../components/LocationLink.jsx'

const STATUS_OPTIONS = [
  { value: 'complete', label: '✅ Complete', color: C.accent },
  { value: 'in_progress', label: '🔄 In Progress', color: C.amber },
  { value: 'issue', label: '⚠️ Issue', color: C.red },
]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── Local date helpers (avoid UTC off-by-one) ──
function getLocalDate() {
  return new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time
}

function getLocalDow() {
  return new Date().getDay()
}

function getDateForDow(dow) {
  const today = new Date()
  const diff = dow - today.getDay()
  const target = new Date(today)
  target.setDate(today.getDate() + diff)
  return target.toLocaleDateString('en-CA')
}

function formatDateDisplay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

export default function CrewRoutes({ loggedInEmployee, loggedInCrew }) {
  const [allRoutes, setAllRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDow, setSelectedDow] = useState(getLocalDow())

  // Ongoing routes — loaded flat with stops
  const [ongoingStops, setOngoingStops] = useState([])
  const [ongoingLoading, setOngoingLoading] = useState(false)

  const crewId = loggedInCrew?.id
  const employeeName = loggedInEmployee ? `${loggedInEmployee.firstName} ${loggedInEmployee.lastName}` : 'Crew'
  const selectedDate = getDateForDow(selectedDow)
  const isToday = selectedDow === getLocalDow()

  const load = useCallback(async () => {
    if (!crewId) { setLoading(false); return }
    try {
      const routes = await getCrewRoutes(crewId)
      setAllRoutes(routes)

      // Load all ongoing route stops as a flat list
      const ongoing = routes.filter(r => r.dayOfWeek === null && r.stopCount > 0)
      if (ongoing.length > 0) {
        setOngoingLoading(true)
        const allStops = []
        for (const route of ongoing) {
          try {
            const data = await getRouteDay(route.id, getLocalDate())
            if (data.stops) {
              for (const stop of data.stops) {
                allStops.push({ ...stop, routeId: route.id, routeName: route.name, routeColor: route.color })
              }
            }
          } catch {}
        }
        setOngoingStops(allStops)
        setOngoingLoading(false)
      }
    } catch (e) { console.error('Failed to load routes:', e) }
    setLoading(false)
  }, [crewId])

  useEffect(() => { load() }, [load])

  // Reload ongoing stops when needed
  const reloadOngoing = useCallback(async () => {
    const ongoing = allRoutes.filter(r => r.dayOfWeek === null && r.stopCount > 0)
    if (ongoing.length === 0) return
    const allStops = []
    for (const route of ongoing) {
      try {
        const data = await getRouteDay(route.id, getLocalDate())
        if (data.stops) {
          for (const stop of data.stops) {
            allStops.push({ ...stop, routeId: route.id, routeName: route.name, routeColor: route.color })
          }
        }
      } catch {}
    }
    setOngoingStops(allStops)
  }, [allRoutes])

  const scheduledRoutes = allRoutes.filter(r => r.dayOfWeek === selectedDow && r.stopCount > 0)
  const hasOngoing = allRoutes.some(r => r.dayOfWeek === null && r.stopCount > 0)
  const daysWithRoutes = new Set(allRoutes.filter(r => r.dayOfWeek !== null && r.stopCount > 0).map(r => r.dayOfWeek))

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: C.textLight }}>Loading routes...</div>
    </div>
  )

  if (allRoutes.length === 0 || allRoutes.every(r => r.stopCount === 0)) return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🗺️</div>
      <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>No Routes Assigned</div>
      <div style={{ fontSize: 14, color: C.textLight }}>Your admin hasn't assigned any routes to your crew yet.</div>
    </div>
  )

  return (
    <div>
      {/* Week day tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, background: C.card, borderRadius: 14,
        border: `1.5px solid ${C.cardBorder}`, padding: 4, overflow: 'hidden' }}>
        {DAY_LABELS.map((label, dow) => {
          const isSelected = dow === selectedDow
          const hasRoutes = daysWithRoutes.has(dow)
          const isTodayDow = dow === getLocalDow()
          return (
            <div key={dow} tabIndex={0} role="button"
              onClick={() => setSelectedDow(dow)}
              onKeyDown={e => e.key === 'Enter' && setSelectedDow(dow)}
              style={{
                flex: 1, textAlign: 'center', padding: '10px 0', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', borderRadius: 10, position: 'relative',
                color: isSelected ? '#fff' : hasRoutes ? C.text : C.textLight,
                background: isSelected ? C.accent : 'transparent',
                transition: 'all 0.15s',
              }}>
              {label}
              {isTodayDow && !isSelected && (
                <div style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
                  width: 5, height: 5, borderRadius: '50%', background: C.accent }} />
              )}
              {hasRoutes && !isSelected && !isTodayDow && (
                <div style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)',
                  width: 5, height: 5, borderRadius: '50%', background: C.textLight }} />
              )}
            </div>
          )
        })}
      </div>

      {/* Date display */}
      <div style={{ ...cardStyle(), padding: '12px 18px' }}>
        <div style={{ fontSize: 13, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
          {isToday ? 'Today' : DAY_LABELS[selectedDow]} — {formatDateDisplay(selectedDate)}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2 }}>
          {scheduledRoutes.length > 0 ? `${scheduledRoutes.length} route${scheduledRoutes.length !== 1 ? 's' : ''}` : 'No scheduled route'}
          {hasOngoing && ` · ${ongoingStops.length} ongoing`}
        </div>
      </div>

      {/* ── Today's Route (ordered, grouped by route) ── */}
      {scheduledRoutes.length > 0 && (
        <>
          <div style={{ ...labelStyle, marginTop: 16, marginBottom: 10, fontSize: 13 }}>
            {isToday ? "Today's Route" : `${DAY_LABELS[selectedDow]} Route`}
          </div>
          {scheduledRoutes.map(route => (
            <RouteCard key={route.id} route={route} employeeName={employeeName}
              employeeId={loggedInEmployee?.id} workDate={selectedDate} />
          ))}
        </>
      )}

      {scheduledRoutes.length === 0 && (
        <div style={{ ...cardStyle({ marginTop: 12 }), textAlign: 'center', color: C.textLight }}>
          <div style={{ fontSize: 14 }}>No scheduled route for {DAY_LABELS[selectedDow]}</div>
        </div>
      )}

      {/* ── Ongoing Work (flat account list) ── */}
      {hasOngoing && (
        <>
          <div style={{ ...labelStyle, marginTop: 16, marginBottom: 10, fontSize: 13 }}>Ongoing Work</div>
          {ongoingLoading ? (
            <div style={{ textAlign: 'center', padding: 20, color: C.textLight, fontSize: 14 }}>Loading...</div>
          ) : ongoingStops.length === 0 ? (
            <div style={{ ...cardStyle(), textAlign: 'center', color: C.textLight, fontSize: 14 }}>No ongoing accounts assigned</div>
          ) : (
            ongoingStops.map(stop => (
              <StopCard key={`${stop.routeId}-${stop.id}`} stop={stop} index={null} isOrdered={false}
                routeColor={stop.routeColor} routeId={stop.routeId}
                employeeName={employeeName} employeeId={loggedInEmployee?.id}
                workDate={getLocalDate()} onUpdate={reloadOngoing} />
            ))
          )}
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Route Card (for scheduled/ordered routes — expandable)
// ═══════════════════════════════════════════
function RouteCard({ route, employeeName, employeeId, workDate }) {
  const [expanded, setExpanded] = useState(false)
  const [routeData, setRouteData] = useState(null)
  const [loadingStops, setLoadingStops] = useState(false)

  const loadStops = useCallback(async () => {
    setLoadingStops(true)
    try { setRouteData(await getRouteDay(route.id, workDate)) } catch (e) { console.error(e) }
    setLoadingStops(false)
  }, [route.id, workDate])

  useEffect(() => { if (expanded) loadStops() }, [workDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleExpand = () => {
    if (!expanded) loadStops()
    setExpanded(!expanded)
  }

  const completedCount = routeData?.progress?.completed || 0
  const totalCount = routeData?.progress?.total || route.stopCount
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div style={{ marginBottom: 12 }}>
      <div tabIndex={0} role="button" onClick={handleExpand} onKeyDown={e => e.key === 'Enter' && handleExpand()}
        style={{ ...cardStyle({ marginBottom: 0, cursor: 'pointer' }),
          borderRadius: expanded ? '16px 16px 0 0' : 16, borderLeft: `4px solid ${route.color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{route.name}</div>
            <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>
              {route.stopCount} stop{route.stopCount !== 1 ? 's' : ''}
              {route.totalMinutes > 0 && ` · ~${Math.round(route.totalMinutes / 60 * 10) / 10}h`}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {routeData && <div style={{ fontSize: 14, fontWeight: 800, color: pct === 100 ? C.accent : C.textMed }}>{completedCount}/{totalCount}</div>}
            <div style={{ fontSize: 18 }}>{expanded ? '▲' : '▼'}</div>
          </div>
        </div>
        {routeData && (
          <div style={{ height: 6, borderRadius: 3, background: '#E8E6E0', marginTop: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, background: pct === 100 ? C.accent : route.color,
              width: `${pct}%`, transition: 'width 0.3s' }} />
          </div>
        )}
      </div>

      {expanded && (
        <div style={{ background: '#FAFAF7', border: `1.5px solid ${C.cardBorder}`, borderTop: 'none',
          borderRadius: '0 0 16px 16px', padding: '12px 14px' }}>
          {loadingStops ? (
            <div style={{ textAlign: 'center', padding: 20, color: C.textLight, fontSize: 14 }}>Loading stops...</div>
          ) : !routeData?.stops?.length ? (
            <div style={{ textAlign: 'center', padding: 20, color: C.textLight, fontSize: 14 }}>No stops on this route</div>
          ) : (
            routeData.stops.map((stop, index) => (
              <StopCard key={stop.id} stop={stop} index={index} isOrdered={true}
                routeColor={route.color} routeId={route.id}
                employeeName={employeeName} employeeId={employeeId}
                workDate={workDate} onUpdate={loadStops} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Stop Card
// ═══════════════════════════════════════════
function StopCard({ stop, index, isOrdered, routeColor, routeId, employeeName, employeeId, workDate, onUpdate }) {
  const [showModal, setShowModal] = useState(false)
  const isDone = !!stop.completion
  const statusInfo = STATUS_OPTIONS.find(s => s.value === (stop.completion?.status || 'complete'))

  const handleUndo = async () => {
    if (!stop.completion?.id) return
    try { await undoCompletion(stop.completion.id); await onUpdate() }
    catch (e) { console.error('Undo failed:', e) }
  }

  const addr = stop.account
  const fullAddress = [addr.address, addr.city, addr.state].filter(Boolean).join(', ')

  return (
    <>
      <div style={{ padding: '12px 14px', borderRadius: 12, background: isDone ? '#F0FAF0' : C.card,
        border: `1.5px solid ${isDone ? C.accentBorder : C.cardBorder}`, marginBottom: 8, transition: 'all 0.2s' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          {/* Number / status icon */}
          <div style={{ minWidth: 32, textAlign: 'center', paddingTop: 2 }}>
            {isDone ? (
              <div style={{ width: 28, height: 28, borderRadius: 14, background: statusInfo?.color || C.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>
                  {stop.completion.status === 'complete' ? '✓' : stop.completion.status === 'in_progress' ? '⟳' : '!'}
                </span>
              </div>
            ) : isOrdered && index !== null ? (
              <div style={{ width: 28, height: 28, borderRadius: 14, background: routeColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>{index + 1}</span>
              </div>
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: 14, border: `2px solid ${C.cardBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: C.textLight, fontSize: 14 }}>○</span>
              </div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800,
              textDecoration: isDone && stop.completion.status === 'complete' ? 'line-through' : 'none',
              color: isDone && stop.completion.status === 'complete' ? C.textLight : C.text }}>{addr.name}</div>
            <div style={{ marginTop: 4 }}><LocationLink location={fullAddress} compact /></div>
            {addr.contactName && (
              <div style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>
                📞 {addr.contactName}{addr.contactPhone ? ` · ${addr.contactPhone}` : ''}
              </div>
            )}
            {stop.notes && <div style={{ fontSize: 12, color: C.amber, marginTop: 4, fontWeight: 600 }}>📝 {stop.notes}</div>}

            {isDone && (
              <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.7)',
                border: `1px solid ${C.accentBorder}`, fontSize: 12, color: C.textMed }}>
                <span style={{ fontWeight: 700 }}>{statusInfo?.label}</span>
                {stop.completion.timeSpentMinutes > 0 && <span> · {formatTime(stop.completion.timeSpentMinutes)}</span>}
                {stop.completion.notes && <div style={{ marginTop: 4, fontStyle: 'italic' }}>{stop.completion.notes}</div>}
                {stop.completion.fieldNotes?.length > 0 && (
                  <div style={{ marginTop: 4 }}>📷 {stop.completion.fieldNotes.length} photo{stop.completion.fieldNotes.length !== 1 ? 's' : ''}</div>
                )}
                <div style={{ marginTop: 4, color: C.textLight }}>
                  by {stop.completion.completedByName} · {new Date(stop.completion.completedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, marginLeft: 42 }}>
          {!isDone ? (
            <button tabIndex={0} onClick={() => setShowModal(true)}
              style={{ ...btnStyle(routeColor, '#fff', { flex: 1, fontSize: 14, padding: '12px' }) }}>
              {isOrdered ? '✓ Complete' : '📋 Log Work'}
            </button>
          ) : (
            <button tabIndex={0} onClick={handleUndo}
              style={{ fontSize: 13, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
                background: '#fff', color: C.textLight, border: `1px solid ${C.cardBorder}` }}>
              ↩ Undo
            </button>
          )}
        </div>
      </div>

      {/* Completion modal */}
      {showModal && (
        <CompletionModal
          stop={stop} routeId={routeId} routeColor={routeColor}
          employeeName={employeeName} employeeId={employeeId}
          workDate={workDate} isOrdered={isOrdered}
          onClose={() => setShowModal(false)} onComplete={onUpdate}
        />
      )}
    </>
  )
}

// ═══════════════════════════════════════════
// Completion Modal
// ═══════════════════════════════════════════
function CompletionModal({ stop, routeId, routeColor, employeeName, employeeId, workDate, isOrdered, onClose, onComplete }) {
  const [status, setStatus] = useState('complete')
  const [notes, setNotes] = useState('')
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [photos, setPhotos] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef(null)
  const modalRef = useRef(null)

  // Focus trap + escape to close
  useEffect(() => {
    const modal = modalRef.current
    if (!modal) return
    const focusable = modal.querySelectorAll('button, input, textarea, select, [tabindex]:not([tabindex="-1"])')
    if (focusable.length) focusable[0].focus()
    const handleKey = (e) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const curr = modal.querySelectorAll('button, input, textarea, select, [tabindex]:not([tabindex="-1"])')
      if (curr.length === 0) return
      const first = curr[0], last = curr[curr.length - 1]
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus() } }
      else { if (document.activeElement === last) { e.preventDefault(); first.focus() } }
    }
    modal.addEventListener('keydown', handleKey)
    return () => modal.removeEventListener('keydown', handleKey)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Capture GPS silently
      let lat = null, lng = null
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: true })
        })
        lat = pos.coords.latitude; lng = pos.coords.longitude
      } catch { /* GPS unavailable */ }

      const timeSpent = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0)

      const result = await completeRouteStop({
        routeStopId: stop.id, routeId,
        completedById: employeeId, completedByName: employeeName,
        status, notes: notes.trim() || null,
        latitude: lat, longitude: lng,
        timeSpentMinutes: timeSpent > 0 ? timeSpent : null,
        workDate,
      })

      if (photos.length > 0 && result.id) {
        try { await uploadFieldNotes(result.id, photos) } catch (e) { console.error('Photo upload failed:', e) }
      }

      onClose()
      await onComplete()
    } catch (e) { console.error('Completion failed:', e) }
    setSubmitting(false)
  }

  const handlePhotoAdd = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) setPhotos(prev => [...prev, ...files])
  }

  const addr = stop.account

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={modalRef} style={{ background: C.card, borderRadius: 20, padding: 24, width: '100%', maxWidth: 440,
        maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 900 }}>{isOrdered ? 'Complete Stop' : 'Log Work'}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: routeColor, marginTop: 6 }}>{addr.name}</div>
          <div style={{ fontSize: 13, color: C.textMed, marginTop: 2 }}>
            {[addr.address, addr.city, addr.state].filter(Boolean).join(', ')}
          </div>
        </div>

        {/* Status */}
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Status</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            {STATUS_OPTIONS.map(opt => (
              <button key={opt.value} tabIndex={0} onClick={() => setStatus(opt.value)}
                style={{ flex: 1, padding: '12px 8px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', border: status === opt.value ? `2px solid ${opt.color}` : `2px solid ${C.cardBorder}`,
                  background: status === opt.value ? `${opt.color}15` : '#fff', color: status === opt.value ? opt.color : C.textMed }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time spent */}
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Time Spent</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6 }}>
            <input value={hours} onChange={e => setHours(e.target.value.replace(/\D/g, ''))}
              placeholder="0" inputMode="numeric" maxLength={2}
              style={inputStyle({ width: 60, textAlign: 'center', padding: '12px 8px', fontSize: 18, fontWeight: 700 })} />
            <span style={{ fontSize: 14, fontWeight: 700, color: C.textLight }}>hrs</span>
            <input value={minutes} onChange={e => setMinutes(e.target.value.replace(/\D/g, ''))}
              placeholder="0" inputMode="numeric" maxLength={2}
              style={inputStyle({ width: 60, textAlign: 'center', padding: '12px 8px', fontSize: 18, fontWeight: 700 })} />
            <span style={{ fontSize: 14, fontWeight: 700, color: C.textLight }}>min</span>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>Notes</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="What did you do?" rows={3}
            style={inputStyle({ resize: 'vertical', minHeight: 80, marginTop: 6 })} />
        </div>

        {/* Photos */}
        <div style={{ marginBottom: 20 }}>
          <div style={labelStyle}>Photos</div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" multiple
            onChange={handlePhotoAdd} style={{ display: 'none' }} />
          <button tabIndex={0} onClick={() => fileRef.current?.click()}
            style={{ fontSize: 14, padding: '12px 16px', borderRadius: 10, cursor: 'pointer', fontWeight: 700,
              background: C.blueLight, color: C.blue, border: `1px solid ${C.blueBorder}`, width: '100%', marginTop: 6 }}>
            📷 {photos.length > 0 ? `${photos.length} photo${photos.length !== 1 ? 's' : ''} added — tap to add more` : 'Take or Add Photos'}
          </button>
          {photos.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={URL.createObjectURL(p)} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover' }} />
                  <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11,
                      background: C.red, color: '#fff', fontSize: 12, fontWeight: 800, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button tabIndex={0} onClick={onClose}
            style={{ ...btnStyle('#eee', C.text, { width: 'auto', padding: '14px 22px', boxShadow: 'none' }) }}>
            Cancel
          </button>
          <button tabIndex={0} onClick={handleSubmit} disabled={submitting}
            style={{ ...btnStyle(C.accent, '#fff', { flex: 1, padding: '14px', opacity: submitting ? 0.6 : 1 }) }}>
            {submitting ? 'Saving...' : '✓ Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

function formatTime(mins) {
  if (!mins) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}
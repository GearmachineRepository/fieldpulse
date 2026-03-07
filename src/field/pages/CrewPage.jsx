// ═══════════════════════════════════════════
// Crew Page — Daily clock-in
// ═══════════════════════════════════════════

import { useState, useEffect } from 'react'
import { C, cardStyle, labelStyle, btnStyle, inputStyle } from '@/config/index.js'
import { submitRoster, getTodayRoster } from '@/lib/api/index.js'

export default function CrewPage({ employees, crews, loggedInEmployee, loggedInCrew, vehicle, showToast }) {
  const crewObj = loggedInCrew ? crews.find(c => c.name === loggedInCrew.name) : crews.find(c => c.name === vehicle?.crewName)
  const crewMembers = crewObj ? employees.filter(e => e.default_crew_id === crewObj.id) : []
  const otherEmployees = crewObj ? employees.filter(e => e.default_crew_id !== crewObj.id) : employees

  const [todayRoster, setTodayRoster]       = useState(null)
  const [loading, setLoading]               = useState(true)
  const [editing, setEditing]               = useState(false)
  const [selected, setSelected]             = useState([])
  const [notes, setNotes]                   = useState('')
  const [submitting, setSubmitting]         = useState(false)
  const [showOtherCrews, setShowOtherCrews] = useState(false)

  const loadRoster = async () => {
    try {
      const roster = await getTodayRoster(crewObj?.id)
      setTodayRoster(roster)
      if (roster) {
        setSelected(roster.members.map(m => ({
          id: m.employeeId, name: m.name,
          isGuest: !crewMembers.find(e => e.id === m.employeeId),
        })))
        setNotes(roster.notes || '')
      } else {
        setSelected(crewMembers.map(e => ({ id: e.id, name: `${e.first_name} ${e.last_name}`, isGuest: false })))
        setNotes('')
      }
    } catch {
      setSelected(crewMembers.map(e => ({ id: e.id, name: `${e.first_name} ${e.last_name}`, isGuest: false })))
      setNotes('')
    }
    setLoading(false)
  }

  useEffect(() => { loadRoster() }, [])

  const toggleMember = (emp, isGuest = false) => {
    const exists = selected.find(m => m.id === emp.id)
    if (exists) setSelected(selected.filter(m => m.id !== emp.id))
    else setSelected([...selected, { id: emp.id, name: `${emp.first_name} ${emp.last_name}`, isGuest }])
  }

  const handleSubmit = async () => {
    if (selected.length === 0) return
    setSubmitting(true)
    try {
      await submitRoster({
        crewId: crewObj?.id || null,
        crewName: crewObj?.name || loggedInCrew?.name || vehicle?.crewName || '—',
        submittedById: loggedInEmployee?.id || null,
        submittedByName: loggedInEmployee
          ? `${loggedInEmployee.firstName} ${loggedInEmployee.lastName}`
          : 'Unknown',
        members: selected.map(m => ({ id: m.id, name: m.name, present: true })),
        notes: notes || null,
      })
      await loadRoster()
      setEditing(false)
      setShowOtherCrews(false)
      if (showToast) showToast('Clock-in submitted ✓')
    } catch {
      if (showToast) showToast('Failed to submit')
    }
    setSubmitting(false)
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const showForm = !todayRoster || editing
  const guests = selected.filter(m => m.isGuest)

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: C.textLight, fontSize: 16 }}>Loading...</div>
  )

  if (crewMembers.length === 0) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>👷</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: C.text, marginBottom: 8 }}>No Crew Members</div>
      <div style={{ fontSize: 14, color: C.textLight }}>
        Ask your admin to assign employees to {crewObj?.name || 'your crew'}.
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: C.textLight, fontWeight: 600 }}>{today}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginTop: 2 }}>
          {crewObj?.name || 'My Crew'} — Clock In
        </div>
      </div>

      {/* Clocked-in banner */}
      {todayRoster && !editing && (
        <div style={{ ...cardStyle(), background: C.accentLight, borderColor: C.accentBorder, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: C.accent }}>Crew Clocked In ✓</div>
              <div style={{ fontSize: 13, color: C.textMed, marginTop: 2 }}>
                {selected.length} member{selected.length !== 1 ? 's' : ''} today
                {guests.length > 0 ? ` · ${guests.length} fill-in${guests.length !== 1 ? 's' : ''}` : ''}
              </div>
            </div>
            <button tabIndex={0} onClick={() => setEditing(true)}
              style={{ ...btnStyle(C.blue, '#fff', { width: 'auto', padding: '10px 18px', fontSize: 13 }) }}>
              ✏️ Edit
            </button>
          </div>
        </div>
      )}

      {/* Clock-in form */}
      {showForm && (
        <div style={{ ...cardStyle(), borderColor: C.blueBorder }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.blue, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 2 }}>
            {todayRoster ? 'Update Clock-In' : "Who's Clocking In Today?"}
          </div>
          <div style={{ fontSize: 13, color: C.textLight, marginBottom: 16 }}>
            Uncheck anyone not with you. Add fill-ins from other crews below.
          </div>

          {/* Default crew members */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {crewMembers.map(emp => {
              const isSelected = !!selected.find(m => m.id === emp.id)
              return (
                <div key={emp.id} tabIndex={0} role="button"
                  onClick={() => toggleMember(emp)}
                  onKeyDown={e => e.key === 'Enter' && toggleMember(emp)}
                  style={{
                    padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                    // outline: 'none' removed — :focus-visible ring handled in global.css
                    background: isSelected ? C.blueLight : C.card,
                    border: `1.5px solid ${isSelected ? C.blueBorder : C.cardBorder}`,
                    display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s',
                  }}>
                  {emp.photo_filename ? (
                    <img src={`/uploads/${emp.photo_filename}`} alt=""
                      style={{ width: 36, height: 36, borderRadius: 18, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 800, background: isSelected ? C.blue : '#bbb' }}>
                      {emp.first_name[0]}{emp.last_name[0]}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{emp.first_name} {emp.last_name}</div>
                    {emp.license_number && <div style={{ fontSize: 11, color: C.textLight }}>{emp.license_number}</div>}
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${isSelected ? C.blue : C.cardBorder}`, background: isSelected ? C.blue : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isSelected && <span style={{ color: '#fff', fontSize: 13, fontWeight: 900 }}>✓</span>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Fill-ins from other crews */}
          {showOtherCrews ? (
            <div style={{ marginBottom: 14 }}>
              <div style={{ ...labelStyle, marginBottom: 8 }}>Add Fill-In</div>
              {otherEmployees.map(emp => {
                const isSelected = !!selected.find(m => m.id === emp.id)
                const empCrew = crews.find(c => c.id === emp.default_crew_id)
                return (
                  <div key={emp.id} tabIndex={0} role="button"
                    onClick={() => toggleMember(emp, true)}
                    onKeyDown={e => e.key === 'Enter' && toggleMember(emp, true)}
                    style={{
                      padding: '10px 14px', borderRadius: 12, cursor: 'pointer', marginBottom: 6,
                      // outline: 'none' removed — :focus-visible ring handled in global.css
                      background: isSelected ? C.blueLight : C.card,
                      border: `1.5px solid ${isSelected ? C.blueBorder : C.cardBorder}`,
                      display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.15s',
                    }}>
                    {emp.photo_filename ? (
                      <img src={`/uploads/${emp.photo_filename}`} alt=""
                        style={{ width: 36, height: 36, borderRadius: 18, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 800, background: isSelected ? C.blue : '#bbb' }}>
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{emp.first_name} {emp.last_name}</div>
                      {empCrew && <div style={{ fontSize: 11, color: C.textLight }}>Default: {empCrew.name}</div>}
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${isSelected ? C.blue : C.cardBorder}`, background: isSelected ? C.blue : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isSelected && <span style={{ color: '#fff', fontSize: 13, fontWeight: 900 }}>✓</span>}
                    </div>
                  </div>
                )
              })}
              <button tabIndex={0} onClick={() => setShowOtherCrews(false)}
                style={{ ...btnStyle('#eee', C.text, { fontSize: 13, marginTop: 8, boxShadow: 'none' }) }}>
                Done
              </button>
            </div>
          ) : (
            // outline: 'none' removed — :focus-visible ring handled in global.css
            <div tabIndex={0} role="button"
              onClick={() => setShowOtherCrews(true)}
              onKeyDown={e => e.key === 'Enter' && setShowOtherCrews(true)}
              style={{ padding: 14, borderRadius: 14, border: `2px dashed ${C.blueBorder}`, textAlign: 'center', cursor: 'pointer', fontSize: 14, color: C.blue, fontWeight: 700, background: C.blueLight, marginBottom: 14 }}>
              + Add Fill-In From Another Crew
            </div>
          )}

          {/* Notes */}
          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Notes (optional)</div>
            <input
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder='e.g. Jake covering from Crew B for the week'
              style={inputStyle({ fontSize: 14 })}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {editing && (
              <button tabIndex={0} onClick={() => { setEditing(false); setShowOtherCrews(false); loadRoster() }}
                style={{ ...btnStyle('#eee', C.text, { flex: 1, fontSize: 14, boxShadow: 'none' }) }}>
                Cancel
              </button>
            )}
            <button tabIndex={0} onClick={handleSubmit}
              disabled={submitting || selected.length === 0}
              style={{ ...btnStyle(C.accent, '#fff', { flex: 2, fontSize: 16, opacity: selected.length === 0 ? 0.5 : 1 }) }}>
              {submitting ? 'Clocking In...' : todayRoster ? `Update Clock-In (${selected.length})` : `Clock In (${selected.length})`}
            </button>
          </div>
        </div>
      )}

      {/* Confirmed clock-in view */}
      {todayRoster && !editing && (
        <div style={cardStyle()}>
          <div style={{ ...labelStyle, marginBottom: 10 }}>Clocked In Today</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {selected.map(m => {
              const emp = employees.find(e => e.id === m.id)
              const guestCrew = m.isGuest && emp ? crews.find(c => c.id === emp.default_crew_id)?.name : null
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: '#FAFAF7', border: `1px solid ${C.cardBorder}` }}>
                  {emp?.photo_filename ? (
                    <img src={`/uploads/${emp.photo_filename}`} alt=""
                      style={{ width: 36, height: 36, borderRadius: 18, objectFit: 'cover', border: `2px solid ${C.cardBorder}` }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: 18, background: m.isGuest ? C.blue : C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', fontWeight: 800 }}>
                      {m.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{m.name}</div>
                    {emp?.license_number && <div style={{ fontSize: 12, color: C.textLight }}>{emp.license_number}</div>}
                  </div>
                  {m.isGuest && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: C.blueLight, color: C.blue }}>
                      {guestCrew ? `From ${guestCrew}` : 'Fill-in'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          {todayRoster.notes && (
            <div style={{ fontSize: 13, color: C.textMed, marginTop: 10, padding: '8px 12px', borderRadius: 8, background: '#FAFAF7' }}>
              {todayRoster.notes}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
// ═══════════════════════════════════════════
// Admin Home — Dashboard with clickable cards
// ═══════════════════════════════════════════

import { useState, useEffect } from 'react'
import { C, cardStyle, labelStyle } from '../../config.js'
import { getAttendanceToday } from '../../lib/api.js'

export default function AdminHome({ crews, employees, onNav }) {
  const [attendance, setAttendance] = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [statDetail, setStatDetail] = useState(null) // 'working' | 'unrostered' | 'rosters' | null
  const today = new Date()
  const h = today.getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    getAttendanceToday()
      .then(setAttendance)
      .catch(() => setAttendance({ crews: [], unrostered: [], totalWorking: 0, totalEmployees: 0 }))
  }, [])

  // Alerts
  const alerts = []
  const currentMonth = today.getMonth() + 1
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const prevMonthName = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][prevMonth]
  if (today.getDate() <= 10) {
    alerts.push({ type: 'warning', icon: '📊', title: 'PUR Report Due', desc: `${prevMonthName} report due by the 10th`, action: () => onNav('admin-spraylogs') })
  }
  const empsNoPIN = employees.filter(e => e.is_crew_lead && !e.has_pin)
  if (empsNoPIN.length > 0) {
    alerts.push({ type: 'warning', icon: '🔑', title: `${empsNoPIN.length} Crew Lead${empsNoPIN.length > 1 ? 's' : ''} Missing PIN`, desc: "Can't sign in without a PIN", action: () => onNav('admin-team') })
  }

  const rostersSubmitted = attendance ? attendance.crews.filter(c => c.submitted).length : 0
  const totalCrews = attendance ? attendance.crews.length : 0

  // Build working employees list from attendance
  const workingEmployees = attendance ? attendance.crews.filter(c => c.submitted).flatMap(c =>
    c.members.map(name => ({ name, crew: c.crewName }))
  ) : []

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: C.textLight, fontWeight: 600 }}>
          {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.text, marginTop: 2 }}>{greeting}</div>
      </div>

      {/* Alerts — now clickable */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {alerts.map((a, i) => (
            <div key={i} tabIndex={0} role="button" onClick={a.action}
              onKeyDown={e => e.key === 'Enter' && a.action?.()}
              style={{ ...cardStyle({ marginBottom: 8, cursor: a.action ? 'pointer' : 'default' }),
                background: a.type === 'warning' ? C.amberLight : C.blueLight,
                borderColor: a.type === 'warning' ? C.amberBorder : C.blueBorder,
                transition: 'border-color 0.15s' }}
              onMouseEnter={e => a.action && (e.currentTarget.style.borderColor = C.accent)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = a.type === 'warning' ? C.amberBorder : C.blueBorder)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: a.type === 'warning' ? C.amber : C.blue }}>{a.title}</div>
                  <div style={{ fontSize: 13, color: C.textMed }}>{a.desc}</div>
                </div>
                {a.action && <div style={{ fontSize: 13, color: C.textLight, fontWeight: 600 }}>→</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Clickable Attendance Stats ── */}
      {attendance && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
          {/* Working */}
          <div tabIndex={0} role="button"
            onClick={() => setStatDetail(statDetail === 'working' ? null : 'working')}
            onKeyDown={e => e.key === 'Enter' && setStatDetail(statDetail === 'working' ? null : 'working')}
            style={{ ...cardStyle({ textAlign: 'center', padding: '16px 12px', cursor: 'pointer', marginBottom: 0 }),
              borderColor: statDetail === 'working' ? C.accent : C.cardBorder,
              transition: 'border-color 0.15s' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: C.accent, lineHeight: 1 }}>{attendance.totalWorking}</div>
            <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 }}>Working</div>
          </div>
          {/* Unrostered */}
          <div tabIndex={0} role="button"
            onClick={() => setStatDetail(statDetail === 'unrostered' ? null : 'unrostered')}
            onKeyDown={e => e.key === 'Enter' && setStatDetail(statDetail === 'unrostered' ? null : 'unrostered')}
            style={{ ...cardStyle({ textAlign: 'center', padding: '16px 12px', cursor: 'pointer', marginBottom: 0 }),
              borderColor: statDetail === 'unrostered' ? C.amber : C.cardBorder,
              transition: 'border-color 0.15s' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: attendance.unrostered.length > 0 ? C.amber : C.textLight, lineHeight: 1 }}>{attendance.unrostered.length}</div>
            <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 }}>Unrostered</div>
          </div>
          {/* Rosters In */}
          <div tabIndex={0} role="button"
            onClick={() => setStatDetail(statDetail === 'rosters' ? null : 'rosters')}
            onKeyDown={e => e.key === 'Enter' && setStatDetail(statDetail === 'rosters' ? null : 'rosters')}
            style={{ ...cardStyle({ textAlign: 'center', padding: '16px 12px', cursor: 'pointer', marginBottom: 0 }),
              borderColor: statDetail === 'rosters' ? C.blue : C.cardBorder,
              transition: 'border-color 0.15s' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: rostersSubmitted === totalCrews && totalCrews > 0 ? C.accent : C.amber, lineHeight: 1 }}>{rostersSubmitted}/{totalCrews}</div>
            <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 }}>Rosters In</div>
          </div>
        </div>
      )}

      {/* ── Stat Detail Panel ── */}
      {statDetail === 'working' && attendance && (
        <div style={{ ...cardStyle({ marginBottom: 14 }), borderColor: C.accentBorder, background: C.accentLight }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.accent, marginBottom: 10 }}>
            Currently Working ({workingEmployees.length})
          </div>
          {workingEmployees.length === 0 ? (
            <div style={{ fontSize: 13, color: C.textMed }}>No employees rostered today yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {attendance.crews.filter(c => c.submitted).map(crew => (
                <div key={crew.crewId}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, marginTop: 4 }}>
                    {crew.crewName}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {crew.members.map((name, i) => (
                      <span key={i} style={{ padding: '5px 10px', borderRadius: 8, background: '#fff', border: `1px solid ${C.accentBorder}`, fontSize: 13, fontWeight: 600, color: C.text }}>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {statDetail === 'unrostered' && attendance && (
        <div style={{ ...cardStyle({ marginBottom: 14 }), borderColor: C.amberBorder, background: C.amberLight }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.amber, marginBottom: 10 }}>
            Not on Any Roster Today ({attendance.unrostered.length})
          </div>
          {attendance.unrostered.length === 0 ? (
            <div style={{ fontSize: 13, color: C.textMed }}>Everyone is rostered — nice!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {attendance.unrostered.map((emp, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: '#fff', border: `1px solid ${C.amberBorder}` }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{emp.name}</div>
                    <div style={{ fontSize: 12, color: C.textLight }}>
                      {emp.defaultCrew ? `Usually on ${emp.defaultCrew}` : 'No default crew'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {statDetail === 'rosters' && attendance && (
        <div style={{ ...cardStyle({ marginBottom: 14 }), borderColor: C.blueBorder, background: C.blueLight }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.blue, marginBottom: 10 }}>
            Roster Status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {attendance.crews.map(crew => (
              <div key={crew.crewId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: '#fff', border: `1px solid ${crew.submitted ? C.accentBorder : C.amberBorder}` }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{crew.crewName}</div>
                  <div style={{ fontSize: 12, color: C.textLight }}>
                    {crew.submitted ? `${crew.memberCount} member${crew.memberCount !== 1 ? 's' : ''} · by ${crew.submittedBy}` : 'Not submitted'}
                  </div>
                </div>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 700,
                  background: crew.submitted ? C.accentLight : C.amberLight,
                  color: crew.submitted ? C.accent : C.amber }}>
                  {crew.submitted ? '✓ In' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Crew Cards (always visible) ── */}
      <div style={{ ...labelStyle, marginBottom: 10 }}>Today's Crews</div>
      {!attendance ? (
        <div style={{ textAlign: 'center', padding: 24, color: C.textLight }}>Loading...</div>
      ) : attendance.crews.length === 0 ? (
        <div style={{ ...cardStyle(), textAlign: 'center', padding: 24 }}>
          <div style={{ fontSize: 14, color: C.textLight }}>No crews set up yet.</div>
        </div>
      ) : attendance.crews.map(crew => (
        <div key={crew.crewId} style={{ marginBottom: 8 }}>
          <div tabIndex={0} role="button"
            onClick={() => crew.submitted && setExpanded(expanded === crew.crewId ? null : crew.crewId)}
            onKeyDown={e => e.key === 'Enter' && crew.submitted && setExpanded(expanded === crew.crewId ? null : crew.crewId)}
            style={{
              ...cardStyle({ marginBottom: 0, cursor: crew.submitted ? 'pointer' : 'default' }),
              borderRadius: expanded === crew.crewId ? '16px 16px 0 0' : 16,
              borderColor: !crew.submitted ? C.amberBorder : C.accentBorder,
              background: !crew.submitted ? C.amberLight : C.card,
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{crew.crewName}</div>
                <div style={{ fontSize: 13, color: C.textMed, marginTop: 2 }}>
                  {crew.submitted
                    ? `${crew.memberCount} member${crew.memberCount !== 1 ? 's' : ''} · by ${crew.submittedBy}`
                    : 'No roster submitted yet'}
                </div>
              </div>
              {crew.submitted
                ? <div style={{ fontSize: 13, color: C.accent, fontWeight: 700 }}>{expanded === crew.crewId ? '▲' : '▼'}</div>
                : <div style={{ fontSize: 13, color: C.amber, fontWeight: 700 }}>Pending</div>}
            </div>
          </div>
          {expanded === crew.crewId && crew.submitted && (
            <div style={{ background: '#FAFAF7', border: `1.5px solid ${C.accentBorder}`, borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '12px 16px' }}>
              {crew.members.map((name, i) => (
                <div key={i} style={{ fontSize: 14, color: C.text, padding: '4px 0', fontWeight: 600 }}>
                  {name}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Quick links */}
      <div style={{ ...cardStyle(), marginTop: 14 }}>
        <div style={labelStyle}>Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          {[
            { k: 'admin-spraylogs', icon: '📋', label: 'Spray Logs' },
            { k: 'admin-rosters', icon: '👷', label: 'Crew Rosters' },
            { k: 'admin-team', icon: '👥', label: 'Team' },
            { k: 'admin-inventory', icon: '🧪', label: 'Inventory' },
            { k: 'admin-vehicles', icon: '🚛', label: 'Fleet' },
          ].map(link => (
            <div key={link.k} tabIndex={0} role="button"
              onClick={() => onNav(link.k)}
              onKeyDown={e => e.key === 'Enter' && onNav(link.k)}
              style={{ padding: '14px 16px', borderRadius: 12, background: '#FAFAF7', border: `1.5px solid ${C.cardBorder}`, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10, transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.cardBorder}>
              <span style={{ fontSize: 20 }}>{link.icon}</span>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{link.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
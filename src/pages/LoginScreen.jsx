// ═══════════════════════════════════════════
// Login Screen — Crew + Admin login flows
// ═══════════════════════════════════════════

import { useState, useEffect } from 'react'
import { APP, C, FONT, cardStyle, inputStyle, btnStyle, labelStyle } from '../config.js'
import { checkHealth, getAdminsList, getCrewLoginTiles, crewLogin, verifyAdminPin } from '../lib/api.js'
import styles from './LoginScreen.module.css'

export default function LoginScreen({ onCrewLogin, onAdminLogin }) {
  const [mode, setMode] = useState('crew')
  const [admins, setAdmins] = useState([])
  const [crewTiles, setCrewTiles] = useState(null)
  const [selectedCrew, setSelectedCrew] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selected, setSelected] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dbOk, setDbOk] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        await checkHealth()
        setDbOk(true)
        const [a, tiles] = await Promise.all([getAdminsList(), getCrewLoginTiles()])
        setAdmins(a)
        setCrewTiles(tiles)
      } catch {
        setDbOk(false)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleSubmit = async () => {
    setError(null)
    try {
      if (mode === 'crew') {
        if (!selectedEmployee || !pin) return
        onCrewLogin(await crewLogin(selectedEmployee.id, pin))
      } else {
        if (!selected || !pin) return
        onAdminLogin(await verifyAdminPin(selected, pin))
      }
    } catch {
      setError('Invalid PIN — try again')
      setPin('')
    }
  }

  const resetCrewFlow = () => {
    setSelectedCrew(null)
    setSelectedEmployee(null)
    setPin('')
    setError(null)
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className={styles.loading} style={{ fontFamily: FONT }}>
        <div className={styles.loadingInner}>
          <div className={styles.loadingIcon}>💧</div>
          <div className={styles.loadingText}>Loading {APP.name}...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrapper} style={{ fontFamily: FONT }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* ── Brand ── */}
        <div className={styles.brand}>
          <div className={styles.brandName}>{APP.name}</div>
          <div className={styles.brandTagline}>{APP.tagline}</div>
        </div>

        {/* ── DB Error ── */}
        {!dbOk ? (
          <div style={cardStyle()} className={styles.dbError}>
            <div className={styles.dbErrorIcon}>⚠️</div>
            <div className={styles.dbErrorTitle}>Cannot Connect to Database</div>
            <div className={styles.dbErrorMsg}>Make sure PostgreSQL is running and run <code>npm run db:setup</code></div>
          </div>
        ) : (
          <>
            {/* ── Mode Tabs ── */}
            <div className={styles.modeTabs} style={{ background: C.card, border: `1.5px solid ${C.cardBorder}` }}>
              {[{ k: 'crew', l: '👷 Crew', bg: C.blue }, { k: 'admin', l: '🔒 Admin', bg: C.sidebar }].map(m => (
                <div key={m.k} tabIndex={0} role="button"
                  onClick={() => { setMode(m.k); setSelected(null); setPin(''); setError(null); resetCrewFlow() }}
                  onKeyDown={e => { if (e.key === 'Enter') { setMode(m.k); setSelected(null); setPin(''); setError(null); resetCrewFlow() } }}
                  className={styles.modeTab}
                  style={{
                    color: mode === m.k ? '#fff' : C.textLight,
                    background: mode === m.k ? m.bg : 'transparent',
                  }}>
                  {m.l}
                </div>
              ))}
            </div>

            {/* ── Crew Login Flow ── */}
            {mode === 'crew' && (
              <div style={cardStyle({ padding: 24 })}>
                <CrewFlow
                  crewTiles={crewTiles}
                  selectedCrew={selectedCrew}
                  selectedEmployee={selectedEmployee}
                  pin={pin}
                  error={error}
                  onSelectCrew={(crew) => { setSelectedCrew(crew); setError(null) }}
                  onSelectEmployee={(emp) => { setSelectedEmployee(emp); setError(null) }}
                  onPinChange={(val) => { setPin(val.replace(/\D/g, '')); setError(null) }}
                  onSubmit={handleSubmit}
                  onBack={resetCrewFlow}
                />
              </div>
            )}

            {/* ── Admin Login ── */}
            {mode === 'admin' && (
              <div style={cardStyle({ padding: 24 })}>
                <AdminFlow
                  admins={admins}
                  selected={selected}
                  pin={pin}
                  error={error}
                  onSelect={(id) => { setSelected(id); setError(null) }}
                  onPinChange={(val) => { setPin(val.replace(/\D/g, '')); setError(null) }}
                  onSubmit={handleSubmit}
                />
              </div>
            )}
          </>
        )}

        <div className={styles.footer}>{APP.name} v{APP.version}</div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Crew Login — 3-step: crew → employee → PIN
// ═══════════════════════════════════════════
function CrewFlow({ crewTiles, selectedCrew, selectedEmployee, pin, error, onSelectCrew, onSelectEmployee, onPinChange, onSubmit, onBack }) {
  // Step 1: Select crew
  if (!selectedCrew) {
    return (
      <>
        <div style={labelStyle}>Select Your Crew</div>
        <div className={styles.listCol}>
          {crewTiles && crewTiles.crews.length === 0 && crewTiles.unassigned.length === 0 ? (
            <div className={styles.emptyMsg}>No crews or employees found. Set them up in admin.</div>
          ) : (
            <>
              {crewTiles && crewTiles.crews.map(crew => (
                <div key={crew.id} tabIndex={0} role="button"
                  onClick={() => onSelectCrew(crew)}
                  onKeyDown={e => e.key === 'Enter' && onSelectCrew(crew)}
                  className={styles.crewTile}>
                  <div className={styles.crewTileRow}>
                    <div>
                      <div className={styles.crewTileName}>{crew.name}</div>
                      <div className={styles.crewTileSub}>
                        {crew.employees.length} member{crew.employees.length !== 1 ? 's' : ''}
                        {crew.vehicle ? ` · ${crew.vehicle.name}` : ''}
                        {crew.lead_name ? ` · Lead: ${crew.lead_name}` : ''}
                      </div>
                    </div>
                    <div className={styles.crewTileArrow}>→</div>
                  </div>
                  {crew.employees.length > 0 && (
                    <div className={styles.crewTileAvatars}>
                      {crew.employees.slice(0, 5).map((emp, i) => (
                        <div key={emp.id}
                          className={`${styles.avatar} ${i > 0 ? styles.avatarStacked : ''}`}
                          style={{ background: emp.photo_filename ? 'transparent' : C.blue, zIndex: 5 - i }}>
                          {emp.photo_filename ? (
                            <img src={`/uploads/${emp.photo_filename}`} alt="" className={styles.avatarImg} />
                          ) : (
                            <>{emp.first_name[0]}{emp.last_name[0]}</>
                          )}
                        </div>
                      ))}
                      {crew.employees.length > 5 && (
                        <div className={styles.avatarOverflow}>+{crew.employees.length - 5}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </>
    )
  }

  // Step 2: Select employee
  if (!selectedEmployee) {
    return (
      <>
        <div className={styles.backRow}>
          <button tabIndex={0} onClick={onBack} className={styles.backBtn}>← Back</button>
          <div className={styles.backCrewName}>{selectedCrew.name}</div>
          {selectedCrew.vehicle && <div className={styles.backVehicle}>🚛 {selectedCrew.vehicle.name}</div>}
        </div>
        <div style={labelStyle}>Who's Signing In?</div>
        <div className={styles.listCol}>
          {selectedCrew.employees.filter(e => e.has_pin).length === 0 ? (
            <div className={styles.emptyMsg}>No employees with PINs in this crew. Set PINs in admin → Employees.</div>
          ) : selectedCrew.employees.filter(e => e.has_pin).map(emp => (
            <div key={emp.id} tabIndex={0} role="button"
              onClick={() => onSelectEmployee(emp)}
              onKeyDown={e => e.key === 'Enter' && onSelectEmployee(emp)}
              className={styles.empTile}>
              {emp.photo_filename ? (
                <img src={`/uploads/${emp.photo_filename}`} alt="" className={styles.empAvatar} />
              ) : (
                <div className={styles.empAvatarPlaceholder}>
                  {emp.first_name[0]}{emp.last_name[0]}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div className={styles.empName}>{emp.first_name} {emp.last_name}</div>
              </div>
              {emp.is_crew_lead && (
                <span className={styles.empBadge} style={{ background: C.accentLight, color: C.accent }}>Lead</span>
              )}
            </div>
          ))}
        </div>
      </>
    )
  }

  // Step 3: Enter PIN
  return (
    <>
      <div className={styles.backRow}>
        <button tabIndex={0} onClick={onBack} className={styles.backBtn}>← Back</button>
      </div>
      <div className={styles.pinSection}>
        {selectedEmployee.photo_filename ? (
          <img src={`/uploads/${selectedEmployee.photo_filename}`} alt="" className={styles.pinAvatar} />
        ) : (
          <div className={styles.pinAvatarPlaceholder}>
            {selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
          </div>
        )}
        <div className={styles.pinName}>{selectedEmployee.first_name} {selectedEmployee.last_name}</div>
      </div>
      <div style={labelStyle}>Enter Your PIN</div>
      <input type="password" inputMode="numeric" maxLength={6} value={pin} autoFocus
        onChange={e => onPinChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSubmit()}
        placeholder="Enter PIN"
        style={inputStyle({
          fontSize: 28, fontWeight: 800, textAlign: 'center', letterSpacing: 12, padding: '18px 16px',
          borderColor: error ? C.red : C.cardBorder, background: error ? C.redLight : '#FAFAF7',
        })} />
      {error && <div className={styles.pinError}>{error}</div>}
      <button onClick={onSubmit} tabIndex={0}
        style={{ ...btnStyle(C.blue), marginTop: 16, opacity: pin.length >= 4 ? 1 : 0.5 }}>
        Sign In
      </button>
    </>
  )
}

// ═══════════════════════════════════════════
// Admin Login — select admin → PIN
// ═══════════════════════════════════════════
function AdminFlow({ admins, selected, pin, error, onSelect, onPinChange, onSubmit }) {
  return (
    <>
      <div style={labelStyle}>Select Admin</div>
      <div className={styles.listCol} style={{ marginBottom: 20 }}>
        {admins.length === 0 ? (
          <div className={styles.emptyMsg}>None found. Run <code>npm run db:setup</code></div>
        ) : admins.map(it => (
          <div key={it.id} tabIndex={0} role="button"
            onClick={() => onSelect(it.id)}
            onKeyDown={e => e.key === 'Enter' && onSelect(it.id)}
            className={styles.adminTile}
            style={{
              background: selected === it.id ? '#2A2A26' : '#FAFAF7',
              border: `2px solid ${selected === it.id ? C.sidebar : C.cardBorder}`,
            }}>
            <div className={styles.adminTileName} style={{ color: selected === it.id ? '#fff' : C.text }}>
              {it.name}
            </div>
            {it.role && (
              <div className={styles.adminTileRole} style={{ color: selected === it.id ? '#aaa' : C.textLight }}>
                {it.role}
              </div>
            )}
          </div>
        ))}
      </div>

      {selected && (
        <>
          <div style={labelStyle}>Admin PIN</div>
          <input type="password" inputMode="numeric" maxLength={6} value={pin} autoFocus
            onChange={e => onPinChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onSubmit()}
            placeholder="Enter PIN"
            style={inputStyle({
              fontSize: 28, fontWeight: 800, textAlign: 'center', letterSpacing: 12, padding: '18px 16px',
              borderColor: error ? C.red : C.cardBorder, background: error ? C.redLight : '#FAFAF7',
            })} />
          {error && <div className={styles.pinError}>{error}</div>}
          <button onClick={onSubmit} tabIndex={0}
            style={{ ...btnStyle(C.sidebar), marginTop: 16, opacity: pin.length >= 4 ? 1 : 0.5 }}>
            🔒 Unlock Admin
          </button>
        </>
      )}
    </>
  )
}
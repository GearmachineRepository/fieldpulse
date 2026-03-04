import { useState, useEffect } from 'react'
import { APP, C, FONT, cardStyle, inputStyle, btnStyle, labelStyle } from './config.js'
import { verifyAdminPin, getAdminsList, getEquipment, getChemicals, getCrews, getEmployees, getSprayLogs, createSprayLog, checkHealth, getCrewLoginTiles, crewLogin } from './lib/api.js'
import { getSimulatedWeather, getWeatherByCoords } from './lib/weather.js'
import Sidebar from './components/Sidebar.jsx'
import SprayTracker from './pages/SprayTracker.jsx'
import FieldHome from './pages/FieldHome.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

// ═══════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════
function LoginScreen({ onCrewLogin, onAdminLogin }) {
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
        await checkHealth(); setDbOk(true)
        const [a, tiles] = await Promise.all([getAdminsList(), getCrewLoginTiles()])
        setAdmins(a); setCrewTiles(tiles)
      } catch { setDbOk(false) }
      finally { setLoading(false) }
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
    } catch { setError('Invalid PIN — try again'); setPin('') }
  }

  const resetCrewFlow = () => { setSelectedCrew(null); setSelectedEmployee(null); setPin(''); setError(null) }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, fontFamily: FONT }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 32, marginBottom: 12 }}>💧</div><div style={{ fontSize: 18, fontWeight: 800 }}>Loading {APP.name}...</div></div>
    </div>
  )

  // Items for admin mode
  const items = admins

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, fontFamily: FONT, padding: 24 }}>
      <div style={{ width: '100%', maxWidth: mode === 'crew' ? 440 : 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 4, color: C.accent, fontWeight: 800, marginBottom: 4 }}>{APP.name}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.text }}>{APP.tagline}</div>
        </div>

        {!dbOk ? (
          <div style={cardStyle({ padding: 24, textAlign: 'center' })}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.red, marginBottom: 8 }}>Cannot Connect to Database</div>
            <div style={{ fontSize: 14, color: C.textMed }}>Make sure PostgreSQL is running and run <code>npm run db:setup</code></div>
          </div>
        ) : (
          <>
            {/* Mode Tabs */}
            <div style={{ display: 'flex', marginBottom: 16, background: C.card, borderRadius: 14, border: `1.5px solid ${C.cardBorder}`, overflow: 'hidden' }}>
              {[{ k: 'crew', l: '👷 Crew' }, { k: 'admin', l: '🔒 Admin' }].map(m => (
                <div key={m.k} tabIndex={0} role="button"
                  onClick={() => { setMode(m.k); setSelected(null); setPin(''); setError(null); resetCrewFlow() }}
                  onKeyDown={e => { if (e.key === 'Enter') { setMode(m.k); setSelected(null); setPin(''); setError(null); resetCrewFlow() } }}
                  style={{ flex: 1, textAlign: 'center', padding: '14px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', outline: 'none',
                    color: mode === m.k ? '#fff' : C.textLight,
                    background: mode === m.k ? (m.k === 'admin' ? C.sidebar : C.blue) : 'transparent',
                    transition: 'all 0.15s' }}>
                  {m.l}
                </div>
              ))}
            </div>

            {/* ── CREW LOGIN FLOW ── */}
            {mode === 'crew' && (
              <div style={cardStyle({ padding: 24 })}>
                {!selectedCrew ? (
                  <>
                    <div style={labelStyle}>Select Your Crew</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {crewTiles && crewTiles.crews.length === 0 && crewTiles.unassigned.length === 0 ? (
                        <div style={{ fontSize: 14, color: C.textLight, padding: 16, textAlign: 'center' }}>No crews or employees found. Set them up in admin.</div>
                      ) : (
                        <>
                          {crewTiles && crewTiles.crews.map(crew => (
                            <div key={crew.id} tabIndex={0} role="button"
                              onClick={() => { setSelectedCrew(crew); setError(null) }}
                              onKeyDown={e => { if (e.key === 'Enter') { setSelectedCrew(crew); setError(null) } }}
                              style={{
                                padding: '16px 18px', borderRadius: 14, cursor: 'pointer', outline: 'none',
                                background: '#FAFAF7', border: `2px solid ${C.cardBorder}`,
                                transition: 'border-color 0.15s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = C.blue}
                              onMouseLeave={e => e.currentTarget.style.borderColor = C.cardBorder}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{crew.name}</div>
                                  <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>
                                    {crew.employees.length} member{crew.employees.length !== 1 ? 's' : ''}
                                    {crew.vehicle ? ` · ${crew.vehicle.name}` : ''}
                                    {crew.lead_name ? ` · Lead: ${crew.lead_name}` : ''}
                                  </div>
                                </div>
                                <div style={{ fontSize: 24 }}>→</div>
                              </div>
                              {crew.employees.length > 0 && (
                                <div style={{ display: 'flex', gap: -4, marginTop: 10 }}>
                                  {crew.employees.slice(0, 5).map((emp, i) => (
                                    <div key={emp.id} style={{
                                      width: 32, height: 32, borderRadius: 16, border: '2px solid #fff',
                                      background: emp.photo_filename ? 'transparent' : C.blue,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 11, color: '#fff', fontWeight: 800, marginLeft: i > 0 ? -8 : 0,
                                      overflow: 'hidden', position: 'relative', zIndex: 5 - i,
                                    }}>
                                      {emp.photo_filename ? (
                                        <img src={`/uploads/${emp.photo_filename}`} alt="" style={{ width: 32, height: 32, objectFit: 'cover' }} />
                                      ) : (
                                        <>{emp.first_name[0]}{emp.last_name[0]}</>
                                      )}
                                    </div>
                                  ))}
                                  {crew.employees.length > 5 && (
                                    <div style={{ width: 32, height: 32, borderRadius: 16, border: '2px solid #fff', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: C.textMed, marginLeft: -8, zIndex: 0 }}>
                                      +{crew.employees.length - 5}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </>
                ) : !selectedEmployee ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <button tabIndex={0} onClick={resetCrewFlow}
                        style={{ fontSize: 13, color: C.blue, cursor: 'pointer', fontWeight: 700, background: 'none', border: 'none', padding: 0 }}>
                        ← Back
                      </button>
                      <div style={{ fontSize: 16, fontWeight: 800 }}>{selectedCrew.name}</div>
                      {selectedCrew.vehicle && <div style={{ fontSize: 12, color: C.textLight, padding: '2px 8px', borderRadius: 6, background: C.bg }}>🚛 {selectedCrew.vehicle.name}</div>}
                    </div>
                    <div style={labelStyle}>Who's Signing In?</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedCrew.employees.filter(e => e.has_pin).length === 0 ? (
                        <div style={{ fontSize: 14, color: C.textLight, padding: 16, textAlign: 'center' }}>
                          No employees with PINs in this crew. Set PINs in admin → Employees.
                        </div>
                      ) : selectedCrew.employees.filter(e => e.has_pin).map(emp => (
                        <div key={emp.id} tabIndex={0} role="button"
                          onClick={() => { setSelectedEmployee(emp); setError(null) }}
                          onKeyDown={e => { if (e.key === 'Enter') { setSelectedEmployee(emp); setError(null) } }}
                          style={{
                            padding: '14px 16px', borderRadius: 12, cursor: 'pointer', outline: 'none',
                            background: '#FAFAF7', border: `2px solid ${C.cardBorder}`,
                            display: 'flex', alignItems: 'center', gap: 14, transition: 'border-color 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = C.blue}
                          onMouseLeave={e => e.currentTarget.style.borderColor = C.cardBorder}>
                          {emp.photo_filename ? (
                            <img src={`/uploads/${emp.photo_filename}`} alt="" style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover', border: `2px solid ${C.cardBorder}` }} />
                          ) : (
                            <div style={{ width: 48, height: 48, borderRadius: 24, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: '#fff', fontWeight: 800 }}>
                              {emp.first_name[0]}{emp.last_name[0]}
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{emp.first_name} {emp.last_name}</div>
                            {emp.is_crew_lead && <div style={{ fontSize: 11, color: C.blue, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>Crew Lead</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <button tabIndex={0} onClick={() => { setSelectedEmployee(null); setPin(''); setError(null) }}
                        style={{ fontSize: 13, color: C.blue, cursor: 'pointer', fontWeight: 700, background: 'none', border: 'none', padding: 0 }}>
                        ← Back
                      </button>
                      <div style={{ fontSize: 16, fontWeight: 800 }}>{selectedCrew.name}</div>
                    </div>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      {selectedEmployee.photo_filename ? (
                        <img src={`/uploads/${selectedEmployee.photo_filename}`} alt="" style={{ width: 64, height: 64, borderRadius: 32, objectFit: 'cover', border: `3px solid ${C.blue}` }} />
                      ) : (
                        <div style={{ width: 64, height: 64, borderRadius: 32, background: C.blue, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', fontWeight: 800 }}>
                          {selectedEmployee.first_name[0]}{selectedEmployee.last_name[0]}
                        </div>
                      )}
                      <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>{selectedEmployee.first_name} {selectedEmployee.last_name}</div>
                    </div>
                    <div style={labelStyle}>Enter Your PIN</div>
                    <input type="password" inputMode="numeric" maxLength={6} value={pin} autoFocus
                      onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError(null) }}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      placeholder="Enter PIN"
                      style={inputStyle({ fontSize: 28, fontWeight: 800, textAlign: 'center', letterSpacing: 12, padding: '18px 16px',
                        borderColor: error ? C.red : C.cardBorder, background: error ? C.redLight : '#FAFAF7' })} />
                    {error && <div style={{ fontSize: 14, color: C.red, fontWeight: 600, marginTop: 8, textAlign: 'center' }}>{error}</div>}
                    <button onClick={handleSubmit} tabIndex={0}
                      style={{ ...btnStyle(C.blue), marginTop: 16, opacity: pin.length >= 4 ? 1 : 0.5 }}>
                      Sign In
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── ADMIN LOGIN ── */}
            {mode === 'admin' && (
              <div style={cardStyle({ padding: 24 })}>
                <div style={labelStyle}>Select Admin</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {items.length === 0 ? (
                    <div style={{ fontSize: 14, color: C.textLight, padding: 16, textAlign: 'center' }}>None found. Run <code>npm run db:setup</code></div>
                  ) : items.map(it => (
                    <div key={it.id} tabIndex={0} role="button"
                      onClick={() => { setSelected(it.id); setError(null) }}
                      onKeyDown={e => { if (e.key === 'Enter') { setSelected(it.id); setError(null) } }}
                      style={{
                        padding: '14px 18px', borderRadius: 12, cursor: 'pointer', outline: 'none',
                        background: selected === it.id ? '#2A2A26' : '#FAFAF7',
                        border: `2px solid ${selected === it.id ? C.sidebar : C.cardBorder}`,
                      }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: selected === it.id ? '#fff' : C.text }}>{it.name}</div>
                      {it.role && <div style={{ fontSize: 12, color: selected === it.id ? '#aaa' : C.textLight, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{it.role}</div>}
                    </div>
                  ))}
                </div>

                {selected && (
                  <>
                    <div style={labelStyle}>Admin PIN</div>
                    <input type="password" inputMode="numeric" maxLength={6} value={pin} autoFocus
                      onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError(null) }}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      placeholder="Enter PIN"
                      style={inputStyle({ fontSize: 28, fontWeight: 800, textAlign: 'center', letterSpacing: 12, padding: '18px 16px',
                        borderColor: error ? C.red : C.cardBorder, background: error ? C.redLight : '#FAFAF7' })} />
                    {error && <div style={{ fontSize: 14, color: C.red, fontWeight: 600, marginTop: 8, textAlign: 'center' }}>{error}</div>}
                    <button onClick={handleSubmit} tabIndex={0}
                      style={{ ...btnStyle(C.sidebar), marginTop: 16, opacity: pin.length >= 4 ? 1 : 0.5 }}>
                      🔒 Unlock Admin
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: C.textLight }}>{APP.name} v{APP.version}</div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════
export default function App() {
  const [vehicle, setVehicle] = useState(null)
  const [admin, setAdmin] = useState(null)
  const [loggedInEmployee, setLoggedInEmployee] = useState(null)
  const [loggedInCrew, setLoggedInCrew] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [page, setPage] = useState('spray')
  const [toast, setToast] = useState(null)
  const [chemicals, setChemicals] = useState([])
  const [equipment, setEquipment] = useState([])
  const [crews, setCrews] = useState([])
  const [employees, setEmployees] = useState([])
  const [logs, setLogs] = useState([])
  const [weather, setWeather] = useState(() => getSimulatedWeather())
  const [dataLoaded, setDataLoaded] = useState(false)

  const fetchWeather = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => { try { setWeather(await getWeatherByCoords(pos.coords.latitude, pos.coords.longitude)) } catch { setWeather(getSimulatedWeather()) } },
        () => setWeather(getSimulatedWeather()), { timeout: 8000 })
    } else setWeather(getSimulatedWeather())
  }

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 2500) }

  useEffect(() => {
    if (!vehicle && !admin && !loggedInEmployee) return
    ;(async () => {
      try {
        const [chems, equip, crewList, empList, sprayLogs] = await Promise.all([
          getChemicals(), getEquipment(), getCrews(), getEmployees(),
          vehicle ? getSprayLogs(vehicle.id) : getSprayLogs(),
        ])
        setChemicals(chems); setEquipment(equip); setCrews(crewList); setEmployees(empList); setLogs(sprayLogs)
        setDataLoaded(true)
        if (vehicle || loggedInEmployee) fetchWeather()
      } catch (e) { console.error(e); showToast('Failed to load data') }
    })()
  }, [vehicle, admin, loggedInEmployee])

  if (!vehicle && !admin && !loggedInEmployee) return (
    <LoginScreen
      onCrewLogin={data => {
        setLoggedInEmployee(data.employee)
        setLoggedInCrew(data.crew)
        if (data.vehicle) setVehicle(data.vehicle)
        setPage('home')
      }}
      onAdminLogin={a => { setAdmin(a); setPage('admin-home') }}
    />
  )

  if (!dataLoaded) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, fontFamily: FONT }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 32, marginBottom: 12 }}>💧</div><div style={{ fontSize: 18, fontWeight: 800 }}>Loading...</div></div>
    </div>
  )

  const isAdmin = !!admin

  const handleSubmitLog = async (logData) => {
    try {
      await createSprayLog({ vehicleId: vehicle?.id || null, ...logData })
      setLogs(await getSprayLogs(vehicle?.id))
      showToast('Spray log submitted & saved ✓'); return true
    } catch { showToast('Failed to save'); return false }
  }

  const handleLogout = () => { setVehicle(null); setAdmin(null); setLoggedInEmployee(null); setLoggedInCrew(null); setDataLoaded(false); setLogs([]); setPage('spray') }

  const refreshData = async () => {
    try {
      const [chems, equip, crewList, empList] = await Promise.all([getChemicals(), getEquipment(), getCrews(), getEmployees()])
      setChemicals(chems); setEquipment(equip); setCrews(crewList); setEmployees(empList)
      if (isAdmin) setLogs(await getSprayLogs())
    } catch (e) { console.error(e) }
  }

  // Build effective vehicle object for crew-login compatibility
  const effectiveVehicle = vehicle ? (vehicle.crewName ? vehicle : { ...vehicle, crewName: loggedInCrew?.name || '' }) : null
  const displayName = loggedInEmployee ? `${loggedInEmployee.firstName} ${loggedInEmployee.lastName}` : (isAdmin ? admin.name : effectiveVehicle?.name || '')
  const displaySub = loggedInCrew?.name || (!isAdmin && effectiveVehicle?.crewName) || ''

  const pageTitle = isAdmin
    ? { 'admin-home': 'Dashboard', 'admin-spraylogs': 'Spray Logs', 'admin-vehicles': 'Vehicles', 'admin-crews': 'Crews', 'admin-chemicals': 'Chemicals', 'admin-equipment': 'Equipment', 'admin-employees': 'Employees' }[page] || 'Dashboard'
    : { 'home': 'Home', 'spray': 'Spray Tracker' }[page] || page.charAt(0).toUpperCase() + page.slice(1)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: FONT, maxWidth: isAdmin ? 900 : 430, margin: '0 auto', position: 'relative' }}>
      {!isAdmin && <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} currentPage={page} onNav={setPage} />}

      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(244,243,239,0.97)', backdropFilter: 'blur(14px)', borderBottom: `1.5px solid ${C.cardBorder}`, padding: '0 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0 8px' }}>
          {!isAdmin && (
            <div onClick={() => setSidebarOpen(true)} tabIndex={0} role="button" onKeyDown={e => e.key === 'Enter' && setSidebarOpen(true)}
              style={{ cursor: 'pointer', padding: '6px 2px', display: 'flex', flexDirection: 'column', gap: 4, outline: 'none' }}>
              <div style={{ width: 22, height: 2.5, background: C.text, borderRadius: 2 }} />
              <div style={{ width: 22, height: 2.5, background: C.text, borderRadius: 2 }} />
              <div style={{ width: 16, height: 2.5, background: C.text, borderRadius: 2 }} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, color: isAdmin ? C.amber : C.accent, fontWeight: 800, lineHeight: 1 }}>
              {APP.name} {isAdmin ? '· ADMIN' : ''}
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.3 }}>{pageTitle}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textMed, textAlign: 'right', lineHeight: 1.3 }}>
              {displayName}
              {displaySub && <div style={{ fontSize: 11, color: C.textLight }}>{displaySub}</div>}
            </div>
            <button onClick={handleLogout} tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && handleLogout()}
              style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, cursor: 'pointer', outline: 'none',
                background: C.red, border: 'none', color: '#fff', fontWeight: 700,
                boxShadow: '0 2px 8px rgba(220,38,38,0.2)' }}>
              Sign Out
            </button>
          </div>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', overflowX: 'auto', gap: 2, paddingBottom: 8 }}>
            {[
              { k: 'admin-home', l: '🏠 Home' }, { k: 'admin-spraylogs', l: '📋 Spray Logs' },
              { k: 'admin-vehicles', l: '🚛 Vehicles' }, { k: 'admin-crews', l: '👥 Crews' },
              { k: 'admin-employees', l: '👷 Employees' }, { k: 'admin-chemicals', l: '🧪 Chemicals' },
              { k: 'admin-equipment', l: '🔧 Equipment' },
            ].map(t => (
              <div key={t.k} tabIndex={0} role="button" onClick={() => setPage(t.k)}
                onKeyDown={e => e.key === 'Enter' && setPage(t.k)}
                style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', outline: 'none',
                  background: page === t.k ? C.sidebar : 'transparent', color: page === t.k ? '#fff' : C.textLight, transition: 'all 0.15s' }}>
                {t.l}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px 40px' }}>
        {!isAdmin && page === 'home' && (
          <FieldHome vehicle={effectiveVehicle || { name: displayName, crewName: displaySub }} weather={weather} logs={logs} employees={employees} crews={crews} onNav={setPage}
            loggedInEmployee={loggedInEmployee} loggedInCrew={loggedInCrew} />
        )}
        {!isAdmin && page === 'spray' && (
          <SprayTracker vehicle={effectiveVehicle || { name: displayName, crewName: displaySub }} chemicals={chemicals} equipment={equipment} crews={crews} employees={employees}
            logs={logs} weather={weather} onRefreshWeather={fetchWeather} onSubmitLog={handleSubmitLog}
            onLogsUpdated={async () => setLogs(await getSprayLogs(effectiveVehicle?.id))}
            loggedInEmployee={loggedInEmployee} loggedInCrew={loggedInCrew} />
        )}
        {!isAdmin && page !== 'spray' && page !== 'home' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
            <div><div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div><div style={{ fontSize: 22, fontWeight: 900 }}>Coming Soon</div></div>
          </div>
        )}
        {isAdmin && (
          <AdminDashboard page={page} chemicals={chemicals} equipment={equipment} crews={crews} employees={employees}
            logs={logs} onRefresh={refreshData} showToast={showToast} onNav={setPage} />
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: C.accent, color: '#fff',
          padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 800, zIndex: 30, boxShadow: '0 4px 20px rgba(45,122,58,0.3)' }}>
          {toast}
        </div>
      )}
      <style>{`
        *:focus-visible { outline: 3px solid #2563EB !important; outline-offset: 2px; border-radius: 8px; }
        input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 3px solid #2563EB !important; outline-offset: 0px; border-radius: 12px; }
        button:focus-visible { outline: 3px solid #2563EB !important; outline-offset: 2px; }
        [role="button"]:focus-visible { outline: 3px solid #2563EB !important; outline-offset: 2px; }
      `}</style>
    </div>
  )
}

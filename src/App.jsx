import { useState, useEffect } from 'react'
import { APP, C, FONT, cardStyle, inputStyle, btnStyle, labelStyle } from './config.js'
import { getVehicles, verifyPin, getAdminsList, verifyAdminPin, getEquipment, getChemicals, getCrews, getSprayLogs, createSprayLog, checkHealth } from './lib/api.js'
import { getSimulatedWeather, getWeatherByCoords } from './lib/weather.js'
import Sidebar from './components/Sidebar.jsx'
import SprayTracker from './pages/SprayTracker.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'

// ═══════════════════════════════════════════
// LOGIN SCREEN — vehicles + admin
// ═══════════════════════════════════════════
function LoginScreen({ onVehicleLogin, onAdminLogin }) {
  const [mode, setMode] = useState('vehicle') // 'vehicle' | 'admin'
  const [vehicles, setVehicles] = useState([])
  const [admins, setAdmins] = useState([])
  const [selected, setSelected] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dbOk, setDbOk] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        await checkHealth()
        setDbOk(true)
        const [v, a] = await Promise.all([getVehicles(), getAdminsList()])
        setVehicles(v)
        setAdmins(a)
      } catch { setDbOk(false) }
      finally { setLoading(false) }
    }
    init()
  }, [])

  const handleSubmit = async () => {
    if (!selected || !pin) return
    setError(null)
    try {
      if (mode === 'vehicle') {
        const v = await verifyPin(selected, pin)
        onVehicleLogin(v)
      } else {
        const a = await verifyAdminPin(selected, pin)
        onAdminLogin(a)
      }
    } catch {
      setError('Invalid PIN — try again')
      setPin('')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, fontFamily: FONT }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💧</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Loading {APP.name}...</div>
        </div>
      </div>
    )
  }

  const items = mode === 'vehicle' ? vehicles : admins

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, fontFamily: FONT, padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
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
            {/* Mode Toggle */}
            <div style={{ display: 'flex', marginBottom: 16, background: C.card, borderRadius: 14, border: `1.5px solid ${C.cardBorder}`, overflow: 'hidden' }}>
              {[{ k: 'vehicle', l: '🚛 Vehicle Login' }, { k: 'admin', l: '🔒 Admin Login' }].map(m => (
                <div key={m.k} onClick={() => { setMode(m.k); setSelected(null); setPin(''); setError(null) }}
                  style={{ flex: 1, textAlign: 'center', padding: '14px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    color: mode === m.k ? '#fff' : C.textLight, background: mode === m.k ? (m.k === 'admin' ? C.sidebar : C.accent) : 'transparent', transition: 'all 0.15s' }}>
                  {m.l}
                </div>
              ))}
            </div>

            <div style={cardStyle({ padding: 24 })}>
              <div style={labelStyle}>{mode === 'vehicle' ? 'Select Vehicle' : 'Select Admin'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {items.length === 0 ? (
                  <div style={{ fontSize: 14, color: C.textLight, padding: 16, textAlign: 'center' }}>
                    None found. Run <code>npm run db:setup</code> to seed data.
                  </div>
                ) : items.map(it => (
                  <div key={it.id} onClick={() => { setSelected(it.id); setError(null) }}
                    style={{
                      padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
                      background: selected === it.id ? (mode === 'admin' ? '#2A2A26' : C.accentLight) : '#FAFAF7',
                      border: `2px solid ${selected === it.id ? (mode === 'admin' ? C.sidebar : C.accent) : C.cardBorder}`,
                      transition: 'all 0.15s',
                    }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: selected === it.id && mode === 'admin' ? '#fff' : C.text }}>{it.name}</div>
                    {it.crew_name && <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>{it.crew_name}</div>}
                    {it.role && <div style={{ fontSize: 12, color: selected === it.id ? '#aaa' : C.textLight, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{it.role}</div>}
                  </div>
                ))}
              </div>

              {selected && (
                <>
                  <div style={labelStyle}>{mode === 'admin' ? 'Admin' : 'Vehicle'} PIN</div>
                  <input type="password" inputMode="numeric" maxLength={6} value={pin} autoFocus
                    onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError(null) }}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    placeholder="Enter PIN"
                    style={inputStyle({ fontSize: 28, fontWeight: 800, textAlign: 'center', letterSpacing: 12, padding: '18px 16px',
                      borderColor: error ? C.red : C.cardBorder, background: error ? C.redLight : '#FAFAF7' })} />
                  {error && <div style={{ fontSize: 14, color: C.red, fontWeight: 600, marginTop: 8, textAlign: 'center' }}>{error}</div>}
                  <button onClick={handleSubmit} style={{ ...btnStyle(mode === 'admin' ? C.sidebar : C.accent), marginTop: 16, opacity: pin.length >= 4 ? 1 : 0.5 }}>
                    {mode === 'admin' ? '🔒 Unlock Admin' : 'Unlock'}
                  </button>
                </>
              )}
            </div>
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [page, setPage] = useState('spray')
  const [toast, setToast] = useState(null)

  const [chemicals, setChemicals] = useState([])
  const [equipment, setEquipment] = useState([])
  const [crews, setCrews] = useState([])
  const [logs, setLogs] = useState([])
  const [weather, setWeather] = useState(() => getSimulatedWeather())
  const [dataLoaded, setDataLoaded] = useState(false)

  const fetchWeather = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => { try { setWeather(await getWeatherByCoords(pos.coords.latitude, pos.coords.longitude)) } catch { setWeather(getSimulatedWeather()) } },
        () => setWeather(getSimulatedWeather()), { timeout: 8000 }
      )
    } else { setWeather(getSimulatedWeather()) }
  }

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 2500) }

  useEffect(() => {
    if (!vehicle && !admin) return
    async function loadData() {
      try {
        const [chems, equip, crewList, sprayLogs] = await Promise.all([
          getChemicals(), getEquipment(), getCrews(),
          vehicle ? getSprayLogs(vehicle.id) : getSprayLogs(),
        ])
        setChemicals(chems); setEquipment(equip); setCrews(crewList); setLogs(sprayLogs)
        setDataLoaded(true)
        if (vehicle) fetchWeather()
      } catch (err) { console.error(err); showToast('Failed to load data') }
    }
    loadData()
  }, [vehicle, admin])

  // Not logged in
  if (!vehicle && !admin) {
    return <LoginScreen onVehicleLogin={(v) => { setVehicle(v); setPage('spray') }} onAdminLogin={(a) => { setAdmin(a); setPage('admin-logs') }} />
  }

  if (!dataLoaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, fontFamily: FONT }}>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 32, marginBottom: 12 }}>💧</div><div style={{ fontSize: 18, fontWeight: 800 }}>Loading...</div></div>
      </div>
    )
  }

  const isAdmin = !!admin

  const handleSubmitLog = async (logData) => {
    try {
      await createSprayLog({ vehicleId: vehicle.id, ...logData })
      setLogs(await getSprayLogs(vehicle.id))
      showToast('Spray log submitted & saved ✓')
      return true
    } catch { showToast('Failed to save'); return false }
  }

  const handleLogout = () => {
    setVehicle(null); setAdmin(null); setDataLoaded(false); setLogs([]); setPage('spray')
  }

  const refreshData = async () => {
    try {
      const [chems, equip, crewList] = await Promise.all([getChemicals(), getEquipment(), getCrews()])
      setChemicals(chems); setEquipment(equip); setCrews(crewList)
      if (isAdmin) setLogs(await getSprayLogs())
    } catch (err) { console.error(err) }
  }

  const pageTitle = isAdmin
    ? { 'admin-logs': 'All Spray Logs', 'admin-vehicles': 'Vehicles & Crews', 'admin-chemicals': 'Chemicals', 'admin-equipment': 'Equipment', 'admin-pur': 'PUR Report' }[page] || 'Dashboard'
    : page === 'spray' ? 'Spray Tracker' : page.charAt(0).toUpperCase() + page.slice(1)

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: FONT, maxWidth: isAdmin ? 900 : 430, margin: '0 auto', position: 'relative' }}>
      {!isAdmin && <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} currentPage={page} onNav={setPage} />}

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(244,243,239,0.97)', backdropFilter: 'blur(14px)', borderBottom: `1.5px solid ${C.cardBorder}`, padding: '0 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0 8px' }}>
          {!isAdmin && (
            <div onClick={() => setSidebarOpen(true)} style={{ cursor: 'pointer', padding: '6px 2px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ width: 22, height: 2.5, background: C.text, borderRadius: 2 }} />
              <div style={{ width: 22, height: 2.5, background: C.text, borderRadius: 2 }} />
              <div style={{ width: 16, height: 2.5, background: C.text, borderRadius: 2 }} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, color: isAdmin ? C.amber : C.accent, fontWeight: 800, lineHeight: 1 }}>
              {APP.name} {isAdmin ? '· ADMIN' : ''}
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.text, lineHeight: 1.3 }}>{pageTitle}</div>
          </div>
          <div onClick={handleLogout} style={{
            padding: '6px 12px', borderRadius: 10, fontSize: 12, cursor: 'pointer',
            background: isAdmin ? C.amberLight : C.blueLight,
            border: `1px solid ${isAdmin ? C.amberBorder : C.blueBorder}`,
            color: isAdmin ? C.amber : C.blue, fontWeight: 700,
          }}>
            {isAdmin ? `🔒 ${admin.name}` : `🚛 ${vehicle.name}`}
          </div>
        </div>

        {/* Admin nav tabs */}
        {isAdmin && (
          <div style={{ display: 'flex', overflowX: 'auto', gap: 2, paddingBottom: 8 }}>
            {[
              { k: 'admin-logs', l: '📋 Logs' },
              { k: 'admin-vehicles', l: '🚛 Vehicles' },
              { k: 'admin-chemicals', l: '🧪 Chemicals' },
              { k: 'admin-equipment', l: '🔧 Equipment' },
              { k: 'admin-pur', l: '📊 PUR' },
            ].map(t => (
              <div key={t.k} onClick={() => setPage(t.k)}
                style={{ padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                  background: page === t.k ? C.sidebar : 'transparent', color: page === t.k ? '#fff' : C.textLight, transition: 'all 0.15s' }}>
                {t.l}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px 40px' }}>
        {!isAdmin && page === 'spray' && (
          <SprayTracker vehicle={vehicle} chemicals={chemicals} equipment={equipment} crews={crews}
            logs={logs} weather={weather} onRefreshWeather={fetchWeather} onSubmitLog={handleSubmitLog}
            onLogsUpdated={async () => setLogs(await getSprayLogs(vehicle.id))} />
        )}
        {!isAdmin && page !== 'spray' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
            <div><div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div><div style={{ fontSize: 22, fontWeight: 900 }}>Coming Soon</div></div>
          </div>
        )}
        {isAdmin && (
          <AdminDashboard page={page} chemicals={chemicals} equipment={equipment} crews={crews}
            logs={logs} onRefresh={refreshData} showToast={showToast} />
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)', background: C.accent, color: '#fff',
          padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 800, zIndex: 30, boxShadow: '0 4px 20px rgba(45,122,58,0.3)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}

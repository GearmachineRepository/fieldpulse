import { useState, useEffect } from 'react'
import { APP, C, FONT, cardStyle, inputStyle, btnStyle, labelStyle } from './config.js'
import { getVehicles, verifyPin, getEquipment, getChemicals, getSprayLogs, createSprayLog, checkHealth } from './lib/api.js'
import { getSimulatedWeather, getWeatherByCoords } from './lib/weather.js'
import Sidebar from './components/Sidebar.jsx'
import SprayTracker from './pages/SprayTracker.jsx'

// ═══════════════════════════════════════════
// PIN Login Screen
// ═══════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        await checkHealth()
        setDbConnected(true)
        const v = await getVehicles()
        setVehicles(v)
      } catch {
        setDbConnected(false)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleSubmit = async () => {
    if (!selectedVehicle || !pin) return
    setError(null)
    try {
      const vehicle = await verifyPin(selectedVehicle, pin)
      onLogin(vehicle)
    } catch {
      setError('Invalid PIN — try again')
      setPin('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
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

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: C.bg, fontFamily: FONT, padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 4, color: C.accent, fontWeight: 800, marginBottom: 4 }}>
            {APP.name}
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.text }}>{APP.tagline}</div>
        </div>

        {!dbConnected ? (
          <div style={cardStyle({ padding: 24 })}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.red, marginBottom: 8 }}>Cannot Connect to Database</div>
              <div style={{ fontSize: 14, color: C.textMed, lineHeight: 1.6 }}>
                Make sure PostgreSQL is running and you've run the setup:
              </div>
              <div style={{
                marginTop: 12, padding: '12px 16px', borderRadius: 10,
                background: '#1B1B19', color: '#4ADE80', fontSize: 14,
                fontFamily: "'DM Mono', monospace", textAlign: 'left', lineHeight: 1.8,
              }}>
                npm run db:setup
              </div>
              <div style={{ fontSize: 13, color: C.textLight, marginTop: 12 }}>
                Then refresh this page.
              </div>
            </div>
          </div>
        ) : (
          <div style={cardStyle({ padding: 24 })}>
            {/* Vehicle Selection */}
            <div style={labelStyle}>Select Vehicle</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {vehicles.length === 0 ? (
                <div style={{ fontSize: 14, color: C.textLight, padding: 16, textAlign: 'center' }}>
                  No vehicles found. Run <code>npm run db:setup</code> to seed data.
                </div>
              ) : (
                vehicles.map(v => (
                  <div
                    key={v.id}
                    onClick={() => { setSelectedVehicle(v.id); setError(null); }}
                    style={{
                      padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
                      background: selectedVehicle === v.id ? C.accentLight : '#FAFAF7',
                      border: `2px solid ${selectedVehicle === v.id ? C.accent : C.cardBorder}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{v.name}</div>
                    {v.crew_name && (
                      <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>{v.crew_name}</div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* PIN Entry */}
            {selectedVehicle && (
              <>
                <div style={labelStyle}>Vehicle PIN</div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setError(null); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter PIN"
                  autoFocus
                  style={inputStyle({
                    fontSize: 28, fontWeight: 800, textAlign: 'center',
                    letterSpacing: 12, padding: '18px 16px',
                    borderColor: error ? C.red : C.cardBorder,
                    background: error ? C.redLight : '#FAFAF7',
                  })}
                />
                {error && (
                  <div style={{ fontSize: 14, color: C.red, fontWeight: 600, marginTop: 8, textAlign: 'center' }}>
                    {error}
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  style={{ ...btnStyle(), marginTop: 16, opacity: pin.length >= 4 ? 1 : 0.5 }}
                >
                  Unlock
                </button>
              </>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: C.textLight }}>
          {APP.name} v{APP.version}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Placeholder Page (for future modules)
// ═══════════════════════════════════════════
function PlaceholderPage({ title }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', textAlign: 'center', padding: 32,
    }}>
      <div>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 15, color: C.textLight, lineHeight: 1.6 }}>
          This module is coming soon. Use the sidebar to navigate.
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Main App
// ═══════════════════════════════════════════
export default function App() {
  const [vehicle, setVehicle] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [page, setPage] = useState('spray')
  const [toast, setToast] = useState(null)

  // Data loaded from API
  const [chemicals, setChemicals] = useState([])
  const [equipment, setEquipment] = useState([])
  const [logs, setLogs] = useState([])
  const [weather, setWeather] = useState(() => getSimulatedWeather())
  const [dataLoaded, setDataLoaded] = useState(false)

  // Fetch real weather via GPS, fall back to simulated
  const fetchWeather = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const wx = await getWeatherByCoords(pos.coords.latitude, pos.coords.longitude)
            setWeather(wx)
          } catch {
            setWeather(getSimulatedWeather())
          }
        },
        () => setWeather(getSimulatedWeather()),  // GPS denied/failed
        { timeout: 8000 }
      )
    } else {
      setWeather(getSimulatedWeather())
    }
  }

  const showToast = (m) => {
    setToast(m)
    setTimeout(() => setToast(null), 2500)
  }

  // Load data after login
  useEffect(() => {
    if (!vehicle) return
    async function loadData() {
      try {
        const [chems, equip, sprayLogs] = await Promise.all([
          getChemicals(),
          getEquipment(),
          getSprayLogs(vehicle.id),
        ])
        setChemicals(chems)
        setEquipment(equip)
        setLogs(sprayLogs)
        setDataLoaded(true)
        fetchWeather()  // Get real weather after login
      } catch (err) {
        console.error('Failed to load data:', err)
        showToast('Failed to load data — check connection')
      }
    }
    loadData()
  }, [vehicle])

  // Not logged in — show PIN screen
  if (!vehicle) {
    return <LoginScreen onLogin={setVehicle} />
  }

  // Data loading
  if (!dataLoaded) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: C.bg, fontFamily: FONT,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>💧</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Loading data...</div>
        </div>
      </div>
    )
  }

  const handleSubmitLog = async (logData) => {
    try {
      const result = await createSprayLog({
        vehicleId: vehicle.id,
        ...logData,
      })
      // Refresh logs from server
      const updatedLogs = await getSprayLogs(vehicle.id)
      setLogs(updatedLogs)
      showToast('Spray log submitted & saved ✓')
      return true
    } catch (err) {
      console.error('Submit failed:', err)
      showToast('Failed to save — check connection')
      return false
    }
  }

  const handleLogout = () => {
    setVehicle(null)
    setDataLoaded(false)
    setLogs([])
    setPage('spray')
  }

  const pageTitle = page === 'spray' ? 'Spray Tracker' : page.charAt(0).toUpperCase() + page.slice(1)

  return (
    <div style={{
      minHeight: '100vh', background: C.bg, color: C.text,
      fontFamily: FONT, maxWidth: 430, margin: '0 auto',
      position: 'relative', overflow: 'hidden',
    }}>
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage={page}
        onNav={setPage}
      />

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(244,243,239,0.97)',
        backdropFilter: 'blur(14px)',
        borderBottom: `1.5px solid ${C.cardBorder}`,
        padding: '0 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0 8px' }}>
          {/* Hamburger */}
          <div
            onClick={() => setSidebarOpen(true)}
            style={{ cursor: 'pointer', padding: '6px 2px', display: 'flex', flexDirection: 'column', gap: 4 }}
          >
            <div style={{ width: 22, height: 2.5, background: C.text, borderRadius: 2 }} />
            <div style={{ width: 22, height: 2.5, background: C.text, borderRadius: 2 }} />
            <div style={{ width: 16, height: 2.5, background: C.text, borderRadius: 2 }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, color: C.accent, fontWeight: 800, lineHeight: 1 }}>
              {APP.name}
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: C.text, lineHeight: 1.3 }}>
              {pageTitle}
            </div>
          </div>

          {/* Vehicle badge */}
          <div
            onClick={handleLogout}
            style={{
              padding: '6px 12px', borderRadius: 10, fontSize: 12, cursor: 'pointer',
              background: C.blueLight, border: `1px solid ${C.blueBorder}`,
              color: C.blue, fontWeight: 700, textAlign: 'center',
            }}
            title="Tap to switch vehicle"
          >
            🚛 {vehicle.name}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div style={{ padding: '14px 16px 40px' }}>
        {page === 'spray' && (
          <SprayTracker
            vehicle={vehicle}
            chemicals={chemicals}
            equipment={equipment}
            logs={logs}
            weather={weather}
            onRefreshWeather={fetchWeather}
            onSubmitLog={handleSubmitLog}
          />
        )}
        {page !== 'spray' && <PlaceholderPage title={pageTitle} />}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
          background: C.accent, color: '#fff',
          padding: '14px 28px', borderRadius: 14,
          fontSize: 15, fontWeight: 800, zIndex: 30,
          boxShadow: '0 4px 20px rgba(45,122,58,0.3)',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}

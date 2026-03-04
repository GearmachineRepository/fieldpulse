import { C, cardStyle, labelStyle, btnStyle } from '../config.js'
import WindCompass from '../components/WindCompass.jsx'

export default function FieldHome({ vehicle, weather, logs, employees, crews, onNav }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const windHigh = weather.windSpeed > 10
  const todaysLogs = logs.filter(l => l.date === new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))

  // Get crew members for this vehicle's crew
  const crewObj = crews.find(c => c.name === vehicle.crewName)
  const crewMembers = crewObj ? employees.filter(e => e.default_crew_id === crewObj.id) : []

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: C.textLight, fontWeight: 600 }}>{today}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.text, marginTop: 2 }}>
          {getGreeting()}, {vehicle.crewName || vehicle.name}
        </div>
      </div>

      {/* Weather Card */}
      <div style={{ ...cardStyle(), borderColor: windHigh ? C.redBorder : C.accentBorder, background: windHigh ? C.redLight : C.card }}>
        {windHigh && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 14px', borderRadius: 10, background: '#fff', border: `2px solid ${C.red}` }}>
            <span style={{ fontSize: 22 }}>⚠️</span>
            <div><div style={{ fontSize: 15, fontWeight: 800, color: C.red }}>High Wind Warning</div>
              <div style={{ fontSize: 13, color: C.textMed }}>Wind exceeds 10 mph — check drift risk before spraying</div></div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <WindCompass direction={weather.windDir} speed={weather.windSpeed} />
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { l: 'Temp', v: `${weather.temp}°F`, c: C.text },
              { l: 'Humidity', v: `${weather.humidity}%`, c: C.blue },
              { l: 'Wind', v: `${weather.windSpeed} mph ${weather.windDir}`, c: windHigh ? C.red : C.accent },
              { l: 'Sky', v: weather.conditions, c: C.amber },
            ].map(s => (
              <div key={s.l}>
                <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.l}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: s.c }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: C.textLight, marginTop: 10 }}>
          {weather.simulated ? '⚡ Simulated — enable location for live data' : '✓ Live weather data'}
        </div>
      </div>

      {/* Quick Start */}
      <button tabIndex={0} onClick={() => onNav('spray')}
        style={{ ...btnStyle(C.accent, '#fff', { marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }) }}>
        <span style={{ fontSize: 22 }}>📝</span> Start New Spray Log
      </button>

      {/* Crew Roster */}
      <div style={cardStyle()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={labelStyle}>Today's Crew{crewObj ? ` — ${crewObj.name}` : ''}</div>
          <div style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>{crewMembers.length} member{crewMembers.length !== 1 ? 's' : ''}</div>
        </div>
        {crewMembers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: C.textLight, fontSize: 14 }}>
            No crew members assigned yet. Set up employees in admin.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {crewMembers.map(emp => (
              <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: '#FAFAF7', border: `1px solid ${C.cardBorder}` }}>
                {emp.photo_filename ? (
                  <img src={`/uploads/${emp.photo_filename}`} alt="" style={{ width: 40, height: 40, borderRadius: 20, objectFit: 'cover', border: `2px solid ${C.cardBorder}` }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 20, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#fff', fontWeight: 800 }}>
                    {emp.first_name[0]}{emp.last_name[0]}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{emp.first_name} {emp.last_name}</div>
                  {emp.license_number && <div style={{ fontSize: 12, color: C.textLight }}>{emp.license_number}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Logs */}
      <div style={cardStyle()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={labelStyle}>Today's Spray Logs</div>
          <div tabIndex={0} role="button" onClick={() => onNav('spray')} onKeyDown={e => e.key === 'Enter' && onNav('spray')}
            style={{ fontSize: 13, color: C.accent, fontWeight: 700, cursor: 'pointer' }}>View All →</div>
        </div>
        {todaysLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: C.textLight, fontSize: 14 }}>
            No spray logs submitted today yet.
          </div>
        ) : todaysLogs.map(log => (
          <div key={log.id} style={{ padding: '12px 14px', borderRadius: 12, background: '#FAFAF7', border: `1px solid ${C.cardBorder}`, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{log.property}</div>
                <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>
                  {log.products.length} product{log.products.length !== 1 ? 's' : ''} · {log.totalMixVol} · {log.equipment}
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{log.time}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent History (last 5) */}
      {logs.length > 0 && (
        <div style={cardStyle()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={labelStyle}>Recent History</div>
            <div style={{ fontSize: 12, color: C.textLight }}>{logs.length} total logs</div>
          </div>
          {logs.slice(0, 5).map(log => (
            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.cardBorder}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{log.property}</div>
                <div style={{ fontSize: 12, color: C.textLight }}>{log.products.length} product{log.products.length !== 1 ? 's' : ''}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{log.date}</div>
                <div style={{ fontSize: 11, color: C.textLight }}>{log.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

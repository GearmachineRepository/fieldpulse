import { useState, useEffect } from 'react'
import { C, cardStyle, labelStyle, btnStyle } from '../config.js'
import WindCompass from '../components/WindCompass.jsx'
import { getTodayRoster } from '../lib/api.js'

export default function FieldHome({ vehicle, weather, logs, employees, crews, onNav, loggedInEmployee, loggedInCrew }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const windHigh = weather.windSpeed > 10
  const todaysLogs = logs.filter(l => l.date === new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))

  const crewObj = loggedInCrew ? crews.find(c => c.name === loggedInCrew.name) : crews.find(c => c.name === vehicle?.crewName)
  const greetingName = loggedInEmployee ? loggedInEmployee.firstName : (vehicle?.crewName || vehicle?.name || '')

  const [roster, setRoster] = useState(undefined)
  useEffect(() => { getTodayRoster(crewObj?.id).then(setRoster).catch(() => setRoster(null)) }, [])

  const memberCount = roster ? roster.members.length : 0

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, color: C.textLight, fontWeight: 600 }}>{today}</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.text, marginTop: 2 }}>
          {getGreeting()}, {greetingName}
        </div>
      </div>

      {/* Weather */}
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

      {/* Crew status */}
      {roster !== undefined && (
        <div tabIndex={0} role="button" onClick={() => onNav('crew')} onKeyDown={e => e.key === 'Enter' && onNav('crew')}
          style={{
            ...cardStyle({ cursor: 'pointer' }),
            borderColor: roster ? C.accentBorder : C.blueBorder,
            background: roster ? C.accentLight : C.blueLight,
          }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: roster ? C.accent : C.blue }}>
                {roster ? `Crew Ready — ${memberCount} member${memberCount !== 1 ? 's' : ''}` : '👷 Set Up Today\'s Crew'}
              </div>
              <div style={{ fontSize: 12, color: C.textMed, marginTop: 2 }}>
                {roster ? 'Tap to view or edit' : 'Tap to mark who\'s working today'}
              </div>
            </div>
            <div style={{ fontSize: 20 }}>{roster ? '✓' : '→'}</div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div style={cardStyle()}>
        <div style={labelStyle}>Quick Links</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
          {[
            { k: 'routes', icon: '🗺️', label: 'My Routes' },
            { k: 'spray', icon: '📝', label: 'New Spray Log' },
            { k: 'crew', icon: '👷', label: 'Crew Roster' },
          ].map(link => (
            <div key={link.k} tabIndex={0} role="button" onClick={() => onNav(link.k)} onKeyDown={e => e.key === 'Enter' && onNav(link.k)}
              style={{ padding: '16px', borderRadius: 12, background: '#FAFAF7', border: `1.5px solid ${C.cardBorder}`, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10, transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent} onMouseLeave={e => e.currentTarget.style.borderColor = C.cardBorder}>
              <span style={{ fontSize: 22 }}>{link.icon}</span>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{link.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Today's count */}
      {todaysLogs.length > 0 && (
        <div tabIndex={0} role="button" onClick={() => onNav('spray')} onKeyDown={e => e.key === 'Enter' && onNav('spray')}
          style={{ ...cardStyle({ cursor: 'pointer' }), textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Spray Logs Today</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.accent }}>{todaysLogs.length}</div>
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

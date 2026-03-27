// ═══════════════════════════════════════════
// Field Home — Crew daily overview (real data)
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import {
  Plus, Clock, Sun, Cloud, Navigation, CheckCircle2, MapPin,
  Droplets, Camera, FileText, Users, ChevronRight, Loader2, Wind,
} from "lucide-react"
import { T } from "@/app/tokens.js"
import useAuth from "@/hooks/useAuth.jsx"
import { getCrewRoutes, getRouteDay } from "@/lib/api/routes.js"
import { getTodayRoster } from "@/lib/api/rosters.js"
import { getSprayLogs } from "@/lib/api/sprayLogs.js"
import { getWeatherByCoords, getSimulatedWeather } from "@/lib/weather.js"

function getLocalDate() { return new Date().toLocaleDateString("en-CA") }
function getLocalDow() { return new Date().getDay() }

export default function FieldHome({ onNewDoc, onNavigate }) {
  const { employee, crew } = useAuth()
  const [weather, setWeather] = useState(null)
  const [todayStops, setTodayStops] = useState([])
  const [todayRoster, setTodayRoster] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const firstName = employee?.firstName || "Crew"
  const crewName = crew?.name || "My Crew"
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"

  useEffect(() => {
    const loadAll = async () => {
      try {
        // Weather
        try {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                try {
                  const w = await getWeatherByCoords(pos.coords.latitude, pos.coords.longitude)
                  setWeather(w)
                } catch { setWeather(getSimulatedWeather()) }
              },
              () => setWeather(getSimulatedWeather()),
              { timeout: 5000 }
            )
          } else { setWeather(getSimulatedWeather()) }
        } catch { setWeather(getSimulatedWeather()) }

        // Today's routes/stops
        if (crew?.id) {
          try {
            const routes = await getCrewRoutes(crew.id)
            const todayRoutes = routes.filter(r => r.dayOfWeek === getLocalDow() && r.stopCount > 0)
            const stops = []
            for (const route of todayRoutes.slice(0, 3)) {
              try {
                const data = await getRouteDay(route.id, getLocalDate())
                if (data.stops) {
                  data.stops.forEach(s => stops.push({
                    ...s, routeName: route.name, routeColor: route.color,
                    isDone: !!s.completion,
                  }))
                }
              } catch (e) { console.error('Failed to load route day:', e.message) }
            }
            setTodayStops(stops)
          } catch (e) { console.error('Failed to load routes:', e.message) }

          try { setTodayRoster(await getTodayRoster(crew.id)) }
          catch (e) { console.error('Failed to load roster:', e.message) }

          try {
            const logs = await getSprayLogs({ crewName: crew.name, limit: 5 })
            setRecentLogs(logs)
          } catch (e) { console.error('Failed to load spray logs:', e.message) }
        }
      } catch (err) { console.error('FieldHome load error:', err) }
      finally { setLoading(false) }
    }
    loadAll()
  }, [crew])

  const completedStops = todayStops.filter(s => s.isDone).length
  const totalStops = todayStops.length

  return (
    <div>
      {/* Header */}
      <div style={{ background: T.sidebar, padding: "20px 20px 24px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: "#64748B" }}>{greeting}</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{firstName}</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
              {crewName}{employee?.isCrewLead ? " · Crew Lead" : ""}
            </div>
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: 3, background: T.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 600,
          }}>
            {(employee?.firstName?.[0] || "")}{(employee?.lastName?.[0] || "")}
          </div>
        </div>

        {/* Weather */}
        {weather && (
          <div style={{ display: "flex", gap: 16, background: "#1E293B", borderRadius: 3, padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Sun size={16} color="#FDE68A" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>{weather.temp || "--"}°F</span>
            </div>
            {weather.conditions && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Cloud size={16} color="#64748B" />
                <span style={{ fontSize: 13, color: "#94A3B8" }}>{weather.conditions}</span>
              </div>
            )}
            {weather.windSpeed && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Wind size={14} color="#64748B" />
                <span style={{ fontSize: 13, color: "#94A3B8" }}>{weather.windSpeed}mph {weather.windDir || ""}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: 20 }}>
        {/* Quick actions */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
          <button onClick={onNewDoc} style={{
            padding: "16px 18px", borderRadius: 3, border: "none", cursor: "pointer",
            background: T.accent, color: "#fff", fontFamily: T.font, display: "flex", alignItems: "center", gap: 10,
          }}>
            <Plus size={20} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>New Doc</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Field documentation</div>
            </div>
          </button>
          <button onClick={() => onNavigate?.("clockin")} style={{
            padding: "16px 18px", borderRadius: 3, cursor: "pointer", border: "none",
            background: todayRoster ? T.green : T.blue, fontFamily: T.font,
            display: "flex", alignItems: "center", gap: 10, color: "#fff",
          }}>
            <Clock size={20} />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                {todayRoster ? "Clocked In" : "Clock In"}
              </div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>
                {todayRoster ? `${todayRoster.members?.length || 0} members` : "Start your day"}
              </div>
            </div>
          </button>
        </div>

        {/* Today's Route */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>Today's Route</div>
            {totalStops > 0 && (
              <span style={{ fontSize: 12, color: T.textLight }}>
                {completedStops}/{totalStops} done
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 20, color: T.textLight }}>
              <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : todayStops.length === 0 ? (
            <div style={{
              padding: "20px 16px", background: T.card, borderRadius: 3,
              border: `1px dashed ${T.border}`, textAlign: "center", color: T.textLight, fontSize: 14,
            }}>
              No stops scheduled today
            </div>
          ) : (
            todayStops.map((stop, i) => (
              <button key={stop.id} onClick={() => onNavigate?.("schedule")} style={{
                display: "flex", gap: 12, padding: "14px 16px", background: T.card, width: "100%",
                borderRadius: 3, border: `1.5px solid ${stop.isDone ? T.accentBorder : T.border}`,
                marginBottom: 8, alignItems: "center", cursor: "pointer", fontFamily: T.font, textAlign: "left",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 3, flexShrink: 0,
                  background: stop.isDone ? T.accentLight : T.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {stop.isDone
                    ? <CheckCircle2 size={18} color={T.accent} />
                    : <div style={{
                        width: 22, height: 22, borderRadius: 3, background: stop.routeColor || T.accent,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 600, color: "#fff",
                      }}>{i + 1}</div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 600,
                    color: stop.isDone ? T.textLight : T.text,
                    textDecoration: stop.isDone ? "line-through" : "none",
                  }}>{stop.account.name}</div>
                  <div style={{ fontSize: 12, color: T.textLight, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {stop.account.address}{stop.account.city && `, ${stop.account.city}`}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: T.textLight, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={12} /> {stop.account.estimatedMinutes || stop.estimatedMinutes || 30}m
                </div>
              </button>
            ))
          )}

          {totalStops > 0 && (
            <button onClick={() => onNavigate?.("schedule")} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px", borderRadius: 3, border: "none", background: "transparent",
              cursor: "pointer", fontFamily: T.font, color: T.accent, fontSize: 13, fontWeight: 600,
              width: "100%",
            }}>
              View full schedule <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* Recent Docs */}
        {recentLogs.length > 0 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.text }}>Recent Docs</div>
              <button onClick={() => onNavigate?.("docs")} style={{
                border: "none", background: "none", cursor: "pointer", fontFamily: T.font,
                fontSize: 13, color: T.accent, fontWeight: 600, display: "flex", alignItems: "center", gap: 4,
              }}>
                All docs <ChevronRight size={14} />
              </button>
            </div>
            {recentLogs.slice(0, 3).map(log => (
              <div key={log.id} style={{
                display: "flex", gap: 12, padding: "14px 16px", background: T.card,
                borderRadius: 3, border: `1px solid ${T.border}`, marginBottom: 8, alignItems: "center",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 3, background: `${T.purple}10`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Droplets size={18} color={T.purple} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{log.property}</div>
                  <div style={{ fontSize: 12, color: T.textLight }}>
                    {log.products?.length || 0} product{(log.products?.length || 0) !== 1 ? "s" : ""} · {log.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

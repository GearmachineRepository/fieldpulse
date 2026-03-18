// ═══════════════════════════════════════════
// Field Docs — Crew's submitted docs
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import {
  Search, Droplets, FileText, Camera, Loader2, ChevronRight,
  MapPin, Clock, Users, Wind, Thermometer, Cloud,
} from "lucide-react"
import { T } from "@/app/tokens.js"
import useAuth from "@/hooks/useAuth.jsx"
import { getSprayLogs } from "@/lib/api/sprayLogs.js"

export default function FieldDocs() {
  const { crew } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState("")
  const [viewing, setViewing] = useState(null)

  useEffect(() => {
    if (!crew?.name) { setLoading(false); return }
    getSprayLogs({ crewName: crew.name })
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [crew])

  const filtered = logs.filter(log => {
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return (log.property || "").toLowerCase().includes(q) ||
      (log.crewLead || "").toLowerCase().includes(q)
  })

  return (
    <div>
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 16, color: T.text }}>My Docs</div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, background: T.card,
          borderRadius: 12, padding: "12px 14px", border: `1px solid ${T.border}`, marginBottom: 16,
        }}>
          <Search size={18} color={T.textLight} />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Search by property..."
            style={{ border: "none", outline: "none", flex: 1, fontSize: 14, fontFamily: T.font, background: "transparent", color: T.text }} />
        </div>
      </div>

      <div style={{ padding: "0 20px 20px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: T.textLight }}>
            <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            padding: "32px 16px", background: T.card, borderRadius: 14,
            border: `1px dashed ${T.border}`, textAlign: "center",
          }}>
            <FileText size={32} color={T.textLight} strokeWidth={1} style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>
              {searchQ ? "No matches" : "No docs yet"}
            </div>
            <div style={{ fontSize: 13, color: T.textLight }}>
              {searchQ ? "Try a different search." : "Submit your first spray log from the home screen."}
            </div>
          </div>
        ) : (
          filtered.map(log => (
            <button key={log.id} onClick={() => setViewing(log)} style={{
              display: "flex", gap: 14, padding: 16, background: T.card,
              borderRadius: 14, border: `1px solid ${T.border}`, marginBottom: 10,
              width: "100%", cursor: "pointer", fontFamily: T.font, textAlign: "left",
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10, background: `${T.purple}10`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Droplets size={20} color={T.purple} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{log.property}</div>
                  <div style={{ fontSize: 12, color: T.textLight, flexShrink: 0 }}>{log.date}</div>
                </div>
                <div style={{ fontSize: 13, color: T.textMed, marginTop: 2 }}>
                  {log.products?.length || 0} product{(log.products?.length || 0) !== 1 ? "s" : ""}
                  {log.crewLead && ` · ${log.crewLead}`}
                </div>
                {(log.photos || []).length > 0 && (
                  <div style={{ fontSize: 12, color: T.textLight, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <Camera size={12} /> {log.photos.length} photo{log.photos.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Detail view */}
      {viewing && <DocDetail log={viewing} onClose={() => setViewing(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function DocDetail({ log, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: T.bg, zIndex: 100,
      overflowY: "auto", fontFamily: T.font,
    }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, background: T.card, padding: "12px 20px",
        borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between",
        zIndex: 1,
      }}>
        <button onClick={onClose} style={{
          border: "none", background: "none", cursor: "pointer", fontFamily: T.font,
          fontSize: 14, color: T.accent, fontWeight: 600,
        }}>← Back</button>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Spray Log</div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: T.text }}>{log.property}</div>
        <div style={{ fontSize: 13, color: T.textLight, marginBottom: 20 }}>{log.date} at {log.time}</div>

        {/* Info cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          <InfoChip icon={Users} label="Crew" value={log.crewName} />
          <InfoChip icon={Users} label="Lead" value={log.crewLead} />
          {log.equipment && <InfoChip icon={MapPin} label="Equipment" value={log.equipment} />}
          {log.totalMixVol && <InfoChip icon={Droplets} label="Total Mix" value={log.totalMixVol} />}
        </div>

        {/* Weather */}
        {log.weather && (log.weather.temp || log.weather.windSpeed) && (
          <div style={{
            display: "flex", gap: 12, padding: "12px 16px", background: T.card,
            borderRadius: 12, border: `1px solid ${T.border}`, marginBottom: 20, flexWrap: "wrap",
          }}>
            {log.weather.temp && <span style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}><Thermometer size={14} color={T.textLight} /> {log.weather.temp}°F</span>}
            {log.weather.humidity && <span style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}><Droplets size={14} color={T.textLight} /> {log.weather.humidity}%</span>}
            {log.weather.windSpeed && <span style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}><Wind size={14} color={T.textLight} /> {log.weather.windSpeed}mph {log.weather.windDir || ""}</span>}
            {log.weather.conditions && <span style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}><Cloud size={14} color={T.textLight} /> {log.weather.conditions}</span>}
          </div>
        )}

        {/* Products */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: T.text }}>Products ({log.products?.length || 0})</div>
          {(log.products || []).map((p) => (
            <div key={p.id || p.name} style={{
              display: "flex", justifyContent: "space-between", padding: "12px 16px",
              background: T.card, borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: 6,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{p.name}</div>
                {p.epa && <div style={{ fontSize: 12, color: T.textLight }}>EPA: {p.epa}</div>}
              </div>
              {p.ozConcentrate && <div style={{ fontSize: 14, fontWeight: 700, color: T.accent }}>{p.ozConcentrate}</div>}
            </div>
          ))}
        </div>

        {/* Photos */}
        {log.photos && log.photos.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: T.text }}>Photos ({log.photos.length})</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {log.photos.map((p) => (
                <a key={p.id || p.filename} href={`/uploads/${p.filename}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: "block", borderRadius: 10, overflow: "hidden", aspectRatio: "1", background: T.bg }}>
                  <img src={`/uploads/${p.filename}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {log.notes && (
          <div style={{
            padding: "12px 16px", background: T.card, borderRadius: 12,
            border: `1px solid ${T.border}`, fontSize: 14, color: T.textMed, lineHeight: 1.6,
          }}>{log.notes}</div>
        )}
      </div>
    </div>
  )
}

function InfoChip({ icon: Icon, label, value }) {
  return (
    <div style={{ padding: "10px 14px", background: T.card, borderRadius: 10, border: `1px solid ${T.border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
        <Icon size={12} color={T.textLight} />
        <span style={{ fontSize: 10, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.3 }}>{label}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{value || "—"}</div>
    </div>
  )
}

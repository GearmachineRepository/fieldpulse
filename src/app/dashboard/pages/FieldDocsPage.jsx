// ═══════════════════════════════════════════
// Field Docs Page — Spray log viewer
//
// Admin-side view of all submitted field docs.
// Read-only — crews submit from the field app.
// Expandable rows to see products, weather, photos.
// ═══════════════════════════════════════════

import { useState } from "react"
import {
  FileText, Droplets, Camera, MapPin, Cloud, Wind,
  Thermometer, ChevronDown, ChevronUp, Download, Users,
  Eye, Calendar, Filter,
} from "lucide-react"
import { T } from "@/app/tokens.js"
import { useData } from "@/context/DataProvider.jsx"
import {
  Modal, PageHeader, SearchBar, LoadingSpinner, EmptyMessage,
} from "@/app/dashboard/components/PageUI.jsx"

export default function FieldDocsPage({ isMobile }) {
  const { sprayLogs, crews } = useData()
  const [searchQ, setSearchQ] = useState("")
  const [filterCrew, setFilterCrew] = useState("")
  const [viewing, setViewing] = useState(null)

  const filtered = sprayLogs.data.filter(log => {
    if (filterCrew && log.crewName !== filterCrew) return false
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return (log.property || "").toLowerCase().includes(q) ||
      (log.crewName || "").toLowerCase().includes(q) ||
      (log.crewLead || "").toLowerCase().includes(q)
  })

  const crewNames = [...new Set(sprayLogs.data.map(l => l.crewName).filter(Boolean))]

  return (
    <div>
      <PageHeader title="Field Docs" count={sprayLogs.data.length} countLabel="spray logs" />

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <SearchBar value={searchQ} onChange={setSearchQ} placeholder="Search by property, crew..." />
        </div>
        {crewNames.length > 1 && (
          <div style={{ marginBottom: 16 }}>
            <select value={filterCrew} onChange={e => setFilterCrew(e.target.value)} style={{
              padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.border}`,
              background: T.card, color: filterCrew ? T.text : T.textLight, fontSize: 13,
              fontWeight: 600, fontFamily: T.font, cursor: "pointer", outline: "none",
            }}>
              <option value="">All Crews</option>
              {crewNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Log list */}
      {sprayLogs.loading && !sprayLogs.data.length ? <LoadingSpinner /> :
       filtered.length === 0 ? (
        <EmptyMessage text={searchQ || filterCrew ? "No logs match your filters." : "No spray logs yet. Crews submit them from the field app."} />
      ) : (
        <div style={{
          background: T.card, borderRadius: 14, border: `1px solid ${T.border}`,
          boxShadow: T.shadow, overflow: "hidden",
        }}>
          {/* Table header */}
          {!isMobile && (
            <div style={{
              display: "grid", gridTemplateColumns: "120px 1fr 140px 100px 80px 60px",
              padding: "10px 18px", background: T.bg, gap: 12,
            }}>
              {["Date", "Property", "Crew", "Products", "Photos", ""].map(h => (
                <div key={h} style={{ fontSize: 11, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</div>
              ))}
            </div>
          )}

          {filtered.map((log, i) => (
            <div key={log.id}>
              {/* Desktop row */}
              {!isMobile ? (
                <button onClick={() => setViewing(log)} style={{
                  display: "grid", gridTemplateColumns: "120px 1fr 140px 100px 80px 60px",
                  padding: "14px 18px", width: "100%", border: "none", background: "none",
                  cursor: "pointer", fontFamily: T.font, textAlign: "left", gap: 12,
                  borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none",
                  transition: "background 0.1s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bg}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{log.date}</div>
                    <div style={{ fontSize: 12, color: T.textLight }}>{log.time}</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {log.property}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{log.crewName}</div>
                    <div style={{ fontSize: 12, color: T.textLight }}>{log.crewLead}</div>
                  </div>
                  <div style={{ fontSize: 13, color: T.textMed }}>
                    {log.products.length} product{log.products.length !== 1 ? "s" : ""}
                  </div>
                  <div style={{ fontSize: 13, color: T.textMed }}>
                    {(log.photos || []).length > 0 ? `${log.photos.length}` : "—"}
                  </div>
                  <div>
                    <Eye size={16} color={T.accent} />
                  </div>
                </button>
              ) : (
                /* Mobile card */
                <button onClick={() => setViewing(log)} style={{
                  display: "flex", gap: 12, padding: "14px 18px", width: "100%",
                  border: "none", background: "none", cursor: "pointer", fontFamily: T.font,
                  textAlign: "left", alignItems: "center",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${T.border}` : "none",
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, background: `${T.purple}10`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Droplets size={18} color={T.purple} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{log.property}</div>
                    <div style={{ fontSize: 12, color: T.textLight }}>
                      {log.crewName} · {log.products.length} product{log.products.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: T.textLight }}>{log.date}</div>
                    <div style={{ fontSize: 11, color: T.textLight }}>{log.time}</div>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {viewing && <LogDetailModal log={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

// ═══════════════════════════════════════════
// Log Detail Modal
// ═══════════════════════════════════════════
function LogDetailModal({ log, onClose }) {
  return (
    <Modal title="Spray Log Detail" onClose={onClose} size="lg">
      {/* Header info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{log.property}</div>
          <div style={{ fontSize: 13, color: T.textLight }}>
            {log.date} at {log.time}
          </div>
        </div>
        <div style={{
          padding: "6px 12px", borderRadius: 8, background: T.accentLight,
          fontSize: 12, fontWeight: 700, color: T.accent,
        }}>
          {log.status || "Synced"}
        </div>
      </div>

      {/* Info grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 1, background: T.border, borderRadius: 12, overflow: "hidden", marginBottom: 20,
      }}>
        <InfoCell icon={Users} label="Crew" value={log.crewName} />
        <InfoCell icon={Users} label="Lead" value={log.crewLead} />
        <InfoCell icon={FileText} label="License" value={log.license || "—"} />
        <InfoCell icon={MapPin} label="Location" value={log.location || "—"} />
      </div>

      {/* Weather */}
      {log.weather && (log.weather.temp || log.weather.windSpeed) && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: T.text }}>Weather at Time of Application</div>
          <div style={{
            display: "flex", gap: 16, padding: "12px 16px", background: T.bg,
            borderRadius: 10, flexWrap: "wrap",
          }}>
            {log.weather.temp && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <Thermometer size={14} color={T.textLight} />
                <span style={{ fontWeight: 700 }}>{log.weather.temp}°F</span>
              </div>
            )}
            {log.weather.humidity && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <Droplets size={14} color={T.textLight} />
                <span>{log.weather.humidity}%</span>
              </div>
            )}
            {log.weather.windSpeed && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <Wind size={14} color={T.textLight} />
                <span>{log.weather.windSpeed} mph {log.weather.windDir || ""}</span>
              </div>
            )}
            {log.weather.conditions && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <Cloud size={14} color={T.textLight} />
                <span>{log.weather.conditions}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: T.text }}>
          Products Applied ({log.products.length})
        </div>
        {log.products.length === 0 ? (
          <div style={{ fontSize: 13, color: T.textLight }}>No products recorded</div>
        ) : (
          <div style={{
            background: T.bg, borderRadius: 10, overflow: "hidden",
          }}>
            {log.products.map((p, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 16px",
                borderBottom: i < log.products.length - 1 ? `1px solid ${T.border}` : "none",
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{p.name}</div>
                  {p.epa && <div style={{ fontSize: 12, color: T.textLight }}>EPA: {p.epa}</div>}
                </div>
                {p.ozConcentrate && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>{p.ozConcentrate}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Equipment & mix */}
      {(log.equipment || log.totalMixVol) && (
        <div style={{
          display: "flex", gap: 16, marginBottom: 20, padding: "12px 16px",
          background: T.bg, borderRadius: 10, flexWrap: "wrap", fontSize: 13,
        }}>
          {log.equipment && <div><span style={{ color: T.textLight }}>Equipment:</span> <span style={{ fontWeight: 600 }}>{log.equipment}</span></div>}
          {log.totalMixVol && <div><span style={{ color: T.textLight }}>Total Mix:</span> <span style={{ fontWeight: 600 }}>{log.totalMixVol}</span></div>}
          {log.targetPest && <div><span style={{ color: T.textLight }}>Target:</span> <span style={{ fontWeight: 600 }}>{log.targetPest}</span></div>}
        </div>
      )}

      {/* Crew members */}
      {log.members && log.members.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: T.text }}>Crew Members Present</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {log.members.map((m, i) => (
              <div key={i} style={{
                padding: "6px 12px", background: T.bg, borderRadius: 8,
                fontSize: 13, fontWeight: 600, color: T.textMed,
              }}>
                {m.employee_name || m.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photos */}
      {log.photos && log.photos.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: T.text }}>Photos ({log.photos.length})</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
            {log.photos.map((photo, i) => (
              <a key={i} href={`/uploads/${photo.filename}`} target="_blank" rel="noopener noreferrer" style={{
                display: "block", borderRadius: 10, overflow: "hidden", aspectRatio: "1",
                background: T.bg, border: `1px solid ${T.border}`,
              }}>
                <img src={`/uploads/${photo.filename}`} alt={photo.original_name || `Photo ${i + 1}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {log.notes && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: T.text }}>Notes</div>
          <div style={{ fontSize: 14, color: T.textMed, lineHeight: 1.6, background: T.bg, borderRadius: 10, padding: "12px 16px" }}>
            {log.notes}
          </div>
        </div>
      )}
    </Modal>
  )
}

function InfoCell({ icon: Icon, label, value }) {
  return (
    <div style={{ background: T.card, padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <Icon size={13} color={T.textLight} />
        <span style={{ fontSize: 11, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: "0.3px" }}>{label}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{value}</div>
    </div>
  )
}

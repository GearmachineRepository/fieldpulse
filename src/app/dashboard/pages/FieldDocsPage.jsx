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
import { useData } from "@/context/DataProvider.jsx"
import {
  Modal, PageHeader, SearchBar, LoadingSpinner, EmptyMessage,
} from "@/app/dashboard/components/PageUI.jsx"
import s from "./FieldDocsPage.module.css"

export default function FieldDocsPage() {
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
      <div className={s.filters}>
        <div className={s.searchWrap}>
          <SearchBar value={searchQ} onChange={setSearchQ} placeholder="Search by property, crew..." />
        </div>
        {crewNames.length > 1 && (
          <div className={s.selectWrap}>
            <select
              value={filterCrew}
              onChange={e => setFilterCrew(e.target.value)}
              className={s.crewSelect}
              style={{ color: filterCrew ? "var(--t1)" : undefined }}
            >
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
        <div className={s.logList}>
          {/* Table header */}
          <div className={s.tableHeader}>
            {["Date", "Property", "Crew", "Products", "Photos", ""].map(h => (
              <div key={h} className={s.colLabel}>{h}</div>
            ))}
          </div>

          {filtered.map((log, i) => (
            <div key={log.id}>
              {/* Desktop row */}
              <button
                onClick={() => setViewing(log)}
                className={`${s.desktopRow} ${i < filtered.length - 1 ? s.rowBorder : ""}`}
              >
                <div>
                  <div className={s.dateText}>{log.date}</div>
                  <div className={s.timeText}>{log.time}</div>
                </div>
                <div className={s.propertyText}>
                  {log.property}
                </div>
                <div>
                  <div className={s.crewName}>{log.crewName}</div>
                  <div className={s.crewLead}>{log.crewLead}</div>
                </div>
                <div className={s.cellMed}>
                  {log.products.length} product{log.products.length !== 1 ? "s" : ""}
                </div>
                <div className={s.cellMed}>
                  {(log.photos || []).length > 0 ? `${log.photos.length}` : "—"}
                </div>
                <div>
                  <Eye size={16} color="var(--amb)" />
                </div>
              </button>

              {/* Mobile card */}
              <button
                onClick={() => setViewing(log)}
                className={`${s.mobileRow} ${i < filtered.length - 1 ? s.rowBorder : ""}`}
              >
                <div className={s.mobileIcon}>
                  <Droplets size={18} color="var(--blu)" />
                </div>
                <div className={s.mobileContent}>
                  <div className={s.mobileProperty}>{log.property}</div>
                  <div className={s.mobileMeta}>
                    {log.crewName} · {log.products.length} product{log.products.length !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className={s.mobileDate}>
                  <div className={s.mobileDateText}>{log.date}</div>
                  <div className={s.mobileTimeText}>{log.time}</div>
                </div>
              </button>
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
      <div className={s.modalHeader}>
        <div>
          <div className={s.modalTitle}>{log.property}</div>
          <div className={s.modalSubtitle}>
            {log.date} at {log.time}
          </div>
        </div>
        <div className={s.statusBadge}>
          {log.status || "Synced"}
        </div>
      </div>

      {/* Info grid */}
      <div className={s.infoGrid}>
        <InfoCell icon={Users} label="Crew" value={log.crewName} />
        <InfoCell icon={Users} label="Lead" value={log.crewLead} />
        <InfoCell icon={FileText} label="License" value={log.license || "—"} />
        <InfoCell icon={MapPin} label="Location" value={log.location || "—"} />
      </div>

      {/* Weather */}
      {log.weather && (log.weather.temp || log.weather.windSpeed) && (
        <div className={s.section}>
          <div className={s.sectionTitle}>Weather at Time of Application</div>
          <div className={s.weatherBar}>
            {log.weather.temp && (
              <div className={s.weatherItem}>
                <Thermometer size={14} color="var(--t3)" />
                <span className={s.weatherBold}>{log.weather.temp}°F</span>
              </div>
            )}
            {log.weather.humidity && (
              <div className={s.weatherItem}>
                <Droplets size={14} color="var(--t3)" />
                <span>{log.weather.humidity}%</span>
              </div>
            )}
            {log.weather.windSpeed && (
              <div className={s.weatherItem}>
                <Wind size={14} color="var(--t3)" />
                <span>{log.weather.windSpeed} mph {log.weather.windDir || ""}</span>
              </div>
            )}
            {log.weather.conditions && (
              <div className={s.weatherItem}>
                <Cloud size={14} color="var(--t3)" />
                <span>{log.weather.conditions}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products */}
      <div className={s.section}>
        <div className={s.sectionTitle}>
          Products Applied ({log.products.length})
        </div>
        {log.products.length === 0 ? (
          <div className={s.noProducts}>No products recorded</div>
        ) : (
          <div className={s.productList}>
            {log.products.map((p, i) => (
              <div key={i} className={s.productRow}
                style={i < log.products.length - 1 ? { borderBottom: "1px solid var(--bd)" } : undefined}
              >
                <div>
                  <div className={s.productName}>{p.name}</div>
                  {p.epa && <div className={s.productEpa}>EPA: {p.epa}</div>}
                </div>
                {p.ozConcentrate && (
                  <div className={s.productConc}>{p.ozConcentrate}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Equipment & mix */}
      {(log.equipment || log.totalMixVol) && (
        <div className={s.equipBar}>
          {log.equipment && <div><span className={s.equipLabel}>Equipment:</span> <span className={s.equipValue}>{log.equipment}</span></div>}
          {log.totalMixVol && <div><span className={s.equipLabel}>Total Mix:</span> <span className={s.equipValue}>{log.totalMixVol}</span></div>}
          {log.targetPest && <div><span className={s.equipLabel}>Target:</span> <span className={s.equipValue}>{log.targetPest}</span></div>}
        </div>
      )}

      {/* Crew members */}
      {log.members && log.members.length > 0 && (
        <div className={s.section}>
          <div className={s.sectionTitle}>Crew Members Present</div>
          <div className={s.memberList}>
            {log.members.map((m, i) => (
              <div key={i} className={s.memberChip}>
                {m.employee_name || m.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Photos */}
      {log.photos && log.photos.length > 0 && (
        <div className={s.section}>
          <div className={s.sectionTitle}>Photos ({log.photos.length})</div>
          <div className={s.photoGrid}>
            {log.photos.map((photo, i) => (
              <a key={i} href={`/uploads/${photo.filename}`} target="_blank" rel="noopener noreferrer" className={s.photoLink}>
                <img src={`/uploads/${photo.filename}`} alt={photo.original_name || `Photo ${i + 1}`}
                  className={s.photoImg} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {log.notes && (
        <div className={s.notesSection}>
          <div className={s.notesTitle}>Notes</div>
          <div className={s.notesBody}>
            {log.notes}
          </div>
        </div>
      )}
    </Modal>
  )
}

function InfoCell({ icon: Icon, label, value }) {
  return (
    <div className={s.infoCell}>
      <div className={s.infoCellHeader}>
        <Icon size={13} color="var(--t3)" />
        <span className={s.infoCellLabel}>{label}</span>
      </div>
      <div className={s.infoCellValue}>{value}</div>
    </div>
  )
}

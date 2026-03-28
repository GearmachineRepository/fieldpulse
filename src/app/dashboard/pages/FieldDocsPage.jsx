// ═══════════════════════════════════════════
// Field Docs Page — All field submissions
//
// Admin-side view of docs submitted by field crews:
// spray logs, general notes, inspections.
// Read-only — crews submit from the field app.
// ═══════════════════════════════════════════

import { useState, useEffect } from 'react'
import {
  FileText,
  Droplets,
  MapPin,
  Cloud,
  Wind,
  Thermometer,
  Users,
  Eye,
  ClipboardList,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import AddressLink from '../components/AddressLink.jsx'
import usePageData from '@/hooks/usePageData.js'
import { getSprayLogs } from '@/lib/api/sprayLogs.js'
import { getCrews } from '@/lib/api/crews.js'
import { getFieldDocs } from '@/lib/api/fieldDocs.js'
import {
  Modal,
  PageHeader,
  SearchBar,
  LoadingSpinner,
  EmptyMessage,
} from '@/app/dashboard/components/PageUI.jsx'
import s from './FieldDocsPage.module.css'

const DOC_TYPE_META = {
  'spray-log': { icon: Droplets, label: 'Spray Log', color: 'var(--blu)' },
  note: { icon: FileText, label: 'Note', color: 'var(--blu)' },
  inspection: { icon: ClipboardList, label: 'Inspection', color: 'var(--amb)' },
}

const FILTER_TYPES = [
  { key: '', label: 'All Types' },
  { key: 'spray-log', label: 'Spray Logs' },
  { key: 'note', label: 'Notes' },
  { key: 'inspection', label: 'Inspections' },
]

export default function FieldDocsPage() {
  const sprayLogs = usePageData('sprayLogs', { fetchFn: getSprayLogs })
  const _crews = usePageData('crews', { fetchFn: getCrews })
  const [fieldDocs, setFieldDocs] = useState([])
  const [fieldDocsLoading, setFieldDocsLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const [filterCrew, setFilterCrew] = useState('')
  const [filterType, setFilterType] = useState('')
  const [viewing, setViewing] = useState(null)

  // Fetch field docs (notes + inspections)
  useEffect(() => {
    let active = true
    getFieldDocs()
      .then((d) => {
        if (active) setFieldDocs(d)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setFieldDocsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // Combine all docs into unified list
  const allDocs = [
    ...sprayLogs.data.map((sl) => ({
      id: `spray-${sl.id}`,
      docType: 'spray-log',
      title: sl.property,
      crewName: sl.crewName,
      employeeName: sl.crewLead,
      date: sl.date,
      time: sl.time,
      photoCount: (sl.photos || []).length,
      status: sl.status || 'synced',
      raw: sl,
      sortDate: sl.date,
    })),
    ...fieldDocs.map((fd) => ({
      id: `field-${fd.id}`,
      docType: fd.type,
      title: fd.title,
      crewName: fd.crewName,
      employeeName: fd.employeeName,
      date: fd.date,
      time: fd.time,
      photoCount: fd.photoCount || 0,
      status: fd.status,
      raw: fd,
      sortDate: fd.createdAt,
    })),
  ]

  // Sort newest first
  allDocs.sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate))

  const filtered = allDocs.filter((doc) => {
    if (filterType && doc.docType !== filterType) return false
    if (filterCrew && doc.crewName !== filterCrew) return false
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return (
      doc.title.toLowerCase().includes(q) ||
      (doc.crewName || '').toLowerCase().includes(q) ||
      (doc.employeeName || '').toLowerCase().includes(q)
    )
  })

  const crewNames = [...new Set(allDocs.map((d) => d.crewName).filter(Boolean))]
  const isLoading = (sprayLogs.loading && !sprayLogs.data.length) || fieldDocsLoading

  return (
    <div>
      <PageHeader title="Field Docs" count={allDocs.length} countLabel="documents" />

      {/* Filters */}
      <div className={s.filters}>
        <div className={s.searchWrap}>
          <SearchBar value={searchQ} onChange={setSearchQ} placeholder="Search by title, crew..." />
        </div>
        <div className={s.selectWrap}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={s.crewSelect}
            style={{ color: filterType ? 'var(--t1)' : undefined }}
          >
            {FILTER_TYPES.map((ft) => (
              <option key={ft.key} value={ft.key}>
                {ft.label}
              </option>
            ))}
          </select>
        </div>
        {crewNames.length > 1 && (
          <div className={s.selectWrap}>
            <select
              value={filterCrew}
              onChange={(e) => setFilterCrew(e.target.value)}
              className={s.crewSelect}
              style={{ color: filterCrew ? 'var(--t1)' : undefined }}
            >
              <option value="">All Crews</option>
              {crewNames.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Doc list */}
      {isLoading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyMessage
          text={
            searchQ || filterCrew || filterType
              ? 'No docs match your filters.'
              : 'No field docs yet. Crews submit them from the field app.'
          }
        />
      ) : (
        <div className={s.logList}>
          {/* Table header */}
          <div className={s.tableHeader}>
            {['Date', 'Type', 'Title', 'Crew', 'Photos', 'Status', ''].map((h) => (
              <div key={h} className={s.colLabel}>
                {h}
              </div>
            ))}
          </div>

          {filtered.map((doc, i) => {
            const meta = DOC_TYPE_META[doc.docType] || DOC_TYPE_META.note
            return (
              <div key={doc.id}>
                {/* Desktop row */}
                <button
                  onClick={() => setViewing(doc)}
                  className={`${s.desktopRow} ${i < filtered.length - 1 ? s.rowBorder : ''}`}
                  style={{ gridTemplateColumns: '100px 110px 1fr 130px 70px 90px 50px' }}
                >
                  <div>
                    <div className={s.dateText}>{doc.date}</div>
                    <div className={s.timeText}>{doc.time}</div>
                  </div>
                  <div>
                    <span
                      className={s.typeBadge}
                      style={{ background: `${meta.color}15`, color: meta.color }}
                    >
                      <meta.icon size={12} /> {meta.label}
                    </span>
                  </div>
                  <div className={s.propertyText}>{doc.title}</div>
                  <div>
                    <div className={s.crewName}>{doc.crewName}</div>
                    <div className={s.crewLead}>{doc.employeeName}</div>
                  </div>
                  <div className={s.cellMed}>{doc.photoCount > 0 ? doc.photoCount : '—'}</div>
                  <div>
                    <span
                      className={`${s.statusBadge} ${doc.status === 'flagged' ? s.statusFlagged : ''}`}
                    >
                      {doc.status || 'submitted'}
                    </span>
                  </div>
                  <div>
                    <Eye size={16} color="var(--amb)" />
                  </div>
                </button>

                {/* Mobile card */}
                <button
                  onClick={() => setViewing(doc)}
                  className={`${s.mobileRow} ${i < filtered.length - 1 ? s.rowBorder : ''}`}
                >
                  <div className={s.mobileIcon} style={{ background: `${meta.color}15` }}>
                    <meta.icon size={18} color={meta.color} />
                  </div>
                  <div className={s.mobileContent}>
                    <div className={s.mobileProperty}>{doc.title}</div>
                    <div className={s.mobileMeta}>
                      {meta.label} · {doc.crewName}
                      {doc.photoCount > 0
                        ? ` · ${doc.photoCount} photo${doc.photoCount !== 1 ? 's' : ''}`
                        : ''}
                    </div>
                  </div>
                  <div className={s.mobileDate}>
                    <div className={s.mobileDateText}>{doc.date}</div>
                    <div className={s.mobileTimeText}>{doc.time}</div>
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail modal */}
      {viewing && <DocDetailModal doc={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}

// ═══════════════════════════════════════════
// Detail Modal — renders based on doc type
// ═══════════════════════════════════════════
function DocDetailModal({ doc, onClose }) {
  if (doc.docType === 'spray-log') return <SprayLogModal log={doc.raw} onClose={onClose} />
  if (doc.docType === 'inspection') return <InspectionModal doc={doc.raw} onClose={onClose} />
  return <NoteModal doc={doc.raw} onClose={onClose} />
}

function SprayLogModal({ log, onClose }) {
  return (
    <Modal title="Spray Log Detail" onClose={onClose} size="lg">
      <div className={s.modalHeader}>
        <div>
          <div className={s.modalTitle}>{log.property}</div>
          <div className={s.modalSubtitle}>
            {log.date} at {log.time}
          </div>
        </div>
        <div className={s.statusBadge}>{log.status || 'Synced'}</div>
      </div>

      <div className={s.infoGrid}>
        <InfoCell icon={Users} label="Crew" value={log.crewName} />
        <InfoCell icon={Users} label="Lead" value={log.crewLead} />
        <InfoCell icon={FileText} label="License" value={log.license || '—'} />
        <InfoCell
          icon={MapPin}
          label="Location"
          value={log.location ? <AddressLink location={log.location} /> : '—'}
        />
      </div>

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
                <span>
                  {log.weather.windSpeed} mph {log.weather.windDir || ''}
                </span>
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

      <div className={s.section}>
        <div className={s.sectionTitle}>Products Applied ({log.products.length})</div>
        {log.products.length === 0 ? (
          <div className={s.noProducts}>No products recorded</div>
        ) : (
          <div className={s.productList}>
            {log.products.map((p, i) => (
              <div
                key={i}
                className={s.productRow}
                style={
                  i < log.products.length - 1 ? { borderBottom: '1px solid var(--bd)' } : undefined
                }
              >
                <div>
                  <div className={s.productName}>{p.name}</div>
                  {p.epa && <div className={s.productEpa}>EPA: {p.epa}</div>}
                </div>
                {p.ozConcentrate && <div className={s.productConc}>{p.ozConcentrate}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {(log.equipment || log.totalMixVol) && (
        <div className={s.equipBar}>
          {log.equipment && (
            <div>
              <span className={s.equipLabel}>Equipment:</span>{' '}
              <span className={s.equipValue}>{log.equipment}</span>
            </div>
          )}
          {log.totalMixVol && (
            <div>
              <span className={s.equipLabel}>Total Mix:</span>{' '}
              <span className={s.equipValue}>{log.totalMixVol}</span>
            </div>
          )}
          {log.targetPest && (
            <div>
              <span className={s.equipLabel}>Target:</span>{' '}
              <span className={s.equipValue}>{log.targetPest}</span>
            </div>
          )}
        </div>
      )}

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

      {log.photos && log.photos.length > 0 && (
        <div className={s.section}>
          <div className={s.sectionTitle}>Photos ({log.photos.length})</div>
          <div className={s.photoGrid}>
            {log.photos.map((photo, i) => (
              <a
                key={i}
                href={`/uploads/${photo.filename}`}
                target="_blank"
                rel="noopener noreferrer"
                className={s.photoLink}
              >
                <img
                  src={`/uploads/${photo.filename}`}
                  alt={photo.original_name || `Photo ${i + 1}`}
                  className={s.photoImg}
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {log.notes && (
        <div className={s.notesSection}>
          <div className={s.notesTitle}>Notes</div>
          <div className={s.notesBody}>{log.notes}</div>
        </div>
      )}
    </Modal>
  )
}

function NoteModal({ doc, onClose }) {
  return (
    <Modal title="General Note" onClose={onClose} size="lg">
      <div className={s.modalHeader}>
        <div>
          <div className={s.modalTitle}>{doc.title}</div>
          <div className={s.modalSubtitle}>
            {doc.date} at {doc.time}
          </div>
        </div>
        <div className={s.statusBadge}>{doc.status || 'Submitted'}</div>
      </div>

      <div className={s.infoGrid}>
        <InfoCell icon={Users} label="Submitted By" value={doc.employeeName || '—'} />
        <InfoCell icon={Users} label="Crew" value={doc.crewName || '—'} />
        {doc.location && (
          <InfoCell
            icon={MapPin}
            label="Location"
            value={<AddressLink location={doc.location} />}
          />
        )}
      </div>

      {doc.body && (
        <div className={s.notesSection}>
          <div className={s.notesTitle}>Notes</div>
          <div className={s.notesBody}>{doc.body}</div>
        </div>
      )}

      {doc.photos && doc.photos.length > 0 && (
        <div className={s.section}>
          <div className={s.sectionTitle}>Photos ({doc.photos.length})</div>
          <div className={s.photoGrid}>
            {doc.photos.map((photo, i) => (
              <a
                key={i}
                href={`/uploads/${photo.filename}`}
                target="_blank"
                rel="noopener noreferrer"
                className={s.photoLink}
              >
                <img
                  src={`/uploads/${photo.filename}`}
                  alt={photo.originalName || `Photo ${i + 1}`}
                  className={s.photoImg}
                />
              </a>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}

function InspectionModal({ doc, onClose }) {
  const checklist = doc.checklist || []
  const passCount = checklist.filter((c) => c.status === 'pass').length
  const failCount = checklist.filter((c) => c.status === 'fail').length
  const naCount = checklist.filter((c) => c.status === 'na').length

  return (
    <Modal title="Inspection Report" onClose={onClose} size="lg">
      <div className={s.modalHeader}>
        <div>
          <div className={s.modalTitle}>{doc.title}</div>
          <div className={s.modalSubtitle}>
            {doc.date} at {doc.time}
          </div>
        </div>
        <div className={`${s.statusBadge} ${doc.status === 'flagged' ? s.statusFlagged : ''}`}>
          {doc.status === 'flagged' ? 'Flagged' : 'Submitted'}
        </div>
      </div>

      <div className={s.infoGrid}>
        <InfoCell icon={Users} label="Inspector" value={doc.employeeName || '—'} />
        <InfoCell icon={Users} label="Crew" value={doc.crewName || '—'} />
        {doc.location && (
          <InfoCell
            icon={MapPin}
            label="Location"
            value={<AddressLink location={doc.location} />}
          />
        )}
        <InfoCell
          icon={ClipboardList}
          label="Template"
          value={doc.metadata?.template || 'Custom'}
        />
      </div>

      {/* Summary */}
      <div className={s.section}>
        <div className={s.sectionTitle}>Results Summary</div>
        <div className={s.weatherBar}>
          <div className={s.weatherItem} style={{ color: 'var(--amb)' }}>
            <CheckCircle size={14} /> <span style={{ fontWeight: 600 }}>{passCount} Pass</span>
          </div>
          <div className={s.weatherItem} style={{ color: 'var(--red)' }}>
            <XCircle size={14} /> <span style={{ fontWeight: 600 }}>{failCount} Fail</span>
          </div>
          <div className={s.weatherItem}>
            <span style={{ fontWeight: 600, color: 'var(--t3)' }}>{naCount} N/A</span>
          </div>
        </div>
      </div>

      {/* Checklist items */}
      <div className={s.section}>
        <div className={s.sectionTitle}>Checklist ({checklist.length} items)</div>
        <div className={s.productList}>
          {checklist.map((c, i) => (
            <div
              key={i}
              className={s.productRow}
              style={{
                borderBottom: i < checklist.length - 1 ? '1px solid var(--bd)' : undefined,
                borderLeft: c.status === 'fail' ? '3px solid var(--red)' : undefined,
              }}
            >
              <div>
                <div className={s.productName}>{c.item}</div>
                {c.note && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--red)', marginTop: 2 }}>
                    {c.note}
                  </div>
                )}
              </div>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color:
                    c.status === 'pass'
                      ? 'var(--amb)'
                      : c.status === 'fail'
                        ? 'var(--red)'
                        : 'var(--t3)',
                }}
              >
                {c.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {doc.body && (
        <div className={s.notesSection}>
          <div className={s.notesTitle}>Notes</div>
          <div className={s.notesBody}>{doc.body}</div>
        </div>
      )}

      {doc.photos && doc.photos.length > 0 && (
        <div className={s.section}>
          <div className={s.sectionTitle}>Photos ({doc.photos.length})</div>
          <div className={s.photoGrid}>
            {doc.photos.map((photo, i) => (
              <a
                key={i}
                href={`/uploads/${photo.filename}`}
                target="_blank"
                rel="noopener noreferrer"
                className={s.photoLink}
              >
                <img
                  src={`/uploads/${photo.filename}`}
                  alt={photo.originalName || `Photo ${i + 1}`}
                  className={s.photoImg}
                />
              </a>
            ))}
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

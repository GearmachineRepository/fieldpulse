// ═══════════════════════════════════════════
// Field Docs — Crew's submitted docs (all types)
//
// Shows spray logs, general notes, inspections,
// and incidents in a unified list.
// ═══════════════════════════════════════════

import { useState, useEffect } from 'react'
import {
  Search,
  Droplets,
  FileText,
  Camera,
  Loader2,
  MapPin,
  Users,
  Wind,
  Thermometer,
  Cloud,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { T } from '@/app/tokens.js'
import useAuth from '@/hooks/useAuth.jsx'
import { getSprayLogs } from '@/lib/api/sprayLogs.js'
import { getFieldDocs } from '@/lib/api/fieldDocs.js'

const DOC_TYPE_META = {
  'spray-log': { icon: Droplets, label: 'Spray Log', color: T.purple },
  note: { icon: FileText, label: 'Note', color: T.blue },
  inspection: { icon: ClipboardList, label: 'Inspection', color: T.accent },
  incident: { icon: AlertTriangle, label: 'Incident', color: T.red },
}

const FILTER_PILLS = [
  { key: 'all', label: 'All' },
  { key: 'spray-log', label: 'Spray Logs' },
  { key: 'note', label: 'Notes' },
  { key: 'inspection', label: 'Inspections' },
]

export default function FieldDocs() {
  const { crew } = useAuth()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [viewing, setViewing] = useState(null)

  useEffect(() => {
    if (!crew?.name) {
      setLoading(false)
      return
    } // eslint-disable-line react-hooks/set-state-in-effect -- Early exit guard

    let active = true

    // Fetch all doc types in parallel
    Promise.all([
      getSprayLogs({ crewName: crew.name }).catch(() => []),
      getFieldDocs({ crewName: crew.name }).catch(() => []),
    ])
      .then(([sprayLogs, fieldDocs]) => {
        if (!active) return
        // Normalize spray logs into unified shape
        const normalizedSpray = sprayLogs.map((sl) => ({
          id: `spray-${sl.id}`,
          rawId: sl.id,
          docType: 'spray-log',
          title: sl.property,
          subtitle: `${sl.products?.length || 0} product${(sl.products?.length || 0) !== 1 ? 's' : ''}${sl.crewLead ? ` · ${sl.crewLead}` : ''}`,
          date: sl.date,
          time: sl.time,
          photoCount: (sl.photos || []).length,
          status: sl.status || 'synced',
          raw: sl,
        }))

        // Normalize field docs (notes + inspections)
        const normalizedField = fieldDocs.map((fd) => ({
          id: `field-${fd.id}`,
          rawId: fd.id,
          docType: fd.type,
          title: fd.title,
          subtitle:
            fd.type === 'inspection'
              ? `${fd.metadata?.passCount || 0} pass · ${fd.metadata?.failCount || 0} fail`
              : fd.body
                ? fd.body.slice(0, 60) + (fd.body.length > 60 ? '...' : '')
                : fd.employeeName || '',
          date: fd.date,
          time: fd.time,
          photoCount: fd.photoCount || 0,
          status: fd.status,
          raw: fd,
        }))

        // Combine and sort by date (newest first)
        const all = [...normalizedSpray, ...normalizedField]
        all.sort((a, b) => {
          const da = a.raw.createdAt || a.raw.created_at || a.date
          const db = b.raw.createdAt || b.raw.created_at || b.date
          return new Date(db) - new Date(da)
        })
        setDocs(all)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [crew])

  const filtered = docs.filter((doc) => {
    if (filter !== 'all' && doc.docType !== filter) return false
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return doc.title.toLowerCase().includes(q) || (doc.subtitle || '').toLowerCase().includes(q)
  })

  return (
    <div>
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 16, color: T.text }}>
          My Docs
        </div>

        {/* Search */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: T.card,
            borderRadius: 3,
            padding: '12px 14px',
            border: `1px solid ${T.border}`,
            marginBottom: 12,
          }}
        >
          <Search size={18} color={T.textLight} />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search docs..."
            style={{
              border: 'none',
              outline: 'none',
              flex: 1,
              fontSize: 14,
              fontFamily: T.font,
              background: 'transparent',
              color: T.text,
            }}
          />
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' }}>
          {FILTER_PILLS.map((fp) => (
            <button
              key={fp.key}
              onClick={() => setFilter(fp.key)}
              style={{
                padding: '6px 12px',
                borderRadius: 3,
                fontFamily: T.font,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                border: filter === fp.key ? 'none' : `1.5px solid ${T.border}`,
                background: filter === fp.key ? T.accent : 'transparent',
                color: filter === fp.key ? T.card : T.textMed,
              }}
            >
              {fp.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: T.textLight }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              padding: '32px 16px',
              background: T.card,
              borderRadius: 3,
              border: `1px dashed ${T.border}`,
              textAlign: 'center',
            }}
          >
            <FileText
              size={32}
              color={T.textLight}
              strokeWidth={1}
              style={{ margin: '0 auto 12px' }}
            />
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 4 }}>
              {searchQ || filter !== 'all' ? 'No matches' : 'No docs yet'}
            </div>
            <div style={{ fontSize: 13, color: T.textLight }}>
              {searchQ || filter !== 'all'
                ? 'Try a different search or filter.'
                : 'Tap the + button on home to create your first doc.'}
            </div>
          </div>
        ) : (
          filtered.map((doc) => {
            const meta = DOC_TYPE_META[doc.docType] || DOC_TYPE_META.note
            return (
              <button
                key={doc.id}
                onClick={() => setViewing(doc)}
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: 16,
                  background: T.card,
                  borderRadius: 3,
                  border: `1px solid ${T.border}`,
                  marginBottom: 10,
                  width: '100%',
                  cursor: 'pointer',
                  fontFamily: T.font,
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 3,
                    background: `${meta.color}10`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <meta.icon size={20} color={meta.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: T.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {doc.title}
                    </div>
                    <div style={{ fontSize: 12, color: T.textLight, flexShrink: 0 }}>
                      {doc.date}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: T.textMed,
                      marginTop: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {doc.subtitle}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: 3,
                        background: `${meta.color}12`,
                        color: meta.color,
                      }}
                    >
                      {meta.label}
                    </span>
                    {doc.photoCount > 0 && (
                      <span
                        style={{
                          fontSize: 12,
                          color: T.textLight,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <Camera size={11} /> {doc.photoCount}
                      </span>
                    )}
                    {doc.status === 'flagged' && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: T.red,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <AlertTriangle size={11} /> Flagged
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Detail view */}
      {viewing && <DocDetail doc={viewing} onClose={() => setViewing(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ═══════════════════════════════════════════
// Doc Detail — full-screen viewer
// ═══════════════════════════════════════════
function DocDetail({ doc, onClose }) {
  if (doc.docType === 'spray-log') return <SprayLogDetail log={doc.raw} onClose={onClose} />
  if (doc.docType === 'inspection') return <InspectionDetail doc={doc.raw} onClose={onClose} />
  return <NoteDetail doc={doc.raw} onClose={onClose} />
}

function SprayLogDetail({ log, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: T.bg,
        zIndex: 100,
        overflowY: 'auto',
        fontFamily: T.font,
      }}
    >
      <DetailHeader title="Spray Log" onClose={onClose} />
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, color: T.text }}>
          {log.property}
        </div>
        <div style={{ fontSize: 13, color: T.textLight, marginBottom: 20 }}>
          {log.date} at {log.time}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          <InfoChip icon={Users} label="Crew" value={log.crewName} />
          <InfoChip icon={Users} label="Lead" value={log.crewLead} />
          {log.equipment && <InfoChip icon={MapPin} label="Equipment" value={log.equipment} />}
          {log.totalMixVol && (
            <InfoChip icon={Droplets} label="Total Mix" value={log.totalMixVol} />
          )}
        </div>

        {log.weather && (log.weather.temp || log.weather.windSpeed) && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              padding: '12px 16px',
              background: T.card,
              borderRadius: 3,
              border: `1px solid ${T.border}`,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            {log.weather.temp && (
              <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Thermometer size={14} color={T.textLight} /> {log.weather.temp}°F
              </span>
            )}
            {log.weather.humidity && (
              <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Droplets size={14} color={T.textLight} /> {log.weather.humidity}%
              </span>
            )}
            {log.weather.windSpeed && (
              <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Wind size={14} color={T.textLight} /> {log.weather.windSpeed}mph{' '}
                {log.weather.windDir || ''}
              </span>
            )}
            {log.weather.conditions && (
              <span style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Cloud size={14} color={T.textLight} /> {log.weather.conditions}
              </span>
            )}
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: T.text }}>
            Products ({log.products?.length || 0})
          </div>
          {(log.products || []).map((p) => (
            <div
              key={p.id || p.name}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: T.card,
                borderRadius: 3,
                border: `1px solid ${T.border}`,
                marginBottom: 6,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{p.name}</div>
                {p.epa && <div style={{ fontSize: 12, color: T.textLight }}>EPA: {p.epa}</div>}
              </div>
              {p.ozConcentrate && (
                <div style={{ fontSize: 14, fontWeight: 600, color: T.accent }}>
                  {p.ozConcentrate}
                </div>
              )}
            </div>
          ))}
        </div>

        <PhotoGrid photos={log.photos} />

        {log.notes && (
          <div
            style={{
              padding: '12px 16px',
              background: T.card,
              borderRadius: 3,
              border: `1px solid ${T.border}`,
              fontSize: 14,
              color: T.textMed,
              lineHeight: 1.6,
            }}
          >
            {log.notes}
          </div>
        )}
      </div>
    </div>
  )
}

function NoteDetail({ doc, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: T.bg,
        zIndex: 100,
        overflowY: 'auto',
        fontFamily: T.font,
      }}
    >
      <DetailHeader title="General Note" onClose={onClose} />
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, color: T.text }}>
          {doc.title}
        </div>
        <div style={{ fontSize: 13, color: T.textLight, marginBottom: 20 }}>
          {doc.date} at {doc.time}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          <InfoChip icon={Users} label="Submitted By" value={doc.employeeName} />
          <InfoChip icon={Users} label="Crew" value={doc.crewName} />
          {doc.location && <InfoChip icon={MapPin} label="Location" value={doc.location} />}
        </div>

        {doc.body && (
          <div
            style={{
              padding: '14px 16px',
              background: T.card,
              borderRadius: 3,
              border: `1px solid ${T.border}`,
              fontSize: 14,
              color: T.textMed,
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            {doc.body}
          </div>
        )}

        <PhotoGrid photos={doc.photos} />
      </div>
    </div>
  )
}

function InspectionDetail({ doc, onClose }) {
  const checklist = doc.checklist || []
  const passCount = checklist.filter((c) => c.status === 'pass').length
  const failCount = checklist.filter((c) => c.status === 'fail').length

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: T.bg,
        zIndex: 100,
        overflowY: 'auto',
        fontFamily: T.font,
      }}
    >
      <DetailHeader title="Inspection" onClose={onClose} />
      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4, color: T.text }}>
          {doc.title}
        </div>
        <div style={{ fontSize: 13, color: T.textLight, marginBottom: 20 }}>
          {doc.date} at {doc.time}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          <InfoChip icon={Users} label="Inspector" value={doc.employeeName} />
          <InfoChip icon={Users} label="Crew" value={doc.crewName} />
          {doc.location && <InfoChip icon={MapPin} label="Location" value={doc.location} />}
        </div>

        {/* Results summary */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            padding: '12px 16px',
            background: T.card,
            borderRadius: 3,
            border: `1px solid ${T.border}`,
            marginBottom: 16,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <span style={{ color: T.accent }}>{passCount} Pass</span>
          <span style={{ color: T.red }}>{failCount} Fail</span>
          <span style={{ color: T.textLight }}>{checklist.length - passCount - failCount} N/A</span>
        </div>

        {/* Checklist items */}
        <div style={{ marginBottom: 20 }}>
          {checklist.map((c, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: T.card,
                borderRadius: 3,
                border: `1px solid ${c.status === 'fail' ? T.red : T.border}`,
                marginBottom: 6,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: T.text }}>{c.item}</div>
                {c.note && <div style={{ fontSize: 12, color: T.red, marginTop: 2 }}>{c.note}</div>}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  flexShrink: 0,
                  marginLeft: 8,
                  color: c.status === 'pass' ? T.accent : c.status === 'fail' ? T.red : T.textLight,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {c.status === 'pass' && <CheckCircle size={14} />}
                {c.status === 'fail' && <XCircle size={14} />}
                {c.status}
              </div>
            </div>
          ))}
        </div>

        {doc.body && (
          <div
            style={{
              padding: '14px 16px',
              background: T.card,
              borderRadius: 3,
              border: `1px solid ${T.border}`,
              fontSize: 14,
              color: T.textMed,
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: T.textLight,
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Notes
            </div>
            {doc.body}
          </div>
        )}

        <PhotoGrid photos={doc.photos} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Shared components
// ═══════════════════════════════════════════
function DetailHeader({ title, onClose }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        background: T.card,
        padding: '12px 20px',
        borderBottom: `1px solid ${T.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1,
      }}
    >
      <button
        onClick={onClose}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          fontFamily: T.font,
          fontSize: 14,
          color: T.accent,
          fontWeight: 600,
        }}
      >
        ← Back
      </button>
      <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{title}</div>
      <div style={{ width: 60 }} />
    </div>
  )
}

function PhotoGrid({ photos }) {
  if (!photos || photos.length === 0) return null
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: T.text }}>
        Photos ({photos.length})
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {photos.map((p) => (
          <a
            key={p.id || p.filename}
            href={`/uploads/${p.filename}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              borderRadius: 3,
              overflow: 'hidden',
              aspectRatio: '1',
              background: T.bg,
            }}
          >
            <img
              src={`/uploads/${p.filename}`}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </a>
        ))}
      </div>
    </div>
  )
}

function InfoChip({ icon: Icon, label, value }) {
  return (
    <div
      style={{
        padding: '10px 14px',
        background: T.card,
        borderRadius: 3,
        border: `1px solid ${T.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
        <Icon size={12} color={T.textLight} />
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: T.textLight,
            textTransform: 'uppercase',
            letterSpacing: 0.3,
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{value || '—'}</div>
    </div>
  )
}

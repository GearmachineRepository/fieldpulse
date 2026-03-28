// ═══════════════════════════════════════════
// Asset Inspections — Shared list + detail modal
// Used in Fleet and Equipment detail panels
// ═══════════════════════════════════════════

import { useState } from 'react'
import {
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
  User,
  Users,
  ClipboardList,
  Camera,
  AlertTriangle,
} from 'lucide-react'
import { Modal } from './PageUI.jsx'
import s from './AssetInspections.module.css'

// ── Inspection List ──
export function AssetInspectionList({ inspections, loading }) {
  const [selected, setSelected] = useState(null)

  if (loading) {
    return <div className={s.loading}>Loading inspections...</div>
  }

  if (inspections.length === 0) {
    return (
      <div className={s.empty}>
        <FileText size={28} strokeWidth={1} className={s.emptyIcon} />
        <div className={s.emptyTitle}>No inspections recorded</div>
        <div className={s.emptyDesc}>
          Inspections submitted from the field app for this asset will appear here.
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={s.list}>
        {inspections.map((doc) => {
          const passCount = doc.metadata?.passCount || 0
          const failCount = doc.metadata?.failCount || 0
          const isFlagged = doc.status === 'flagged'
          return (
            <button
              key={doc.id}
              className={`${s.card} ${isFlagged ? s.cardFlagged : ''}`}
              onClick={() => setSelected(doc)}
            >
              <div className={s.cardTop}>
                <div className={s.cardTitle}>{doc.title}</div>
                {isFlagged && <span className={s.flagBadge}>FLAGGED</span>}
              </div>
              <div className={s.cardDate}>
                {doc.date} {doc.time && `· ${doc.time}`}
              </div>
              <div className={s.cardStats}>
                <span className={s.statPass}>
                  <CheckCircle size={12} /> {passCount} pass
                </span>
                {failCount > 0 && (
                  <span className={s.statFail}>
                    <XCircle size={12} /> {failCount} fail
                  </span>
                )}
                {doc.employeeName && <span className={s.statMeta}>by {doc.employeeName}</span>}
                {doc.photoCount > 0 && (
                  <span className={s.statMeta}>
                    <Camera size={11} /> {doc.photoCount}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {selected && <InspectionDetailModal doc={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

// ── Inspection Detail Modal ──
function InspectionDetailModal({ doc, onClose }) {
  const checklist = doc.checklist || []
  const passCount = checklist.filter((c) => c.status === 'pass').length
  const failCount = checklist.filter((c) => c.status === 'fail').length
  const naCount = checklist.filter((c) => c.status === 'na').length
  const isFlagged = doc.status === 'flagged'
  const photos = doc.photos || []

  return (
    <Modal onClose={onClose} size="lg">
      <div className={s.detail}>
        {/* Header */}
        <div className={s.detailHeader}>
          <div className={s.detailTitleRow}>
            <div className={s.detailTitle}>{doc.title}</div>
            {isFlagged && <span className={s.flagBadge}>FLAGGED</span>}
          </div>
          <div className={s.detailSub}>
            {doc.date} {doc.time && `· ${doc.time}`}
          </div>
        </div>

        {/* Flagged warning */}
        {isFlagged && (
          <div className={s.flagWarning}>
            <AlertTriangle size={14} />
            <span>
              {failCount} item{failCount !== 1 ? 's' : ''} failed — this inspection is flagged for
              review
            </span>
          </div>
        )}

        {/* Info grid */}
        <div className={s.infoGrid}>
          <DField icon={User} label="Inspector" value={doc.employeeName} />
          <DField icon={Users} label="Crew" value={doc.crewName} />
          <DField icon={MapPin} label="Location" value={doc.location} />
          <DField icon={ClipboardList} label="Template" value={doc.metadata?.template} />
          {doc.assetName && (
            <DField
              icon={doc.assetType === 'vehicle' ? FileText : FileText}
              label={doc.assetType === 'vehicle' ? 'Vehicle' : 'Equipment'}
              value={doc.assetName}
            />
          )}
        </div>

        {/* Results summary */}
        {checklist.length > 0 && (
          <div className={s.section}>
            <div className={s.sectionTitle}>
              Results — {passCount} pass · {failCount} fail · {naCount} N/A
            </div>
            <div className={s.checklistWrap}>
              {checklist.map((c, i) => (
                <div key={i} className={s.checkRow}>
                  <span
                    className={
                      c.status === 'pass'
                        ? s.checkPass
                        : c.status === 'fail'
                          ? s.checkFail
                          : s.checkNA
                    }
                  >
                    {c.status === 'pass' ? 'PASS' : c.status === 'fail' ? 'FAIL' : 'N/A'}
                  </span>
                  <div className={s.checkContent}>
                    <span className={s.checkItem}>{c.item}</span>
                    {c.note && <div className={s.checkNote}>{c.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {doc.body && (
          <div className={s.section}>
            <div className={s.sectionTitle}>Notes</div>
            <div className={s.notes}>{doc.body}</div>
          </div>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <div className={s.section}>
            <div className={s.sectionTitle}>Photos ({photos.length})</div>
            <div className={s.photoGrid}>
              {photos.map((p, i) => (
                <a
                  key={p.id || i}
                  href={`/api/uploads/${p.filename}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.photoLink}
                >
                  <Camera size={14} />
                  {p.originalName || p.original_name || `Photo ${i + 1}`}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

function DField({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className={s.dField}>
      <div className={s.dLabel}>
        <Icon size={13} /> {label}
      </div>
      <div className={s.dValue}>{value}</div>
    </div>
  )
}

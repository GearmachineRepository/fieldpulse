// ═══════════════════════════════════════════
// SDS Library Page — Search-first redesign
// Cal OSHA / HAZCOM requirement
// Search-first UI with dual mode (My Library / SDS Manager)
// QR code integration, GHS pictograms, staleness color
// ═══════════════════════════════════════════

import { useState } from 'react'
import {
  FlaskConical,
  Search,
  Plus,
  QrCode,
  FileText,
  Settings2,
  Edit3,
  AlertTriangle,
  ExternalLink,
  MoreVertical,
  Trash2,
  Link2,
} from 'lucide-react'
import usePageData from '@/hooks/usePageData.js'
import { useGlobalToast } from '@/hooks/ToastContext.jsx'
import useCategories from '@/hooks/useCategories.js'
import { getSdsEntries, createSdsEntry, updateSdsEntry, deleteSdsEntry } from '@/lib/api/sds.js'
import { searchSDSManagerAPI } from '@/lib/api/integrations.js'
import PageShell from '../components/PageShell.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import CategoryManager from '../components/CategoryManager.jsx'
import SDSQRModal from '../components/SDSQRModal.jsx'
import { GHSRow } from '../components/GHSPictograms.jsx'
import { Modal, ModalFooter, ConfirmModal, FormField, SelectField } from '../components/PageUI.jsx'
import s from './SDSPage.module.css'

const FILTER_PILLS = ['All', 'Herbicides', 'Pesticides', 'Fertilizers', 'Solvents', 'Other']

const SIGNAL_WORDS = ['Danger', 'Warning', 'Caution']

const CHEMICAL_TYPES = [
  'Herbicide',
  'Pesticide',
  'Insecticide',
  'Fungicide',
  'Fertilizer',
  'Solvent',
  'Surfactant',
  'Other',
]

function getStalenessColor(dateStr) {
  if (!dateStr) return 'var(--t3)'
  const age = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 365)
  if (age < 1) return 'var(--grn)'
  if (age < 2) return 'var(--amb)'
  return 'var(--red)'
}

function getStalenessLabel(dateStr) {
  if (!dateStr) return 'No date'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function SDSPage() {
  const toast = useGlobalToast()
  const sds = usePageData('sds', {
    fetchFn: getSdsEntries,
    createFn: createSdsEntry,
    updateFn: updateSdsEntry,
    deleteFn: deleteSdsEntry,
  })
  const categories = useCategories('sds')

  const [searchQ, setSearchQ] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [mode, setMode] = useState('library') // "library" | "search"
  const [manageOpen, setManageOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [qrModal, setQrModal] = useState(null)
  const [kebabOpen, setKebabOpen] = useState(null)

  // SDS Manager search state
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  // Filter library entries
  const filtered = sds.data.filter((c) => {
    if (searchQ) {
      const q = searchQ.toLowerCase()
      if (
        !(c.name || '').toLowerCase().includes(q) &&
        !(c.type || '').toLowerCase().includes(q) &&
        !(c.active_ingredient || '').toLowerCase().includes(q) &&
        !(c.epa || '').toLowerCase().includes(q) &&
        !(c.manufacturer || '').toLowerCase().includes(q)
      )
        return false
    }
    if (activeFilter !== 'All') {
      const filterType = activeFilter.slice(0, -1) // "Herbicides" → "Herbicide"
      if ((c.type || 'Other') !== filterType) return false
    }
    return true
  })

  const handleSave = async (data) => {
    try {
      if (editing.id) {
        await sds.update(editing.id, data)
        toast.show('SDS updated')
      } else {
        await sds.create(data)
        toast.show('SDS added')
      }
      setEditing(null)
    } catch (err) {
      toast.show(err.message || 'Failed to save')
    }
  }

  const handleDelete = async (id) => {
    try {
      await sds.remove(id)
      toast.show('SDS removed')
      setEditing(null)
    } catch {
      toast.show('Failed to remove')
    }
  }

  const handleSDSManagerSearch = async () => {
    if (!searchQ.trim()) return
    setSearching(true)
    try {
      const data = await searchSDSManagerAPI(searchQ)
      setSearchResults(data.results || [])
      if (data.message) toast.show(data.message)
    } catch (err) {
      toast.show(err.message || 'SDS Manager search unavailable — connect in Settings')
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  return (
    <>
      <PageShell
        title="SDS Library"
        actions={
          <div className={s.headerActions}>
            <button
              className={s.manageBtn}
              onClick={() => setManageOpen(true)}
              title="Manage categories"
            >
              <Settings2 size={16} />
            </button>
            <button className={s.addBtn} onClick={() => setEditing({})}>
              <Plus size={15} /> Add SDS
            </button>
          </div>
        }
      >
        {/* ── Prominent Search Bar ── */}
        <div className={s.searchBar}>
          <Search size={18} className={s.searchBarIcon} />
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => mode === 'search' && e.key === 'Enter' && handleSDSManagerSearch()}
            placeholder="Search by chemical name, brand, or CAS number..."
            className={s.searchBarInput}
          />
        </div>

        {/* ── Mode Toggle ── */}
        <div className={s.modeRow}>
          <div className={s.modeToggle}>
            <button
              className={`${s.modePill} ${mode === 'library' ? s.modePillActive : ''}`}
              onClick={() => setMode('library')}
            >
              My Library
            </button>
            <button
              className={`${s.modePill} ${mode === 'search' ? s.modePillActive : ''}`}
              onClick={() => setMode('search')}
            >
              Search SDS Manager
            </button>
          </div>
        </div>

        {/* ── Filter Pills (library mode) ── */}
        {mode === 'library' && (
          <div className={s.filterPills}>
            {FILTER_PILLS.map((pill) => (
              <button
                key={pill}
                className={`${s.filterPill} ${activeFilter === pill ? s.filterPillActive : ''}`}
                onClick={() => setActiveFilter(pill)}
              >
                {pill}
              </button>
            ))}
          </div>
        )}

        {/* ── Library Mode Content ── */}
        {mode === 'library' && (
          <>
            {sds.loading && !sds.data.length ? (
              <div className={s.loadingGrid}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className={s.skeletonCard}>
                    <div className={s.skeletonLine} />
                    <div className={s.skeletonLineSm} />
                    <div className={s.skeletonLineSm} />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 && sds.data.length === 0 ? (
              <div className={s.emptyState}>
                <FlaskConical size={48} strokeWidth={1} className={s.emptyIcon} />
                <div className={s.emptyTitle}>No Safety Data Sheets yet</div>
                <div className={s.emptyDesc}>
                  Upload Safety Data Sheets to make them searchable by your field crews. Each SDS
                  can generate a QR code for posting in trucks and job sites.
                </div>
                <div className={s.emptyActions}>
                  <button className={s.addBtn} onClick={() => setEditing({})}>
                    <Plus size={14} /> Add SDS
                  </button>
                  <button className={s.secondaryBtn} onClick={() => setMode('search')}>
                    <Link2 size={14} /> Search SDS Manager
                  </button>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className={s.emptyState}>
                <Search size={48} strokeWidth={1} className={s.emptyIcon} />
                <div className={s.emptyTitle}>No matches found</div>
                <div className={s.emptyDesc}>Try a different search term or filter.</div>
              </div>
            ) : (
              <div className={s.grid}>
                {filtered.map((chem) => (
                  <SDSCard
                    key={chem.id}
                    chem={chem}
                    onEdit={() => setEditing(chem)}
                    onQR={() => setQrModal(chem)}
                    onDelete={() => handleDelete(chem.id)}
                    kebabOpen={kebabOpen === chem.id}
                    onKebab={() => setKebabOpen(kebabOpen === chem.id ? null : chem.id)}
                    onKebabClose={() => setKebabOpen(null)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Search SDS Manager Mode ── */}
        {mode === 'search' && (
          <div className={s.searchModeContent}>
            {searching ? (
              <div className={s.emptyState}>
                <div className={s.emptyTitle}>Searching SDS Manager...</div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className={s.grid}>
                {searchResults.map((item, i) => (
                  <div key={i} className={`${s.card} ${s.importCard}`}>
                    <div className={s.cardBody}>
                      <div className={s.cardName}>{item.product_name || 'Unknown'}</div>
                      <div className={s.cardMfg}>{item.manufacturer || 'Unknown manufacturer'}</div>
                      {item.cas_number && (
                        <div className={s.cardDetail}>
                          CAS: <span className={s.mono}>{item.cas_number}</span>
                        </div>
                      )}
                    </div>
                    <div className={s.cardFooter}>
                      <button className={s.importBtn}>
                        <Plus size={14} /> Import
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={s.emptyState}>
                <FlaskConical size={48} strokeWidth={1} className={s.emptyIcon} />
                <div className={s.emptyTitle}>Search SDS Manager</div>
                <div className={s.emptyDesc}>
                  Connect SDS Manager in Settings to search a database of millions of Safety Data
                  Sheets. Type a chemical name above and press Enter to search.
                </div>
                <button
                  className={s.addBtn}
                  onClick={handleSDSManagerSearch}
                  disabled={!searchQ.trim()}
                >
                  <Search size={14} /> Search
                </button>
              </div>
            )}
          </div>
        )}
      </PageShell>

      {/* QR Code Modal */}
      {qrModal && (
        <SDSQRModal
          sds={{ id: qrModal.id, product_name: qrModal.name, name: qrModal.name }}
          onClose={() => setQrModal(null)}
        />
      )}

      {/* Create / Edit Modal */}
      {editing !== null && (
        <SDSModal
          item={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={editing.id ? () => handleDelete(editing.id) : undefined}
        />
      )}

      {/* Category Manager Modal */}
      <CategoryManager
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        categories={categories}
        scopeLabel="SDS Categories"
      />
    </>
  )
}

// ===================================================
// SDS Card — Redesigned with GHS, staleness, QR
// ===================================================
function SDSCard({ chem, onEdit, onQR, onDelete, kebabOpen, onKebab, onKebabClose }) {
  return (
    <div className={s.card}>
      <div
        className={s.cardBody}
        onClick={onEdit}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onEdit())}
      >
        <div className={s.cardHeader}>
          <div>
            <div className={s.cardName}>{chem.name}</div>
            {chem.manufacturer && <div className={s.cardMfg}>{chem.manufacturer}</div>}
          </div>
          <div className={s.cardActions} onClick={(e) => e.stopPropagation()}>
            <div className={s.kebabWrap}>
              <button className={s.kebabBtn} onClick={onKebab} title="More actions">
                <MoreVertical size={14} />
              </button>
              {kebabOpen && (
                <div className={s.kebabMenu}>
                  <button
                    className={s.kebabItem}
                    onClick={() => {
                      onEdit()
                      onKebabClose()
                    }}
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                  <button
                    className={`${s.kebabItem} ${s.kebabItemDanger}`}
                    onClick={() => {
                      onDelete()
                      onKebabClose()
                    }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* GHS Pictograms */}
        {chem.ghs_pictograms && chem.ghs_pictograms.length > 0 && (
          <div className={s.hazardRow}>
            <GHSRow codes={chem.ghs_pictograms} size={22} gap={3} />
          </div>
        )}

        {/* Badges */}
        <div className={s.cardMeta}>
          {chem.type && <StatusBadge>{chem.type}</StatusBadge>}
          {chem.signal_word && (
            <StatusBadge variant={chem.signal_word === 'Danger' ? 'red' : 'amber'}>
              <AlertTriangle size={10} /> {chem.signal_word}
            </StatusBadge>
          )}
          {chem.restricted && <StatusBadge variant="red">Restricted</StatusBadge>}
        </div>

        {chem.active_ingredient && (
          <div className={s.cardDetail}>Active: {chem.active_ingredient}</div>
        )}
        {chem.epa && (
          <div className={s.cardDetail}>
            EPA #: <span className={s.mono}>{chem.epa}</span>
          </div>
        )}

        {/* Staleness indicator */}
        <div className={s.cardUpdated}>
          <span
            className={s.stalenessDot}
            style={{ background: getStalenessColor(chem.updated_at || chem.created_at) }}
          />
          Updated {getStalenessLabel(chem.updated_at || chem.created_at)}
        </div>
      </div>

      <div className={s.cardFooter}>
        {chem.sds_url ? (
          <a
            href={chem.sds_url}
            target="_blank"
            rel="noopener noreferrer"
            className={s.cardAction}
            onClick={(e) => e.stopPropagation()}
          >
            <FileText size={14} /> View PDF <ExternalLink size={10} />
          </a>
        ) : (
          <span className={s.cardAction} style={{ opacity: 0.4 }}>
            <FileText size={14} /> No PDF
          </span>
        )}
        <button
          className={s.cardAction}
          onClick={(e) => {
            e.stopPropagation()
            onQR()
          }}
        >
          <QrCode size={14} /> QR Code
        </button>
      </div>
    </div>
  )
}

// ===================================================
// SDS Modal — Create / Edit
// ===================================================
function SDSModal({ item, onClose, onSave, onDelete }) {
  const isEdit = !!item.id
  const [name, setName] = useState(item.name || '')
  const [type, setType] = useState(item.type || '')
  const [epa, setEpa] = useState(item.epa || '')
  const [activeIngredient, setActiveIngredient] = useState(item.active_ingredient || '')
  const [signalWord, setSignalWord] = useState(item.signal_word || '')
  const [restricted, setRestricted] = useState(item.restricted || false)
  const [sdsUrl, setSdsUrl] = useState(item.sds_url || '')
  const [labelUrl, setLabelUrl] = useState(item.label_url || '')
  const [manufacturer, setManufacturer] = useState(item.manufacturer || '')
  const [casNumber, setCasNumber] = useState(item.cas_number || '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave({
      name: name.trim(),
      type: type || undefined,
      epa: epa.trim() || undefined,
      active_ingredient: activeIngredient.trim() || undefined,
      signal_word: signalWord || undefined,
      restricted,
      sds_url: sdsUrl.trim() || undefined,
      label_url: labelUrl.trim() || undefined,
      manufacturer: manufacturer.trim() || undefined,
      cas_number: casNumber.trim() || undefined,
    })
    setSaving(false)
  }

  if (confirmDelete) {
    return (
      <ConfirmModal
        title={`Remove "${item.name}"?`}
        message="This will permanently remove the SDS entry."
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    )
  }

  return (
    <Modal title={isEdit ? 'Edit SDS' : 'Add SDS'} onClose={onClose}>
      <FormField
        label="Chemical / Product Name *"
        value={name}
        onChange={setName}
        autoFocus
        placeholder="e.g. Roundup Pro Concentrate"
      />
      <div className={s.formRow}>
        <FormField
          label="Manufacturer"
          value={manufacturer}
          onChange={setManufacturer}
          placeholder="e.g. Bayer"
        />
        <FormField
          label="CAS Number"
          value={casNumber}
          onChange={setCasNumber}
          placeholder="e.g. 1071-83-6"
        />
      </div>
      <div className={s.formRow}>
        <SelectField
          label="Type"
          value={type}
          onChange={setType}
          placeholder="Select type"
          options={CHEMICAL_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <SelectField
          label="Signal Word"
          value={signalWord}
          onChange={setSignalWord}
          placeholder="Select signal word"
          options={SIGNAL_WORDS.map((w) => ({ value: w, label: w }))}
        />
      </div>
      <div className={s.formRow}>
        <FormField
          label="EPA Registration #"
          value={epa}
          onChange={setEpa}
          placeholder="e.g. 524-579"
        />
        <FormField
          label="Active Ingredient"
          value={activeIngredient}
          onChange={setActiveIngredient}
          placeholder="e.g. Glyphosate 41%"
        />
      </div>
      <div className={s.formRow}>
        <FormField
          label="SDS Document URL"
          value={sdsUrl}
          onChange={setSdsUrl}
          placeholder="https://..."
        />
        <FormField
          label="Label URL"
          value={labelUrl}
          onChange={setLabelUrl}
          placeholder="https://..."
        />
      </div>
      <label className={s.checkRow}>
        <input
          type="checkbox"
          checked={restricted}
          onChange={(e) => setRestricted(e.target.checked)}
        />
        <span>Restricted Use Pesticide</span>
      </label>
      <ModalFooter
        onClose={onClose}
        onSave={handleSubmit}
        saving={saving}
        disabled={!name.trim()}
        onDelete={onDelete ? () => setConfirmDelete(true) : undefined}
      />
    </Modal>
  )
}

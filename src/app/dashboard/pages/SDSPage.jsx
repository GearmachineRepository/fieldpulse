// ═══════════════════════════════════════════
// SDS Library Page — Safety Data Sheet library
// Full CRUD with search, category filter, card grid
// Cal OSHA / HAZCOM requirement
// ═══════════════════════════════════════════

import { useState } from "react"
import {
  FlaskConical, Search, Plus, QrCode, FileText,
  Settings2, Edit3, AlertTriangle, ExternalLink,
} from "lucide-react"
import usePageData from "@/hooks/usePageData.js"
import useToast from "@/hooks/useToast.js"
import useCategories from "@/hooks/useCategories.js"
import { getSdsEntries, createSdsEntry, updateSdsEntry, deleteSdsEntry } from "@/lib/api/sds.js"
import PageShell from "../components/PageShell.jsx"
import StatusBadge from "../components/StatusBadge.jsx"
import CategoryManager from "../components/CategoryManager.jsx"
import {
  Modal, ModalFooter, ConfirmModal, FormField, SelectField, TextareaField,
} from "../components/PageUI.jsx"
import s from "./SDSPage.module.css"

const FALLBACK_CATEGORIES = [
  "Herbicides", "Pesticides", "Fertilizers", "Solvents", "Other",
]

const SIGNAL_WORDS = ["Danger", "Warning", "Caution"]

const CHEMICAL_TYPES = [
  "Herbicide", "Pesticide", "Insecticide", "Fungicide",
  "Fertilizer", "Solvent", "Surfactant", "Other",
]

export default function SDSPage() {
  const toast = useToast()
  const sds = usePageData("sds", {
    fetchFn: getSdsEntries,
    createFn: createSdsEntry,
    updateFn: updateSdsEntry,
    deleteFn: deleteSdsEntry,
  })
  const categories = useCategories("sds")
  const [searchQ, setSearchQ] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [manageOpen, setManageOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const categoryNames = categories.data.length > 0
    ? categories.data.map(c => c.name)
    : FALLBACK_CATEGORIES

  const filtered = sds.data.filter(c => {
    if (searchQ) {
      const q = searchQ.toLowerCase()
      if (
        !c.name.toLowerCase().includes(q) &&
        !(c.type || "").toLowerCase().includes(q) &&
        !(c.active_ingredient || "").toLowerCase().includes(q) &&
        !(c.epa || "").toLowerCase().includes(q)
      ) return false
    }
    if (categoryFilter && (c.type || "Other") !== categoryFilter) return false
    return true
  })

  const handleSave = async (data) => {
    try {
      if (editing.id) {
        await sds.update(editing.id, data)
        toast.show("SDS updated")
      } else {
        await sds.create(data)
        toast.show("SDS added")
      }
      setEditing(null)
    } catch (err) {
      toast.show(err.message || "Failed to save")
    }
  }

  const handleDelete = async (id) => {
    try {
      await sds.remove(id)
      toast.show("SDS removed")
      setEditing(null)
    } catch {
      toast.show("Failed to remove")
    }
  }

  return (
    <>
      <PageShell
        title="SDS Library"
        actions={
          <button className={s.addBtn} onClick={() => setEditing({})}>
            <Plus size={15} /> Add SDS
          </button>
        }
      >
        {/* Filter Bar */}
        <div className={s.filterBar}>
          <div className={s.searchWrap}>
            <Search size={15} className={s.searchIcon} />
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Search by name, type, EPA #, or ingredient..."
              className={s.searchInput}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className={s.filterSelect}
          >
            <option value="">All Types</option>
            {CHEMICAL_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            className={s.manageBtn}
            onClick={() => setManageOpen(true)}
            title="Manage categories"
          >
            <Settings2 size={16} />
          </button>
        </div>

        {/* Content */}
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
              Upload Safety Data Sheets to make them searchable by your field crews.
              Each SDS can generate a QR code for posting in trucks and job sites.
            </div>
            <button className={s.addBtn} onClick={() => setEditing({})}>
              <Plus size={14} /> Add First SDS
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className={s.emptyState}>
            <Search size={48} strokeWidth={1} className={s.emptyIcon} />
            <div className={s.emptyTitle}>No matches found</div>
            <div className={s.emptyDesc}>
              Try a different search term or type filter.
            </div>
          </div>
        ) : (
          <div className={s.grid}>
            {filtered.map(chem => (
              <div key={chem.id} className={s.card}>
                <div
                  className={s.cardBody}
                  onClick={() => setEditing(chem)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setEditing(chem))}
                >
                  <div className={s.cardHeader}>
                    <div className={s.cardName}>{chem.name}</div>
                    <button
                      className={s.cardEditBtn}
                      onClick={e => { e.stopPropagation(); setEditing(chem) }}
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                  </div>
                  <div className={s.cardMeta}>
                    {chem.type && <StatusBadge>{chem.type}</StatusBadge>}
                    {chem.signal_word && (
                      <StatusBadge variant={chem.signal_word === "Danger" ? "red" : "amber"}>
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
                </div>
                <div className={s.cardFooter}>
                  {chem.sds_url ? (
                    <a href={chem.sds_url} target="_blank" rel="noopener noreferrer" className={s.cardAction}>
                      <FileText size={14} /> View SDS <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span className={s.cardAction} style={{ opacity: 0.4 }}>
                      <FileText size={14} /> No SDS
                    </span>
                  )}
                  <button className={s.cardAction}>
                    <QrCode size={14} /> QR Code
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageShell>

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

      {toast.message && (
        <div className={s.toast} role="status" aria-live="polite">
          {toast.message}
        </div>
      )}
    </>
  )
}


// ===================================================
// SDS Modal — Create / Edit
// ===================================================
function SDSModal({ item, onClose, onSave, onDelete }) {
  const isEdit = !!item.id
  const [name, setName] = useState(item.name || "")
  const [type, setType] = useState(item.type || "")
  const [epa, setEpa] = useState(item.epa || "")
  const [activeIngredient, setActiveIngredient] = useState(item.active_ingredient || "")
  const [signalWord, setSignalWord] = useState(item.signal_word || "")
  const [restricted, setRestricted] = useState(item.restricted || false)
  const [sdsUrl, setSdsUrl] = useState(item.sds_url || "")
  const [labelUrl, setLabelUrl] = useState(item.label_url || "")
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
    <Modal title={isEdit ? "Edit SDS" : "Add SDS"} onClose={onClose}>
      <FormField
        label="Chemical / Product Name *"
        value={name}
        onChange={setName}
        autoFocus
        placeholder="e.g. Roundup Pro Concentrate"
      />
      <div className={s.formRow}>
        <SelectField
          label="Type"
          value={type}
          onChange={setType}
          placeholder="Select type"
          options={CHEMICAL_TYPES.map(t => ({ value: t, label: t }))}
        />
        <SelectField
          label="Signal Word"
          value={signalWord}
          onChange={setSignalWord}
          placeholder="Select signal word"
          options={SIGNAL_WORDS.map(w => ({ value: w, label: w }))}
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
          onChange={e => setRestricted(e.target.checked)}
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

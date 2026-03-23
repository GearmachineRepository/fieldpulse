// ═══════════════════════════════════════════
// CategoryManager — Modal to add/rename/remove categories
// Reusable across SDS, Equipment, Documents, etc.
// ═══════════════════════════════════════════

import { useState } from "react"
import { Plus, Trash2, Pencil, Check, X } from "lucide-react"
import { Modal } from "./PageUI.jsx"
import s from "./CategoryManager.module.css"

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   categories: { data: Array, create: Function, update: Function, remove: Function },
 *   scopeLabel?: string,
 * }} props
 */
export default function CategoryManager({ open, onClose, categories, scopeLabel = "Categories" }) {
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState("")
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const handleAdd = async () => {
    if (!newName.trim() || saving) return
    setSaving(true)
    try {
      await categories.create(newName.trim())
      setNewName("")
    } catch { /* dupe name etc */ }
    setSaving(false)
  }

  const handleRename = async (id) => {
    if (!editName.trim() || saving) return
    setSaving(true)
    try {
      await categories.update(id, editName.trim())
      setEditingId(null)
    } catch { /* */ }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (saving) return
    setSaving(true)
    try {
      await categories.remove(id)
    } catch { /* */ }
    setSaving(false)
  }

  const startEdit = (cat) => {
    setEditingId(cat.id)
    setEditName(cat.name)
  }

  return (
    <Modal title={`Manage ${scopeLabel}`} onClose={onClose} size="sm">
      <div className={s.list}>
        {categories.data.length === 0 && (
          <div className={s.empty}>No categories yet. Add one below.</div>
        )}
        {categories.data.map(cat => (
          <div key={cat.id} className={s.row}>
            {editingId === cat.id ? (
              <div className={s.editRow}>
                <input
                  className={s.editInput}
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleRename(cat.id); if (e.key === "Escape") setEditingId(null) }}
                  autoFocus
                />
                <button className={s.iconBtn} onClick={() => handleRename(cat.id)} title="Save">
                  <Check size={14} />
                </button>
                <button className={s.iconBtn} onClick={() => setEditingId(null)} title="Cancel">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <span className={s.catName}>{cat.name}</span>
                <div className={s.rowActions}>
                  <button className={s.iconBtn} onClick={() => startEdit(cat)} title="Rename">
                    <Pencil size={13} />
                  </button>
                  <button className={`${s.iconBtn} ${s.deleteBtn}`} onClick={() => handleDelete(cat.id)} title="Remove">
                    <Trash2 size={13} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add new */}
      <div className={s.addRow}>
        <input
          className={s.addInput}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleAdd() }}
          placeholder="New category name..."
        />
        <button className={s.addBtn} onClick={handleAdd} disabled={!newName.trim() || saving}>
          <Plus size={14} /> Add
        </button>
      </div>
    </Modal>
  )
}

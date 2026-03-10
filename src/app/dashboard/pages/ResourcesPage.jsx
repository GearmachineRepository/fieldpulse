// ═══════════════════════════════════════════
// Resources Page — Safety docs, SDS sheets, manuals
//
// Category sidebar, search, pinned items, file
// upload + link support. Shared with field app.
// ═══════════════════════════════════════════

import { useState, useEffect, useRef } from "react"
import {
  BookOpen, Plus, Edit3, Search, Pin, ExternalLink, Download,
  FileText, File, Shield, Tag, Wrench, GraduationCap,
  FolderOpen, Upload, Link2, X, Loader2,
} from "lucide-react"
import { T } from "@/app/tokens.js"
import {
  getResources, getResourceCategories, createResource, updateResource,
  deleteResource, uploadResource, createResourceCategory, updateResourceCategory,
  deleteResourceCategory,
} from "@/lib/api/resources.js"
import {
  Modal, ModalFooter, ConfirmModal, FormField, SelectField, TextareaField,
  PageHeader, AddButton, ClickableCard, IconButton, LoadingSpinner, EmptyMessage,
} from "@/app/dashboard/components/PageUI.jsx"

const ICON_MAP = {
  shield: Shield, "book-open": BookOpen, tag: Tag, "graduation-cap": GraduationCap,
  "file-text": FileText, wrench: Wrench, folder: FolderOpen,
}
const CAT_COLORS = ["#EF4444", "#F59E0B", "#7C3AED", "#3B82F6", "#059669", "#0891B2", "#DB2777", "#92400E", "#475569"]

function formatFileSize(bytes) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType) {
  if (!mimeType) return FileText
  if (mimeType.includes("pdf")) return FileText
  if (mimeType.includes("image")) return File
  return File
}

export default function ResourcesPage({ isMobile }) {
  const [resources, setResources] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState("")
  const [activeCategory, setActiveCategory] = useState(null) // null = all
  const [editing, setEditing] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [showAddChoice, setShowAddChoice] = useState(false)

  const fetchAll = async () => {
    try {
      const [res, cats] = await Promise.all([getResources(), getResourceCategories()])
      setResources(res)
      setCategories(cats)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  // Filter
  const filtered = resources.filter(r => {
    if (activeCategory && r.categoryId !== activeCategory) return false
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return r.title.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q) ||
      (r.originalName || "").toLowerCase().includes(q)
  })

  const pinned = filtered.filter(r => r.pinned)
  const unpinned = filtered.filter(r => !r.pinned)

  // CRUD handlers
  const handleSave = async (data, file) => {
    try {
      if (file) {
        await uploadResource(file, data)
      } else if (editing?.id) {
        await updateResource(editing.id, data)
      } else {
        await createResource(data)
      }
      setEditing(null)
      fetchAll()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id) => {
    try { await deleteResource(id); setEditing(null); fetchAll() } catch {}
  }

  const handleTogglePin = async (resource) => {
    try { await updateResource(resource.id, { ...resource, pinned: !resource.pinned }); fetchAll() } catch {}
  }

  const handleSaveCategory = async (data) => {
    try {
      if (editingCategory?.id) await updateResourceCategory(editingCategory.id, data)
      else await createResourceCategory(data)
      setEditingCategory(null)
      fetchAll()
    } catch {}
  }

  const handleDeleteCategory = async (id) => {
    try { await deleteResourceCategory(id); setEditingCategory(null); if (activeCategory === id) setActiveCategory(null); fetchAll() } catch {}
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader title="Resources" count={resources.length} countLabel="documents"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setEditingCategory({})} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 14px",
              borderRadius: 10, border: `1.5px solid ${T.border}`, cursor: "pointer",
              background: T.card, color: T.textMed, fontSize: 13, fontWeight: 600, fontFamily: T.font,
            }}>
              <FolderOpen size={14} /> Categories
            </button>
            <AddButton label="Add Resource" icon={Plus} onClick={() => setShowAddChoice(true)} />
          </div>
        }
      />

      {/* Category tabs + search */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Categories */}
        <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 4, flex: "1 1 auto", flexWrap: "wrap" }}>
          <CatPill label="All" count={resources.length} active={!activeCategory}
            onClick={() => setActiveCategory(null)} color={T.textMed} />
          {categories.map(cat => {
            const CatIcon = ICON_MAP[cat.icon] || FolderOpen
            return (
              <CatPill key={cat.id} label={cat.name} count={cat.resourceCount}
                active={activeCategory === cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                color={cat.color} icon={CatIcon}
                onEdit={() => setEditingCategory(cat)} />
            )
          })}
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, background: T.card,
          borderRadius: 10, padding: "8px 14px", border: `1px solid ${T.border}`,
          minWidth: 200, flex: "0 0 auto",
        }}>
          <Search size={16} color={T.textLight} />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search resources..."
            style={{ flex: 1, border: "none", outline: "none", fontSize: 13, fontFamily: T.font, background: "transparent", color: T.text, width: 140 }} />
        </div>
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <Pin size={13} /> Pinned ({pinned.length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 10 }}>
            {pinned.map(r => <ResourceCard key={r.id} resource={r} onEdit={() => setEditing(r)} onPin={() => handleTogglePin(r)} />)}
          </div>
        </div>
      )}

      {/* All / filtered */}
      {unpinned.length === 0 && pinned.length === 0 ? (
        <EmptyMessage text={searchQ || activeCategory ? "No resources match your filters." : "No resources yet. Add your first document or link."} />
      ) : unpinned.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <div style={{ fontSize: 13, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
              All Resources ({unpinned.length})
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 10 }}>
            {unpinned.map(r => <ResourceCard key={r.id} resource={r} onEdit={() => setEditing(r)} onPin={() => handleTogglePin(r)} />)}
          </div>
        </div>
      )}

      {/* Add choice modal (link or upload) */}
      {showAddChoice && (
        <Modal title="Add Resource" onClose={() => setShowAddChoice(false)} size="sm">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => { setShowAddChoice(false); setEditing({ resourceType: "link" }) }} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "18px 20px",
              borderRadius: 12, border: `1.5px solid ${T.border}`, background: T.card,
              cursor: "pointer", fontFamily: T.font, textAlign: "left", width: "100%",
              transition: "border-color 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${T.blue}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Link2 size={22} color={T.blue} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Add a Link</div>
                <div style={{ fontSize: 13, color: T.textLight }}>Paste a URL to an SDS sheet, manual, or web page</div>
              </div>
            </button>

            <button onClick={() => { setShowAddChoice(false); setEditing({ resourceType: "file" }) }} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "18px 20px",
              borderRadius: 12, border: `1.5px solid ${T.border}`, background: T.card,
              cursor: "pointer", fontFamily: T.font, textAlign: "left", width: "100%",
              transition: "border-color 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${T.accent}10`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Upload size={22} color={T.accent} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>Upload a File</div>
                <div style={{ fontSize: 13, color: T.textLight }}>Upload a PDF, image, or document (up to 25MB)</div>
              </div>
            </button>
          </div>
        </Modal>
      )}

      {/* Resource edit/create modal */}
      {editing !== null && (
        <ResourceModal resource={editing} categories={categories}
          onClose={() => setEditing(null)} onSave={handleSave}
          onDelete={editing.id ? () => handleDelete(editing.id) : undefined} />
      )}

      {/* Category edit modal */}
      {editingCategory !== null && (
        <CategoryModal category={editingCategory} onClose={() => setEditingCategory(null)}
          onSave={handleSaveCategory}
          onDelete={editingCategory.id ? () => handleDeleteCategory(editingCategory.id) : undefined} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Resource Card
// ═══════════════════════════════════════════
function ResourceCard({ resource, onEdit, onPin }) {
  const isFile = resource.resourceType === "file"
  const FileIcon = isFile ? getFileIcon(resource.mimeType) : ExternalLink

  return (
    <ClickableCard onClick={onEdit} style={{ padding: "16px 18px" }}>
      <div style={{ display: "flex", gap: 14 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10, flexShrink: 0,
          background: isFile ? `${T.accent}10` : `${T.blue}10`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <FileIcon size={20} color={isFile ? T.accent : T.blue} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <div style={{ fontSize: 15, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {resource.title}
            </div>
            {resource.pinned && <Pin size={12} color={T.amber} />}
          </div>

          {resource.description && (
            <div style={{ fontSize: 12, color: T.textMed, lineHeight: 1.4, marginBottom: 4,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {resource.description}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            {resource.categoryName && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                background: `${resource.categoryColor || T.textLight}12`,
                color: resource.categoryColor || T.textLight,
              }}>{resource.categoryName}</span>
            )}
            {isFile && resource.fileSize && (
              <span style={{ fontSize: 11, color: T.textLight }}>{formatFileSize(resource.fileSize)}</span>
            )}
            {isFile && resource.originalName && (
              <span style={{ fontSize: 11, color: T.textLight, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>
                {resource.originalName}
              </span>
            )}
            {!isFile && resource.url && (
              <span style={{ fontSize: 11, color: T.textLight, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                {resource.url.replace(/https?:\/\//, "").split("/")[0]}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <button onClick={e => { e.stopPropagation(); onPin() }} title={resource.pinned ? "Unpin" : "Pin"} style={{
            width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`,
            background: resource.pinned ? T.amberLight : T.card, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Pin size={13} color={resource.pinned ? T.amber : T.textLight} />
          </button>
          {!resource.resourceType || resource.resourceType === "link" ? (
            resource.url && (
              <a href={resource.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                style={{
                  width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`,
                  background: T.card, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  textDecoration: "none",
                }}>
                <ExternalLink size={13} color={T.blue} />
              </a>
            )
          ) : (
            resource.filename && (
              <a href={`/uploads/${resource.filename}`} download={resource.originalName} onClick={e => e.stopPropagation()}
                style={{
                  width: 30, height: 30, borderRadius: 8, border: `1px solid ${T.border}`,
                  background: T.card, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  textDecoration: "none",
                }}>
                <Download size={13} color={T.accent} />
              </a>
            )
          )}
        </div>
      </div>
    </ClickableCard>
  )
}

// ═══════════════════════════════════════════
// Category Pill
// ═══════════════════════════════════════════
function CatPill({ label, count, active, onClick, color, icon: Icon, onEdit }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
      borderRadius: 8, border: `1px solid ${active ? color : T.border}`,
      background: active ? `${color}10` : T.card, cursor: "pointer",
      fontSize: 13, fontWeight: 600, fontFamily: T.font, whiteSpace: "nowrap",
      color: active ? color : T.textMed,
    }}>
      {Icon && <Icon size={14} />}
      {label}
      {count !== undefined && <span style={{ fontSize: 11, opacity: 0.7 }}>({count})</span>}
    </button>
  )
}

// ═══════════════════════════════════════════
// Resource Modal
// ═══════════════════════════════════════════
function ResourceModal({ resource, categories, onClose, onSave, onDelete }) {
  const isEdit = !!resource.id
  const isFile = resource.resourceType === "file"
  const [title, setTitle] = useState(resource.title || "")
  const [description, setDescription] = useState(resource.description || "")
  const [url, setUrl] = useState(resource.url || "")
  const [categoryId, setCategoryId] = useState(resource.categoryId ? String(resource.categoryId) : "")
  const [pinned, setPinned] = useState(resource.pinned || false)
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const fileRef = useRef(null)

  const handleSubmit = async () => {
    if (!title.trim() && !file) return
    setSaving(true)
    const data = {
      title: title.trim() || (file ? file.name : ""),
      description: description || null,
      categoryId: categoryId ? parseInt(categoryId) : null,
      pinned,
    }
    if (!isFile) data.url = url || null
    await onSave(data, file)
    setSaving(false)
  }

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) { setFile(f); if (!title) setTitle(f.name.replace(/\.[^.]+$/, "")) }
  }

  if (confirmDel) return <ConfirmModal title={`Delete "${resource.title}"?`} message="This removes the resource."
    onConfirm={onDelete} onCancel={() => setConfirmDel(false)} />

  return (
    <Modal title={isEdit ? "Edit Resource" : (isFile ? "Upload File" : "Add Link")} onClose={onClose}>
      {/* File upload zone */}
      {isFile && !isEdit && (
        <div style={{ marginBottom: 14 }}>
          <input ref={fileRef} type="file" onChange={handleFileChange} style={{ display: "none" }}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp" />
          <button onClick={() => fileRef.current?.click()} style={{
            width: "100%", padding: "28px 20px", borderRadius: 12,
            border: `2px dashed ${file ? T.accent : T.border}`,
            background: file ? T.accentLight : T.bg, cursor: "pointer",
            fontFamily: T.font, textAlign: "center",
          }}>
            {file ? (
              <div>
                <FileText size={24} color={T.accent} style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: T.accent }}>{file.name}</div>
                <div style={{ fontSize: 12, color: T.textLight }}>{formatFileSize(file.size)} · Click to change</div>
              </div>
            ) : (
              <div>
                <Upload size={24} color={T.textLight} style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Click to select a file</div>
                <div style={{ fontSize: 12, color: T.textLight }}>PDF, Word, Excel, images — up to 25MB</div>
              </div>
            )}
          </button>
        </div>
      )}

      <FormField label="Title *" value={title} onChange={setTitle} autoFocus={!isFile}
        placeholder={isFile ? "Auto-filled from filename" : "e.g. Roundup SDS Sheet"} />

      {!isFile && (
        <FormField label="URL" value={url} onChange={setUrl} placeholder="https://example.com/sds-sheet.pdf" />
      )}

      <TextareaField label="Description" value={description} onChange={setDescription}
        placeholder="Optional notes about this resource" rows={2} />

      <SelectField label="Category" value={categoryId} onChange={setCategoryId} placeholder="Uncategorized"
        options={categories.map(c => ({ value: String(c.id), label: c.name }))} />

      <button onClick={() => setPinned(!pinned)} style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 0", marginBottom: 4,
        border: "none", background: "none", cursor: "pointer", fontFamily: T.font, width: "100%",
      }}>
        <div style={{
          width: 20, height: 20, borderRadius: 6, border: `2px solid ${pinned ? T.amber : T.border}`,
          background: pinned ? T.amber : "transparent", display: "flex", alignItems: "center", justifyContent: "center",
        }}>{pinned && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}</div>
        <Pin size={16} color={pinned ? T.amber : T.textLight} />
        <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Pin to top</span>
      </button>

      <ModalFooter onClose={onClose} onSave={handleSubmit} saving={saving}
        disabled={!title.trim() && !file}
        onDelete={onDelete ? () => setConfirmDel(true) : undefined} />
    </Modal>
  )
}

// ═══════════════════════════════════════════
// Category Modal
// ═══════════════════════════════════════════
function CategoryModal({ category, onClose, onSave, onDelete }) {
  const isEdit = !!category.id
  const [name, setName] = useState(category.name || "")
  const [color, setColor] = useState(category.color || "#475569")
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return; setSaving(true)
    await onSave({ name: name.trim(), color })
    setSaving(false)
  }

  if (confirmDel) return <ConfirmModal title={`Delete "${category.name}"?`}
    message="Resources in this category will become uncategorized."
    onConfirm={onDelete} onCancel={() => setConfirmDel(false)} />

  return (
    <Modal title={isEdit ? "Edit Category" : "Add Category"} onClose={onClose} size="sm">
      <FormField label="Category Name *" value={name} onChange={setName} autoFocus placeholder="e.g. SDS Sheets" />
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Color</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CAT_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: 28, height: 28, borderRadius: 7, background: c, border: "none", cursor: "pointer",
              boxShadow: color === c ? `0 0 0 2px ${T.bg}, 0 0 0 4px ${c}` : "none",
            }} />
          ))}
        </div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSubmit} saving={saving} disabled={!name.trim()}
        onDelete={onDelete ? () => setConfirmDel(true) : undefined} />
    </Modal>
  )
}

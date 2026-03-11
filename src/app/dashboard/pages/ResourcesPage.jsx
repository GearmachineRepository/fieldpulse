// ═══════════════════════════════════════════
// Resources Page — Safety docs, SDS sheets, manuals
// + Account linking from resource side
// ═══════════════════════════════════════════

import { useState, useEffect, useRef } from "react"
import {
  BookOpen, Plus, Edit3, Search, Pin, ExternalLink, Download,
  FileText, File, Shield, Tag, Wrench, GraduationCap,
  FolderOpen, Upload, Link2, X, Loader2, MapPinned,
  Settings, Trash2,
} from "lucide-react"
import { T } from "@/app/tokens.js"
import {
  getResources, getResourceCategories, createResource, updateResource,
  deleteResource, uploadResource, replaceResourceFile, createResourceCategory, updateResourceCategory,
  deleteResourceCategory,
} from "@/lib/api/resources.js"
import {
  getResourceAccounts, linkResourceToAccount, unlinkResourceFromAccount,
} from "@/lib/api/resources.js"
import { getAccounts } from "@/lib/api/accounts.js"
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
  const [activeCategory, setActiveCategory] = useState(null)
  const [editing, setEditing] = useState(null)
  const [managingCategories, setManagingCategories] = useState(false)
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

  const filtered = resources.filter(r => {
    if (activeCategory && r.categoryId !== activeCategory) return false
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return r.title.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q) ||
      (r.originalName || "").toLowerCase().includes(q)
  })

  const pinned = filtered.filter(r => r.pinned)
  const unpinned = filtered.filter(r => !r.pinned)

  const handleSave = async (data, file) => {
    try {
      if (file && editing?.id) {
        // Replacing file on existing resource — upload new file, then update metadata
        await replaceResourceFile(editing.id, file)
        await updateResource(editing.id, data)
      } else if (file) {
        // New file upload
        await uploadResource(file, data)
      } else if (editing?.id) {
        // Editing metadata only (no new file)
        await updateResource(editing.id, data)
      } else {
        // New link resource
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
      if (data.id) await updateResourceCategory(data.id, { name: data.name, color: data.color })
      else await createResourceCategory({ name: data.name, color: data.color })
      fetchAll()
    } catch {}
  }

  const handleDeleteCategory = async (id) => {
    try { await deleteResourceCategory(id); fetchAll() } catch {}
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <PageHeader title="Resources" count={resources.length} countLabel="total"
        action={<AddButton label="Add Resource" icon={Plus} onClick={() => setShowAddChoice(true)} />} />

      {/* Search + category pills */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ position: "relative", marginBottom: 12 }}>
          <Search size={16} color={T.textLight} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search resources..."
            style={{
              width: "100%", padding: "10px 14px 10px 40px", borderRadius: 10,
              border: `1.5px solid ${T.border}`, background: T.card, fontSize: 14,
              fontFamily: T.font, outline: "none", boxSizing: "border-box", color: T.text,
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <CatPill label="All" count={resources.length} color={T.accent}
            active={!activeCategory} onClick={() => setActiveCategory(null)} />
          {categories.map(c => {
            const count = resources.filter(r => r.categoryId === c.id).length
            return <CatPill key={c.id} label={c.name} count={count} color={c.color}
              active={activeCategory === c.id} onClick={() => setActiveCategory(activeCategory === c.id ? null : c.id)} />
          })}
          <button onClick={() => setManagingCategories(true)} style={{
            width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${T.border}`,
            background: T.card, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }} title="Manage Categories">
            <Settings size={14} color={T.textLight} />
          </button>
        </div>
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: T.amber, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
            <Pin size={13} /> Pinned ({pinned.length})
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 10 }}>
            {pinned.map(r => <ResourceCard key={r.id} resource={r} onEdit={() => setEditing(r)} onPin={() => handleTogglePin(r)} />)}
          </div>
        </div>
      )}

      {/* All */}
      {filtered.length === 0 ? (
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

      {/* Add choice modal */}
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

      {/* Manage Categories modal */}
      {managingCategories && (
        <ManageCategoriesModal
          categories={categories.map(c => ({
            id: c.id, name: c.name, color: c.color,
            count: resources.filter(r => r.categoryId === c.id).length,
          }))}
          onSave={handleSaveCategory}
          onDelete={handleDeleteCategory}
          onClose={() => setManagingCategories(false)}
        />
      )}
    </div>
  )
}


// ═══════════════════════════════════════════
// Category Pill
// ═══════════════════════════════════════════
function CatPill({ label, count, color, active, onClick, icon: Icon }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
      borderRadius: 8, border: `1.5px solid ${active ? color : T.border}`,
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
            {!isFile && resource.url && (
              <span style={{ fontSize: 11, color: T.textLight, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>
                {resource.url.replace(/https?:\/\/(www\.)?/, "").split("/")[0]}
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0, alignItems: "center" }}>
          <button onClick={e => { e.stopPropagation(); onPin() }} style={{
            border: "none", background: "none", cursor: "pointer", padding: 4,
          }} title={resource.pinned ? "Unpin" : "Pin"}>
            <Pin size={14} color={resource.pinned ? T.amber : T.textLight} />
          </button>
          {isFile && resource.filename ? (
            <a href={`/uploads/${resource.filename}`} download={resource.originalName}
              onClick={e => e.stopPropagation()} style={{ padding: 4 }}>
              <Download size={14} color={T.accent} />
            </a>
          ) : resource.url ? (
            <a href={resource.url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()} style={{ padding: 4 }}>
              <ExternalLink size={14} color={T.blue} />
            </a>
          ) : null}
        </div>
      </div>
    </ClickableCard>
  )
}


// ═══════════════════════════════════════════
// Resource Modal — with Accounts tab
// ═══════════════════════════════════════════
function ResourceModal({ resource, categories, onClose, onSave, onDelete }) {
  const isEdit = !!resource.id
  const isFile = resource.resourceType === "file"
  const [tab, setTab] = useState("details")
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

  if (confirmDel) return <ConfirmModal title={`Delete "${resource.title}"?`} message="This removes the resource from all linked accounts too."
    onConfirm={onDelete} onCancel={() => setConfirmDel(false)} />

  const tabs = [
    { key: "details", label: "Details" },
    ...(isEdit ? [{ key: "accounts", label: "Accounts" }] : []),
  ]

  return (
    <Modal title={isEdit ? "Edit Resource" : (isFile ? "Upload File" : "Add Link")} onClose={onClose} size="lg">
      {/* Tabs — only for existing resources */}
      {isEdit && (
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1.5px solid ${T.border}`, paddingBottom: 0 }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "10px 18px", border: "none", cursor: "pointer", fontFamily: T.font,
              fontSize: 14, fontWeight: 700, background: "transparent",
              color: tab === t.key ? T.accent : T.textLight,
              borderBottom: tab === t.key ? `2.5px solid ${T.accent}` : "2.5px solid transparent",
              marginBottom: -1.5, transition: "color 0.15s, border-color 0.15s",
            }}>{t.label}</button>
          ))}
        </div>
      )}

      {/* Details tab */}
      {tab === "details" && (
        <>
          {/* File upload / replace zone */}
          {isFile && (
            <div style={{ marginBottom: 14 }}>
              <input ref={fileRef} type="file" onChange={handleFileChange} style={{ display: "none" }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp" />

              {/* Editing existing file — show current file + replace */}
              {isEdit && !file && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                  borderRadius: 12, border: `1.5px solid ${T.border}`, background: T.bg,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, background: `${T.accent}10`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <FileText size={20} color={T.accent} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {resource.originalName || resource.title}
                    </div>
                    <div style={{ fontSize: 12, color: T.textLight }}>
                      {formatFileSize(resource.fileSize)}
                    </div>
                  </div>
                  <button onClick={() => fileRef.current?.click()} style={{
                    padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${T.accent}`,
                    background: T.accentLight, color: T.accent, fontSize: 13, fontWeight: 700,
                    cursor: "pointer", fontFamily: T.font, whiteSpace: "nowrap",
                  }}>
                    Replace File
                  </button>
                </div>
              )}

              {/* New file selected (creating or replacing) */}
              {file && (
                <button onClick={() => fileRef.current?.click()} style={{
                  width: "100%", padding: "18px 20px", borderRadius: 12,
                  border: `2px dashed ${T.accent}`, background: T.accentLight,
                  cursor: "pointer", fontFamily: T.font, textAlign: "center",
                }}>
                  <FileText size={24} color={T.accent} style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.accent }}>{file.name}</div>
                  <div style={{ fontSize: 12, color: T.textLight }}>{formatFileSize(file.size)} · Click to change</div>
                </button>
              )}

              {/* New resource — no file selected yet */}
              {!isEdit && !file && (
                <button onClick={() => fileRef.current?.click()} style={{
                  width: "100%", padding: "28px 20px", borderRadius: 12,
                  border: `2px dashed ${T.border}`, background: T.bg,
                  cursor: "pointer", fontFamily: T.font, textAlign: "center",
                }}>
                  <Upload size={24} color={T.textLight} style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Click to select a file</div>
                  <div style={{ fontSize: 12, color: T.textLight }}>PDF, Word, Excel, images — up to 25MB</div>
                </button>
              )}
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
        </>
      )}

      {/* Accounts tab */}
      {tab === "accounts" && resource.id && (
        <ResourceAccountsTab resourceId={resource.id} onClose={onClose} />
      )}
    </Modal>
  )
}


// ═══════════════════════════════════════════
// Resource Accounts Tab — Link/unlink accounts from resource side
// ═══════════════════════════════════════════
function ResourceAccountsTab({ resourceId, onClose }) {
  const [linkedAccounts, setLinkedAccounts] = useState([])
  const [allAccounts, setAllAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSearch, setPickerSearch] = useState("")

  const load = async () => {
    let linked = []
    let all = []
    try { all = await getAccounts() } catch (err) { console.error("Failed to load accounts:", err) }
    try { linked = await getResourceAccounts(resourceId) } catch (err) { console.error("Failed to load linked accounts:", err) }
    setLinkedAccounts(linked)
    setAllAccounts(all)
    setLoading(false)
  }

  useEffect(() => { load() }, [resourceId])

  const handleLink = async (accountId) => {
    try {
      await linkResourceToAccount(resourceId, accountId)
      load()
    } catch (err) { console.error(err) }
  }

  const handleUnlink = async (accountId) => {
    try {
      await unlinkResourceFromAccount(resourceId, accountId)
      load()
    } catch (err) { console.error(err) }
  }

  const linkedIds = new Set(linkedAccounts.map(a => a.id))
  const available = allAccounts.filter(a => !linkedIds.has(a.id))
  const filteredAvailable = available.filter(a => {
    if (!pickerSearch) return true
    const q = pickerSearch.toLowerCase()
    return a.name.toLowerCase().includes(q) || (a.address || "").toLowerCase().includes(q) ||
      (a.city || "").toLowerCase().includes(q)
  })

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
            {linkedAccounts.length} account{linkedAccounts.length !== 1 ? "s" : ""} linked
          </div>
          <div style={{ fontSize: 12, color: T.textLight }}>
            Crews at these sites can access this resource
          </div>
        </div>
        <button onClick={() => setShowPicker(true)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
          borderRadius: 8, border: `1.5px dashed ${T.accent}`, background: T.accentLight,
          color: T.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: T.font,
        }}>
          <MapPinned size={14} /> Attach to Account
        </button>
      </div>

      {/* Linked accounts list */}
      {linkedAccounts.length === 0 ? (
        <div style={{
          padding: 30, textAlign: "center", color: T.textLight, fontSize: 14,
          background: T.bg, borderRadius: 12, border: `1.5px dashed ${T.border}`,
        }}>
          <MapPinned size={28} color={T.textLight} style={{ marginBottom: 8 }} />
          <div>Not attached to any accounts</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Attach to accounts so crews can access this resource at specific jobsites
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {linkedAccounts.map(a => (
            <div key={a.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
              background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8, background: `${T.accent}10`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <MapPinned size={16} color={T.accent} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.name}
                </div>
                <div style={{ fontSize: 11, color: T.textLight }}>
                  {a.address}{a.city ? `, ${a.city}` : ""}
                </div>
              </div>
              <button onClick={() => handleUnlink(a.id)} style={{
                border: "none", background: "none", cursor: "pointer", padding: 4,
              }} title="Unlink">
                <X size={16} color={T.textLight} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
        <button onClick={onClose} style={{
          padding: "10px 24px", borderRadius: 10, border: `1.5px solid ${T.border}`,
          background: "transparent", color: T.textMed, fontSize: 14, fontWeight: 600,
          cursor: "pointer", fontFamily: T.font,
        }}>Done</button>
      </div>

      {/* Account Picker */}
      {showPicker && (
        <div onClick={e => e.target === e.currentTarget && setShowPicker(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 120,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <div style={{
            background: T.card, borderRadius: 16, width: "100%", maxWidth: 440,
            maxHeight: "70vh", display: "flex", flexDirection: "column",
            boxShadow: T.shadowLg, animation: "modalIn 0.15s ease",
          }}>
            <div style={{ padding: "18px 20px 0", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>Attach to Account</div>
                <button onClick={() => setShowPicker(false)} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
                  <X size={18} color={T.textLight} />
                </button>
              </div>
              <div style={{ position: "relative", marginBottom: 12 }}>
                <Search size={16} color={T.textLight} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                <input
                  value={pickerSearch} onChange={e => setPickerSearch(e.target.value)}
                  placeholder="Search accounts..."
                  style={{
                    width: "100%", padding: "10px 12px 10px 36px", borderRadius: 10,
                    border: `1.5px solid ${T.border}`, background: T.bg, fontSize: 14,
                    fontFamily: T.font, outline: "none", boxSizing: "border-box", color: T.text,
                  }}
                />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
              {filteredAvailable.length === 0 ? (
                <div style={{ textAlign: "center", padding: 24, color: T.textLight, fontSize: 14 }}>
                  {pickerSearch ? "No matching accounts" : allAccounts.length === 0 ? "No accounts created yet — add some from the Accounts page first" : "All accounts are already linked"}
                </div>
              ) : (
                filteredAvailable.map(a => (
                  <button key={a.id} onClick={() => handleLink(a.id)} style={{
                    display: "flex", alignItems: "center", gap: 12, width: "100%",
                    padding: "10px 12px", borderRadius: 10, border: "none",
                    background: "transparent", cursor: "pointer", fontFamily: T.font,
                    textAlign: "left", marginBottom: 2, transition: "background 0.1s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = T.accentLight}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 8, background: `${T.accent}10`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <MapPinned size={16} color={T.accent} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.name}
                      </div>
                      <div style={{ fontSize: 11, color: T.textLight }}>
                        {a.address}{a.city ? `, ${a.city}` : ""}
                      </div>
                    </div>
                    <Plus size={16} color={T.accent} />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


// ═══════════════════════════════════════════
// Manage Categories Modal
// ═══════════════════════════════════════════
function ManageCategoriesModal({ categories, onSave, onDelete, onClose }) {
  const [editingItem, setEditingItem] = useState(null)
  const [creating, setCreating] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)

  return (
    <Modal title="Manage Categories" onClose={onClose} size="sm">
      {categories.length === 0 ? (
        <div style={{ textAlign: "center", padding: 20, color: T.textLight, fontSize: 14 }}>
          No categories created yet
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
          {categories.map(item => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`,
            }}>
              <div style={{ width: 12, height: 12, borderRadius: 6, background: item.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{item.name}</div>
                <div style={{ fontSize: 11, color: T.textLight }}>{item.count} resource{item.count !== 1 ? "s" : ""}</div>
              </div>
              <button onClick={() => setEditingItem(item)} style={{
                border: "none", background: "none", cursor: "pointer", padding: 4,
              }} title="Edit">
                <Edit3 size={14} color={T.textMed} />
              </button>
              <button onClick={() => setConfirmDel(item)} style={{
                border: "none", background: "none", cursor: "pointer", padding: 4,
              }} title="Delete">
                <Trash2 size={14} color={T.red} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setCreating(true)} style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
        padding: "10px", borderRadius: 10, border: `1.5px dashed ${T.accent}`,
        background: T.accentLight, color: T.accent, fontSize: 13, fontWeight: 700,
        cursor: "pointer", fontFamily: T.font,
      }}>
        <Plus size={14} /> Add Category
      </button>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
        <button onClick={onClose} style={{
          padding: "10px 24px", borderRadius: 10, border: `1.5px solid ${T.border}`,
          background: "transparent", color: T.textMed, fontSize: 14, fontWeight: 600,
          cursor: "pointer", fontFamily: T.font,
        }}>Done</button>
      </div>

      {(editingItem || creating) && (
        <CatItemEditModal
          item={editingItem || {}}
          onSave={async (data) => { await onSave(data); setEditingItem(null); setCreating(false) }}
          onClose={() => { setEditingItem(null); setCreating(false) }}
        />
      )}

      {confirmDel && (
        <ConfirmModal title={`Delete "${confirmDel.name}"?`}
          message="Resources in this category will become uncategorized."
          onConfirm={async () => { await onDelete(confirmDel.id); setConfirmDel(null) }}
          onCancel={() => setConfirmDel(null)} />
      )}
    </Modal>
  )
}

function CatItemEditModal({ item, onSave, onClose }) {
  const isEdit = !!item.id
  const [name, setName] = useState(item.name || "")
  const [color, setColor] = useState(item.color || CAT_COLORS[0])
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave({ id: item.id || null, name: name.trim(), color })
    setSaving(false)
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 130,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: T.card, borderRadius: 16, width: "100%", maxWidth: 360,
        padding: 24, boxShadow: T.shadowLg, animation: "modalIn 0.15s ease",
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
          {isEdit ? "Edit Category" : "New Category"}
        </div>
        <FormField label="Name *" value={name} onChange={setName} autoFocus placeholder="e.g. SDS Sheets" />
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
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{
            padding: "10px 18px", borderRadius: 10, border: `1.5px solid ${T.border}`,
            background: "transparent", color: T.textMed, fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: T.font,
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!name.trim() || saving} style={{
            padding: "10px 18px", borderRadius: 10, border: "none",
            background: T.accent, color: "#fff", fontSize: 14, fontWeight: 600,
            cursor: "pointer", fontFamily: T.font, opacity: !name.trim() || saving ? 0.5 : 1,
          }}>{saving ? "Saving..." : "Save"}</button>
        </div>
      </div>
    </div>
  )
}
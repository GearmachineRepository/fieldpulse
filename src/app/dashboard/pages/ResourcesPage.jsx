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
import s from "./ResourcesPage.module.css"

const ICON_MAP = {
  shield: Shield, "book-open": BookOpen, tag: Tag, "graduation-cap": GraduationCap,
  "file-text": FileText, wrench: Wrench, folder: FolderOpen,
}
const CAT_COLORS = ["#EF4444", "#F59E0B", "#7C3AED", "#3B82F6", "#2F6FED", "#0891B2", "#DB2777", "#92400E", "#475569"]

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

export default function ResourcesPage() {
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
      <div className={s.searchSection}>
        <div className={s.searchWrap}>
          <Search size={16} color="var(--color-text-light)" className={s.searchIcon} />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search resources..."
            className={s.searchInput}
          />
        </div>
        <div className={s.pillBar}>
          <CatPill label="All" count={resources.length} color="var(--color-accent)"
            active={!activeCategory} onClick={() => setActiveCategory(null)} />
          {categories.map(c => {
            const count = resources.filter(r => r.categoryId === c.id).length
            return <CatPill key={c.id} label={c.name} count={count} color={c.color}
              active={activeCategory === c.id} onClick={() => setActiveCategory(activeCategory === c.id ? null : c.id)} />
          })}
          <button onClick={() => setManagingCategories(true)} className={s.settingsBtn} title="Manage Categories">
            <Settings size={14} color="var(--color-text-light)" />
          </button>
        </div>
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <div className={s.pinnedSection}>
          <div className={s.pinnedHeader}>
            <Pin size={13} /> Pinned ({pinned.length})
          </div>
          <div className={s.cardGrid}>
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
            <div className={s.sectionHeader}>
              All Resources ({unpinned.length})
            </div>
          )}
          <div className={s.cardGrid}>
            {unpinned.map(r => <ResourceCard key={r.id} resource={r} onEdit={() => setEditing(r)} onPin={() => handleTogglePin(r)} />)}
          </div>
        </div>
      )}

      {/* Add choice modal */}
      {showAddChoice && (
        <Modal title="Add Resource" onClose={() => setShowAddChoice(false)} size="sm">
          <div className={s.addChoiceList}>
            <button onClick={() => { setShowAddChoice(false); setEditing({ resourceType: "link" }) }}
              className={s.addChoiceBtn}
            >
              <div className={s.addChoiceIconLink}>
                <Link2 size={22} color="var(--color-blue)" />
              </div>
              <div>
                <div className={s.addChoiceTitle}>Add a Link</div>
                <div className={s.addChoiceSub}>Paste a URL to an SDS sheet, manual, or web page</div>
              </div>
            </button>
            <button onClick={() => { setShowAddChoice(false); setEditing({ resourceType: "file" }) }}
              className={s.addChoiceBtn}
            >
              <div className={s.addChoiceIconFile}>
                <Upload size={22} color="var(--color-accent)" />
              </div>
              <div>
                <div className={s.addChoiceTitle}>Upload a File</div>
                <div className={s.addChoiceSub}>Upload a PDF, image, or document (up to 25MB)</div>
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
    <button onClick={onClick} className={s.catPill} style={{
      borderColor: active ? color : undefined,
      background: active ? `${color}10` : undefined,
      color: active ? color : undefined,
    }}>
      {Icon && <Icon size={14} />}
      {label}
      {count !== undefined && <span className={s.catPillCount}>({count})</span>}
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
      <div className={s.cardRow}>
        <div className={isFile ? s.cardIconFile : s.cardIconLink}>
          <FileIcon size={20} color={isFile ? "var(--color-accent)" : "var(--color-blue)"} />
        </div>

        <div className={s.cardBody}>
          <div className={s.cardTitleRow}>
            <div className={s.cardTitle}>
              {resource.title}
            </div>
            {resource.pinned && <Pin size={12} color="var(--color-amber)" />}
          </div>

          {resource.description && (
            <div className={s.cardDesc}>
              {resource.description}
            </div>
          )}

          <div className={s.cardMeta}>
            {resource.categoryName && (
              <span className={s.categoryBadge} style={{
                background: `${resource.categoryColor || "var(--color-text-light)"}12`,
                color: resource.categoryColor || "var(--color-text-light)",
              }}>{resource.categoryName}</span>
            )}
            {isFile && resource.fileSize && (
              <span className={s.fileSizeMeta}>{formatFileSize(resource.fileSize)}</span>
            )}
            {!isFile && resource.url && (
              <span className={s.urlMeta}>
                {resource.url.replace(/https?:\/\/(www\.)?/, "").split("/")[0]}
              </span>
            )}
          </div>
        </div>

        <div className={s.cardActions}>
          <button onClick={e => { e.stopPropagation(); onPin() }} className={s.iconBtn}
            title={resource.pinned ? "Unpin" : "Pin"}>
            <Pin size={14} color={resource.pinned ? "var(--color-amber)" : "var(--color-text-light)"} />
          </button>
          {isFile && resource.filename ? (
            <a href={`/uploads/${resource.filename}`} download={resource.originalName}
              onClick={e => e.stopPropagation()} className={s.actionLink}>
              <Download size={14} color="var(--color-accent)" />
            </a>
          ) : resource.url ? (
            <a href={resource.url} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()} className={s.actionLink}>
              <ExternalLink size={14} color="var(--color-blue)" />
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
        <div className={s.modalTabs}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={tab === t.key ? s.modalTabActive : s.modalTabInactive}
            >{t.label}</button>
          ))}
        </div>
      )}

      {/* Details tab */}
      {tab === "details" && (
        <>
          {/* File upload / replace zone */}
          {isFile && (
            <div className={s.fileZoneWrap}>
              <input ref={fileRef} type="file" onChange={handleFileChange} className={s.hidden}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp" />

              {/* Editing existing file — show current file + replace */}
              {isEdit && !file && (
                <div className={s.existingFile}>
                  <div className={s.existingFileIcon}>
                    <FileText size={20} color="var(--color-accent)" />
                  </div>
                  <div className={s.existingFileInfo}>
                    <div className={s.existingFileName}>
                      {resource.originalName || resource.title}
                    </div>
                    <div className={s.existingFileSize}>
                      {formatFileSize(resource.fileSize)}
                    </div>
                  </div>
                  <button onClick={() => fileRef.current?.click()} className={s.replaceFileBtn}>
                    Replace File
                  </button>
                </div>
              )}

              {/* New file selected (creating or replacing) */}
              {file && (
                <button onClick={() => fileRef.current?.click()} className={s.fileSelectedBtn}>
                  <FileText size={24} color="var(--color-accent)" className={s.iconCenter} />
                  <div className={s.fileSelectedName}>{file.name}</div>
                  <div className={s.fileSelectedHint}>{formatFileSize(file.size)} · Click to change</div>
                </button>
              )}

              {/* New resource — no file selected yet */}
              {!isEdit && !file && (
                <button onClick={() => fileRef.current?.click()} className={s.fileEmptyBtn}>
                  <Upload size={24} color="var(--color-text-light)" className={s.iconCenter} />
                  <div className={s.fileEmptyTitle}>Click to select a file</div>
                  <div className={s.fileEmptyHint}>PDF, Word, Excel, images — up to 25MB</div>
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

          <button onClick={() => setPinned(!pinned)} className={s.pinToggle}>
            <div className={pinned ? s.pinCheckboxChecked : s.pinCheckboxUnchecked}>
              {pinned && <span className={s.pinCheckmark}>✓</span>}
            </div>
            <Pin size={16} color={pinned ? "var(--color-amber)" : "var(--color-text-light)"} />
            <span className={s.pinLabel}>Pin to top</span>
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
      <div className={s.accountsHeader}>
        <div>
          <div className={s.accountsCount}>
            {linkedAccounts.length} account{linkedAccounts.length !== 1 ? "s" : ""} linked
          </div>
          <div className={s.accountsSub}>
            Crews at these sites can access this resource
          </div>
        </div>
        <button onClick={() => setShowPicker(true)} className={s.attachBtn}>
          <MapPinned size={14} /> Attach to Account
        </button>
      </div>

      {/* Linked accounts list */}
      {linkedAccounts.length === 0 ? (
        <div className={s.emptyAccounts}>
          <MapPinned size={28} color="var(--color-text-light)" style={{ marginBottom: 8 }} />
          <div>Not attached to any accounts</div>
          <div className={s.emptyAccountsSub}>
            Attach to accounts so crews can access this resource at specific jobsites
          </div>
        </div>
      ) : (
        <div className={s.linkedList}>
          {linkedAccounts.map(a => (
            <div key={a.id} className={s.linkedRow}>
              <div className={s.linkedIcon}>
                <MapPinned size={16} color="var(--color-accent)" />
              </div>
              <div className={s.linkedInfo}>
                <div className={s.linkedName}>
                  {a.name}
                </div>
                <div className={s.linkedAddr}>
                  {a.address}{a.city ? `, ${a.city}` : ""}
                </div>
              </div>
              <button onClick={() => handleUnlink(a.id)} className={s.iconBtn} title="Unlink">
                <X size={16} color="var(--color-text-light)" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className={s.tabFooter}>
        <button onClick={onClose} className={s.doneBtn}>Done</button>
      </div>

      {/* Account Picker */}
      {showPicker && (
        <div onClick={e => e.target === e.currentTarget && setShowPicker(false)} className={s.pickerOverlay}>
          <div className={s.pickerCard}>
            <div className={s.pickerHeader}>
              <div className={s.pickerTitleRow}>
                <div className={s.pickerTitle}>Attach to Account</div>
                <button onClick={() => setShowPicker(false)} className={s.iconBtn}>
                  <X size={18} color="var(--color-text-light)" />
                </button>
              </div>
              <div className={s.pickerSearchWrap}>
                <Search size={16} color="var(--color-text-light)" className={s.pickerSearchIcon} />
                <input
                  value={pickerSearch} onChange={e => setPickerSearch(e.target.value)}
                  placeholder="Search accounts..."
                  className={s.pickerSearchInput}
                />
              </div>
            </div>
            <div className={s.pickerList}>
              {filteredAvailable.length === 0 ? (
                <div className={s.pickerEmpty}>
                  {pickerSearch ? "No matching accounts" : allAccounts.length === 0 ? "No accounts created yet — add some from the Accounts page first" : "All accounts are already linked"}
                </div>
              ) : (
                filteredAvailable.map(a => (
                  <button key={a.id} onClick={() => handleLink(a.id)} className={s.pickerItem}>
                    <div className={s.pickerItemIcon}>
                      <MapPinned size={16} color="var(--color-accent)" />
                    </div>
                    <div className={s.pickerItemInfo}>
                      <div className={s.pickerItemName}>
                        {a.name}
                      </div>
                      <div className={s.pickerItemAddr}>
                        {a.address}{a.city ? `, ${a.city}` : ""}
                      </div>
                    </div>
                    <Plus size={16} color="var(--color-accent)" />
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
        <div className={s.catEmptyMsg}>
          No categories created yet
        </div>
      ) : (
        <div className={s.catList}>
          {categories.map(item => (
            <div key={item.id} className={s.catRow}>
              <div className={s.catDot} style={{ background: item.color }} />
              <div className={s.catInfo}>
                <div className={s.catName}>{item.name}</div>
                <div className={s.catCount}>{item.count} resource{item.count !== 1 ? "s" : ""}</div>
              </div>
              <button onClick={() => setEditingItem(item)} className={s.iconBtn} title="Edit">
                <Edit3 size={14} color="var(--color-text-med)" />
              </button>
              <button onClick={() => setConfirmDel(item)} className={s.iconBtn} title="Delete">
                <Trash2 size={14} color="var(--color-red)" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setCreating(true)} className={s.addCatBtn}>
        <Plus size={14} /> Add Category
      </button>

      <div className={s.catFooter}>
        <button onClick={onClose} className={s.doneBtn}>Done</button>
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
    <div onClick={e => e.target === e.currentTarget && onClose()} className={s.catEditOverlay}>
      <div className={s.catEditCard}>
        <div className={s.catEditTitle}>
          {isEdit ? "Edit Category" : "New Category"}
        </div>
        <FormField label="Name *" value={name} onChange={setName} autoFocus placeholder="e.g. SDS Sheets" />
        <div className={s.colorFieldWrap}>
          <label className={s.colorLabel}>Color</label>
          <div className={s.colorSwatches}>
            {CAT_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} className={s.colorSwatch} style={{
                background: c,
                boxShadow: color === c ? `0 0 0 2px var(--color-bg), 0 0 0 4px ${c}` : "none",
              }} />
            ))}
          </div>
        </div>
        <div className={s.catEditActions}>
          <button onClick={onClose} className={s.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={!name.trim() || saving} className={s.saveBtn}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}

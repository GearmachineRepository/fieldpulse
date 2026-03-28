// ═══════════════════════════════════════════
// Resources Page — Phase 3B: usePageData migration
// Pinned section + categories, skeleton loading
// ═══════════════════════════════════════════

import { useState, useEffect, useRef } from 'react'
import {
  BookOpen,
  Plus,
  Edit3,
  Search,
  Pin,
  ExternalLink,
  Download,
  FileText,
  File,
  Upload,
  Link2,
  X,
  MapPinned,
  Settings,
  Trash2,
} from 'lucide-react'
import usePageData from '@/hooks/usePageData.js'
import { useGlobalToast } from '@/hooks/ToastContext.jsx'
import {
  getResources,
  getResourceCategories,
  createResource,
  updateResource,
  deleteResource,
  uploadResource,
  replaceResourceFile,
  createResourceCategory,
  updateResourceCategory,
  deleteResourceCategory,
} from '@/lib/api/resources.js'
import {
  getResourceAccounts,
  linkResourceToAccount,
  unlinkResourceFromAccount,
} from '@/lib/api/resources.js'
import { getAccounts } from '@/lib/api/accounts.js'
import PageShell from '../components/PageShell.jsx'
import FilterPill from '../components/FilterPill.jsx'
import {
  Modal,
  ModalFooter,
  ConfirmModal,
  FormField,
  SelectField,
  TextareaField,
  LoadingSpinner,
} from '../components/PageUI.jsx'
import s from './ResourcesPage.module.css'
import { formatFileSize } from '@/lib/formatUtils.js'

const CAT_COLORS = [
  '#EF4444',
  '#F59E0B',
  '#7C3AED',
  '#3B82F6',
  '#2F6FED',
  '#0891B2',
  '#DB2777',
  '#92400E',
  '#475569',
]

export default function ResourcesPage() {
  const toast = useGlobalToast()
  const resources = usePageData('resources', { fetchFn: getResources })
  const categories = usePageData('resourceCategories', { fetchFn: getResourceCategories })

  const [searchQ, setSearchQ] = useState('')
  const [activeCategory, setActiveCategory] = useState(null)
  const [editing, setEditing] = useState(null)
  const [managingCategories, setManagingCategories] = useState(false)
  const [showAddChoice, setShowAddChoice] = useState(false)

  const filtered = resources.data.filter((r) => {
    if (activeCategory && r.categoryId !== activeCategory) return false
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return (
      r.title.toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.originalName || '').toLowerCase().includes(q)
    )
  })

  const pinned = filtered.filter((r) => r.pinned)
  const unpinned = filtered.filter((r) => !r.pinned)

  const handleSave = async (data, file) => {
    try {
      if (file && editing?.id) {
        await replaceResourceFile(editing.id, file)
        await updateResource(editing.id, data)
      } else if (file) {
        await uploadResource(file, data)
      } else if (editing?.id) {
        await updateResource(editing.id, data)
      } else {
        await createResource(data)
      }
      setEditing(null)
      resources.refresh()
    } catch (err) {
      toast.show(err.message || 'Failed to save')
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteResource(id)
      setEditing(null)
      resources.refresh()
      toast.show('Removed')
    } catch {
      toast.show('Failed to remove')
    }
  }

  const handleTogglePin = async (resource) => {
    try {
      await updateResource(resource.id, { ...resource, pinned: !resource.pinned })
      resources.refresh()
    } catch {
      toast.show('Failed to update')
    }
  }

  const handleSaveCategory = async (data) => {
    try {
      if (data.id) await updateResourceCategory(data.id, { name: data.name, color: data.color })
      else await createResourceCategory({ name: data.name, color: data.color })
      categories.refresh()
      toast.show('Saved')
    } catch {
      toast.show('Failed to save')
    }
  }

  const handleDeleteCategory = async (id) => {
    try {
      await deleteResourceCategory(id)
      categories.refresh()
      resources.refresh()
      toast.show('Removed')
    } catch {
      toast.show('Failed to remove')
    }
  }

  return (
    <>
      <PageShell
        title="Resources"
        count={resources.data.length}
        countLabel="total"
        loading={resources.loading && !resources.data.length}
        skeleton="cards"
        empty={resources.data.length === 0 && !resources.loading}
        emptyIcon={BookOpen}
        emptyTitle="No resources yet"
        emptyDescription="Add your first document, SDS sheet, or link."
        emptyCta="Add Resource"
        onEmptyCta={() => setShowAddChoice(true)}
        actions={
          <button className={s.addBtn} onClick={() => setShowAddChoice(true)}>
            <Plus size={15} /> Add Resource
          </button>
        }
      >
        {/* Search + category pills */}
        <div className={s.searchSection}>
          <div className={s.searchWrap}>
            <Search size={16} color="var(--t3)" className={s.searchIcon} />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search resources..."
              className={s.searchInput}
            />
          </div>
          <div className={s.pillBar}>
            <FilterPill
              label="All"
              count={resources.data.length}
              color="var(--amb)"
              active={!activeCategory}
              onClick={() => setActiveCategory(null)}
            />
            {categories.data.map((c) => {
              const count = resources.data.filter((r) => r.categoryId === c.id).length
              return (
                <FilterPill
                  key={c.id}
                  label={c.name}
                  count={count}
                  color={c.color}
                  active={activeCategory === c.id}
                  onClick={() => setActiveCategory(activeCategory === c.id ? null : c.id)}
                />
              )
            })}
            <button
              onClick={() => setManagingCategories(true)}
              className={s.settingsBtn}
              title="Manage Categories"
            >
              <Settings size={14} color="var(--t3)" />
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
              {pinned.map((r) => (
                <ResourceCard
                  key={r.id}
                  resource={r}
                  onEdit={() => setEditing(r)}
                  onPin={() => handleTogglePin(r)}
                />
              ))}
            </div>
          </div>
        )}

        {/* All resources */}
        {filtered.length === 0 && !resources.loading ? (
          <div className={s.emptyFiltered}>
            {searchQ || activeCategory ? 'No resources match your filters.' : null}
          </div>
        ) : (
          unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <div className={s.sectionHeader}>All Resources ({unpinned.length})</div>
              )}
              <div className={s.cardGrid}>
                {unpinned.map((r) => (
                  <ResourceCard
                    key={r.id}
                    resource={r}
                    onEdit={() => setEditing(r)}
                    onPin={() => handleTogglePin(r)}
                  />
                ))}
              </div>
            </div>
          )
        )}
      </PageShell>

      {/* Add choice modal */}
      {showAddChoice && (
        <Modal title="Add Resource" onClose={() => setShowAddChoice(false)} size="sm">
          <div className={s.addChoiceList}>
            <button
              onClick={() => {
                setShowAddChoice(false)
                setEditing({ resourceType: 'link' })
              }}
              className={s.addChoiceBtn}
            >
              <div className={s.addChoiceIconLink}>
                <Link2 size={22} color="var(--blu)" />
              </div>
              <div>
                <div className={s.addChoiceTitle}>Add a Link</div>
                <div className={s.addChoiceSub}>
                  Paste a URL to an SDS sheet, manual, or web page
                </div>
              </div>
            </button>
            <button
              onClick={() => {
                setShowAddChoice(false)
                setEditing({ resourceType: 'file' })
              }}
              className={s.addChoiceBtn}
            >
              <div className={s.addChoiceIconFile}>
                <Upload size={22} color="var(--amb)" />
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
        <ResourceModal
          resource={editing}
          categories={categories.data}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={editing.id ? () => handleDelete(editing.id) : undefined}
        />
      )}

      {/* Manage Categories modal */}
      {managingCategories && (
        <ManageCategoriesModal
          categories={categories.data.map((c) => ({
            id: c.id,
            name: c.name,
            color: c.color,
            count: resources.data.filter((r) => r.categoryId === c.id).length,
          }))}
          onSave={handleSaveCategory}
          onDelete={handleDeleteCategory}
          onClose={() => setManagingCategories(false)}
        />
      )}
    </>
  )
}

// ═══════════════════════════════════════════
// Resource Card
// ═══════════════════════════════════════════
function ResourceCard({ resource, onEdit, onPin }) {
  const isFile = resource.resourceType === 'file'
  const isImage = isFile && resource.mimeType && resource.mimeType.includes('image')

  return (
    <div className={s.resCard} onClick={onEdit}>
      <div className={s.cardRow}>
        <div className={isFile ? s.cardIconFile : s.cardIconLink}>
          {!isFile && <ExternalLink size={20} color="var(--blu)" />}
          {isFile && isImage && <File size={20} color="var(--amb)" />}
          {isFile && !isImage && <FileText size={20} color="var(--amb)" />}
        </div>

        <div className={s.cardBody}>
          <div className={s.cardTitleRow}>
            <div className={s.cardTitle}>{resource.title}</div>
            {resource.pinned && <Pin size={12} color="var(--amb)" />}
          </div>

          {resource.description && <div className={s.cardDesc}>{resource.description}</div>}

          <div className={s.cardMeta}>
            {resource.categoryName && (
              <span
                className={s.categoryBadge}
                style={{
                  background: `${resource.categoryColor || 'var(--t3)'}12`,
                  color: resource.categoryColor || 'var(--t3)',
                }}
              >
                {resource.categoryName}
              </span>
            )}
            {isFile && resource.fileSize && (
              <span className={s.fileSizeMeta}>{formatFileSize(resource.fileSize)}</span>
            )}
            {!isFile && resource.url && (
              <span className={s.urlMeta}>
                {resource.url.replace(/https?:\/\/(www\.)?/, '').split('/')[0]}
              </span>
            )}
          </div>
        </div>

        <div className={s.cardActions}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPin()
            }}
            className={s.iconBtn}
            title={resource.pinned ? 'Unpin' : 'Pin'}
          >
            <Pin size={14} color={resource.pinned ? 'var(--amb)' : 'var(--t3)'} />
          </button>
          {isFile && resource.filename ? (
            <a
              href={`/uploads/${resource.filename}`}
              download={resource.originalName}
              onClick={(e) => e.stopPropagation()}
              className={s.actionLink}
            >
              <Download size={14} color="var(--amb)" />
            </a>
          ) : resource.url ? (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={s.actionLink}
            >
              <ExternalLink size={14} color="var(--blu)" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Resource Modal — with Accounts tab
// ═══════════════════════════════════════════
function ResourceModal({ resource, categories, onClose, onSave, onDelete }) {
  const isEdit = !!resource.id
  const isFile = resource.resourceType === 'file'
  const [tab, setTab] = useState('details')
  const [title, setTitle] = useState(resource.title || '')
  const [description, setDescription] = useState(resource.description || '')
  const [url, setUrl] = useState(resource.url || '')
  const [categoryId, setCategoryId] = useState(
    resource.categoryId ? String(resource.categoryId) : '',
  )
  const [pinned, setPinned] = useState(resource.pinned || false)
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const fileRef = useRef(null)

  const handleSubmit = async () => {
    if (!title.trim() && !file) return
    setSaving(true)
    const data = {
      title: title.trim() || (file ? file.name : ''),
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
    if (f) {
      setFile(f)
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ''))
    }
  }

  if (confirmDel) {
    return (
      <ConfirmModal
        title={`Delete "${resource.title}"?`}
        message="This removes the resource from all linked accounts too."
        onConfirm={onDelete}
        onCancel={() => setConfirmDel(false)}
      />
    )
  }

  const tabs = [
    { key: 'details', label: 'Details' },
    ...(isEdit ? [{ key: 'accounts', label: 'Accounts' }] : []),
  ]

  return (
    <Modal
      title={isEdit ? 'Edit Resource' : isFile ? 'Upload File' : 'Add Link'}
      onClose={onClose}
      size="lg"
    >
      {isEdit && (
        <div className={s.modalTabs}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={tab === t.key ? s.modalTabActive : s.modalTabInactive}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'details' && (
        <>
          {isFile && (
            <div className={s.fileZoneWrap}>
              <input
                ref={fileRef}
                type="file"
                onChange={handleFileChange}
                className={s.hidden}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
              />
              {isEdit && !file && (
                <div className={s.existingFile}>
                  <div className={s.existingFileIcon}>
                    <FileText size={20} color="var(--amb)" />
                  </div>
                  <div className={s.existingFileInfo}>
                    <div className={s.existingFileName}>
                      {resource.originalName || resource.title}
                    </div>
                    <div className={s.existingFileSize}>{formatFileSize(resource.fileSize)}</div>
                  </div>
                  <button onClick={() => fileRef.current?.click()} className={s.replaceFileBtn}>
                    Replace File
                  </button>
                </div>
              )}
              {file && (
                <button onClick={() => fileRef.current?.click()} className={s.fileSelectedBtn}>
                  <FileText size={24} color="var(--amb)" className={s.iconCenter} />
                  <div className={s.fileSelectedName}>{file.name}</div>
                  <div className={s.fileSelectedHint}>
                    {formatFileSize(file.size)} · Click to change
                  </div>
                </button>
              )}
              {!isEdit && !file && (
                <button onClick={() => fileRef.current?.click()} className={s.fileEmptyBtn}>
                  <Upload size={24} color="var(--t3)" className={s.iconCenter} />
                  <div className={s.fileEmptyTitle}>Click to select a file</div>
                  <div className={s.fileEmptyHint}>PDF, Word, Excel, images — up to 25MB</div>
                </button>
              )}
            </div>
          )}

          <FormField
            label="Title *"
            value={title}
            onChange={setTitle}
            autoFocus={!isFile}
            placeholder={isFile ? 'Auto-filled from filename' : 'e.g. Roundup SDS Sheet'}
          />
          {!isFile && (
            <FormField
              label="URL"
              value={url}
              onChange={setUrl}
              placeholder="https://example.com/sds-sheet.pdf"
            />
          )}
          <TextareaField
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Optional notes about this resource"
            rows={2}
          />
          <SelectField
            label="Category"
            value={categoryId}
            onChange={setCategoryId}
            placeholder="Uncategorized"
            options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
          />

          <button onClick={() => setPinned(!pinned)} className={s.pinToggle} type="button">
            <div className={pinned ? s.pinCheckboxChecked : s.pinCheckboxUnchecked}>
              {pinned && <span className={s.pinCheckmark}>✓</span>}
            </div>
            <Pin size={16} color={pinned ? 'var(--amb)' : 'var(--t3)'} />
            <span className={s.pinLabel}>Pin to top</span>
          </button>

          <ModalFooter
            onClose={onClose}
            onSave={handleSubmit}
            saving={saving}
            disabled={!title.trim() && !file}
            onDelete={onDelete ? () => setConfirmDel(true) : undefined}
          />
        </>
      )}

      {tab === 'accounts' && resource.id && (
        <ResourceAccountsTab resourceId={resource.id} onClose={onClose} />
      )}
    </Modal>
  )
}

// ═══════════════════════════════════════════
// Resource Accounts Tab
// ═══════════════════════════════════════════
function ResourceAccountsTab({ resourceId, onClose }) {
  const [linkedAccounts, setLinkedAccounts] = useState([])
  const [allAccounts, setAllAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')

  const load = async () => {
    let linked = [],
      all = []
    try {
      all = await getAccounts()
    } catch (err) {
      console.error(err)
    }
    try {
      linked = await getResourceAccounts(resourceId)
    } catch (err) {
      console.error(err)
    }
    setLinkedAccounts(linked)
    setAllAccounts(all)
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      let linked = [],
        all = []
      try {
        all = await getAccounts()
      } catch (err) {
        console.error(err)
      }
      try {
        linked = await getResourceAccounts(resourceId)
      } catch (err) {
        console.error(err)
      }
      if (active) {
        setLinkedAccounts(linked)
        setAllAccounts(all)
        setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [resourceId])

  const handleLink = async (accountId) => {
    try {
      await linkResourceToAccount(resourceId, accountId)
      load()
    } catch (err) {
      console.error(err)
    }
  }

  const handleUnlink = async (accountId) => {
    try {
      await unlinkResourceFromAccount(resourceId, accountId)
      load()
    } catch (err) {
      console.error(err)
    }
  }

  const linkedIds = new Set(linkedAccounts.map((a) => a.id))
  const available = allAccounts.filter((a) => !linkedIds.has(a.id))
  const filteredAvailable = available.filter((a) => {
    if (!pickerSearch) return true
    const q = pickerSearch.toLowerCase()
    return a.name.toLowerCase().includes(q) || (a.address || '').toLowerCase().includes(q)
  })

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className={s.accountsHeader}>
        <div>
          <div className={s.accountsCount}>
            {linkedAccounts.length} account{linkedAccounts.length !== 1 ? 's' : ''} linked
          </div>
          <div className={s.accountsSub}>Crews at these sites can access this resource</div>
        </div>
        <button onClick={() => setShowPicker(true)} className={s.attachBtn}>
          <MapPinned size={14} /> Attach to Account
        </button>
      </div>

      {linkedAccounts.length === 0 ? (
        <div className={s.emptyAccounts}>
          <MapPinned size={28} color="var(--t3)" style={{ marginBottom: 8 }} />
          <div>Not attached to any accounts</div>
          <div className={s.emptyAccountsSub}>
            Attach to accounts so crews can access this resource at specific jobsites
          </div>
        </div>
      ) : (
        <div className={s.linkedList}>
          {linkedAccounts.map((a) => (
            <div key={a.id} className={s.linkedRow}>
              <div className={s.linkedIcon}>
                <MapPinned size={16} color="var(--amb)" />
              </div>
              <div className={s.linkedInfo}>
                <div className={s.linkedName}>{a.name}</div>
                <div className={s.linkedAddr}>
                  {a.address}
                  {a.city ? `, ${a.city}` : ''}
                </div>
              </div>
              <button onClick={() => handleUnlink(a.id)} className={s.iconBtn} title="Unlink">
                <X size={16} color="var(--t3)" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={s.tabFooter}>
        <button onClick={onClose} className={s.doneBtn}>
          Done
        </button>
      </div>

      {showPicker && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowPicker(false)}
          className={s.pickerOverlay}
        >
          <div className={s.pickerCard}>
            <div className={s.pickerHeader}>
              <div className={s.pickerTitleRow}>
                <div className={s.pickerTitle}>Attach to Account</div>
                <button onClick={() => setShowPicker(false)} className={s.iconBtn}>
                  <X size={18} color="var(--t3)" />
                </button>
              </div>
              <div className={s.pickerSearchWrap}>
                <Search size={16} color="var(--t3)" className={s.pickerSearchIcon} />
                <input
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search accounts..."
                  className={s.pickerSearchInput}
                />
              </div>
            </div>
            <div className={s.pickerList}>
              {filteredAvailable.length === 0 ? (
                <div className={s.pickerEmpty}>
                  {pickerSearch
                    ? 'No matching accounts'
                    : allAccounts.length === 0
                      ? 'No accounts created yet'
                      : 'All accounts are already linked'}
                </div>
              ) : (
                filteredAvailable.map((a) => (
                  <button key={a.id} onClick={() => handleLink(a.id)} className={s.pickerItem}>
                    <div className={s.pickerItemIcon}>
                      <MapPinned size={16} color="var(--amb)" />
                    </div>
                    <div className={s.pickerItemInfo}>
                      <div className={s.pickerItemName}>{a.name}</div>
                      <div className={s.pickerItemAddr}>
                        {a.address}
                        {a.city ? `, ${a.city}` : ''}
                      </div>
                    </div>
                    <Plus size={16} color="var(--amb)" />
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
        <div className={s.catEmptyMsg}>No categories created yet</div>
      ) : (
        <div className={s.catList}>
          {categories.map((item) => (
            <div key={item.id} className={s.catRow}>
              <div className={s.catDot} style={{ background: item.color }} />
              <div className={s.catInfo}>
                <div className={s.catName}>{item.name}</div>
                <div className={s.catCount}>
                  {item.count} resource{item.count !== 1 ? 's' : ''}
                </div>
              </div>
              <button onClick={() => setEditingItem(item)} className={s.iconBtn} title="Edit">
                <Edit3 size={14} color="var(--t2)" />
              </button>
              <button onClick={() => setConfirmDel(item)} className={s.iconBtn} title="Delete">
                <Trash2 size={14} color="var(--red)" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setCreating(true)} className={s.addCatBtn}>
        <Plus size={14} /> Add Category
      </button>

      <div className={s.catFooter}>
        <button onClick={onClose} className={s.doneBtn}>
          Done
        </button>
      </div>

      {(editingItem || creating) && (
        <CatItemEditModal
          item={editingItem || {}}
          onSave={async (data) => {
            await onSave(data)
            setEditingItem(null)
            setCreating(false)
          }}
          onClose={() => {
            setEditingItem(null)
            setCreating(false)
          }}
        />
      )}

      {confirmDel && (
        <ConfirmModal
          title={`Delete "${confirmDel.name}"?`}
          message="Resources in this category will become uncategorized."
          onConfirm={async () => {
            await onDelete(confirmDel.id)
            setConfirmDel(null)
          }}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </Modal>
  )
}

function CatItemEditModal({ item, onSave, onClose }) {
  const isEdit = !!item.id
  const [name, setName] = useState(item.name || '')
  const [color, setColor] = useState(item.color || CAT_COLORS[0])
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave({ id: item.id || null, name: name.trim(), color })
    setSaving(false)
  }

  return (
    <div onClick={(e) => e.target === e.currentTarget && onClose()} className={s.catEditOverlay}>
      <div className={s.catEditCard}>
        <div className={s.catEditTitle}>{isEdit ? 'Edit Category' : 'New Category'}</div>
        <FormField
          label="Name *"
          value={name}
          onChange={setName}
          autoFocus
          placeholder="e.g. SDS Sheets"
        />
        <div className={s.colorFieldWrap}>
          <label className={s.colorLabel}>Color</label>
          <div className={s.colorSwatches}>
            {CAT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={s.colorSwatch}
                style={{
                  background: c,
                  boxShadow: color === c ? `0 0 0 2px var(--s1), 0 0 0 3px ${c}` : 'none',
                }}
              />
            ))}
          </div>
        </div>
        <div className={s.catEditActions}>
          <button onClick={onClose} className={s.cancelBtn}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!name.trim() || saving} className={s.saveBtn}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

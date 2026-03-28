// ===================================================
// Projects Page — Phase 3A: List-Detail Split Layout
// Uses DetailLayout, usePageData, StatusBadge
// ===================================================

import { useState, useEffect } from "react"
import {
  Plus, Edit3, Search, ChevronRight, Settings, Trash2,
  Link2, X, ExternalLink, FileText, BookOpen, Clock,
} from "lucide-react"
import AddressLink from "../components/AddressLink.jsx"
import s from "./ProjectsPage.module.css"
import usePageData from "@/hooks/usePageData.js"
import { useGlobalToast } from "@/hooks/ToastContext.jsx"
import {
  getAccounts, createAccount, updateAccount, deleteAccount,
  getAccountResources, linkAccountResource, unlinkAccountResource,
} from "@/lib/api/accounts.js"
import {
  getAccountGroups, createAccountGroup, updateAccountGroup, deleteAccountGroup,
} from "@/lib/api/accountGroups.js"
import { getResources } from "@/lib/api/resources.js"
import DetailLayout from "../components/DetailLayout.jsx"
import StatusBadge from "../components/StatusBadge.jsx"
import {
  Modal, ModalFooter, ConfirmModal, FormField, SelectField, TextareaField,
  LoadingSpinner,
} from "../components/PageUI.jsx"
import { abbreviateState, formatFileSize, ITEM_COLORS } from "@/lib/formatUtils.js"

export default function ProjectsPage() {
  const toast = useGlobalToast()
  const projects = usePageData("accounts", {
    fetchFn: getAccounts,
    createFn: createAccount,
    updateFn: updateAccount,
    deleteFn: deleteAccount,
  })
  const groups = usePageData("accountGroups", {
    fetchFn: getAccountGroups,
    createFn: createAccountGroup,
    updateFn: updateAccountGroup,
    deleteFn: deleteAccountGroup,
  })

  const [selectedId, setSelectedId] = useState(null)
  const [searchQ, setSearchQ] = useState("")
  const [filterGroup, setFilterGroup] = useState("")
  const [activeTab, setActiveTab] = useState("details")
  const [editing, setEditing] = useState(null)          // null = closed, {} = create, {...} = edit
  const [isEditMode, setIsEditMode] = useState(false)
  const [managingGroups, setManagingGroups] = useState(false)

  const selectedProject = projects.data.find(p => p.id === selectedId) || null

  // Reset tab + edit mode when selection changes
  useEffect(() => {
    setActiveTab("details") // eslint-disable-line react-hooks/set-state-in-effect -- Reset state on selection change
    setIsEditMode(false)
  }, [selectedId])

  // Filtered list
  const filtered = projects.data.filter(a => {
    if (filterGroup && a.group_id !== filterGroup) return false
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return (
      a.name.toLowerCase().includes(q) ||
      (a.address || "").toLowerCase().includes(q) ||
      (a.city || "").toLowerCase().includes(q) ||
      (a.contactName || "").toLowerCase().includes(q)
    )
  })

  // CRUD handlers
  const handleSave = async (data) => {
    try {
      if (editing.id) {
        await projects.update(editing.id, data)
        toast.show("Updated")
      } else {
        await projects.create(data)
        toast.show("Added")
      }
      setEditing(null)
    } catch (err) {
      toast.show(err.message || "Failed to save")
    }
  }

  const handleDelete = async (id) => {
    try {
      await projects.remove(id)
      toast.show("Removed")
      setEditing(null)
      if (selectedId === id) setSelectedId(null)
    } catch {
      toast.show("Failed to remove")
    }
  }

  // Inline detail save (edit mode in right panel)
  const handleDetailSave = async (data) => {
    if (!selectedId) return
    try {
      await projects.update(selectedId, data)
      toast.show("Updated")
      setIsEditMode(false)
    } catch (err) {
      toast.show(err.message || "Failed to save")
    }
  }

  const handleDetailDelete = async () => {
    if (!selectedId) return
    try {
      await projects.remove(selectedId)
      toast.show("Removed")
      setSelectedId(null)
    } catch {
      toast.show("Failed to remove")
    }
  }

  // Group CRUD
  const handleSaveGroup = async (data) => {
    try {
      if (data.id) {
        await groups.update(data.id, { name: data.name, color: data.color })
        toast.show("Updated")
      } else {
        await groups.create({ name: data.name, color: data.color })
        toast.show("Created")
      }
    } catch (err) {
      toast.show(err.message || "Failed")
    }
  }

  const handleDeleteGroup = async (id) => {
    try {
      await groups.remove(id)
      toast.show("Removed")
    } catch {
      toast.show("Failed to remove")
    }
  }

  // Detail layout tabs
  const detailTabs = [
    { key: "details", label: "Details" },
    { key: "resources", label: "Resources" },
    { key: "activity", label: "Activity" },
  ]

  // -- Sidebar (left panel) --
  const sidebar = (
    <div className={s.sidebarInner}>
      {/* Search */}
      <div className={s.searchWrap}>
        <Search size={15} className={s.searchIcon} />
        <input
          type="text"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="Search projects..."
          className={s.searchInput}
        />
      </div>

      {/* Group filter */}
      <div className={s.filterRow}>
        <select
          value={filterGroup}
          onChange={e => setFilterGroup(e.target.value)}
          className={s.filterSelect}
        >
          <option value="">All Groups ({projects.data.length})</option>
          {groups.data.map(g => {
            const count = projects.data.filter(a => a.group_id === g.id).length
            return (
              <option key={g.id} value={g.id}>
                {g.name} ({count})
              </option>
            )
          })}
        </select>
        <button
          onClick={() => setManagingGroups(true)}
          className={s.manageGroupsBtn}
          title="Manage Groups"
        >
          <Settings size={14} color="var(--t3)" />
        </button>
      </div>

      <div className={s.sidebarAction}>
        <button className={s.addBtn} onClick={() => setEditing({})}>
          <Plus size={15} /> New Project
        </button>
      </div>

      {/* Project list */}
      <div className={s.listScroll}>
        {projects.loading && !projects.data.length ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <div className={s.listEmpty}>
            {searchQ || filterGroup ? "No matches." : "No projects yet."}
          </div>
        ) : (
          filtered.map(acct => {
            const group = groups.data.find(g => g.id === acct.group_id)
            const isActive = selectedId === acct.id
            return (
              <button
                key={acct.id}
                className={`${s.listItem} ${isActive ? s.listItemActive : ""}`}
                onClick={() => setSelectedId(acct.id)}
                type="button"
              >
                {isActive && <div className={s.activeBar} />}
                <div className={s.listItemContent}>
                  <div className={s.listItemName}>{acct.name}</div>
                  <div className={s.listItemAddr}>
                    <AddressLink address={acct.address} city={acct.city} state={acct.state} />
                  </div>
                </div>
                <div className={s.listItemRight}>
                  {group && (
                    <StatusBadge>
                      <span style={{ color: group.color }}>{group.name}</span>
                    </StatusBadge>
                  )}
                  <ChevronRight size={14} className={s.listChevron} />
                </div>
              </button>
            )
          })
        )}
      </div>

    </div>
  )

  return (
    <div className={s.page}>
      <DetailLayout
        sidebar={sidebar}
        tabs={detailTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasSelection={!!selectedProject}
        onBack={() => setSelectedId(null)}
        emptyMessage="Select a project to view details."
      >
        {selectedProject && activeTab === "details" && (
          <DetailsTab
            project={selectedProject}
            groups={groups.data}
            isEditMode={isEditMode}
            onEdit={() => setIsEditMode(true)}
            onCancel={() => setIsEditMode(false)}
            onSave={handleDetailSave}
            onDelete={handleDetailDelete}
            onOpenModal={() => setEditing(selectedProject)}
          />
        )}
        {selectedProject && activeTab === "resources" && (
          <ResourcesTab projectId={selectedProject.id} toast={toast} />
        )}
        {selectedProject && activeTab === "activity" && (
          <div className={s.activityEmpty}>
            <Clock size={28} className={s.activityIcon} />
            <div className={s.activityText}>Activity tracking coming soon.</div>
          </div>
        )}
      </DetailLayout>

      {/* Create / Edit modal */}
      {editing !== null && (
        <ProjectModal
          project={editing}
          groups={groups.data}
          onSave={handleSave}
          onDelete={editing.id ? () => handleDelete(editing.id) : undefined}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Manage Groups modal */}
      {managingGroups && (
        <ManageItemsModal
          title="Manage Groups"
          items={groups.data.map(g => ({
            id: g.id,
            name: g.name,
            color: g.color,
            count: projects.data.filter(a => a.group_id === g.id).length,
          }))}
          onSave={handleSaveGroup}
          onDelete={handleDeleteGroup}
          onClose={() => setManagingGroups(false)}
        />
      )}

    </div>
  )
}


// ===================================================
// Details Tab — Read / Edit mode
// ===================================================
function DetailsTab({ project, groups, isEditMode, onEdit, onCancel, onSave, onDelete }) {
  const [name, setName] = useState(project.name || "")
  const [address, setAddress] = useState(project.address || "")
  const [city, setCity] = useState(project.city || "")
  const [state, setState] = useState(project.state || "CA")
  const [zip, setZip] = useState(project.zip || "")
  const [contactName, setContactName] = useState(project.contactName || "")
  const [contactPhone, setContactPhone] = useState(project.contactPhone || "")
  const [contactEmail, setContactEmail] = useState(project.contactEmail || "")
  const [notes, setNotes] = useState(project.notes || "")
  const [groupId, setGroupId] = useState(project.group_id ? String(project.group_id) : "")
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Sync form when project changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync form fields from prop
    setName(project.name || "")
    setAddress(project.address || "")
    setCity(project.city || "")
    setState(project.state || "CA")
    setZip(project.zip || "")
    setContactName(project.contactName || "")
    setContactPhone(project.contactPhone || "")
    setContactEmail(project.contactEmail || "")
    setNotes(project.notes || "")
    setGroupId(project.group_id ? String(project.group_id) : "")
  }, [project])

  const handleSubmit = async () => {
    if (!name.trim() || !address.trim()) return
    setSaving(true)
    await onSave({
      name: name.trim(),
      address,
      city,
      state: abbreviateState(state),
      zip,
      contactName,
      contactPhone,
      contactEmail,
      groupId: groupId ? parseInt(groupId) : null,
      notes: notes || null,
    })
    setSaving(false)
  }

  if (confirmDelete) {
    return (
      <ConfirmModal
        title={`Remove "${project.name}"?`}
        message="Existing logs referencing this property are preserved."
        onConfirm={() => { onDelete(); setConfirmDelete(false) }}
        onCancel={() => setConfirmDelete(false)}
      />
    )
  }

  const group = groups.find(g => g.id === project.group_id)

  // -- Read mode --
  if (!isEditMode) {
    return (
      <div className={s.detailRead}>
        <div className={s.detailHeader}>
          <h2 className={s.detailTitle}>{project.name}</h2>
          <div className={s.detailActions}>
            <button className={s.editBtn} onClick={onEdit}>
              <Edit3 size={14} /> Edit
            </button>
            <button className={s.deleteBtn} onClick={() => setConfirmDelete(true)}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className={s.fieldGrid}>
          <div style={{ gridColumn: "1 / -1" }}>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--t3)", marginBottom: "var(--space-1)" }}>Address</div>
            <AddressLink icon address={project.address} city={project.city} state={project.state} zip={project.zip} />
          </div>
          <ReadField label="Contact Name" value={project.contactName} />
          <ReadField label="Contact Phone" value={project.contactPhone} mono />
          <ReadField label="Contact Email" value={project.contactEmail} />
          <ReadField
            label="Group"
            value={group ? group.name : "None"}
            color={group?.color}
          />
        </div>

        {project.notes && (
          <div className={s.notesSection}>
            <div className={s.readLabel}>Notes</div>
            <div className={s.readValue}>{project.notes}</div>
          </div>
        )}
      </div>
    )
  }

  // -- Edit mode --
  return (
    <div className={s.detailEdit}>
      <div className={s.formGrid}>
        <div className={s.formSpan2}>
          <FormField label="Name *" value={name} onChange={setName} autoFocus />
        </div>
        <div className={s.formSpan2}>
          <FormField label="Address *" value={address} onChange={setAddress} />
        </div>
        <FormField label="City" value={city} onChange={setCity} />
        <FormField label="State" value={state} onChange={setState} />
        <FormField label="ZIP" value={zip} onChange={setZip} />
        <FormField label="Contact Name" value={contactName} onChange={setContactName} />
        <FormField label="Phone" value={contactPhone} onChange={setContactPhone} type="tel" />
        <FormField label="Email" value={contactEmail} onChange={setContactEmail} type="email" />
        <div className={s.formSpan2}>
          <SelectField
            label="Group"
            value={groupId}
            onChange={setGroupId}
            placeholder="None"
            options={groups.map(g => ({ value: String(g.id), label: g.name }))}
          />
        </div>
        <div className={s.formSpan2}>
          <TextareaField label="Notes" value={notes} onChange={setNotes} placeholder="Gate code, special instructions, etc." />
        </div>
      </div>

      <div className={s.editActions}>
        <button className={s.cancelBtn} onClick={onCancel}>Cancel</button>
        <button
          className={s.saveBtn}
          onClick={handleSubmit}
          disabled={!name.trim() || !address.trim() || saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  )
}

function ReadField({ label, value, mono, color }) {
  return (
    <div className={s.readFieldWrap}>
      <div className={s.readLabel}>{label}</div>
      <div
        className={`${s.readValue} ${mono ? s.mono : ""}`}
        style={color ? { color } : undefined}
      >
        {value || "\u2014"}
      </div>
    </div>
  )
}


// ===================================================
// Resources Tab — Link/unlink resources
// ===================================================
function ResourcesTab({ projectId, toast }) {
  const [linked, setLinked] = useState([])
  const [allResources, setAllResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSearch, setPickerSearch] = useState("")

  const load = async () => {
    let linkedRes = []
    let allRes = []
    try { allRes = await getResources() } catch (err) { console.error("Failed to load resources:", err) }
    try { linkedRes = await getAccountResources(projectId) } catch (err) { console.error("Failed to load linked resources:", err) }
    setLinked(linkedRes)
    setAllResources(allRes)
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      let linkedRes = []
      let allRes = []
      try { allRes = await getResources() } catch (err) { console.error("Failed to load resources:", err) }
      try { linkedRes = await getAccountResources(projectId) } catch (err) { console.error("Failed to load linked resources:", err) }
      if (active) { setLinked(linkedRes); setAllResources(allRes); setLoading(false) }
    })()
    return () => { active = false }
  }, [projectId])

  const handleLink = async (resourceId) => {
    try {
      await linkAccountResource(projectId, resourceId)
      toast.show("Resource linked")
      load()
    } catch { toast.show("Failed to link") }
  }

  const handleUnlink = async (resourceId) => {
    try {
      await unlinkAccountResource(projectId, resourceId)
      toast.show("Resource unlinked")
      load()
    } catch { toast.show("Failed to unlink") }
  }

  const linkedIds = new Set(linked.map(r => r.id))
  const available = allResources.filter(r => !linkedIds.has(r.id))
  const filteredAvailable = available.filter(r => {
    if (!pickerSearch) return true
    const q = pickerSearch.toLowerCase()
    return r.title.toLowerCase().includes(q) || (r.categoryName || "").toLowerCase().includes(q)
  })

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className={s.resourcesHeader}>
        <div>
          <div className={s.resourcesCount}>
            <span className={s.mono}>{linked.length}</span> resource{linked.length !== 1 ? "s" : ""} linked
          </div>
          <div className={s.resourcesSub}>
            Crews see these when visiting this jobsite
          </div>
        </div>
        <button onClick={() => setShowPicker(true)} className={s.attachBtn}>
          <Link2 size={14} /> Attach Resource
        </button>
      </div>

      {linked.length === 0 ? (
        <div className={s.emptyResources}>
          <BookOpen size={28} color="var(--t3)" className={s.emptyResourcesIcon} />
          <div>No resources attached yet</div>
          <div className={s.emptyResourcesSub}>
            Attach SDS sheets, site plans, or manuals for crews to access on-site
          </div>
        </div>
      ) : (
        <div className={s.linkedList}>
          {linked.map(r => (
            <div key={r.id} className={s.linkedRow}>
              <div
                className={s.resourceIcon}
                style={{ background: r.categoryColor ? `${r.categoryColor}15` : "var(--blu-dim)" }}
              >
                {r.resourceType === "link"
                  ? <ExternalLink size={16} color={r.categoryColor || "var(--blu)"} />
                  : <FileText size={16} color={r.categoryColor || "var(--blu)"} />}
              </div>
              <div className={s.resourceInfo}>
                <div className={s.resourceTitle}>{r.title}</div>
                <div className={s.resourceMeta}>
                  <span className={s.resourceBadge}>{r.resourceType === "link" ? "Link" : "File"}</span>
                  {r.fileSize && <span className={s.mono}>{formatFileSize(r.fileSize)}</span>}
                  {r.createdAt && <span className={s.mono}>{new Date(r.createdAt).toLocaleDateString()}</span>}
                </div>
              </div>
              <button onClick={() => handleUnlink(r.id)} className={s.unlinkBtn} title="Unlink">
                <X size={16} color="var(--t3)" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Resource Picker */}
      {showPicker && (
        <ResourcePickerOverlay
          available={filteredAvailable}
          totalCount={allResources.length}
          search={pickerSearch}
          onSearch={setPickerSearch}
          onSelect={handleLink}
          onClose={() => { setShowPicker(false); setPickerSearch("") }}
        />
      )}
    </div>
  )
}



// ===================================================
// Resource Picker Overlay
// ===================================================
export function ResourcePickerOverlay({ available, search, onSearch, onSelect, onClose, totalCount = 0 }) {
  const emptyMessage = search
    ? "No matching resources"
    : totalCount === 0
      ? "No resources in your library yet \u2014 add some from the Resources page first"
      : "All resources are already linked"

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} className={s.pickerOverlay}>
      <div className={s.pickerPanel}>
        <div className={s.pickerHeader}>
          <div className={s.pickerTitleRow}>
            <div className={s.pickerTitle}>Attach Resource</div>
            <button onClick={onClose} className={s.pickerCloseBtn}>
              <X size={18} color="var(--t3)" />
            </button>
          </div>
          <div className={s.pickerSearchWrap}>
            <Search size={16} color="var(--t3)" className={s.pickerSearchIcon} />
            <input
              value={search}
              onChange={e => onSearch(e.target.value)}
              placeholder="Search resources..."
              className={s.pickerSearchInput}
            />
          </div>
        </div>
        <div className={s.pickerList}>
          {available.length === 0 ? (
            <div className={s.pickerEmpty}>{emptyMessage}</div>
          ) : (
            available.map(r => (
              <button key={r.id} onClick={() => onSelect(r.id)} className={s.pickerItem}>
                <div
                  className={s.resourceIcon}
                  style={{ background: r.categoryColor ? `${r.categoryColor}15` : "var(--blu-dim)" }}
                >
                  {r.resourceType === "link"
                    ? <ExternalLink size={16} color={r.categoryColor || "var(--blu)"} />
                    : <FileText size={16} color={r.categoryColor || "var(--blu)"} />}
                </div>
                <div className={s.resourceInfo}>
                  <div className={s.resourceTitle}>{r.title}</div>
                  <div className={s.resourceCategory}>{r.categoryName || "Uncategorized"}</div>
                </div>
                <Plus size={16} color="var(--amb)" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}


// ===================================================
// Project Modal — Create / Edit
// ===================================================
function ProjectModal({ project, groups, onSave, onDelete, onClose }) {
  const isEdit = !!project.id
  const [name, setName] = useState(project.name || "")
  const [address, setAddress] = useState(project.address || "")
  const [city, setCity] = useState(project.city || "")
  const [state, setState] = useState(project.state || "CA")
  const [zip, setZip] = useState(project.zip || "")
  const [contactName, setContactName] = useState(project.contactName || "")
  const [contactPhone, setContactPhone] = useState(project.contactPhone || "")
  const [contactEmail, setContactEmail] = useState(project.contactEmail || "")
  const [notes, setNotes] = useState(project.notes || "")
  const [groupId, setGroupId] = useState(project.group_id ? String(project.group_id) : "")
  const [estimatedMinutes, setEstMinutes] = useState(String(project.estimatedMinutes || 30))
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !address.trim()) return
    setSaving(true)
    await onSave({
      name: name.trim(),
      address,
      city,
      state: abbreviateState(state),
      zip,
      contactName,
      contactPhone,
      contactEmail,
      groupId: groupId ? parseInt(groupId) : null,
      estimatedMinutes: parseInt(estimatedMinutes) || 30,
      notes: notes || null,
    })
    setSaving(false)
  }

  if (confirmDelete) {
    return (
      <ConfirmModal
        title={`Remove "${project.name}"?`}
        message="Existing logs referencing this property are preserved."
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    )
  }

  return (
    <Modal title={isEdit ? "Edit Project" : "Add Project"} onClose={onClose} size="lg">
      <FormField label="Project Name *" value={name} onChange={setName} autoFocus placeholder="e.g. Oak Ridge Estates" />
      <FormField label="Address *" value={address} onChange={setAddress} placeholder="Street address" />
      <div className={s.formRow3}>
        <FormField label="City" value={city} onChange={setCity} />
        <FormField label="State" value={state} onChange={setState} />
        <FormField label="ZIP" value={zip} onChange={setZip} />
      </div>

      <SelectField
        label="Group"
        value={groupId}
        onChange={setGroupId}
        placeholder="None"
        options={groups.map(g => ({ value: String(g.id), label: g.name }))}
      />

      {/* Estimated service time */}
      <div className={s.estTimeSection}>
        <label className={s.estTimeLabel}>Estimated Service Time</label>
        <div className={s.estTimeBtnRow}>
          {[15, 30, 45, 60, 90, 120].map(m => (
            <button
              key={m}
              onClick={() => setEstMinutes(String(m))}
              className={`${s.estTimeBtn} ${parseInt(estimatedMinutes) === m ? s.estTimeBtnActive : ""}`}
            >
              {m < 60 ? `${m}m` : `${m / 60}h`}
            </button>
          ))}
        </div>
        <input
          value={estimatedMinutes}
          onChange={e => setEstMinutes(e.target.value.replace(/\D/g, ""))}
          placeholder="Custom minutes"
          className={s.estTimeInput}
        />
        <span className={s.estTimeHint}>minutes</span>
      </div>

      <div className={s.contactSection}>
        <div className={s.contactSectionTitle}>Contact</div>
        <FormField label="Name" value={contactName} onChange={setContactName} />
        <div className={s.formRow2}>
          <FormField label="Phone" value={contactPhone} onChange={setContactPhone} type="tel" />
          <FormField label="Email" value={contactEmail} onChange={setContactEmail} type="email" />
        </div>
      </div>

      <TextareaField label="Notes" value={notes} onChange={setNotes} placeholder="Gate code, special instructions, etc." />
      <ModalFooter
        onClose={onClose}
        onSave={handleSubmit}
        saving={saving}
        disabled={!name.trim() || !address.trim()}
        onDelete={onDelete ? () => setConfirmDelete(true) : undefined}
      />
    </Modal>
  )
}


// ===================================================
// Manage Items Modal — Group management
// ===================================================
function ManageItemsModal({ title, items, onSave, onDelete, onClose }) {
  const [editingItem, setEditingItem] = useState(null)
  const [creating, setCreating] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)

  return (
    <Modal title={title} onClose={onClose} size="sm">
      {items.length === 0 ? (
        <div className={s.manageEmpty}>None created yet</div>
      ) : (
        <div className={s.manageList}>
          {items.map(item => (
            <div key={item.id} className={s.manageRow}>
              <div className={s.manageColorDot} style={{ background: item.color }} />
              <div className={s.manageInfo}>
                <div className={s.manageName}>{item.name}</div>
                <div className={s.manageCount}>{item.count} item{item.count !== 1 ? "s" : ""}</div>
              </div>
              <button onClick={() => setEditingItem(item)} className={s.manageActionBtn} title="Edit">
                <Edit3 size={14} color="var(--t2)" />
              </button>
              <button onClick={() => setConfirmDel(item)} className={s.manageActionBtn} title="Delete">
                <Trash2 size={14} color="var(--red)" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setCreating(true)} className={s.addNewBtn}>
        <Plus size={14} /> Add New
      </button>

      <div className={s.manageFooter}>
        <button onClick={onClose} className={s.doneBtn}>Done</button>
      </div>

      {(editingItem || creating) && (
        <ItemEditModal
          item={editingItem || {}}
          onSave={async (data) => { await onSave(data); setEditingItem(null); setCreating(false) }}
          onClose={() => { setEditingItem(null); setCreating(false) }}
        />
      )}

      {confirmDel && (
        <ConfirmModal
          title={`Delete "${confirmDel.name}"?`}
          message="Items using this will become uncategorized."
          onConfirm={async () => { await onDelete(confirmDel.id); setConfirmDel(null) }}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </Modal>
  )
}


// ===================================================
// Item Edit Modal — name + color picker
// ===================================================
function ItemEditModal({ item, onSave, onClose }) {
  const isEdit = !!item.id
  const [name, setName] = useState(item.name || "")
  const [color, setColor] = useState(item.color || ITEM_COLORS[0])
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave({ id: item.id || null, name: name.trim(), color })
    setSaving(false)
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} className={s.itemEditOverlay}>
      <div className={s.itemEditPanel}>
        <div className={s.itemEditTitle}>{isEdit ? "Edit" : "Create New"}</div>
        <FormField label="Name *" value={name} onChange={setName} autoFocus placeholder="e.g. Zone A" />
        <div className={s.colorPickerSection}>
          <label className={s.colorPickerLabel}>Color</label>
          <div className={s.colorPickerRow}>
            {ITEM_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={s.colorSwatch}
                style={{
                  background: c,
                  boxShadow: color === c ? `0 0 0 2px var(--s1), 0 0 0 4px ${c}` : "none",
                }}
              />
            ))}
          </div>
        </div>
        <div className={s.itemEditActions}>
          <button onClick={onClose} className={s.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={!name.trim() || saving} className={s.saveBtn}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  )
}

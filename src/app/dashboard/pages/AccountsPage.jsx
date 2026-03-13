// ═══════════════════════════════════════════
// Accounts Page — Properties with group filtering
// + Resource linking via edit modal "Resources" tab
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import {
  MapPinned, Plus, Edit3, MapPin, Phone as PhoneIcon, Navigation,
  BookOpen, Link2, X, Search, ExternalLink, Download, FileText, Loader2,
  Settings, Trash2,
} from "lucide-react"
import s from "./AccountsPage.module.css"
import { useData } from "@/context/DataProvider.jsx"
import {
  getAccountResources, linkAccountResource, unlinkAccountResource,
} from "@/lib/api/accounts.js"
import { getResources } from "@/lib/api/resources.js"
import {
  Modal, ModalFooter, ConfirmModal, FormField, SelectField, TextareaField,
  PageHeader, AddButton, SearchBar, ClickableCard, IconButton,
  LoadingSpinner, EmptyMessage,
} from "@/app/dashboard/components/PageUI.jsx"

const STATE_MAP = {
  alabama:"AL", alaska:"AK", arizona:"AZ", arkansas:"AR", california:"CA",
  colorado:"CO", connecticut:"CT", delaware:"DE", florida:"FL", georgia:"GA",
  hawaii:"HI", idaho:"ID", illinois:"IL", indiana:"IN", iowa:"IA", kansas:"KS",
  kentucky:"KY", louisiana:"LA", maine:"ME", maryland:"MD", massachusetts:"MA",
  michigan:"MI", minnesota:"MN", mississippi:"MS", missouri:"MO", montana:"MT",
  nebraska:"NE", nevada:"NV", "new hampshire":"NH", "new jersey":"NJ",
  "new mexico":"NM", "new york":"NY", "north carolina":"NC", "north dakota":"ND",
  ohio:"OH", oklahoma:"OK", oregon:"OR", pennsylvania:"PA", "rhode island":"RI",
  "south carolina":"SC", "south dakota":"SD", tennessee:"TN", texas:"TX",
  utah:"UT", vermont:"VT", virginia:"VA", washington:"WA", "west virginia":"WV",
  wisconsin:"WI", wyoming:"WY", "district of columbia":"DC",
}

function abbreviateState(input) {
  if (!input) return "CA"
  const trimmed = input.trim()
  if (trimmed.length <= 2) return trimmed.toUpperCase()
  return STATE_MAP[trimmed.toLowerCase()] || trimmed
}

export default function AccountsPage() {
  const { accounts, accountGroups, toast } = useData()
  const [editing, setEditing] = useState(null)
  const [searchQ, setSearchQ] = useState("")
  const [filterGroup, setFilterGroup] = useState("")
  const [managingGroups, setManagingGroups] = useState(false)

  const filtered = accounts.data.filter(a => {
    if (filterGroup && a.group_id !== filterGroup) return false
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return a.name.toLowerCase().includes(q) || (a.address || "").toLowerCase().includes(q) ||
      (a.city || "").toLowerCase().includes(q) || (a.contactName || "").toLowerCase().includes(q)
  })

  const handleSave = async (data) => {
    try {
      if (editing.id) { await accounts.update(editing.id, data); toast.show("Updated ✓") }
      else { await accounts.create(data); toast.show("Added ✓") }
      setEditing(null)
    } catch (err) { toast.show(err.message || "Failed to save") }
  }

  const handleDelete = async (id) => {
    try { await accounts.remove(id); toast.show("Removed ✓"); setEditing(null) }
    catch { toast.show("Failed to remove") }
  }

  const handleSaveGroup = async (data) => {
    try {
      if (data.id) { await accountGroups.update(data.id, { name: data.name, color: data.color }); toast.show("Updated ✓") }
      else { await accountGroups.create({ name: data.name, color: data.color }); toast.show("Created ✓") }
    } catch (err) { toast.show(err.message || "Failed") }
  }

  const handleDeleteGroup = async (id) => {
    try { await accountGroups.remove(id); toast.show("Removed ✓") }
    catch { toast.show("Failed to remove") }
  }

  return (
    <div>
      <PageHeader title="Accounts" count={accounts.data.length} countLabel={`propert${accounts.data.length !== 1 ? "ies" : "y"}`}
        action={<AddButton label="Add Account" icon={Plus} onClick={() => setEditing({})} />} />

      {/* Filters */}
      <div className={s.filterBar}>
        <SearchBar value={searchQ} onChange={setSearchQ} placeholder="Search accounts..." />
        <div className={s.filterRow}>
          <FilterPill label="All" count={accounts.data.length} color="var(--color-accent)"
            active={!filterGroup} onClick={() => setFilterGroup("")} />
          {accountGroups.data.map(g => {
            const count = accounts.data.filter(a => a.group_id === g.id).length
            return <FilterPill key={g.id} label={g.name} count={count} color={g.color}
              active={filterGroup === g.id} onClick={() => setFilterGroup(filterGroup === g.id ? "" : g.id)} />
          })}
          <button onClick={() => setManagingGroups(true)} className={s.manageGroupsBtn} title="Manage Groups">
            <Settings size={14} color="var(--color-text-light)" />
          </button>
        </div>
      </div>

      {/* Cards */}
      {accounts.loading && !accounts.data.length ? <LoadingSpinner /> :
       filtered.length === 0 ? <EmptyMessage text={searchQ || filterGroup ? "No matches." : "No accounts yet."} /> : (
        <div className={s.cardGrid}>
          {filtered.map(acct => {
            const group = accountGroups.data.find(g => g.id === acct.group_id)
            return (
              <ClickableCard key={acct.id} onClick={() => setEditing(acct)} className={s.cardInner}>
                <div className={s.cardHeader}>
                  <div className={s.cardHeaderLeft}>
                    <div className={s.cardTitleRow}>
                      <div className={s.cardName}>{acct.name}</div>
                      {group && <span className={s.groupBadge} style={{ background: `${group.color}15`, color: group.color }}>{group.name}</span>}
                    </div>
                  </div>
                  <IconButton icon={Edit3} onClick={() => setEditing(acct)} title="Edit" />
                </div>

                <div className={s.addressRow}>
                  <MapPin size={14} color="var(--color-text-light)" className={s.addressIcon} />
                  <div className={s.addressText}>
                    {acct.address}{acct.city && <>, {acct.city}</>}{acct.state && <>, {acct.state}</>}{acct.zip && <> {acct.zip}</>}
                  </div>
                </div>

                {(acct.contactName || acct.contactPhone) && (
                  <div className={s.contactRow}>
                    {acct.contactName && <span>{acct.contactName}</span>}
                    {acct.contactPhone && <span className={s.contactPhone}><PhoneIcon size={11} /> {acct.contactPhone}</span>}
                  </div>
                )}

                {acct.latitude && acct.longitude && (
                  <div className={s.gpsRow}>
                    <Navigation size={11} /> GPS saved
                  </div>
                )}
              </ClickableCard>
            )
          })}
        </div>
      )}

      {/* Edit / Create modal */}
      {editing !== null && (
        <AccountModal
          account={editing}
          groups={accountGroups.data}
          onSave={handleSave}
          onDelete={editing.id ? () => handleDelete(editing.id) : undefined}
          onClose={() => setEditing(null)}
          toast={toast}
        />
      )}

      {/* Manage Groups modal */}
      {managingGroups && (
        <ManageItemsModal
          title="Manage Groups"
          items={accountGroups.data.map(g => ({
            id: g.id, name: g.name, color: g.color,
            count: accounts.data.filter(a => a.group_id === g.id).length,
          }))}
          onSave={handleSaveGroup}
          onDelete={handleDeleteGroup}
          onClose={() => setManagingGroups(false)}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Account Modal — with Resources tab for existing accounts
// ═══════════════════════════════════════════
function AccountModal({ account, groups, onSave, onDelete, onClose, toast }) {
  const isEdit = !!account.id
  const [tab, setTab] = useState("details")
  const [name, setName] = useState(account.name || "")
  const [address, setAddress] = useState(account.address || "")
  const [city, setCity] = useState(account.city || "")
  const [state, setState] = useState(account.state || "CA")
  const [zip, setZip] = useState(account.zip || "")
  const [contactName, setContactName] = useState(account.contactName || "")
  const [contactPhone, setContactPhone] = useState(account.contactPhone || "")
  const [contactEmail, setContactEmail] = useState(account.contactEmail || "")
  const [notes, setNotes] = useState(account.notes || "")
  const [groupId, setGroupId] = useState(account.group_id ? String(account.group_id) : "")
  const [estimatedMinutes, setEstMinutes] = useState(String(account.estimatedMinutes || 30))
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !address.trim()) return
    setSaving(true)
    await onSave({
      name: name.trim(), address, city, state: abbreviateState(state), zip,
      contactName, contactPhone, contactEmail,
      groupId: groupId ? parseInt(groupId) : null,
      estimatedMinutes: parseInt(estimatedMinutes) || 30,
      notes: notes || null,
    })
    setSaving(false)
  }

  if (confirmDelete) {
    return <ConfirmModal title={`Remove "${account.name}"?`}
      message="Existing logs referencing this property are preserved."
      onConfirm={onDelete} onCancel={() => setConfirmDelete(false)} />
  }

  const tabs = [
    { key: "details", label: "Details" },
    ...(!isEdit ? [] : [{ key: "resources", label: "Resources" }]),
  ]

  return (
    <Modal title={isEdit ? "Edit Account" : "Add Account"} onClose={onClose} size="lg">
      {/* Tabs — only for existing accounts */}
      {isEdit && (
        <div className={s.tabBar}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`${s.tabBtn} ${tab === t.key ? s.tabBtnActive : ""}`}
            >{t.label}</button>
          ))}
        </div>
      )}

      {/* Details tab */}
      {tab === "details" && (
        <>
          <FormField label="Property Name *" value={name} onChange={setName} autoFocus placeholder="e.g. Oak Ridge Estates" />
          <FormField label="Address *" value={address} onChange={setAddress} placeholder="Street address" />
          <div className={s.formRow3}>
            <FormField label="City" value={city} onChange={setCity} />
            <FormField label="State" value={state} onChange={setState} />
            <FormField label="ZIP" value={zip} onChange={setZip} />
          </div>

          <SelectField label="Group" value={groupId} onChange={setGroupId} placeholder="None"
            options={groups.map(g => ({ value: String(g.id), label: g.name }))} />

          {/* Estimated service time */}
          <div className={s.estTimeSection}>
            <label className={s.estTimeLabel}>
              Estimated Service Time
            </label>
            <div className={s.estTimeBtnRow}>
              {[15, 30, 45, 60, 90, 120].map(m => (
                <button key={m} onClick={() => setEstMinutes(String(m))}
                  className={`${s.estTimeBtn} ${parseInt(estimatedMinutes) === m ? s.estTimeBtnActive : ""}`}
                >{m < 60 ? `${m}m` : `${m / 60}h`}</button>
              ))}
            </div>
            <input value={estimatedMinutes} onChange={e => setEstMinutes(e.target.value.replace(/\D/g, ""))}
              placeholder="Custom minutes" className={s.estTimeInput} />
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
          <ModalFooter onClose={onClose} onSave={handleSubmit} saving={saving}
            disabled={!name.trim() || !address.trim()}
            onDelete={onDelete ? () => setConfirmDelete(true) : undefined} />
        </>
      )}

      {/* Resources tab */}
      {tab === "resources" && account.id && (
        <AccountResourcesTab accountId={account.id} toast={toast} onClose={onClose} />
      )}
    </Modal>
  )
}


// ═══════════════════════════════════════════
// Account Resources Tab — Link/unlink resources
// Used inside AccountModal AND exported for ResourceModal
// ═══════════════════════════════════════════
export function AccountResourcesTab({ accountId, toast, onClose }) {
  const [linked, setLinked] = useState([])
  const [allResources, setAllResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSearch, setPickerSearch] = useState("")

  const load = async () => {
    // Fetch independently — if the linked endpoint isn't ready yet,
    // we still want the full resource list to populate the picker
    let linkedRes = []
    let allRes = []
    try { allRes = await getResources() } catch (err) { console.error("Failed to load resources:", err) }
    try { linkedRes = await getAccountResources(accountId) } catch (err) { console.error("Failed to load linked resources:", err) }
    setLinked(linkedRes)
    setAllResources(allRes)
    setLoading(false)
  }

  useEffect(() => { load() }, [accountId])

  const handleLink = async (resourceId) => {
    try {
      await linkAccountResource(accountId, resourceId)
      toast.show("Resource linked ✓")
      load()
    } catch { toast.show("Failed to link") }
  }

  const handleUnlink = async (resourceId) => {
    try {
      await unlinkAccountResource(accountId, resourceId)
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
            {linked.length} resource{linked.length !== 1 ? "s" : ""} linked
          </div>
          <div className={s.resourcesSub}>
            Crews see these when visiting this jobsite
          </div>
        </div>
        <button onClick={() => setShowPicker(true)} className={s.attachBtn}>
          <Link2 size={14} /> Attach Resource
        </button>
      </div>

      {/* Linked list */}
      {linked.length === 0 ? (
        <div className={s.emptyResources}>
          <BookOpen size={28} color="var(--color-text-light)" className={s.emptyResourcesIcon} />
          <div>No resources attached yet</div>
          <div className={s.emptyResourcesSub}>
            Attach SDS sheets, site plans, or manuals for crews to access on-site
          </div>
        </div>
      ) : (
        <div className={s.linkedList}>
          {linked.map(r => (
            <div key={r.id} className={s.linkedRow}>
              <div className={s.resourceIcon}
                style={{ background: r.categoryColor ? `${r.categoryColor}15` : "var(--color-blue-light)" }}>
                {r.resourceType === "link"
                  ? <ExternalLink size={16} color={r.categoryColor || "var(--color-blue)"} />
                  : <FileText size={16} color={r.categoryColor || "var(--color-blue)"} />
                }
              </div>
              <div className={s.resourceInfo}>
                <div className={s.resourceTitle}>
                  {r.title}
                </div>
                <div className={s.resourceCategory}>
                  {r.categoryName || "Uncategorized"}
                </div>
              </div>
              <button onClick={() => handleUnlink(r.id)} className={s.unlinkBtn} title="Unlink">
                <X size={16} color="var(--color-text-light)" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className={s.resourcesFooter}>
        <button onClick={onClose} className={s.doneBtn}>Done</button>
      </div>

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


// ═══════════════════════════════════════════
// Resource Picker Overlay — reusable
// ═══════════════════════════════════════════
export function ResourcePickerOverlay({ available, search, onSearch, onSelect, onClose, totalCount = 0 }) {
  const emptyMessage = search
    ? "No matching resources"
    : totalCount === 0
      ? "No resources in your library yet — add some from the Resources page first"
      : "All resources are already linked"

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} className={s.pickerOverlay}>
      <div className={s.pickerPanel}>
        <div className={s.pickerHeader}>
          <div className={s.pickerTitleRow}>
            <div className={s.pickerTitle}>Attach Resource</div>
            <button onClick={onClose} className={s.pickerCloseBtn}>
              <X size={18} color="var(--color-text-light)" />
            </button>
          </div>
          <div className={s.pickerSearchWrap}>
            <Search size={16} color="var(--color-text-light)" className={s.pickerSearchIcon} />
            <input
              value={search} onChange={e => onSearch(e.target.value)}
              placeholder="Search resources..."
              className={s.pickerSearchInput}
            />
          </div>
        </div>
        <div className={s.pickerList}>
          {available.length === 0 ? (
            <div className={s.pickerEmpty}>
              {emptyMessage}
            </div>
          ) : (
            available.map(r => (
              <button key={r.id} onClick={() => onSelect(r.id)} className={s.pickerItem}>
                <div className={s.resourceIcon}
                  style={{ background: r.categoryColor ? `${r.categoryColor}15` : "var(--color-blue-light)" }}>
                  {r.resourceType === "link"
                    ? <ExternalLink size={16} color={r.categoryColor || "var(--color-blue)"} />
                    : <FileText size={16} color={r.categoryColor || "var(--color-blue)"} />
                  }
                </div>
                <div className={s.resourceInfo}>
                  <div className={s.resourceTitle}>
                    {r.title}
                  </div>
                  <div className={s.resourceCategory}>
                    {r.categoryName || "Uncategorized"}
                  </div>
                </div>
                <Plus size={16} color="var(--color-accent)" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════
// Filter Pill — Clickable tag for filtering
// ═══════════════════════════════════════════
function FilterPill({ label, count, color, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`${s.filterPill} ${active ? s.filterPillActive : ""}`}
      style={active ? { borderColor: color, background: `${color}10`, color } : undefined}
    >
      {label}
      {count !== undefined && <span className={s.filterPillCount}>({count})</span>}
    </button>
  )
}

// ═══════════════════════════════════════════
// Manage Items Modal — Shared for groups + categories
// ═══════════════════════════════════════════
const ITEM_COLORS = ["#059669", "#3B82F6", "#F59E0B", "#EF4444", "#7C3AED", "#0891B2", "#DB2777", "#65A30D", "#92400E", "#475569"]

function ManageItemsModal({ title, items, onSave, onDelete, onClose }) {
  const [editingItem, setEditingItem] = useState(null)
  const [creating, setCreating] = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)

  return (
    <Modal title={title} onClose={onClose} size="sm">
      {/* Existing items */}
      {items.length === 0 ? (
        <div className={s.manageEmpty}>
          None created yet
        </div>
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
                <Edit3 size={14} color="var(--color-text-med)" />
              </button>
              <button onClick={() => setConfirmDel(item)} className={s.manageActionBtn} title="Delete">
                <Trash2 size={14} color="var(--color-red)" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new button */}
      <button onClick={() => setCreating(true)} className={s.addNewBtn}>
        <Plus size={14} /> Add New
      </button>

      {/* Close */}
      <div className={s.manageFooter}>
        <button onClick={onClose} className={s.doneBtn}>Done</button>
      </div>

      {/* Edit / Create sub-modal */}
      {(editingItem || creating) && (
        <ItemEditModal
          item={editingItem || {}}
          onSave={async (data) => { await onSave(data); setEditingItem(null); setCreating(false) }}
          onClose={() => { setEditingItem(null); setCreating(false) }}
        />
      )}

      {/* Delete confirmation */}
      {confirmDel && (
        <ConfirmModal title={`Delete "${confirmDel.name}"?`}
          message="Items using this will become uncategorized."
          onConfirm={async () => { await onDelete(confirmDel.id); setConfirmDel(null) }}
          onCancel={() => setConfirmDel(null)} />
      )}
    </Modal>
  )
}

// ═══════════════════════════════════════════
// Item Edit Modal — name + color picker
// ═══════════════════════════════════════════
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
        <div className={s.itemEditTitle}>
          {isEdit ? "Edit" : "Create New"}
        </div>
        <FormField label="Name *" value={name} onChange={setName} autoFocus placeholder="e.g. Zone A" />
        <div className={s.colorPickerSection}>
          <label className={s.colorPickerLabel}>Color</label>
          <div className={s.colorPickerRow}>
            {ITEM_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} className={s.colorSwatch}
                style={{
                  background: c,
                  boxShadow: color === c ? `0 0 0 2px var(--color-bg), 0 0 0 4px ${c}` : "none",
                }} />
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

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
import { T } from "@/app/tokens.js"
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

export default function AccountsPage({ isMobile }) {
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
      <div style={{ marginBottom: 16 }}>
        <SearchBar value={searchQ} onChange={setSearchQ} placeholder="Search accounts..." />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
          <FilterPill label="All" count={accounts.data.length} color={T.accent}
            active={!filterGroup} onClick={() => setFilterGroup("")} />
          {accountGroups.data.map(g => {
            const count = accounts.data.filter(a => a.group_id === g.id).length
            return <FilterPill key={g.id} label={g.name} count={count} color={g.color}
              active={filterGroup === g.id} onClick={() => setFilterGroup(filterGroup === g.id ? "" : g.id)} />
          })}
          <button onClick={() => setManagingGroups(true)} style={{
            width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${T.border}`,
            background: T.card, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
          }} title="Manage Groups">
            <Settings size={14} color={T.textLight} />
          </button>
        </div>
      </div>

      {/* Cards — original sizing preserved */}
      {accounts.loading && !accounts.data.length ? <LoadingSpinner /> :
       filtered.length === 0 ? <EmptyMessage text={searchQ || filterGroup ? "No matches." : "No accounts yet."} /> : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 12 }}>
          {filtered.map(acct => {
            const group = accountGroups.data.find(g => g.id === acct.group_id)
            return (
              <ClickableCard key={acct.id} onClick={() => setEditing(acct)} style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{acct.name}</div>
                      {group && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: `${group.color}15`, color: group.color, flexShrink: 0 }}>{group.name}</span>}
                    </div>
                  </div>
                  <IconButton icon={Edit3} onClick={() => setEditing(acct)} title="Edit" />
                </div>

                <div style={{ display: "flex", alignItems: "start", gap: 6, marginBottom: 4 }}>
                  <MapPin size={14} color={T.textLight} style={{ marginTop: 1, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: T.textMed, lineHeight: 1.4 }}>
                    {acct.address}{acct.city && <>, {acct.city}</>}{acct.state && <>, {acct.state}</>}{acct.zip && <> {acct.zip}</>}
                  </div>
                </div>

                {(acct.contactName || acct.contactPhone) && (
                  <div style={{ display: "flex", gap: 12, fontSize: 12, color: T.textLight, marginTop: 4 }}>
                    {acct.contactName && <span>{acct.contactName}</span>}
                    {acct.contactPhone && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><PhoneIcon size={11} /> {acct.contactPhone}</span>}
                  </div>
                )}

                {acct.latitude && acct.longitude && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, fontSize: 11, color: T.accent, fontWeight: 600 }}>
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
          <FormField label="Property Name *" value={name} onChange={setName} autoFocus placeholder="e.g. Oak Ridge Estates" />
          <FormField label="Address *" value={address} onChange={setAddress} placeholder="Street address" />
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
            <FormField label="City" value={city} onChange={setCity} />
            <FormField label="State" value={state} onChange={setState} />
            <FormField label="ZIP" value={zip} onChange={setZip} />
          </div>

          <SelectField label="Group" value={groupId} onChange={setGroupId} placeholder="None"
            options={groups.map(g => ({ value: String(g.id), label: g.name }))} />

          {/* Estimated service time */}
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              Estimated Service Time
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[15, 30, 45, 60, 90, 120].map(m => (
                <button key={m} onClick={() => setEstMinutes(String(m))} style={{
                  padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontFamily: T.font,
                  fontSize: 13, fontWeight: 700,
                  border: `1.5px solid ${parseInt(estimatedMinutes) === m ? T.accent : T.border}`,
                  background: parseInt(estimatedMinutes) === m ? T.accentLight : T.card,
                  color: parseInt(estimatedMinutes) === m ? T.accent : T.textMed,
                }}>{m < 60 ? `${m}m` : `${m / 60}h`}</button>
              ))}
            </div>
            <input value={estimatedMinutes} onChange={e => setEstMinutes(e.target.value.replace(/\D/g, ""))}
              placeholder="Custom minutes" style={{
                marginTop: 6, width: 120, padding: "8px 12px", borderRadius: 8,
                border: `1.5px solid ${T.border}`, background: T.bg, fontSize: 13,
                fontFamily: T.font, outline: "none", boxSizing: "border-box", color: T.text,
              }} />
            <span style={{ fontSize: 12, color: T.textLight, marginLeft: 8 }}>minutes</span>
          </div>

          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, marginTop: 8, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: T.text }}>Contact</div>
            <FormField label="Name" value={contactName} onChange={setContactName} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
            {linked.length} resource{linked.length !== 1 ? "s" : ""} linked
          </div>
          <div style={{ fontSize: 12, color: T.textLight }}>
            Crews see these when visiting this jobsite
          </div>
        </div>
        <button onClick={() => setShowPicker(true)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
          borderRadius: 8, border: `1.5px dashed ${T.accent}`, background: T.accentLight,
          color: T.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: T.font,
        }}>
          <Link2 size={14} /> Attach Resource
        </button>
      </div>

      {/* Linked list */}
      {linked.length === 0 ? (
        <div style={{
          padding: 30, textAlign: "center", color: T.textLight, fontSize: 14,
          background: T.bg, borderRadius: 12, border: `1.5px dashed ${T.border}`,
        }}>
          <BookOpen size={28} color={T.textLight} style={{ marginBottom: 8 }} />
          <div>No resources attached yet</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Attach SDS sheets, site plans, or manuals for crews to access on-site
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {linked.map(r => (
            <div key={r.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
              background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: r.categoryColor ? `${r.categoryColor}15` : `${T.blue}10`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {r.resourceType === "link"
                  ? <ExternalLink size={16} color={r.categoryColor || T.blue} />
                  : <FileText size={16} color={r.categoryColor || T.blue} />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.title}
                </div>
                <div style={{ fontSize: 11, color: T.textLight }}>
                  {r.categoryName || "Uncategorized"}
                </div>
              </div>
              <button onClick={() => handleUnlink(r.id)} style={{
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
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
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
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>Attach Resource</div>
            <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
              <X size={18} color={T.textLight} />
            </button>
          </div>
          <div style={{ position: "relative", marginBottom: 12 }}>
            <Search size={16} color={T.textLight} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={search} onChange={e => onSearch(e.target.value)}
              placeholder="Search resources..."
              style={{
                width: "100%", padding: "10px 12px 10px 36px", borderRadius: 10,
                border: `1.5px solid ${T.border}`, background: T.bg, fontSize: 14,
                fontFamily: T.font, outline: "none", boxSizing: "border-box", color: T.text,
              }}
            />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
          {available.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, color: T.textLight, fontSize: 14, lineHeight: 1.5 }}>
              {emptyMessage}
            </div>
          ) : (
            available.map(r => (
              <button key={r.id} onClick={() => onSelect(r.id)} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%",
                padding: "10px 12px", borderRadius: 10, border: "none",
                background: "transparent", cursor: "pointer", fontFamily: T.font,
                textAlign: "left", marginBottom: 2, transition: "background 0.1s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = T.accentLight}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: r.categoryColor ? `${r.categoryColor}15` : `${T.blue}10`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {r.resourceType === "link"
                    ? <ExternalLink size={16} color={r.categoryColor || T.blue} />
                    : <FileText size={16} color={r.categoryColor || T.blue} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.title}
                  </div>
                  <div style={{ fontSize: 11, color: T.textLight }}>
                    {r.categoryName || "Uncategorized"}
                  </div>
                </div>
                <Plus size={16} color={T.accent} />
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
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
      borderRadius: 8, border: `1.5px solid ${active ? color : T.border}`,
      background: active ? `${color}10` : T.card, cursor: "pointer",
      fontSize: 13, fontWeight: 600, fontFamily: T.font, whiteSpace: "nowrap",
      color: active ? color : T.textMed,
    }}>
      {label}
      {count !== undefined && <span style={{ fontSize: 11, opacity: 0.7 }}>({count})</span>}
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
        <div style={{ textAlign: "center", padding: 20, color: T.textLight, fontSize: 14 }}>
          None created yet
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
          {items.map(item => (
            <div key={item.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              background: T.bg, borderRadius: 10, border: `1px solid ${T.border}`,
            }}>
              <div style={{ width: 12, height: 12, borderRadius: 6, background: item.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{item.name}</div>
                <div style={{ fontSize: 11, color: T.textLight }}>{item.count} item{item.count !== 1 ? "s" : ""}</div>
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

      {/* Add new button */}
      <button onClick={() => setCreating(true)} style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
        padding: "10px", borderRadius: 10, border: `1.5px dashed ${T.accent}`,
        background: T.accentLight, color: T.accent, fontSize: 13, fontWeight: 700,
        cursor: "pointer", fontFamily: T.font,
      }}>
        <Plus size={14} /> Add New
      </button>

      {/* Close */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
        <button onClick={onClose} style={{
          padding: "10px 24px", borderRadius: 10, border: `1.5px solid ${T.border}`,
          background: "transparent", color: T.textMed, fontSize: 14, fontWeight: 600,
          cursor: "pointer", fontFamily: T.font,
        }}>Done</button>
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
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 130,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: T.card, borderRadius: 16, width: "100%", maxWidth: 360,
        padding: 24, boxShadow: T.shadowLg, animation: "modalIn 0.15s ease",
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>
          {isEdit ? "Edit" : "Create New"}
        </div>
        <FormField label="Name *" value={name} onChange={setName} autoFocus placeholder="e.g. Zone A" />
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Color</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {ITEM_COLORS.map(c => (
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
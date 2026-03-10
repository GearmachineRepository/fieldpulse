// ═══════════════════════════════════════════
// Accounts Page — Properties with group filtering
// Type field removed — groups replace it.
// ═══════════════════════════════════════════

import { useState } from "react"
import {
  MapPinned, Plus, Edit3, MapPin, Phone as PhoneIcon, Navigation,
} from "lucide-react"
import { T } from "@/app/tokens.js"
import { useData } from "@/context/DataProvider.jsx"
import {
  Modal, ModalFooter, ConfirmModal, FormField, SelectField, TextareaField,
  PageHeader, AddButton, SearchBar, ClickableCard, IconButton,
  DropdownFilter, LoadingSpinner, EmptyMessage,
} from "@/app/dashboard/components/PageUI.jsx"

export default function AccountsPage({ isMobile }) {
  const { accounts, accountGroups, toast } = useData()
  const [editing, setEditing] = useState(null)
  const [searchQ, setSearchQ] = useState("")
  const [filterGroup, setFilterGroup] = useState("")
  const [creatingGroup, setCreatingGroup] = useState(false)

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

  const handleCreateGroup = async (name, color) => {
    try {
      await accountGroups.create({ name, color })
      toast.show("Group created ✓")
      setCreatingGroup(false)
    } catch (err) { toast.show(err.message || "Failed to create group") }
  }

  return (
    <div>
      <PageHeader title="Accounts" count={accounts.data.length} countLabel={`propert${accounts.data.length !== 1 ? "ies" : "y"}`}
        action={<AddButton label="Add Account" icon={Plus} onClick={() => setEditing({})} />} />

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <SearchBar value={searchQ} onChange={setSearchQ} placeholder="Search accounts..." />
        </div>
        <div style={{ marginBottom: 16 }}>
          <DropdownFilter
            label="All Groups"
            value={filterGroup}
            onChange={setFilterGroup}
            options={accountGroups.data.map(g => ({ id: g.id, name: g.name, label: g.name, value: g.id, color: g.color }))}
            onCreateNew={() => setCreatingGroup(true)}
          />
        </div>
      </div>

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

      {editing !== null && (
        <AccountModal account={editing} groups={accountGroups.data}
          onClose={() => setEditing(null)} onSave={handleSave}
          onDelete={editing.id ? () => handleDelete(editing.id) : undefined} />
      )}

      {creatingGroup && <GroupModal onClose={() => setCreatingGroup(false)} onSave={handleCreateGroup} />}
    </div>
  )
}

function AccountModal({ account, groups, onClose, onSave, onDelete }) {
  const isEdit = !!account.id
  const [name, setName]             = useState(account.name || "")
  const [address, setAddress]       = useState(account.address || "")
  const [city, setCity]             = useState(account.city || "")
  const [state, setState]           = useState(account.state || "CA")
  const [zip, setZip]               = useState(account.zip || "")
  const [contactName, setContactName]   = useState(account.contactName || "")
  const [contactPhone, setContactPhone] = useState(account.contactPhone || "")
  const [contactEmail, setContactEmail] = useState(account.contactEmail || "")
  const [groupId, setGroupId]       = useState(account.group_id ? String(account.group_id) : "")
  const [notes, setNotes]           = useState(account.notes || "")
  const [saving, setSaving]         = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !address.trim()) return; setSaving(true)
    await onSave({
      name: name.trim(), address: address.trim(), city: city || null,
      state: state || "CA", zip: zip || null,
      contactName: contactName || null, contactPhone: contactPhone || null,
      contactEmail: contactEmail || null,
      groupId: groupId ? parseInt(groupId) : null,
      notes: notes || null,
    })
    setSaving(false)
  }

  if (confirmDelete) {
    return <ConfirmModal title={`Remove "${account.name}"?`}
      message="Existing logs referencing this property are preserved."
      onConfirm={onDelete} onCancel={() => setConfirmDelete(false)} />
  }

  return (
    <Modal title={isEdit ? "Edit Account" : "Add Account"} onClose={onClose} size="lg">
      <FormField label="Property Name *" value={name} onChange={setName} autoFocus placeholder="e.g. Oak Ridge Estates" />
      <FormField label="Address *" value={address} onChange={setAddress} placeholder="Street address" />
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
        <FormField label="City" value={city} onChange={setCity} />
        <FormField label="State" value={state} onChange={setState} />
        <FormField label="ZIP" value={zip} onChange={setZip} />
      </div>

      <SelectField label="Group" value={groupId} onChange={setGroupId} placeholder="None"
        options={groups.map(g => ({ value: String(g.id), label: g.name }))} />

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
    </Modal>
  )
}

const GROUP_COLORS = ["#059669", "#3B82F6", "#F59E0B", "#EF4444", "#7C3AED", "#0891B2", "#DB2777", "#65A30D", "#92400E", "#475569"]

function GroupModal({ onClose, onSave }) {
  const [name, setName] = useState("")
  const [color, setColor] = useState("#059669")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => { if (!name.trim()) return; setSaving(true); await onSave(name.trim(), color); setSaving(false) }

  return (
    <Modal title="Create Group" onClose={onClose} size="sm">
      <FormField label="Group Name *" value={name} onChange={setName} autoFocus placeholder="e.g. Zone A" />
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Color</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {GROUP_COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{
              width: 30, height: 30, borderRadius: 8, background: c, border: "none", cursor: "pointer",
              boxShadow: color === c ? `0 0 0 3px ${T.bg}, 0 0 0 5px ${c}` : "none",
            }} />
          ))}
        </div>
      </div>
      <ModalFooter onClose={onClose} onSave={handleSubmit} saving={saving} disabled={!name.trim()} />
    </Modal>
  )
}

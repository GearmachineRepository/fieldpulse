// ═══════════════════════════════════════════
// Accounts Section — Property / Customer Management
// SubTabs: List (CRUD) + Map (Leaflet overview)
// Geocoding is automatic on save — no manual step needed.
// ═══════════════════════════════════════════

import { useState } from 'react'
import { C, cardStyle, labelStyle, inputStyle, btnStyle } from '../../config.js'
import { createAccount, updateAccount, deleteAccount, geocodeAddress } from '../../lib/api.js'
import { SectionHeader, SubTabs, FormModal, ConfirmDelete, Field } from '../../components/admin/SharedAdmin.jsx'
import LocationLink from '../../components/LocationLink.jsx'
import AccountMap from '../../components/AccountMap.jsx'

const ACCOUNT_TYPES = [
  { key: 'residential', label: '🏠 Residential' },
  { key: 'commercial', label: '🏢 Commercial' },
  { key: 'hoa', label: '🏘️ HOA' },
]

const TYPE_BADGES = {
  residential: { bg: '#E8F5EA', color: '#2D7A3A', label: 'Residential' },
  commercial: { bg: '#EFF6FF', color: '#2563EB', label: 'Commercial' },
  hoa: { bg: '#FFFBEB', color: '#D97706', label: 'HOA' },
}

export default function AccountsSection({ accounts, onRefresh, showToast }) {
  const [subTab, setSubTab] = useState('list')
  return (
    <div>
      <SubTabs tabs={[{ key: 'list', label: '📋 List' }, { key: 'map', label: '🗺️ Map' }]} active={subTab} onChange={setSubTab} />
      {subTab === 'list' && <ListView accounts={accounts} onRefresh={onRefresh} showToast={showToast} />}
      {subTab === 'map' && <MapView accounts={accounts} />}
    </div>
  )
}

// ═══════════════════════════════════════════
// LIST VIEW
// ═══════════════════════════════════════════
function ListView({ accounts, onRefresh, showToast }) {
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [filterType, setFilterType] = useState('')

  const [aName, setAName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('CA')
  const [zip, setZip] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [accountType, setAccountType] = useState('residential')
  const [notes, setNotes] = useState('')
  const [showManualCoords, setShowManualCoords] = useState(false)
  const [geocoding, setGeocoding] = useState(false)

  const openForm = (acct) => {
    if (acct) {
      setEditItem(acct); setAName(acct.name); setAddress(acct.address)
      setCity(acct.city || ''); setState(acct.state || 'CA'); setZip(acct.zip || '')
      setLatitude(acct.latitude ? String(acct.latitude) : '')
      setLongitude(acct.longitude ? String(acct.longitude) : '')
      setContactName(acct.contactName || ''); setContactPhone(acct.contactPhone || '')
      setContactEmail(acct.contactEmail || ''); setAccountType(acct.accountType || 'residential')
      setNotes(acct.notes || '')
    } else {
      setEditItem(null); setAName(''); setAddress(''); setCity(''); setState('CA'); setZip('')
      setLatitude(''); setLongitude(''); setContactName(''); setContactPhone('')
      setContactEmail(''); setAccountType('residential'); setNotes('')
    }
    setShowManualCoords(false)
    setShowForm(true)
  }

  // Manual re-geocode (for correcting bad results)
  const handleGeocode = async () => {
    const full = [address, city, state, zip].filter(Boolean).join(', ')
    if (!full.trim()) return
    setGeocoding(true)
    try {
      const result = await geocodeAddress(full)
      if (result.latitude && result.longitude) {
        setLatitude(String(result.latitude)); setLongitude(String(result.longitude))
        showToast('Location found ✓')
      } else { showToast('Could not geocode — try a more specific address') }
    } catch { showToast('Geocoding failed') }
    setGeocoding(false)
  }

  const save = async () => {
    if (!aName.trim() || !address.trim()) return
    setSaving(true)
    try {
      const data = {
        name: aName, address, city: city || null, state: state || 'CA', zip: zip || null,
        // Only send lat/lng if the user manually set them — otherwise the server auto-geocodes
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        contactName: contactName || null, contactPhone: contactPhone || null,
        contactEmail: contactEmail || null, accountType, notes: notes || null,
      }
      if (editItem) await updateAccount(editItem.id, data)
      else await createAccount(data)
      showToast(editItem ? 'Account updated ✓' : 'Account added ✓')
      setShowForm(false); await onRefresh()
    } catch { showToast('Failed to save') }
    setSaving(false)
  }

  const handleDelete = async () => {
    try { await deleteAccount(deleteItem.id); showToast('Deleted ✓'); setDeleteItem(null); await onRefresh() }
    catch { showToast('Failed to delete') }
  }
  const handleFormDelete = () => { setShowForm(false); setDeleteItem(editItem) }

  const filtered = accounts.filter(a => {
    if (filterType && a.accountType !== filterType) return false
    if (searchQ) {
      const q = searchQ.toLowerCase()
      return a.name.toLowerCase().includes(q) || a.address.toLowerCase().includes(q) ||
        (a.city || '').toLowerCase().includes(q) || (a.contactName || '').toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div>
      <SectionHeader title="Accounts" count={accounts.length} onAdd={() => openForm(null)} addLabel="Add Account" />
      <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search accounts..." style={inputStyle({ marginBottom: 10 })} />

      {/* Type filter pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        <div tabIndex={0} role="button" onClick={() => setFilterType('')}
          style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            background: !filterType ? C.accent : '#eee', color: !filterType ? '#fff' : C.textMed }}>All</div>
        {ACCOUNT_TYPES.map(t => (
          <div key={t.key} tabIndex={0} role="button" onClick={() => setFilterType(filterType === t.key ? '' : t.key)}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: filterType === t.key ? C.accent : '#eee', color: filterType === t.key ? '#fff' : C.textMed }}>{t.label}</div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏘️</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{accounts.length === 0 ? 'No accounts yet' : 'No matches'}</div>
          {accounts.length === 0 && <div style={{ fontSize: 13, marginTop: 4 }}>Add your first property or customer account.</div>}
        </div>
      ) : filtered.map(acct => {
        const badge = TYPE_BADGES[acct.accountType] || TYPE_BADGES.residential
        return (
          <div key={acct.id} tabIndex={0} role="button" onClick={() => openForm(acct)} onKeyDown={e => e.key === 'Enter' && openForm(acct)}
            style={{ ...cardStyle({ cursor: 'pointer' }), transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.accent} onMouseLeave={e => e.currentTarget.style.borderColor = C.cardBorder}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{acct.name}</div>
                <div style={{ fontSize: 13, color: C.textMed, marginTop: 2 }}>
                  {acct.address}{acct.city ? `, ${acct.city}` : ''}{acct.state ? ` ${acct.state}` : ''}{acct.zip ? ` ${acct.zip}` : ''}
                </div>
                {acct.contactName && (
                  <div style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>
                    📞 {acct.contactName}{acct.contactPhone ? ` · ${acct.contactPhone}` : ''}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 700, background: badge.bg, color: badge.color }}>{badge.label}</span>
                {acct.latitude && acct.longitude && <span style={{ fontSize: 11, color: C.accent, fontWeight: 600 }}>📍 Mapped</span>}
              </div>
            </div>
          </div>
        )
      })}

      {showForm && (
        <FormModal title={editItem ? 'Edit Account' : 'New Account'} onSave={save} onCancel={() => setShowForm(false)} onDelete={editItem ? handleFormDelete : undefined} saving={saving}>
          <Field label="Account Name" value={aName} onChange={setAName} placeholder="e.g. Smith Residence" required />
          <Field label="Address" value={address} onChange={setAddress} placeholder="123 Main St" required />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
            <Field label="City" value={city} onChange={setCity} placeholder="Riverside" />
            <Field label="State" value={state} onChange={setState} placeholder="CA" />
            <Field label="ZIP" value={zip} onChange={setZip} placeholder="92501" />
          </div>

          {/* GPS — auto-geocoded on save, with manual override */}
          <div style={{ padding: '12px 16px', borderRadius: 12, marginBottom: 14,
            background: (latitude && longitude) ? C.accentLight : '#FAFAF7',
            border: `1.5px solid ${(latitude && longitude) ? C.accentBorder : C.cardBorder}` }}>

            {(latitude && longitude) ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>📍 Location Set</div>
                    <div style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>{parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button tabIndex={0} onClick={handleGeocode} disabled={geocoding || !address.trim()}
                      style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        cursor: (geocoding || !address.trim()) ? 'not-allowed' : 'pointer',
                        background: '#fff', color: C.accent, border: `1px solid ${C.accentBorder}`,
                        opacity: (geocoding || !address.trim()) ? 0.5 : 1 }}>
                      {geocoding ? 'Finding...' : 'Re-Geocode'}
                    </button>
                    <button tabIndex={0} onClick={() => { setLatitude(''); setLongitude('') }}
                      style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', background: '#fff', color: C.textLight, border: `1px solid ${C.cardBorder}` }}>
                      Clear
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.textMed, marginBottom: 4 }}>📍 Map Location</div>
                <div style={{ fontSize: 12, color: C.textLight }}>
                  Automatically pinned from address when you save.
                  {!showManualCoords && (
                    <button tabIndex={0} onClick={() => setShowManualCoords(true)}
                      style={{ fontSize: 12, color: C.blue, cursor: 'pointer', background: 'none', border: 'none', padding: 0, marginLeft: 6, fontWeight: 600 }}>
                      Enter manually
                    </button>
                  )}
                </div>
                {showManualCoords && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                    <input value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="Latitude" type="number" step="any" style={inputStyle({ padding: '8px 12px', fontSize: 13 })} />
                    <input value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="Longitude" type="number" step="any" style={inputStyle({ padding: '8px 12px', fontSize: 13 })} />
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Account Type</div>
            <select value={accountType} onChange={e => setAccountType(e.target.value)} style={inputStyle()}>
              {ACCOUNT_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>

          <div style={{ ...labelStyle, fontSize: 13, marginTop: 8, marginBottom: 8 }}>Contact Info</div>
          <Field label="Contact Name" value={contactName} onChange={setContactName} placeholder="Property manager, owner, etc." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Phone" value={contactPhone} onChange={setContactPhone} placeholder="(555) 123-4567" />
            <Field label="Email" value={contactEmail} onChange={setContactEmail} placeholder="email@example.com" />
          </div>
          <Field label="Notes" value={notes} onChange={setNotes} placeholder="Gate codes, special instructions, etc." type="textarea" />
        </FormModal>
      )}
      {deleteItem && <ConfirmDelete name={deleteItem.name} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />}
    </div>
  )
}

// ═══════════════════════════════════════════
// MAP VIEW
// ═══════════════════════════════════════════
function MapView({ accounts }) {
  const [selected, setSelected] = useState(null)
  const [filterType, setFilterType] = useState('')
  const filtered = filterType ? accounts.filter(a => a.accountType === filterType) : accounts
  const mappedCount = filtered.filter(a => a.latitude && a.longitude).length

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>Account Map</div>
          <div style={{ fontSize: 13, color: C.textLight }}>{mappedCount} of {filtered.length} accounts on map</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <div tabIndex={0} role="button" onClick={() => setFilterType('')}
          style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            background: !filterType ? C.accent : '#eee', color: !filterType ? '#fff' : C.textMed }}>All</div>
        {ACCOUNT_TYPES.map(t => (
          <div key={t.key} tabIndex={0} role="button" onClick={() => setFilterType(filterType === t.key ? '' : t.key)}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: filterType === t.key ? C.accent : '#eee', color: filterType === t.key ? '#fff' : C.textMed }}>{t.label}</div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 12, color: C.textLight, fontWeight: 600 }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#2D7A3A', marginRight: 4 }} />Residential</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#2563EB', marginRight: 4 }} />Commercial</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#D97706', marginRight: 4 }} />HOA</span>
      </div>

      <AccountMap accounts={filtered} selectedId={selected?.id} onSelect={setSelected} height="500px" />

      {selected && (
        <div style={{ ...cardStyle({ marginTop: 12 }), borderColor: C.accentBorder, background: C.accentLight }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{selected.name}</div>
              <div style={{ fontSize: 13, color: C.textMed, marginTop: 2 }}>{selected.address}</div>
              {selected.contactName && <div style={{ fontSize: 13, color: C.textMed, marginTop: 4 }}>📞 {selected.contactName}{selected.contactPhone ? ` · ${selected.contactPhone}` : ''}</div>}
              {selected.notes && <div style={{ fontSize: 13, color: C.textLight, marginTop: 6, fontStyle: 'italic' }}>{selected.notes}</div>}
              <div style={{ marginTop: 8 }}><LocationLink location={selected.address} compact /></div>
            </div>
            <button tabIndex={0} onClick={() => setSelected(null)} style={{ fontSize: 13, color: C.textLight, cursor: 'pointer', fontWeight: 600, background: 'none', border: 'none' }}>✕ Close</button>
          </div>
        </div>
      )}

      {filtered.length > mappedCount && (
        <div style={{ ...cardStyle({ marginTop: 12 }), borderColor: C.amberBorder, background: C.amberLight }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.amber, marginBottom: 4 }}>⚠ {filtered.length - mappedCount} account{filtered.length - mappedCount !== 1 ? 's' : ''} not on map</div>
          <div style={{ fontSize: 13, color: C.textMed }}>These accounts couldn't be geocoded. Edit them to correct the address or enter coordinates manually.</div>
        </div>
      )}
    </div>
  )
}
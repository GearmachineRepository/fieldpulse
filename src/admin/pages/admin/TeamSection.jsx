// ═══════════════════════════════════════════
// Team Section — Employees + Crews under one roof
// Crews tab has inline member management
// ═══════════════════════════════════════════

import { useState, useRef } from 'react'
import { C, cardStyle, labelStyle, inputStyle, btnStyle } from '@/config/index.js'
import { createCrew, updateCrew, deleteCrew, createEmployee, updateEmployee, deleteEmployee } from '@/lib/api/index.js'
import { SectionHeader, SubTabs, FormModal, ConfirmDelete, Field } from '@/admin/components/SharedAdmin.jsx'

export default function TeamSection({ employees, crews, onRefresh, showToast }) {
  const [subTab, setSubTab] = useState('employees')
  return (
    <div>
      <SubTabs tabs={[{ key: 'employees', label: '👤 Employees' }, { key: 'crews', label: '👥 Crews' }]} active={subTab} onChange={setSubTab} />
      {subTab === 'employees' && <EmployeesView employees={employees} crews={crews} onRefresh={onRefresh} showToast={showToast} />}
      {subTab === 'crews' && <CrewsView crews={crews} employees={employees} onRefresh={onRefresh} showToast={showToast} />}
    </div>
  )
}

// ═══════════════════════════════════════════
// EMPLOYEES VIEW
// ═══════════════════════════════════════════
function EmployeesView({ employees, crews, onRefresh, showToast }) {
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [licenseNum, setLicenseNum] = useState('')
  const [certNum, setCertNum] = useState('')
  const [crewId, setCrewId] = useState('')
  const [empPin, setEmpPin] = useState('')
  const [isCrewLead, setIsCrewLead] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const fileRef = useRef(null)

  // ── Filters ──
  const [filterCrew, setFilterCrew] = useState('')    // crew name or '__none__'
  const [filterRole, setFilterRole] = useState('')    // '' | 'lead' | 'member'

  const openForm = (emp) => {
    if (emp) {
      setEditItem(emp); setFirstName(emp.first_name); setLastName(emp.last_name)
      setPhone(emp.phone || ''); setLicenseNum(emp.license_number || '')
      setCertNum(emp.cert_number || '')
      setCrewId(emp.default_crew_id ? String(emp.default_crew_id) : '')
      setPhotoPreview(emp.photo_filename ? `/uploads/${emp.photo_filename}` : null)
      setIsCrewLead(emp.is_crew_lead || false); setEmpPin('')
    } else {
      setEditItem(null); setFirstName(''); setLastName(''); setPhone('')
      setLicenseNum(''); setCertNum(''); setCrewId(''); setEmpPin('')
      setIsCrewLead(false); setPhotoPreview(null)
    }
    setPhotoFile(null); setShowForm(true)
  }

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)) }
  }

  const save = async () => {
    if (!firstName.trim() || !lastName.trim()) return; setSaving(true)
    try {
      const data = { firstName, lastName, phone, licenseNumber: licenseNum, certNumber: certNum, defaultCrewId: crewId || null, isCrewLead }
      if (empPin) data.pin = empPin
      if (editItem) await updateEmployee(editItem.id, data, photoFile)
      else await createEmployee(data, photoFile)
      showToast(editItem ? 'Employee updated ✓' : 'Employee added ✓')
      setShowForm(false); await onRefresh()
    } catch { showToast('Failed to save') }
    setSaving(false)
  }

  const handleDelete = async () => {
    try {
      const emp = deleteItem
      const empName = `${emp.first_name} ${emp.last_name}`
      await deleteEmployee(emp.id)
      const leadCrews = crews.filter(c => c.lead_name === empName)
      for (const crew of leadCrews) {
        try { await updateCrew(crew.id, { name: crew.name, leadName: '' }) } catch {}
      }
      showToast('Deleted ✓'); setDeleteItem(null); await onRefresh()
    } catch { showToast('Failed to delete') }
  }
  const handleFormDelete = () => { setShowForm(false); setDeleteItem(editItem) }

  // ── Build filter options ──
  const crewNames = [...new Set(employees.map(e => crews.find(c => c.id === e.default_crew_id)?.name).filter(Boolean))].sort()
  const leadCount = employees.filter(e => e.is_crew_lead).length
  const memberCount = employees.filter(e => !e.is_crew_lead).length

  // ── Apply filters (crew + role are AND-ed together) ──
  const filtered = employees.filter(e => {
    const crew = crews.find(c => c.id === e.default_crew_id)
    const crewMatch = !filterCrew
      ? true
      : filterCrew === '__none__' ? !crew : crew?.name === filterCrew
    const roleMatch = !filterRole
      ? true
      : filterRole === 'lead' ? e.is_crew_lead : !e.is_crew_lead
    return crewMatch && roleMatch
  })

  // ── Pill style helper ──
  const pill = (active, color = C.accent) => ({
    padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
    background: active ? color : '#eee',
    color: active ? '#fff' : C.textMed,
    border: 'none',
    transition: 'background 0.12s',
  })

  return (
    <div>
      <SectionHeader title="Employees" count={employees.length} onAdd={() => openForm(null)} addLabel="Add Employee" />

      {/* ── Filter row 1: By Crew ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <button tabIndex={0} onClick={() => setFilterCrew('')} style={pill(!filterCrew)}>All Crews</button>
        {crewNames.map(c => (
          <button key={c} tabIndex={0} onClick={() => setFilterCrew(c)} style={pill(filterCrew === c)}>{c}</button>
        ))}
        {employees.some(e => !e.default_crew_id) && (
          <button tabIndex={0} onClick={() => setFilterCrew('__none__')} style={pill(filterCrew === '__none__', C.amber)}>
            Unassigned
          </button>
        )}
      </div>

      {/* ── Filter row 2: By Role ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        <button tabIndex={0} onClick={() => setFilterRole('')} style={pill(!filterRole, C.blue)}>All Roles</button>
        <button tabIndex={0} onClick={() => setFilterRole('lead')} style={pill(filterRole === 'lead', C.blue)}>
          ⭐ Crew Leaders {leadCount > 0 && <span style={{ opacity: 0.75, marginLeft: 4 }}>({leadCount})</span>}
        </button>
        <button tabIndex={0} onClick={() => setFilterRole('member')} style={pill(filterRole === 'member', C.blue)}>
          👤 Members {memberCount > 0 && <span style={{ opacity: 0.75, marginLeft: 4 }}>({memberCount})</span>}
        </button>
      </div>

      {/* ── Result count ── */}
      {(filterCrew || filterRole) && (
        <div style={{ fontSize: 12, color: C.textLight, marginBottom: 10, fontWeight: 600 }}>
          Showing {filtered.length} of {employees.length} employee{employees.length !== 1 ? 's' : ''}
          {' '}
          <button onClick={() => { setFilterCrew(''); setFilterRole('') }}
            style={{ fontSize: 12, color: C.blue, cursor: 'pointer', background: 'none', border: 'none', fontWeight: 700, padding: 0 }}>
            Clear filters
          </button>
        </div>
      )}

      {/* ── Employee cards ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.textLight }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>No employees match these filters</div>
        </div>
      ) : filtered.map(emp => (
        <div key={emp.id} tabIndex={0} role="button" onClick={() => openForm(emp)} onKeyDown={e => e.key === 'Enter' && openForm(emp)}
          style={{ ...cardStyle({ cursor: 'pointer' }), transition: 'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
          onMouseLeave={e => e.currentTarget.style.borderColor = C.cardBorder}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {emp.photo_filename ? (
              <img src={`/uploads/${emp.photo_filename}`} alt="" style={{ width: 44, height: 44, borderRadius: 22, objectFit: 'cover', border: `2px solid ${C.cardBorder}` }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: 22, background: C.blue,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 800 }}>
                {emp.first_name[0]}{emp.last_name[0]}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{emp.first_name} {emp.last_name}</div>
                {emp.is_crew_lead && (
                  <span style={{ fontSize: 11, fontWeight: 800, color: C.blue, background: C.blueLight,
                    padding: '2px 8px', borderRadius: 6, border: `1px solid ${C.blueBorder}` }}>
                    ⭐ Crew Lead
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>
                {crews.find(c => c.id === emp.default_crew_id)?.name || 'No crew'}
                {emp.license_number ? ` · Lic: ${emp.license_number}` : ''}
              </div>
            </div>
            <div style={{ fontSize: 18, color: C.textLight }}>›</div>
          </div>
        </div>
      ))}

      {/* ── Form Modal ── */}
      {showForm && (
        <FormModal
          title={editItem ? `${editItem.first_name} ${editItem.last_name}` : 'New Employee'}
          onCancel={() => setShowForm(false)}
          onSave={save}
          saving={saving}
          onDelete={editItem ? handleFormDelete : null}
        >
          {/* Photo — tappable circle at top */}
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div tabIndex={0} role="button" onClick={() => fileRef.current?.click()}
              onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
              style={{ cursor: 'pointer', display: 'inline-block' }}>
              {photoPreview ? (
                <img src={photoPreview} alt=""
                  style={{ width: 88, height: 88, borderRadius: 44, objectFit: 'cover',
                    border: `3px solid ${C.blue}` }} />
              ) : (
                <div style={{ width: 88, height: 88, borderRadius: 44, background: '#F0F0EC',
                  border: `2.5px dashed ${C.blue}`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 30 }}>
                  📷
                </div>
              )}
              <div style={{ fontSize: 12, color: C.blue, fontWeight: 700, marginTop: 6 }}>
                {photoPreview ? 'Change Photo' : 'Add Photo'}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <Field label="First Name" value={firstName} onChange={setFirstName} style={{ flex: 1 }} />
            <Field label="Last Name" value={lastName} onChange={setLastName} style={{ flex: 1 }} />
          </div>
          <Field label="Phone" value={phone} onChange={setPhone} type="tel" />
          <Field label="License #" value={licenseNum} onChange={setLicenseNum} />
          <Field label="Cert #" value={certNum} onChange={setCertNum} />

          {/* PIN */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={labelStyle}>PIN</div>
              {editItem && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
                  background: editItem.has_pin ? C.accentLight : '#FFF5F5', color: editItem.has_pin ? C.accent : C.red }}>
                  {editItem.has_pin ? 'Set ✓' : 'Not set'}
                </span>
              )}
            </div>
            <input value={empPin} onChange={e => setEmpPin(e.target.value.replace(/\D/g, ''))}
              placeholder={editItem?.has_pin ? 'Enter new PIN to reset' : '4-6 digit PIN'}
              maxLength={6} inputMode="numeric" type="password"
              style={inputStyle({ letterSpacing: 4, fontSize: 18, fontWeight: 700 })} />
            <div style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>
              {editItem?.has_pin
                ? 'Leave blank to keep current PIN. Enter a new PIN to reset it.'
                : isCrewLead ? 'Required for crew lead login' : 'Only needed if this employee is a crew lead'}
            </div>
          </div>

          {/* Crew + Role */}
          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Default Crew</div>
            <select value={crewId} onChange={e => setCrewId(e.target.value)} style={inputStyle()}>
              <option value="">No crew</option>
              {crews.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Field label="Crew Lead" value={isCrewLead} onChange={setIsCrewLead} placeholder="This employee is a crew lead" type="checkbox" />
        </FormModal>
      )}
      {deleteItem && <ConfirmDelete name={`${deleteItem.first_name} ${deleteItem.last_name}`} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />}
    </div>
  )
}

// ═══════════════════════════════════════════
// CREWS VIEW — with inline member management
// ═══════════════════════════════════════════
function CrewsView({ crews, employees, onRefresh, showToast }) {
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [cName, setCName] = useState('')
  const [cLeadId, setCLeadId] = useState('')
  const [expandedCrew, setExpandedCrew] = useState(null)

  const openForm = (c) => {
    if (c) {
      setEditItem(c); setCName(c.name)
      const lead = employees.find(e => `${e.first_name} ${e.last_name}` === c.lead_name)
      setCLeadId(lead ? String(lead.id) : '')
    } else {
      setEditItem(null); setCName(''); setCLeadId('')
    }
    setShowForm(true)
  }

  const save = async () => {
    if (!cName.trim()) return; setSaving(true)
    try {
      const leadEmp = employees.find(e => String(e.id) === cLeadId)
      const leadName = leadEmp ? `${leadEmp.first_name} ${leadEmp.last_name}` : ''
      if (editItem) await updateCrew(editItem.id, { name: cName, leadName })
      else await createCrew({ name: cName, leadName })
      showToast(editItem ? 'Crew updated ✓' : 'Crew added ✓')
      setShowForm(false); await onRefresh()
    } catch { showToast('Failed to save') }
    setSaving(false)
  }

  const handleDelete = async () => {
    try { await deleteCrew(deleteItem.id); showToast('Deleted ✓'); setDeleteItem(null); await onRefresh() }
    catch { showToast('Failed to delete') }
  }
  const handleFormDelete = () => { setShowForm(false); setDeleteItem(editItem) }

  return (
    <div>
      <SectionHeader title="Crews" count={crews.length} onAdd={() => openForm(null)} addLabel="Add Crew" />
      {crews.map(crew => {
        const members = employees.filter(e => e.default_crew_id === crew.id)
        const isExpanded = expandedCrew === crew.id
        return (
          <div key={crew.id} style={{ marginBottom: 10 }}>
            <div tabIndex={0} role="button"
              onClick={() => setExpandedCrew(isExpanded ? null : crew.id)}
              onKeyDown={e => e.key === 'Enter' && setExpandedCrew(isExpanded ? null : crew.id)}
              style={{ ...cardStyle({ marginBottom: 0, cursor: 'pointer' }), borderRadius: isExpanded ? '12px 12px 0 0' : 12, transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.cardBorder}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{crew.name}</div>
                  <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>
                    {crew.lead_name ? `Lead: ${crew.lead_name}` : 'No lead assigned'}
                    {' · '}{members.length} member{members.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button tabIndex={0} onClick={e => { e.stopPropagation(); openForm(crew) }}
                    style={{ ...btnStyle(C.blue, '#fff', { width: 'auto', padding: '8px 14px', fontSize: 13 }) }}>
                    Edit
                  </button>
                  <div style={{ fontSize: 18, color: C.textLight }}>{isExpanded ? '▲' : '▼'}</div>
                </div>
              </div>
            </div>

            {isExpanded && (
              <div style={{ ...cardStyle({ marginBottom: 0 }), borderTop: 'none', borderRadius: '0 0 12px 12px', background: '#FAFAF8' }}>
                <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Members</div>
                {members.length === 0 ? (
                  <div style={{ fontSize: 13, color: C.textLight, padding: '8px 0' }}>No employees assigned to this crew yet.</div>
                ) : members.map(emp => (
                  <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: `1px solid ${C.cardBorder}` }}>
                    {emp.photo_filename ? (
                      <img src={`/uploads/${emp.photo_filename}`} alt="" style={{ width: 32, height: 32, borderRadius: 16, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 32, height: 32, borderRadius: 16, background: C.blue,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 800 }}>
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                    )}
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 700 }}>{emp.first_name} {emp.last_name}</div>
                    {emp.is_crew_lead && <span style={{ fontSize: 11, color: C.blue, fontWeight: 800 }}>⭐ Lead</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {showForm && (
        <FormModal
          title={editItem ? editItem.name : 'New Crew'}
          onCancel={() => setShowForm(false)}
          onSave={save}
          saving={saving}
          onDelete={editItem ? handleFormDelete : null}
        >
          <Field label="Crew Name" value={cName} onChange={setCName} />
          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Crew Lead</div>
            <select value={cLeadId} onChange={e => setCLeadId(e.target.value)} style={inputStyle()}>
              <option value="">No lead</option>
              {employees.filter(e => e.is_crew_lead).map(e => (
                <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
              ))}
            </select>
            {employees.filter(e => e.is_crew_lead).length === 0 && (
              <div style={{ fontSize: 12, color: C.amber, marginTop: 4 }}>
                No crew leads set yet. Mark an employee as a Crew Lead in the Employees tab first.
              </div>
            )}
          </div>
        </FormModal>
      )}
      {deleteItem && <ConfirmDelete name={deleteItem.name} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />}
    </div>
  )
}
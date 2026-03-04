// ═══════════════════════════════════════════
// Team Section — Employees + Crews under one roof
// Crews tab has inline member management
// ═══════════════════════════════════════════

import { useState, useRef } from 'react'
import { C, cardStyle, labelStyle, inputStyle, btnStyle } from '../../config.js'
import { createCrew, updateCrew, deleteCrew, createEmployee, updateEmployee, deleteEmployee } from '../../lib/api.js'
import { SectionHeader, SubTabs, FormModal, ConfirmDelete, Field } from '../../components/admin/SharedAdmin.jsx'

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
  const [filterCrew, setFilterCrew] = useState('')

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

      // Delete the employee
      await deleteEmployee(emp.id)

      // Clean up: if this employee was a crew lead, clear their name from that crew
      const leadCrews = crews.filter(c => c.lead_name === empName)
      for (const crew of leadCrews) {
        try { await updateCrew(crew.id, { name: crew.name, leadName: '' }) } catch { /* best effort */ }
      }

      showToast('Deleted ✓'); setDeleteItem(null); await onRefresh()
    } catch { showToast('Failed to delete') }
  }
  const handleFormDelete = () => { setShowForm(false); setDeleteItem(editItem) }

  // Group employees by crew for filtered view
  const crewNames = [...new Set(employees.map(e => crews.find(c => c.id === e.default_crew_id)?.name).filter(Boolean))]
  const filtered = filterCrew
    ? employees.filter(e => {
        const crew = crews.find(c => c.id === e.default_crew_id)
        return filterCrew === '__none__' ? !crew : crew?.name === filterCrew
      })
    : employees

  return (
    <div>
      <SectionHeader title="Employees" count={employees.length} onAdd={() => openForm(null)} addLabel="Add Employee" />

      {/* Filter by crew */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        <div tabIndex={0} role="button" onClick={() => setFilterCrew('')}
          style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            background: !filterCrew ? C.accent : '#eee', color: !filterCrew ? '#fff' : C.textMed }}>All</div>
        {crewNames.map(c => (
          <div key={c} tabIndex={0} role="button" onClick={() => setFilterCrew(c)}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: filterCrew === c ? C.accent : '#eee', color: filterCrew === c ? '#fff' : C.textMed }}>{c}</div>
        ))}
        {employees.some(e => !e.default_crew_id) && (
          <div tabIndex={0} role="button" onClick={() => setFilterCrew('__none__')}
            style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: filterCrew === '__none__' ? C.amber : '#eee', color: filterCrew === '__none__' ? '#fff' : C.textMed }}>Unassigned</div>
        )}
      </div>

      {filtered.map(emp => (
        <div key={emp.id} tabIndex={0} role="button" onClick={() => openForm(emp)} onKeyDown={e => e.key === 'Enter' && openForm(emp)}
          style={{ ...cardStyle({ cursor: 'pointer' }), transition: 'border-color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = C.accent} onMouseLeave={e => e.currentTarget.style.borderColor = C.cardBorder}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {emp.photo_filename ? (
              <img src={`/uploads/${emp.photo_filename}`} alt="" style={{ width: 44, height: 44, borderRadius: 22, objectFit: 'cover', border: `2px solid ${C.cardBorder}` }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: 22, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 800 }}>
                {emp.first_name[0]}{emp.last_name[0]}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{emp.first_name} {emp.last_name}</div>
              <div style={{ fontSize: 13, color: C.textLight }}>
                {crews.find(c => c.id === emp.default_crew_id)?.name || 'No crew'}
                {emp.is_crew_lead ? ' · Lead' : ''}
                {emp.license_number ? ` · Lic: ${emp.license_number}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 700,
                background: emp.has_pin ? C.accentLight : '#FFF5F5', color: emp.has_pin ? C.accent : C.red }}>
                {emp.has_pin ? 'PIN ✓' : 'No PIN'}
              </span>
              <div style={{ fontSize: 13, color: C.textLight, fontWeight: 600 }}>Edit →</div>
            </div>
          </div>
        </div>
      ))}

      {showForm && (
        <FormModal title={editItem ? 'Edit Employee' : 'New Employee'} onSave={save} onCancel={() => setShowForm(false)} onDelete={editItem ? handleFormDelete : undefined} saving={saving}>
          {/* Photo */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div onClick={() => fileRef.current?.click()} style={{ cursor: 'pointer', display: 'inline-block' }}>
              {photoPreview ? (
                <img src={photoPreview} alt="" style={{ width: 80, height: 80, borderRadius: 40, objectFit: 'cover', border: `3px solid ${C.blue}` }} />
              ) : (
                <div style={{ width: 80, height: 80, borderRadius: 40, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📷</div>
              )}
              <div style={{ fontSize: 12, color: C.blue, fontWeight: 700, marginTop: 4 }}>{photoPreview ? 'Change Photo' : 'Add Photo'}</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="First Name" value={firstName} onChange={setFirstName} placeholder="First" required />
            <Field label="Last Name" value={lastName} onChange={setLastName} placeholder="Last" required />
          </div>
          <Field label="Phone" value={phone} onChange={setPhone} placeholder="(555) 123-4567" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="License #" value={licenseNum} onChange={setLicenseNum} placeholder="QAL / QAC number" />
            <Field label="Cert #" value={certNum} onChange={setCertNum} placeholder="Certification #" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={labelStyle}>PIN</div>
              {editItem && (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 700,
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
      showToast(editItem ? 'Crew updated ✓' : 'Crew created ✓')
      setShowForm(false); await onRefresh()
    } catch { showToast('Failed to save') }
    setSaving(false)
  }

  const handleDelete = async () => {
    try { await deleteCrew(deleteItem.id); showToast('Deleted ✓'); setDeleteItem(null); await onRefresh() }
    catch { showToast('Failed to delete') }
  }
  const handleFormDelete = () => { setShowForm(false); setDeleteItem(editItem) }

  const getCrewEmployees = (crewId) => employees.filter(e => e.default_crew_id === crewId)
  const getUnassigned = () => employees.filter(e => !e.default_crew_id)

  // ── FIX: Send full employee data when moving between crews ──
  // The server PUT /employees/:id does a full SET — sending partial data blanks other fields
  const buildFullEmployeeData = (emp) => ({
    firstName: emp.first_name,
    lastName: emp.last_name,
    phone: emp.phone || '',
    licenseNumber: emp.license_number || '',
    certNumber: emp.cert_number || '',
    isCrewLead: emp.is_crew_lead || false,
  })

  const assignToCrew = async (empId, crewId) => {
    const emp = employees.find(e => e.id === empId)
    if (!emp) return
    try {
      await updateEmployee(empId, { ...buildFullEmployeeData(emp), defaultCrewId: crewId })
      await onRefresh()
      showToast('Moved ✓')
    } catch { showToast('Failed to move') }
  }

  const removeFromCrew = async (empId) => {
    const emp = employees.find(e => e.id === empId)
    if (!emp) return
    try {
      await updateEmployee(empId, { ...buildFullEmployeeData(emp), defaultCrewId: null })
      await onRefresh()
      showToast('Removed from crew ✓')
    } catch { showToast('Failed to remove') }
  }

  return (
    <div>
      <SectionHeader title="Crews" count={crews.length} onAdd={() => openForm(null)} addLabel="Add Crew" />

      {crews.map(c => {
        const crewEmps = getCrewEmployees(c.id)
        const isExpanded = expandedCrew === c.id
        // Resolve lead name — show the actual lead from employees if they still exist
        const leadEmp = employees.find(e => `${e.first_name} ${e.last_name}` === c.lead_name)
        const leadDisplay = leadEmp ? `Lead: ${c.lead_name}` : (c.lead_name ? `Lead: ${c.lead_name} ⚠️` : 'No lead assigned')

        return (
          <div key={c.id} style={{ marginBottom: 10 }}>
            {/* ── FIX: Entire header row is one clickable element, arrow included ── */}
            <div
              tabIndex={0} role="button"
              onClick={() => setExpandedCrew(isExpanded ? null : c.id)}
              onKeyDown={e => e.key === 'Enter' && setExpandedCrew(isExpanded ? null : c.id)}
              style={{
                ...cardStyle({ marginBottom: 0, cursor: 'pointer' }),
                borderRadius: isExpanded ? '16px 16px 0 0' : 16,
                borderColor: isExpanded ? C.accentBorder : C.cardBorder,
                transition: 'border-color 0.15s',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{c.name}</div>
                  <div style={{ fontSize: 13, color: C.textLight }}>
                    {leadDisplay} · {crewEmps.length} member{crewEmps.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button tabIndex={0} onClick={(e) => { e.stopPropagation(); openForm(c) }}
                    style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', background: '#eee', border: 'none', color: C.textMed, fontWeight: 700 }}>
                    ✏️ Edit
                  </button>
                  <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, padding: '4px 2px' }}>{isExpanded ? '▲' : '▼'}</div>
                </div>
              </div>
            </div>

            {/* Expanded: show members with management */}
            {isExpanded && (
              <div style={{ background: '#FAFAF7', border: `1.5px solid ${C.accentBorder}`, borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '14px 16px' }}>
                {/* Current members */}
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  Members ({crewEmps.length})
                </div>
                {crewEmps.length === 0 ? (
                  <div style={{ fontSize: 13, color: C.textLight, marginBottom: 12 }}>No members assigned yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    {crewEmps.map(emp => (
                      <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, background: '#fff', border: `1px solid ${C.cardBorder}` }}>
                        {emp.photo_filename ? (
                          <img src={`/uploads/${emp.photo_filename}`} alt="" style={{ width: 32, height: 32, borderRadius: 16, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 32, height: 32, borderRadius: 16, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff', fontWeight: 800 }}>
                            {emp.first_name[0]}{emp.last_name[0]}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{emp.first_name} {emp.last_name}</div>
                          <div style={{ fontSize: 12, color: C.textLight }}>
                            {emp.is_crew_lead ? '⭐ Lead' : 'Member'}
                            {emp.has_pin ? '' : ' · No PIN'}
                          </div>
                        </div>
                        <button tabIndex={0} onClick={() => removeFromCrew(emp.id)}
                          style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer', background: '#FFF5F5', border: `1px solid ${C.redBorder}`, color: C.red, fontWeight: 700 }}>
                          ✕ Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Unassigned employees — quick add */}
                {getUnassigned().length > 0 && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.amber, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                      Unassigned Employees ({getUnassigned().length})
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      {getUnassigned().map(emp => (
                        <button key={emp.id} tabIndex={0} onClick={() => assignToCrew(emp.id, c.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                            background: C.amberLight, border: `1px solid ${C.amberBorder}`, fontSize: 13, fontWeight: 600, color: C.text }}>
                          <span style={{ fontSize: 14 }}>+</span> {emp.first_name} {emp.last_name}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Move from another crew */}
                {crews.filter(other => other.id !== c.id).some(other => getCrewEmployees(other.id).length > 0) && (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 6 }}>
                      Move from Another Crew
                    </div>
                    {crews.filter(other => other.id !== c.id && getCrewEmployees(other.id).length > 0).map(other => (
                      <div key={other.id} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 12, color: C.textLight, fontWeight: 700, marginBottom: 4 }}>{other.name}</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {getCrewEmployees(other.id).map(emp => (
                            <button key={emp.id} tabIndex={0} onClick={() => assignToCrew(emp.id, c.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                                background: C.blueLight, border: `1px solid ${C.blueBorder}`, fontSize: 12, fontWeight: 600, color: C.blue }}>
                              ← {emp.first_name} {emp.last_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}

      {showForm && (
        <FormModal title={editItem ? 'Edit Crew' : 'New Crew'} onSave={save} onCancel={() => setShowForm(false)} onDelete={editItem ? handleFormDelete : undefined} saving={saving}>
          <Field label="Crew Name" value={cName} onChange={setCName} placeholder="e.g. Crew C" required />
          <div style={{ marginBottom: 14 }}>
            <div style={labelStyle}>Crew Lead</div>
            <select value={cLeadId} onChange={e => setCLeadId(e.target.value)} style={inputStyle()}>
              <option value="">No lead assigned</option>
              {employees.filter(e => e.is_crew_lead || e.has_pin).map(e => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name}{e.is_crew_lead ? ' (Lead)' : ''}
                </option>
              ))}
            </select>
          </div>
        </FormModal>
      )}
      {deleteItem && <ConfirmDelete name={deleteItem.name} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />}
    </div>
  )
}
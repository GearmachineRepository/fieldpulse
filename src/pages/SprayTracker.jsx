import { useState, useRef } from 'react'
import { APP, C, MONO, SIG_COLORS, WIND_DIRS, cardStyle, labelStyle, inputStyle, btnStyle } from '../config.js'
import { checkRestrictions } from '../lib/weather.js'
import { uploadPhotos } from '../lib/api.js'
import WindCompass from '../components/WindCompass.jsx'
import { openPdf } from '../components/PdfExport.js'

export default function SprayTracker({ vehicle, chemicals, equipment, crews, employees, logs, weather, onRefreshWeather, onSubmitLog, onLogsUpdated }) {
  const [tab, setTab] = useState('log')
  const tabs = [{ key: 'log', label: 'New Log', icon: '📝' }, { key: 'history', label: 'History', icon: '📋' }, { key: 'sds', label: 'SDS', icon: '☣️' }]
  return (
    <div>
      <div style={{ display: 'flex', marginBottom: 14, background: C.card, borderRadius: 14, border: `1.5px solid ${C.cardBorder}`, overflow: 'hidden' }}>
        {tabs.map(t => (
          <div key={t.key} tabIndex={0} role="button" onClick={() => setTab(t.key)} onKeyDown={e => e.key === 'Enter' && setTab(t.key)}
            style={{ flex: 1, textAlign: 'center', padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', outline: 'none',
              color: tab === t.key ? '#fff' : C.textLight, background: tab === t.key ? C.accent : 'transparent', transition: 'all 0.15s' }}>
            {t.icon} {t.label}
          </div>
        ))}
      </div>
      {tab === 'log' && <NewLogTab vehicle={vehicle} chemicals={chemicals} equipment={equipment} crews={crews} employees={employees} weather={weather} onRefresh={onRefreshWeather} onSubmit={onSubmitLog} onLogsUpdated={onLogsUpdated} />}
      {tab === 'history' && <HistoryTab logs={logs} />}
      {tab === 'sds' && <SdsTab chemicals={chemicals} />}
    </div>
  )
}

// ═══════════════════════════════════════════
// NEW LOG TAB
// ═══════════════════════════════════════════
function NewLogTab({ vehicle, chemicals, equipment, crews, employees, weather, onRefresh, onSubmit, onLogsUpdated }) {
  // Crew — separate "useCustomCrew" flag so typing doesn't reset
  const [crewSelect, setCrewSelect] = useState(vehicle.crewName || '')
  const [customCrewName, setCustomCrewName] = useState('')
  const [useCustomCrew, setUseCustomCrew] = useState(false)

  const crewName = useCustomCrew ? customCrewName : crewSelect

  const [crewLead, setCrewLead] = useState('')
  const [license, setLicense] = useState('')
  const [property, setProperty] = useState('')
  const [locMode, setLocMode] = useState('none')
  const [gps, setGps] = useState(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [manualAddr, setManualAddr] = useState('')
  const [selectedEquip, setSelectedEquip] = useState('')
  const [totalMixVol, setTotalMixVol] = useState('')
  const [mixVolUnit, setMixVolUnit] = useState('gal')
  const [targetPest, setTargetPest] = useState('')
  const [products, setProducts] = useState([])
  const [showPicker, setShowPicker] = useState(false)
  const [chemQ, setChemQ] = useState('')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])

  // Crew members for this log
  const [selectedMembers, setSelectedMembers] = useState([])
  const [showMemberPicker, setShowMemberPicker] = useState(false)

  const [manualWx, setManualWx] = useState(false)
  const [mw, setMw] = useState({ temp: '', humidity: '', windSpeed: '', windDir: 'N', conditions: 'Clear' })
  const [errors, setErrors] = useState({})
  const [shakeSubmit, setShakeSubmit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInput = useRef(null)

  const filtered = chemicals.filter(c =>
    c.name.toLowerCase().includes(chemQ.toLowerCase()) || c.type.toLowerCase().includes(chemQ.toLowerCase()) || c.ai.toLowerCase().includes(chemQ.toLowerCase()))

  const addProduct = (chem) => { setProducts([...products, { ...chem, ozConcentrate: '', unit: 'oz' }]); setShowPicker(false); setChemQ(''); setErrors(e => ({ ...e, products: undefined })) }
  const removeProduct = (idx) => setProducts(products.filter((_, i) => i !== idx))
  const updateOz = (idx, val) => { setProducts(products.map((p, i) => i === idx ? { ...p, ozConcentrate: val } : p)); setErrors(e => ({ ...e, [`oz-${idx}`]: undefined })) }
  const updateUnit = (idx, unit) => setProducts(products.map((p, i) => i === idx ? { ...p, unit } : p))

  const toggleMember = (emp) => {
    const exists = selectedMembers.find(m => m.id === emp.id)
    if (exists) setSelectedMembers(selectedMembers.filter(m => m.id !== emp.id))
    else setSelectedMembers([...selectedMembers, { id: emp.id, name: `${emp.first_name} ${emp.last_name}` }])
  }

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files)
    setPhotos(prev => [...prev, ...files])
    files.forEach(f => { const r = new FileReader(); r.onload = ev => setPhotoPreviews(prev => [...prev, { name: f.name, url: ev.target.result }]); r.readAsDataURL(f) })
  }
  const removePhoto = (idx) => { setPhotos(prev => prev.filter((_, i) => i !== idx)); setPhotoPreviews(prev => prev.filter((_, i) => i !== idx)) }

  const wx = manualWx
    ? { temp: Number(mw.temp) || 0, humidity: Number(mw.humidity) || 0, windSpeed: Number(mw.windSpeed) || 0, windDir: mw.windDir, conditions: mw.conditions }
    : weather
  const windHigh = wx.windSpeed > 10

  const getLoc = () => {
    setGpsLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { setGps({ lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) }); setLocMode('gps'); setGpsLoading(false); setErrors(e => ({ ...e, location: undefined })) },
        () => { setLocMode('manual'); setGpsLoading(false) })
    } else { setLocMode('manual'); setGpsLoading(false) }
  }

  const activeWarnings = products.flatMap(p => {
    const chem = chemicals.find(c => c.name === p.name)
    if (!chem) return []
    return checkRestrictions(chem, wx).map(r => ({ product: p.name, ...r }))
  })

  const validate = () => {
    const e = {}
    if (!crewLead.trim()) e.crewLead = 'Required'
    if (!license.trim()) e.license = 'Required'
    if (!property.trim()) e.property = 'Required'
    if (!selectedEquip) e.equipment = 'Required'
    if (!totalMixVol.trim()) e.totalMixVol = 'Required'
    if (products.length === 0) e.products = 'Add at least one product'
    products.forEach((p, i) => { if (!p.ozConcentrate.trim()) e[`oz-${i}`] = 'Required' })
    if (!((locMode === 'gps' && gps) || (locMode === 'manual' && manualAddr.trim()))) e.location = 'Required'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); setShakeSubmit(true); setTimeout(() => setShakeSubmit(false), 600); return }
    setErrors({}); setSubmitting(true)
    const loc = locMode === 'gps' && gps ? `${gps.lat}, ${gps.lng}` : manualAddr || '—'
    const equipItem = equipment.find(eq => eq.name === selectedEquip)

    const success = await onSubmit({
      crewName: crewName || '—', crewLead, license, property, location: loc,
      equipmentId: equipItem?.id || null, equipmentName: selectedEquip,
      totalMixVol: `${totalMixVol} ${mixVolUnit}`, targetPest, notes,
      products: products.map(p => ({ chemicalId: p.id, name: p.name, epa: p.epa, amount: `${p.ozConcentrate} ${p.unit || 'oz'}` })),
      crewMembers: selectedMembers,
      weather: wx,
    })

    if (success && photos.length > 0) {
      try {
        const logsResp = await fetch('/api/spray-logs?limit=1')
        const latest = await logsResp.json()
        if (latest.length > 0) { await uploadPhotos(latest[0].id, photos); if (onLogsUpdated) await onLogsUpdated() }
      } catch (err) { console.error('Photo upload failed:', err) }
    }

    setSubmitting(false)
    if (success) {
      setProperty(''); setSelectedEquip(''); setTotalMixVol(''); setTargetPest('')
      setProducts([]); setNotes(''); setLocMode('none'); setGps(null); setManualAddr('')
      setPhotos([]); setPhotoPreviews([]); setSelectedMembers([])
    }
  }

  const Req = () => <span style={{ color: C.red, marginLeft: 3 }}>*</span>
  const errMsg = (key) => errors[key] ? <div style={{ fontSize: 12, color: C.red, fontWeight: 600, marginTop: 4 }}>{errors[key]}</div> : null
  const errBorder = (key) => errors[key] ? { borderColor: C.red, background: '#FFFBFB' } : {}

  // Filter employees by selected crew
  const crewEmployees = employees.filter(emp => {
    const crew = crews.find(c => c.name === crewName)
    return crew ? emp.default_crew_id === crew.id : true
  })

  return (
    <div>
      {/* Weather */}
      <div style={{ ...cardStyle(), borderColor: windHigh ? C.redBorder : activeWarnings.length > 0 ? C.amberBorder : C.accentBorder, background: windHigh ? C.redLight : activeWarnings.length > 0 ? C.amberLight : C.card }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🌤</span>
            <span style={{ fontSize: 16, fontWeight: 800 }}>{manualWx ? 'Manual Weather' : weather.simulated ? 'Simulated' : 'Live Weather'}</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button tabIndex={0} onClick={() => setManualWx(!manualWx)} style={{ fontSize: 13, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', background: C.bg, border: `1px solid ${C.cardBorder}`, color: C.textMed, fontWeight: 600 }}>
              {manualWx ? 'Auto' : 'Manual'}
            </button>
            {!manualWx && <button tabIndex={0} onClick={onRefresh} style={{ fontSize: 13, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', background: C.accentLight, border: `1px solid ${C.accentBorder}`, color: C.accent, fontWeight: 700 }}>Refresh</button>}
          </div>
        </div>

        {windHigh && (
          <div style={{ background: '#fff', border: `2px solid ${C.red}`, borderRadius: 12, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div><div style={{ fontSize: 16, fontWeight: 800, color: C.red }}>High Wind Warning</div><div style={{ fontSize: 14, color: C.textMed }}>Exceeds 10 mph</div></div>
          </div>
        )}
        {activeWarnings.length > 0 && (
          <div style={{ background: '#fff', border: `2px solid ${C.amber}`, borderRadius: 12, padding: '12px 16px', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.amber, marginBottom: 6 }}>⚠️ Weather Conflicts With Your Mix</div>
            {activeWarnings.map((w, i) => <div key={i} style={{ fontSize: 13, padding: '4px 0' }}>• <strong>{w.product}</strong> — {w.warn}</div>)}
          </div>
        )}

        {manualWx ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[{ l: 'Temp (°F)', k: 'temp' }, { l: 'Humidity (%)', k: 'humidity' }, { l: 'Wind (mph)', k: 'windSpeed' }].map(f => (
              <div key={f.k}><div style={labelStyle}>{f.l}</div><input value={mw[f.k]} onChange={e => setMw({ ...mw, [f.k]: e.target.value })} style={inputStyle()} /></div>
            ))}
            <div><div style={labelStyle}>Wind Dir</div><select value={mw.windDir} onChange={e => setMw({ ...mw, windDir: e.target.value })} style={inputStyle()}>{WIND_DIRS.map(d => <option key={d}>{d}</option>)}</select></div>
            <div style={{ gridColumn: '1 / -1' }}><div style={labelStyle}>Conditions</div><select value={mw.conditions} onChange={e => setMw({ ...mw, conditions: e.target.value })} style={inputStyle()}>
              {['Clear', 'Partly Cloudy', 'Overcast', 'Hazy', 'Foggy'].map(c => <option key={c}>{c}</option>)}</select></div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <WindCompass direction={weather.windDir} speed={weather.windSpeed} />
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[{ l: 'Temp', v: `${weather.temp}°F`, c: C.text }, { l: 'Humidity', v: `${weather.humidity}%`, c: C.blue },
                { l: 'Wind', v: `${weather.windSpeed} mph ${weather.windDir}`, c: windHigh ? C.red : C.accent }, { l: 'Sky', v: weather.conditions, c: C.amber }].map(s => (
                <div key={s.l}><div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>{s.l}</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: s.c }}>{s.v}</div></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Crew Info */}
      <div style={cardStyle()}>
        <div style={{ ...labelStyle, fontSize: 14, color: C.blue, marginBottom: 4, letterSpacing: 2 }}>Crew Info</div>
        <div style={{ fontSize: 12, color: C.textLight, marginBottom: 14, lineHeight: 1.5 }}>Crew lead logs on behalf of the entire crew.</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <div style={labelStyle}>Crew Name</div>
            <select value={useCustomCrew ? '__custom' : crewSelect}
              onChange={e => {
                if (e.target.value === '__custom') { setUseCustomCrew(true); setCustomCrewName('') }
                else { setUseCustomCrew(false); setCrewSelect(e.target.value) }
              }} style={inputStyle()}>
              <option value="">Select crew…</option>
              {crews.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              <option value="__custom">Other…</option>
            </select>
            {useCustomCrew && (
              <input value={customCrewName} onChange={e => setCustomCrewName(e.target.value)}
                placeholder="Enter crew name" autoFocus style={inputStyle({ marginTop: 6 })} />
            )}
          </div>
          <div>
            <div style={labelStyle}>Crew Lead<Req /></div>
            <input value={crewLead} onChange={e => { setCrewLead(e.target.value); setErrors(er => ({ ...er, crewLead: undefined })) }} placeholder="Your name" style={inputStyle(errBorder('crewLead'))} />
            {errMsg('crewLead')}
          </div>
        </div>
        <div style={labelStyle}>Business License / Cert #<Req /></div>
        <input value={license} onChange={e => { setLicense(e.target.value); setErrors(er => ({ ...er, license: undefined })) }} placeholder="e.g. QAL-48271" style={inputStyle(errBorder('license'))} />
        {errMsg('license')}
      </div>

      {/* Crew Members */}
      <div style={cardStyle()}>
        <div style={{ ...labelStyle, fontSize: 14, color: C.blue, marginBottom: 8, letterSpacing: 2 }}>Crew Members Today</div>
        <div style={{ fontSize: 12, color: C.textLight, marginBottom: 12 }}>Select who's on this crew for today's applications.</div>

        {selectedMembers.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {selectedMembers.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, background: C.blueLight, border: `1.5px solid ${C.blueBorder}` }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.blue }}>{m.name}</span>
                <span onClick={() => toggleMember({ id: m.id })} style={{ cursor: 'pointer', color: C.blue, fontSize: 18, lineHeight: 1, fontWeight: 800 }}>×</span>
              </div>
            ))}
          </div>
        )}

        {showMemberPicker ? (
          <div style={{ background: '#FAFAF7', border: `1.5px solid ${C.cardBorder}`, borderRadius: 14, padding: 14 }}>
            {(crewEmployees.length > 0 ? crewEmployees : employees).map(emp => {
              const isSelected = selectedMembers.some(m => m.id === emp.id)
              return (
                <div key={emp.id} tabIndex={0} role="button"
                  onClick={() => toggleMember(emp)}
                  onKeyDown={e => e.key === 'Enter' && toggleMember(emp)}
                  style={{ padding: '12px 14px', borderRadius: 12, cursor: 'pointer', marginBottom: 6, outline: 'none',
                    background: isSelected ? C.blueLight : C.card, border: `1.5px solid ${isSelected ? C.blueBorder : C.cardBorder}`,
                    display: 'flex', alignItems: 'center', gap: 12 }}>
                  {emp.photo_filename ? (
                    <img src={`/uploads/${emp.photo_filename}`} alt="" style={{ width: 40, height: 40, borderRadius: 20, objectFit: 'cover', border: `2px solid ${isSelected ? C.blue : C.cardBorder}` }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 20, background: isSelected ? C.blue : '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 800 }}>
                      {emp.first_name[0]}{emp.last_name[0]}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{emp.first_name} {emp.last_name}</div>
                    {emp.crew_name && <div style={{ fontSize: 12, color: C.textLight }}>{emp.crew_name}</div>}
                  </div>
                  <div style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${isSelected ? C.blue : C.cardBorder}`, background: isSelected ? C.blue : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isSelected && <span style={{ color: '#fff', fontSize: 14, fontWeight: 900 }}>✓</span>}
                  </div>
                </div>
              )
            })}
            {employees.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: C.textLight }}>No employees yet. Add them in the admin dashboard.</div>}
            <button tabIndex={0} onClick={() => setShowMemberPicker(false)}
              style={{ ...btnStyle(C.blue, '#fff', { fontSize: 14, marginTop: 8 }) }}>
              Done ({selectedMembers.length} selected)
            </button>
          </div>
        ) : (
          <div tabIndex={0} role="button" onClick={() => setShowMemberPicker(true)} onKeyDown={e => e.key === 'Enter' && setShowMemberPicker(true)}
            style={{ padding: 16, borderRadius: 14, border: `2px dashed ${C.blueBorder}`, textAlign: 'center', cursor: 'pointer', fontSize: 16, color: C.blue, fontWeight: 700, background: C.blueLight, outline: 'none' }}>
            👷 {selectedMembers.length > 0 ? `${selectedMembers.length} Member${selectedMembers.length > 1 ? 's' : ''} Selected — Tap to Change` : 'Select Crew Members'}
          </div>
        )}
      </div>

      {/* Application Details */}
      <div style={cardStyle()}>
        <div style={{ ...labelStyle, fontSize: 14, color: C.accent, marginBottom: 14, letterSpacing: 2 }}>Application Details</div>
        <div style={labelStyle}>Property / Job Site<Req /></div>
        <input value={property} onChange={e => { setProperty(e.target.value); setErrors(er => ({ ...er, property: undefined })) }} placeholder="e.g. Henderson Residence" style={inputStyle({ marginBottom: errors.property ? 0 : 14, ...errBorder('property') })} />
        {errMsg('property')}{errors.property && <div style={{ height: 10 }} />}

        <div style={labelStyle}>Location<Req /></div>
        {errors.location && <div style={{ fontSize: 12, color: C.red, fontWeight: 600, marginBottom: 6 }}>{errors.location}</div>}
        {locMode === 'none' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            <button tabIndex={0} onClick={getLoc} style={{ flex: 1, padding: 14, borderRadius: 12, cursor: 'pointer', background: C.accentLight, border: `1.5px solid ${C.accentBorder}`, textAlign: 'center' }}>
              <span style={{ fontSize: 20, display: 'block', marginBottom: 2 }}>📍</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{gpsLoading ? 'Getting…' : 'Current Location'}</span>
            </button>
            <button tabIndex={0} onClick={() => setLocMode('manual')} style={{ flex: 1, padding: 14, borderRadius: 12, cursor: 'pointer', background: C.blueLight, border: `1.5px solid ${C.blueBorder}`, textAlign: 'center' }}>
              <span style={{ fontSize: 20, display: 'block', marginBottom: 2 }}>✏️</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.blue }}>Enter Manually</span>
            </button>
          </div>
        )}
        {locMode === 'gps' && gps && (
          <div style={{ padding: '12px 16px', borderRadius: 12, background: C.accentLight, border: `1.5px solid ${C.accentBorder}`, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 20 }}>📍</span>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>Location Captured</div><div style={{ fontSize: 13, color: C.textMed, fontFamily: MONO }}>{gps.lat}, {gps.lng}</div></div>
            <button tabIndex={0} onClick={() => { setLocMode('none'); setGps(null) }} style={{ fontSize: 13, color: C.textLight, cursor: 'pointer', fontWeight: 600, background: 'none', border: 'none' }}>Change</button>
          </div>
        )}
        {locMode === 'manual' && (
          <div style={{ marginBottom: 14 }}>
            <input value={manualAddr} onChange={e => setManualAddr(e.target.value)} placeholder="Address or cross streets" autoFocus style={inputStyle()} />
            <button tabIndex={0} onClick={() => setLocMode('none')} style={{ fontSize: 13, color: C.accent, cursor: 'pointer', marginTop: 4, fontWeight: 600, background: 'none', border: 'none', padding: 0 }}>← Back</button>
          </div>
        )}

        <div style={labelStyle}>Target Pest / Purpose</div>
        <input value={targetPest} onChange={e => setTargetPest(e.target.value)} placeholder="e.g. Annual grassy weeds" style={inputStyle({ marginBottom: 14 })} />

        <div style={labelStyle}>Equipment<Req /></div>
        <select value={selectedEquip} onChange={e => { setSelectedEquip(e.target.value); setErrors(er => ({ ...er, equipment: undefined })) }} style={inputStyle({ color: selectedEquip ? C.text : C.textLight, ...errBorder('equipment') })}>
          <option value="">Select equipment…</option>
          {equipment.map(e => <option key={e.id} value={e.name}>{e.name} — {e.type}</option>)}
        </select>
        {errMsg('equipment')}
      </div>

      {/* Mix Sheet */}
      <div style={cardStyle()}>
        <div style={{ ...labelStyle, fontSize: 14, color: C.accent, marginBottom: 14, letterSpacing: 2 }}>Mix Sheet</div>
        <div style={labelStyle}>Total Volume of Mix<Req /></div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <input value={totalMixVol} onChange={e => { setTotalMixVol(e.target.value); setErrors(er => ({ ...er, totalMixVol: undefined })) }} placeholder="0"
            style={inputStyle({ flex: 1, ...errBorder('totalMixVol') })} type="number" inputMode="decimal" />
          <select value={mixVolUnit} onChange={e => setMixVolUnit(e.target.value)}
            style={inputStyle({ width: 80, flexShrink: 0, fontSize: 16, fontWeight: 800, color: C.accent, textAlign: 'center', padding: '14px 8px', appearance: 'none', WebkitAppearance: 'none', background: C.accentLight, borderColor: C.accentBorder })}>
            <option value="gal">gal</option><option value="L">L</option><option value="qt">qt</option>
          </select>
        </div>
        {errMsg('totalMixVol')}

        <div style={{ ...labelStyle, marginBottom: 10 }}>Products in Tank ({products.length})<Req /></div>
        {errors.products && <div style={{ fontSize: 12, color: C.red, fontWeight: 600, marginBottom: 10 }}>{errors.products}</div>}

        {products.map((p, idx) => {
          const sig = SIG_COLORS[p.signal] || SIG_COLORS.CAUTION
          const warnings = checkRestrictions(p, wx)
          return (
            <div key={`${p.id}-${idx}`} style={{ background: warnings.length > 0 ? C.amberLight : sig.bg, border: `1.5px solid ${warnings.length > 0 ? C.amberBorder : sig.border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div><div style={{ fontSize: 16, fontWeight: 800 }}>{p.name}</div><div style={{ fontSize: 12, color: C.textLight }}>EPA: {p.epa} · {p.type}</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, background: `${sig.badge}18`, color: sig.badge, fontWeight: 800, textTransform: 'uppercase' }}>{p.signal}</span>
                  <button tabIndex={0} onClick={() => removeProduct(idx)} style={{ cursor: 'pointer', color: C.textLight, fontSize: 22, lineHeight: 1, background: 'none', border: 'none' }}>×</button>
                </div>
              </div>
              {p.restricted && <div style={{ fontSize: 12, color: C.red, fontWeight: 700, marginBottom: 6 }}>⚠ Restricted Use Pesticide</div>}
              {warnings.map((w, i) => <div key={i} style={{ fontSize: 12, color: C.amber, fontWeight: 700, marginBottom: 4, padding: '4px 8px', background: `${C.amber}10`, borderRadius: 6 }}>⚠ {w.warn}</div>)}
              <div style={{ fontSize: 12, color: C.textLight, fontWeight: 700, marginBottom: 4, marginTop: 6 }}>Amount of Concentrate<Req /></div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={p.ozConcentrate} onChange={e => updateOz(idx, e.target.value)} placeholder="0"
                  style={inputStyle({ flex: 1, fontSize: 20, fontWeight: 800, fontFamily: MONO, padding: '16px', ...errBorder(`oz-${idx}`) })} type="number" inputMode="decimal" />
                <select value={p.unit || 'oz'} onChange={e => updateUnit(idx, e.target.value)}
                  style={inputStyle({ width: 80, flexShrink: 0, fontSize: 16, fontWeight: 800, color: C.accent, textAlign: 'center', padding: '16px 8px', appearance: 'none', WebkitAppearance: 'none', background: C.accentLight, borderColor: C.accentBorder })}>
                  <option value="oz">oz</option><option value="fl oz">fl oz</option><option value="ml">ml</option>
                  <option value="g">g</option><option value="lb">lb</option><option value="tsp">tsp</option><option value="tbsp">tbsp</option>
                </select>
              </div>
              {errMsg(`oz-${idx}`)}
            </div>
          )
        })}

        {showPicker ? (
          <div style={{ background: '#FAFAF7', border: `1.5px solid ${C.cardBorder}`, borderRadius: 14, padding: 14 }}>
            <input value={chemQ} onChange={e => setChemQ(e.target.value)} autoFocus placeholder="Search products…" style={inputStyle({ marginBottom: 10 })} />
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {filtered.map(c => {
                const sig = SIG_COLORS[c.signal] || SIG_COLORS.CAUTION; const warnings = checkRestrictions(c, wx)
                return (
                  <div key={c.id} tabIndex={0} role="button" onClick={() => addProduct(c)} onKeyDown={e => e.key === 'Enter' && addProduct(c)}
                    style={{ padding: 14, borderRadius: 12, cursor: 'pointer', marginBottom: 6, background: C.card, border: `1px solid ${warnings.length > 0 ? C.amberBorder : C.cardBorder}`, outline: 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div><div style={{ fontSize: 16, fontWeight: 700 }}>{c.name}</div><div style={{ fontSize: 12, color: C.textLight }}>{c.type} · EPA: {c.epa}</div></div>
                      <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 5, background: sig.bg, color: sig.badge, fontWeight: 800, border: `1px solid ${sig.border}` }}>{c.signal}</span>
                    </div>
                    {c.restricted && <div style={{ fontSize: 12, color: C.red, marginTop: 4, fontWeight: 700 }}>⚠ Restricted Use</div>}
                    {warnings.length > 0 && <div style={{ fontSize: 12, color: C.amber, marginTop: 4, fontWeight: 700 }}>⚠ {warnings.length} active restriction{warnings.length > 1 ? 's' : ''}</div>}
                  </div>
                )
              })}
              {filtered.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: C.textLight }}>No matching products</div>}
            </div>
            <button tabIndex={0} onClick={() => { setShowPicker(false); setChemQ('') }} style={{ ...btnStyle('#eee', C.text, { marginTop: 8, boxShadow: 'none' }) }}>Cancel</button>
          </div>
        ) : (
          <div tabIndex={0} role="button" onClick={() => setShowPicker(true)} onKeyDown={e => e.key === 'Enter' && setShowPicker(true)}
            style={{ padding: 16, borderRadius: 14, border: `2px dashed ${C.accentBorder}`, textAlign: 'center', cursor: 'pointer', fontSize: 16, color: C.accent, fontWeight: 700, outline: 'none' }}>
            + Add Product to Mix
          </div>
        )}
      </div>

      {/* Notes + Photos */}
      <div style={cardStyle()}>
        <div style={labelStyle}>Field Notes</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Areas treated, observations, conditions…"
          style={{ ...inputStyle(), minHeight: 90, resize: 'vertical', fontSize: 15, lineHeight: 1.5 }} />

        <div style={{ marginTop: 16 }}>
          <div style={labelStyle}>Photos / Attachments</div>
          <input ref={fileInput} type="file" accept="image/*" multiple capture="environment" onChange={handlePhotos} style={{ display: 'none' }} />
          {photoPreviews.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {photoPreviews.map((p, i) => (
                <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 12, overflow: 'hidden', border: `1.5px solid ${C.cardBorder}` }}>
                  <img src={p.url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div onClick={() => removePhoto(i)} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, background: 'rgba(0,0,0,0.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer', fontWeight: 800 }}>×</div>
                </div>
              ))}
            </div>
          )}
          <button tabIndex={0} onClick={() => fileInput.current?.click()}
            style={{ ...btnStyle(C.blue, '#fff', { fontSize: 15, background: C.blueLight, color: C.blue, border: `2px dashed ${C.blueBorder}`, boxShadow: 'none' }) }}>
            📷 Add Photos
          </button>
          <div style={{ fontSize: 12, color: C.textLight, marginTop: 6 }}>
            {photos.length > 0 ? `${photos.length} photo${photos.length > 1 ? 's' : ''} attached` : 'Tap to take a photo or choose from library'}
          </div>
        </div>
      </div>

      {/* Submit */}
      {Object.keys(errors).length > 0 && (
        <div style={{ background: C.redLight, border: `1.5px solid ${C.redBorder}`, borderRadius: 12, padding: '12px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>⛔</span>
          <div style={{ fontSize: 14, color: C.red, fontWeight: 700 }}>{Object.keys(errors).length} required field{Object.keys(errors).length > 1 ? 's' : ''} missing</div>
        </div>
      )}
      <button tabIndex={0} onClick={handleSubmit} disabled={submitting}
        style={{ ...btnStyle(Object.keys(errors).length > 0 ? C.textLight : C.accent), opacity: submitting ? 0.6 : 1, animation: shakeSubmit ? 'fpShake 0.5s ease' : 'none' }}>
        {submitting ? 'Saving...' : Object.keys(errors).length > 0 ? 'Fix Required Fields to Submit' : `Submit Spray Log${photos.length > 0 ? ` + ${photos.length} Photo${photos.length > 1 ? 's' : ''}` : ''}`}
      </button>
      <style>{`@keyframes fpShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(4px)} }`}</style>
      <div style={{ height: 20 }} />
    </div>
  )
}

// ═══════════════════════════════════════════
// HISTORY TAB
// ═══════════════════════════════════════════
function HistoryTab({ logs }) {
  const [expanded, setExpanded] = useState(null)
  if (logs.length === 0) return <div style={{ textAlign: 'center', padding: 40 }}><div style={{ fontSize: 40, marginBottom: 12 }}>📋</div><div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>No Spray Logs Yet</div><div style={{ fontSize: 14, color: C.textLight }}>Submit your first log in the New Log tab.</div></div>

  return (
    <div>
      <div style={labelStyle}>{logs.length} Spray Records</div>
      {logs.map(log => (
        <div key={log.id} style={{ marginBottom: 12 }}>
          <div tabIndex={0} role="button" onClick={() => setExpanded(expanded === log.id ? null : log.id)} onKeyDown={e => e.key === 'Enter' && setExpanded(expanded === log.id ? null : log.id)}
            style={{ ...cardStyle({ marginBottom: 0, cursor: 'pointer' }), borderRadius: expanded === log.id ? '16px 16px 0 0' : 16, outline: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div><div style={{ fontSize: 17, fontWeight: 800 }}>{log.property}</div>
                <div style={{ fontSize: 13, color: C.textLight, marginTop: 2 }}>{log.crewName} · {log.products.length} product{log.products.length !== 1 ? 's' : ''} · {log.totalMixVol}</div></div>
              <div style={{ textAlign: 'right' }}><div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>{log.date}</div><div style={{ fontSize: 12, color: C.textLight }}>{log.time}</div></div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 13, color: C.textLight, fontWeight: 600, flexWrap: 'wrap' }}>
              <span>🌡 {log.weather.temp}°F</span><span>💨 {log.weather.windSpeed} mph</span><span>🔧 {log.equipment}</span>
              {log.photos && log.photos.length > 0 && <span>📷 {log.photos.length}</span>}
              {log.members && log.members.length > 0 && <span>👷 {log.members.length}</span>}
              <span style={{ marginLeft: 'auto', color: C.accent }}>✓ {log.status}</span>
            </div>
          </div>
          {expanded === log.id && (
            <div style={{ background: '#FAFAF7', border: `1.5px solid ${C.cardBorder}`, borderTop: 'none', borderRadius: '0 0 16px 16px', padding: '16px 18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                {[{ l: 'Crew', v: log.crewName }, { l: 'Crew Lead', v: log.crewLead }, { l: 'License', v: log.license }, { l: 'Equipment', v: log.equipment },
                  { l: 'Mix Volume', v: log.totalMixVol }, { l: 'Location', v: log.location }, { l: 'Target Pest', v: log.targetPest }].map(f => (
                  <div key={f.l}><div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>{f.l}</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{f.v || '—'}</div></div>
                ))}
              </div>

              {log.members && log.members.length > 0 && (
                <><div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Crew Members ({log.members.length})</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  {log.members.map(m => <span key={m.id} style={{ padding: '6px 12px', borderRadius: 8, background: C.blueLight, border: `1px solid ${C.blueBorder}`, fontSize: 13, fontWeight: 600, color: C.blue }}>{m.name}</span>)}
                </div></>
              )}

              <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Mix Sheet</div>
              {log.products.map((p, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: C.card, border: `1px solid ${C.cardBorder}`, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><div style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</div><div style={{ fontSize: 12, color: C.textLight }}>EPA: {p.epa}</div></div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: C.accent, fontFamily: MONO }}>{p.ozConcentrate}</div>
                </div>
              ))}

              <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 14, marginBottom: 6 }}>Weather</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <WindCompass direction={log.weather.windDir} speed={log.weather.windSpeed} size={66} />
                <div style={{ fontSize: 14, color: C.textMed, lineHeight: 1.8 }}>{log.weather.temp}°F · {log.weather.humidity}%<br />{log.weather.windSpeed} mph {log.weather.windDir} · {log.weather.conditions}</div>
              </div>

              {log.photos && log.photos.length > 0 && (
                <><div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Photos ({log.photos.length})</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {log.photos.map(ph => (
                    <a key={ph.id} href={`/uploads/${ph.filename}`} target="_blank" rel="noopener noreferrer"
                      style={{ width: 80, height: 80, borderRadius: 10, overflow: 'hidden', border: `1.5px solid ${C.cardBorder}`, display: 'block' }}>
                      <img src={`/uploads/${ph.filename}`} alt={ph.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </a>
                  ))}
                </div></>
              )}

              {log.notes && <><div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Notes</div>
                <div style={{ fontSize: 14, color: C.textMed, lineHeight: 1.6, marginBottom: 14 }}>{log.notes}</div></>}
              <button tabIndex={0} onClick={() => openPdf(log)} style={btnStyle(C.blue, '#fff', { fontSize: 15 })}>📄 Export / Print as PDF</button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════
// SDS LIBRARY TAB (unchanged from v2)
// ═══════════════════════════════════════════
function SdsTab({ chemicals }) {
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(null)
  const filtered = chemicals.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.ai.toLowerCase().includes(q.toLowerCase()) || c.type.toLowerCase().includes(q.toLowerCase()))

  if (sel) {
    const sig = SIG_COLORS[sel.signal] || SIG_COLORS.CAUTION
    const r = sel.wxRestrictions || {}
    const cats = [{ key: 'temp', icon: '🌡', label: 'Temperature', rule: r.temp }, { key: 'humidity', icon: '💧', label: 'Humidity', rule: r.humidity },
      { key: 'windSpeed', icon: '💨', label: 'Wind Speed', rule: r.windSpeed }, { key: 'conditions', icon: '☁️', label: 'Sky / Conditions', rule: r.conditions }]
    return (
      <div>
        <button tabIndex={0} onClick={() => setSel(null)} style={{ fontSize: 15, color: C.accent, cursor: 'pointer', marginBottom: 14, fontWeight: 700, background: 'none', border: 'none', padding: 0 }}>← Back</button>
        <div style={{ ...cardStyle(), background: sig.bg, borderColor: sig.border, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div><div style={{ fontSize: 22, fontWeight: 900 }}>{sel.name}</div><div style={{ fontSize: 14, color: C.textMed, marginTop: 2 }}>{sel.type}</div></div>
            <span style={{ fontSize: 13, padding: '5px 14px', borderRadius: 8, background: `${sig.badge}20`, color: sig.badge, fontWeight: 900, textTransform: 'uppercase', border: `2px solid ${sig.badge}40` }}>{sel.signal}</span>
          </div>
          <div style={{ marginTop: 12, fontSize: 14 }}><span style={{ color: C.textLight }}>EPA:</span> <strong>{sel.epa}</strong> · <span style={{ color: C.textLight }}>Active:</span> <strong>{sel.ai}</strong></div>
          {sel.restricted && <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: C.redLight, border: `2px solid ${C.red}`, fontSize: 14, color: C.red, fontWeight: 800 }}>⚠ RESTRICTED USE PESTICIDE</div>}
        </div>
        <div style={cardStyle()}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, letterSpacing: 0.5 }}>Weather Restrictions from Label</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {cats.map(c => (
              <div key={c.key} style={{ padding: '12px 14px', borderRadius: 12, background: c.rule ? C.amberLight : '#FAFAF7', border: `1.5px solid ${c.rule ? C.amberBorder : C.cardBorder}` }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{c.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{c.label}</div>
                {c.rule ? <div style={{ fontSize: 13, fontWeight: 700, color: C.amber, lineHeight: 1.4 }}>{c.rule.warn}</div>
                  : <div style={{ fontSize: 13, fontWeight: 600, color: C.textLight, fontStyle: 'italic' }}>N/A — not specified</div>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {sel.labelUrl ? <a href={sel.labelUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'block', textDecoration: 'none', ...cardStyle({ textAlign: 'center', cursor: 'pointer', background: C.accentLight, borderColor: C.accentBorder, marginBottom: 0 }) }}><span style={{ fontSize: 24, display: 'block', marginBottom: 2 }}>🏷️</span><span style={{ fontSize: 15, fontWeight: 800, color: C.accent }}>Open Label</span></a>
            : <div style={{ flex: 1, ...cardStyle({ textAlign: 'center', marginBottom: 0, opacity: 0.5 }) }}><span style={{ fontSize: 24, display: 'block', marginBottom: 2 }}>🏷️</span><span style={{ fontSize: 15, fontWeight: 800, color: C.textLight }}>No Label</span></div>}
          {sel.sdsUrl ? <a href={sel.sdsUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'block', textDecoration: 'none', ...cardStyle({ textAlign: 'center', cursor: 'pointer', background: C.blueLight, borderColor: C.blueBorder, marginBottom: 0 }) }}><span style={{ fontSize: 24, display: 'block', marginBottom: 2 }}>📋</span><span style={{ fontSize: 15, fontWeight: 800, color: C.blue }}>Open SDS</span></a>
            : <div style={{ flex: 1, ...cardStyle({ textAlign: 'center', marginBottom: 0, opacity: 0.5 }) }}><span style={{ fontSize: 24, display: 'block', marginBottom: 2 }}>📋</span><span style={{ fontSize: 15, fontWeight: 800, color: C.textLight }}>No SDS</span></div>}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={labelStyle}>SDS Library — {chemicals.length} Products</div>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" style={inputStyle({ marginBottom: 12, fontSize: 16 })} />
      {filtered.map(c => {
        const sig = SIG_COLORS[c.signal] || SIG_COLORS.CAUTION; const rCount = c.wxRestrictions ? Object.values(c.wxRestrictions).filter(Boolean).length : 0
        return (
          <div key={c.id} tabIndex={0} role="button" onClick={() => setSel(c)} onKeyDown={e => e.key === 'Enter' && setSel(c)}
            style={{ ...cardStyle({ cursor: 'pointer' }), background: sig.bg, borderColor: sig.border, outline: 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div><div style={{ fontSize: 17, fontWeight: 800 }}>{c.name}</div><div style={{ fontSize: 13, color: C.textMed, marginTop: 2 }}>{c.type}</div><div style={{ fontSize: 12, color: C.textLight, marginTop: 4 }}>EPA: {c.epa}</div></div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: `${sig.badge}15`, color: sig.badge, fontWeight: 800, textTransform: 'uppercase' }}>{c.signal}</span>
                {c.restricted && <span style={{ fontSize: 12, color: C.red, fontWeight: 700 }}>RESTRICTED</span>}
                {rCount > 0 && <span style={{ fontSize: 11, color: C.amber, fontWeight: 600 }}>{rCount} restriction{rCount > 1 ? 's' : ''}</span>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

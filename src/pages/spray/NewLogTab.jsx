// ═══════════════════════════════════════════
// New Log Tab — Spray log creation form
// ═══════════════════════════════════════════

import { useState, useRef } from 'react'
import { C, MONO, SIG_COLORS, WIND_DIRS, cardStyle, labelStyle, inputStyle, btnStyle } from '../../config.js'
import { checkRestrictions } from '../../lib/weather.js'
import { uploadPhotos } from '../../lib/api.js'
import WindCompass from '../../components/WindCompass.jsx'

export default function NewLogTab({ vehicle, chemicals, equipment, crews, weather, onRefresh, onSubmit, onLogsUpdated, loggedInEmployee, loggedInCrew }) {
  // Crew — separate "useCustomCrew" flag so typing doesn't reset
  const [crewSelect, setCrewSelect] = useState(loggedInCrew?.name || vehicle.crewName || '')
  const [customCrewName, setCustomCrewName] = useState('')
  const [useCustomCrew, setUseCustomCrew] = useState(false)

  const crewName = useCustomCrew ? customCrewName : crewSelect

  const [crewLead, setCrewLead] = useState(loggedInEmployee ? `${loggedInEmployee.firstName} ${loggedInEmployee.lastName}` : '')
  const [license, setLicense] = useState(loggedInEmployee?.certNumber || loggedInEmployee?.license || '')
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
      setPhotos([]); setPhotoPreviews([])
    }
  }

  const Req = () => <span style={{ color: C.red, marginLeft: 3 }}>*</span>
  const errMsg = (key) => errors[key] ? <div style={{ fontSize: 12, color: C.red, fontWeight: 600, marginTop: 4 }}>{errors[key]}</div> : null
  const errBorder = (key) => errors[key] ? { borderColor: C.red, background: '#FFFBFB' } : {}

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
            <select value={useCustomCrew ? '__custom__' : crewSelect}
              onChange={e => {
                if (e.target.value === '__custom__') { setUseCustomCrew(true) }
                else { setUseCustomCrew(false); setCrewSelect(e.target.value) }
              }}
              style={inputStyle()}>
              <option value="">Select crew…</option>
              {crews.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              <option value="__custom__">✏️ Custom…</option>
            </select>
            {useCustomCrew && <input value={customCrewName} onChange={e => setCustomCrewName(e.target.value)} placeholder="Crew name" style={inputStyle({ marginTop: 6 })} />}
          </div>
          <div>
            <div style={labelStyle}>Crew Lead<Req /></div>
            <input value={crewLead} onChange={e => { setCrewLead(e.target.value); setErrors(er => ({ ...er, crewLead: undefined })) }} placeholder="Lead name" style={inputStyle(errBorder('crewLead'))} />
            {errMsg('crewLead')}
          </div>
        </div>
        <div style={labelStyle}>License / Cert #<Req /></div>
        <input value={license} onChange={e => { setLicense(e.target.value); setErrors(er => ({ ...er, license: undefined })) }} placeholder="QAL / QAC number" style={inputStyle(errBorder('license'))} />
        {errMsg('license')}
      </div>

      {/* Property */}
      <div style={labelStyle}>Property / Job Site<Req /></div>
      <input value={property} onChange={e => { setProperty(e.target.value); setErrors(er => ({ ...er, property: undefined })) }} placeholder="e.g. 123 Main St — HOA Common Area" style={inputStyle({ marginBottom: 14, ...errBorder('property') })} />
      {errMsg('property')}

      {/* Location */}
      <div style={labelStyle}>Location<Req /></div>
      {locMode === 'none' && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
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
      <select value={selectedEquip} onChange={e => { setSelectedEquip(e.target.value); setErrors(er => ({ ...er, equipment: undefined })) }} style={inputStyle({ color: selectedEquip ? C.text : C.textLight, marginBottom: 14, ...errBorder('equipment') })}>
        <option value="">Select equipment…</option>
        {equipment.map(eq => <option key={eq.id} value={eq.name}>{eq.name} ({eq.type})</option>)}
      </select>
      {errMsg('equipment')}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <div style={labelStyle}>Total Mix Volume<Req /></div>
          <input value={totalMixVol} onChange={e => { setTotalMixVol(e.target.value); setErrors(er => ({ ...er, totalMixVol: undefined })) }} placeholder="e.g. 25" inputMode="decimal" style={inputStyle(errBorder('totalMixVol'))} />
          {errMsg('totalMixVol')}
        </div>
        <div>
          <div style={labelStyle}>Unit</div>
          <select value={mixVolUnit} onChange={e => setMixVolUnit(e.target.value)} style={inputStyle()}>
            <option value="gal">gal</option><option value="oz">oz</option><option value="L">L</option>
          </select>
        </div>
      </div>

      {/* Products / Mix Sheet */}
      <div style={{ ...cardStyle(), borderColor: errors.products ? C.redBorder : C.accentBorder, background: errors.products ? C.redLight : C.accentLight }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ ...labelStyle, fontSize: 14, color: C.accent, marginBottom: 0, letterSpacing: 2 }}>Mix Sheet<Req /></div>
          <button tabIndex={0} onClick={() => setShowPicker(true)}
            style={{ fontSize: 13, padding: '8px 16px', borderRadius: 10, cursor: 'pointer', background: C.accent, border: 'none', color: '#fff', fontWeight: 700 }}>
            + Add Product
          </button>
        </div>
        {errMsg('products')}
        {products.length === 0 ? (
          <div style={{ fontSize: 13, color: C.textLight, padding: '8px 0' }}>No products added yet. Tap "Add Product" to build your mix.</div>
        ) : products.map((p, i) => {
          const sig = SIG_COLORS[p.signal] || SIG_COLORS.CAUTION
          return (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: C.card, border: `1.5px solid ${C.cardBorder}`, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div><div style={{ fontSize: 15, fontWeight: 800 }}>{p.name}</div><div style={{ fontSize: 12, color: C.textLight }}>EPA: {p.epa}</div></div>
                <button tabIndex={0} onClick={() => removeProduct(i)} style={{ fontSize: 18, color: C.red, cursor: 'pointer', background: 'none', border: 'none', fontWeight: 800, lineHeight: 1 }}>×</button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <input value={p.ozConcentrate} onChange={e => updateOz(i, e.target.value)} placeholder="Amount" inputMode="decimal"
                    style={inputStyle({ padding: '10px 14px', fontSize: 16, fontWeight: 700, fontFamily: MONO, ...errBorder(`oz-${i}`) })} />
                  {errMsg(`oz-${i}`)}
                </div>
                <select value={p.unit} onChange={e => updateUnit(i, e.target.value)} style={inputStyle({ width: 70, padding: '10px 8px', fontSize: 14 })}>
                  <option value="oz">oz</option><option value="ml">ml</option><option value="gal">gal</option><option value="L">L</option><option value="g">g</option><option value="lb">lb</option>
                </select>
              </div>
            </div>
          )
        })}
      </div>

      {/* Product Picker */}
      {showPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => { setShowPicker(false); setChemQ('') }}>
          <div style={{ width: '100%', maxWidth: 430, maxHeight: '70vh', background: C.bg, borderRadius: '20px 20px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 18px 8px' }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>Add Product to Mix</div>
              <input value={chemQ} onChange={e => setChemQ(e.target.value)} placeholder="Search chemicals…" autoFocus style={inputStyle()} />
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 18px 18px' }}>
              {filtered.filter(c => !products.some(p => p.id === c.id)).map(c => {
                const sig = SIG_COLORS[c.signal] || SIG_COLORS.CAUTION
                return (
                  <div key={c.id} tabIndex={0} role="button" onClick={() => addProduct(c)} onKeyDown={e => e.key === 'Enter' && addProduct(c)}
                    style={{ ...cardStyle({ cursor: 'pointer', marginBottom: 8 }), background: sig.bg, borderColor: sig.border }}>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: C.textMed, marginTop: 2 }}>{c.type} · EPA: {c.epa} · {c.ai}</div>
                  </div>
                )
              })}
              {filtered.filter(c => !products.some(p => p.id === c.id)).length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: C.textLight }}>No matching chemicals found</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div style={labelStyle}>Field Notes</div>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any observations, special instructions, or issues…" rows={3}
        style={inputStyle({ resize: 'vertical', marginBottom: 14, fontFamily: 'inherit' })} />

      {/* Photos */}
      <div style={cardStyle({ cursor: 'pointer' })} onClick={() => fileInput.current?.click()}>
        <input ref={fileInput} type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>📷</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.accent }}>Photos</div>
            <div style={{ fontSize: 13, color: C.textLight }}>{photos.length > 0 ? `${photos.length} photo${photos.length > 1 ? 's' : ''} attached` : 'Tap to take a photo or choose from library'}</div>
          </div>
        </div>
      </div>
      {photoPreviews.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, marginBottom: 14 }}>
          {photoPreviews.map((ph, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={ph.url} alt={ph.name} style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', border: `1.5px solid ${C.cardBorder}` }} />
              <div onClick={(e) => { e.stopPropagation(); removePhoto(i) }}
                style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, background: C.red, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, cursor: 'pointer', border: '2px solid #fff' }}>×</div>
            </div>
          ))}
        </div>
      )}

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
// ═══════════════════════════════════════════
// New Log Tab — Spray log creation form
// ═══════════════════════════════════════════

import { useState, useRef } from 'react'
import { C, MONO, SIG_COLORS, WIND_DIRS, cardStyle, labelStyle, inputStyle, btnStyle } from '@/config/index.js'
import { checkRestrictions } from '@/lib/weather.js'
import { uploadPhotos } from '@/lib/api/sprayLogs.js'
import { validateSprayLog } from '@/utils/validation.js'
import WindCompass from '@/components/WindCompass.jsx'

export default function NewLogTab({
  vehicle, chemicals, equipment, crews, weather,
  onRefresh, onSubmit, onLogsUpdated,
  loggedInEmployee, loggedInCrew,
}) {
  const [crewSelect,     setCrewSelect]    = useState(loggedInCrew?.name || vehicle?.crewName || '')
  const [customCrewName, setCustomCrewName] = useState('')
  const [useCustomCrew,  setUseCustomCrew]  = useState(false)
  const crewName = useCustomCrew ? customCrewName : crewSelect

  const [crewLead,     setCrewLead]     = useState(loggedInEmployee ? `${loggedInEmployee.firstName} ${loggedInEmployee.lastName}` : '')
  const [license,      setLicense]      = useState(loggedInEmployee?.certNumber || loggedInEmployee?.license || '')
  const [property,     setProperty]     = useState('')
  const [locMode,      setLocMode]      = useState('none')
  const [gps,          setGps]          = useState(null)
  const [gpsLoading,   setGpsLoading]   = useState(false)
  const [manualAddr,   setManualAddr]   = useState('')
  const [selectedEquip, setSelectedEquip] = useState('')
  const [totalMixVol,  setTotalMixVol]  = useState('')
  const [mixVolUnit,   setMixVolUnit]   = useState('gal')
  const [targetPest,   setTargetPest]   = useState('')
  const [products,     setProducts]     = useState([])
  const [showPicker,   setShowPicker]   = useState(false)
  const [chemQ,        setChemQ]        = useState('')
  const [notes,        setNotes]        = useState('')
  const [photos,       setPhotos]       = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])
  const [manualWx,     setManualWx]     = useState(false)
  const [mw,           setMw]           = useState({ temp: '', humidity: '', windSpeed: '', windDir: 'N', conditions: 'Clear' })
  const [errors,       setErrors]       = useState({})
  const [shakeSubmit,  setShakeSubmit]  = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const fileInput = useRef(null)

  const filtered = chemicals.filter(c =>
    c.name.toLowerCase().includes(chemQ.toLowerCase()) ||
    c.type.toLowerCase().includes(chemQ.toLowerCase()) ||
    c.ai.toLowerCase().includes(chemQ.toLowerCase())
  )

  const addProduct    = (chem) => { setProducts([...products, { ...chem, ozConcentrate: '', unit: 'oz' }]); setShowPicker(false); setChemQ(''); setErrors(e => ({ ...e, products: undefined })) }
  const removeProduct = (idx)  => setProducts(products.filter((_, i) => i !== idx))
  const updateOz      = (idx, val) => { setProducts(products.map((p, i) => i === idx ? { ...p, ozConcentrate: val } : p)); setErrors(e => ({ ...e, [`oz-${idx}`]: undefined })) }
  const updateUnit    = (idx, unit) => setProducts(products.map((p, i) => i === idx ? { ...p, unit } : p))

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files)
    setPhotos(prev => [...prev, ...files])
    files.forEach(f => {
      const r = new FileReader()
      r.onload = ev => setPhotoPreviews(prev => [...prev, { name: f.name, url: ev.target.result }])
      r.readAsDataURL(f)
    })
  }
  const removePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const wx = manualWx
    ? { temp: Number(mw.temp) || 0, humidity: Number(mw.humidity) || 0, windSpeed: Number(mw.windSpeed) || 0, windDir: mw.windDir, conditions: mw.conditions }
    : weather
  const windHigh = wx.windSpeed > 10

  const getLoc = () => {
    setGpsLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { setGps({ lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) }); setLocMode('gps'); setGpsLoading(false); setErrors(e => ({ ...e, location: undefined })) },
        () => { setLocMode('manual'); setGpsLoading(false) }
      )
    } else { setLocMode('manual'); setGpsLoading(false) }
  }

  const activeWarnings = products.flatMap(p => {
    const chem = chemicals.find(c => c.name === p.name)
    if (!chem) return []
    return checkRestrictions(chem, wx).map(r => ({ product: p.name, ...r }))
  })

  const handleSubmit = async () => {
    const errs = validateSprayLog({ crewLead, license, property, selectedEquip, totalMixVol, products, locMode, gps, manualAddr })
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      setShakeSubmit(true)
      setTimeout(() => setShakeSubmit(false), 600)
      return
    }
    setErrors({})
    setSubmitting(true)

    const loc = locMode === 'gps' && gps
      ? `GPS: ${gps.lat}, ${gps.lng}`
      : manualAddr

    const logData = {
      vehicleId: vehicle?.id,
      crewName,
      crewLead,
      license,
      property,
      location: loc,
      equipmentId: selectedEquip,
      equipmentName: equipment.find(e => String(e.id) === String(selectedEquip))?.name || '',
      totalMixVol: `${totalMixVol} ${mixVolUnit}`,
      targetPest,
      notes,
      weather: wx,
      products: products.map(p => ({ chemicalId: p.id, name: p.name, epa: p.epa, amount: `${p.ozConcentrate} ${p.unit}` })),
    }

    try {
      const result = await onSubmit(logData)
      if (photos.length > 0 && result?.id) {
        try { await uploadPhotos(result.id, photos) } catch { /* non-fatal */ }
      }
      // Reset form
      setProperty(''); setLocMode('none'); setGps(null); setManualAddr(''); setSelectedEquip('')
      setTotalMixVol(''); setTargetPest(''); setProducts([]); setNotes(''); setPhotos([]); setPhotoPreviews([])
      setErrors({})
      if (onLogsUpdated) await onLogsUpdated()
    } catch (e) {
      setErrors({ submit: e.message || 'Failed to submit' })
    }
    setSubmitting(false)
  }

  // ── Render is intentionally kept similar to original to preserve UI ──
  return (
    <div>
      {/* Weather banner */}
      <div style={{ ...cardStyle(), borderColor: windHigh ? C.redBorder : C.accentBorder, background: windHigh ? C.redLight : C.card, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>Current Conditions</div>
          <button onClick={onRefresh} style={{ ...btnStyle(C.accentLight, C.accent, { width: 'auto', padding: '6px 12px', fontSize: 12, borderRadius: 8 }) }}>↻ Refresh</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <WindCompass direction={wx.windDir} speed={wx.windSpeed} size={56} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, flex: 1 }}>
            {[
              { l: 'Temp',     v: `${wx.temp}°F` },
              { l: 'Humidity', v: `${wx.humidity}%` },
              { l: 'Wind',     v: `${wx.windSpeed} mph`, warn: windHigh },
              { l: 'Sky',      v: wx.conditions },
            ].map(item => (
              <div key={item.l}>
                <div style={{ fontSize: 10, color: C.textLight, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>{item.l}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: item.warn ? C.red : C.text }}>{item.v}</div>
              </div>
            ))}
          </div>
        </div>
        {activeWarnings.length > 0 && (
          <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: C.redLight, border: `1.5px solid ${C.redBorder}` }}>
            {activeWarnings.map((w, i) => (
              <div key={i} style={{ fontSize: 13, color: C.red, fontWeight: 700 }}>⚠ {w.product}: {w.warn}</div>
            ))}
          </div>
        )}
      </div>

      {/* Crew Lead */}
      <div style={{ marginBottom: 14 }}>
        <div style={labelStyle}>Crew Lead Name *</div>
        <input value={crewLead} onChange={e => { setCrewLead(e.target.value); setErrors(er => ({ ...er, crewLead: undefined })) }}
          style={{ ...inputStyle(), borderColor: errors.crewLead ? C.red : undefined }} placeholder="Full name" />
        {errors.crewLead && <div style={{ fontSize: 13, color: C.red, marginTop: 4 }}>{errors.crewLead}</div>}
      </div>

      {/* License */}
      <div style={{ marginBottom: 14 }}>
        <div style={labelStyle}>Pest Control License / Cert # *</div>
        <input value={license} onChange={e => { setLicense(e.target.value); setErrors(er => ({ ...er, license: undefined })) }}
          style={{ ...inputStyle(), borderColor: errors.license ? C.red : undefined }} placeholder="License or cert number" />
        {errors.license && <div style={{ fontSize: 13, color: C.red, marginTop: 4 }}>{errors.license}</div>}
      </div>

      {/* Property */}
      <div style={{ marginBottom: 14 }}>
        <div style={labelStyle}>Property / Job Site *</div>
        <input value={property} onChange={e => { setProperty(e.target.value); setErrors(er => ({ ...er, property: undefined })) }}
          style={{ ...inputStyle(), borderColor: errors.property ? C.red : undefined }} placeholder="Address or property name" />
        {errors.property && <div style={{ fontSize: 13, color: C.red, marginTop: 4 }}>{errors.property}</div>}
      </div>

      {/* Equipment */}
      <div style={{ marginBottom: 14 }}>
        <div style={labelStyle}>Equipment *</div>
        <select value={selectedEquip} onChange={e => { setSelectedEquip(e.target.value); setErrors(er => ({ ...er, equipment: undefined })) }}
          style={{ ...inputStyle(), borderColor: errors.equipment ? C.red : undefined }}>
          <option value="">Select equipment…</option>
          {equipment.map(eq => <option key={eq.id} value={eq.id}>{eq.name}</option>)}
        </select>
        {errors.equipment && <div style={{ fontSize: 13, color: C.red, marginTop: 4 }}>{errors.equipment}</div>}
      </div>

      {/* Mix Volume */}
      <div style={{ marginBottom: 14 }}>
        <div style={labelStyle}>Total Mix Volume *</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={totalMixVol} onChange={e => { setTotalMixVol(e.target.value); setErrors(er => ({ ...er, totalMixVol: undefined })) }}
            style={{ ...inputStyle(), flex: 1, borderColor: errors.totalMixVol ? C.red : undefined }} placeholder="Amount" type="number" min="0" />
          <select value={mixVolUnit} onChange={e => setMixVolUnit(e.target.value)}
            style={{ ...inputStyle(), width: 80 }}>
            {['gal', 'qt', 'oz', 'L'].map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        {errors.totalMixVol && <div style={{ fontSize: 13, color: C.red, marginTop: 4 }}>{errors.totalMixVol}</div>}
      </div>

      {/* Products */}
      <div style={{ marginBottom: 14 }}>
        <div style={labelStyle}>Products Applied *</div>
        {errors.products && <div style={{ fontSize: 13, color: C.red, marginBottom: 6 }}>{errors.products}</div>}
        {products.map((p, idx) => {
          const sig = SIG_COLORS[p.signal] || SIG_COLORS.CAUTION
          return (
            <div key={idx} style={{ ...cardStyle({ marginBottom: 8 }), background: sig.bg, borderColor: sig.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: C.textLight }}>{p.type} · EPA {p.epa}</div>
                </div>
                <button onClick={() => removeProduct(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.textLight }}>✕</button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={p.ozConcentrate} onChange={e => updateOz(idx, e.target.value)}
                  style={{ ...inputStyle({ flex: 1, borderColor: errors[`oz-${idx}`] ? C.red : undefined }), fontFamily: MONO }}
                  placeholder="Amount" type="number" min="0" />
                <select value={p.unit} onChange={e => updateUnit(idx, e.target.value)}
                  style={{ ...inputStyle({ width: 72 }) }}>
                  {['oz', 'fl oz', 'ml', 'L', 'lb', 'g'].map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              {errors[`oz-${idx}`] && <div style={{ fontSize: 13, color: C.red, marginTop: 4 }}>Amount required</div>}
            </div>
          )
        })}

        {showPicker ? (
          <div style={cardStyle()}>
            <input value={chemQ} onChange={e => setChemQ(e.target.value)} autoFocus
              style={inputStyle({ marginBottom: 10 })} placeholder="Search chemicals…" />
            {filtered.length === 0
              ? <div style={{ fontSize: 14, color: C.textLight, padding: '8px 0' }}>No chemicals found</div>
              : filtered.map(c => (
                <div key={c.id} tabIndex={0} role="button" onClick={() => addProduct(c)}
                  onKeyDown={e => e.key === 'Enter' && addProduct(c)}
                  style={{ padding: '12px 0', borderBottom: `1px solid ${C.cardBorder}`, cursor: 'pointer' }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: C.textLight }}>{c.type}</div>
                </div>
              ))}
            <button onClick={() => setShowPicker(false)} style={{ ...btnStyle(C.cardBorder, C.text, { marginTop: 10 }) }}>Cancel</button>
          </div>
        ) : (
          <button onClick={() => setShowPicker(true)} style={btnStyle(C.accentLight, C.accent)}>+ Add Product</button>
        )}
      </div>

      {/* Location */}
      <div style={{ marginBottom: 14 }}>
        <div style={labelStyle}>Location *</div>
        {errors.location && <div style={{ fontSize: 13, color: C.red, marginBottom: 6 }}>{errors.location}</div>}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button onClick={getLoc} disabled={gpsLoading}
            style={btnStyle(locMode === 'gps' ? C.accent : C.accentLight, locMode === 'gps' ? '#fff' : C.accent, { fontSize: 14 })}>
            {gpsLoading ? '…' : '📍 GPS'}
          </button>
          <button onClick={() => setLocMode('manual')}
            style={btnStyle(locMode === 'manual' ? C.blue : C.blueLight, locMode === 'manual' ? '#fff' : C.blue, { fontSize: 14 })}>
            ✍️ Manual
          </button>
        </div>
        {locMode === 'gps' && gps && (
          <div style={{ fontSize: 13, color: C.accent, fontWeight: 700, fontFamily: MONO }}>📍 {gps.lat}, {gps.lng}</div>
        )}
        {locMode === 'manual' && (
          <input value={manualAddr} onChange={e => { setManualAddr(e.target.value); setErrors(er => ({ ...er, location: undefined })) }}
            style={inputStyle()} placeholder="Street address or property name" />
        )}
      </div>

      {/* Target Pest */}
      <div style={{ marginBottom: 14 }}>
        <div style={labelStyle}>Target Pest</div>
        <input value={targetPest} onChange={e => setTargetPest(e.target.value)}
          style={inputStyle()} placeholder="e.g. Broadleaf weeds, aphids…" />
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 14 }}>
        <div style={labelStyle}>Notes</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          style={{ ...inputStyle(), minHeight: 80, resize: 'vertical' }} placeholder="Any additional observations…" />
      </div>

      {/* Photos */}
      <div style={{ marginBottom: 20 }}>
        <div style={labelStyle}>Photos</div>
        <input ref={fileInput} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotos} />
        <button onClick={() => fileInput.current?.click()} style={btnStyle(C.blueLight, C.blue, { fontSize: 14 })}>📷 Add Photos</button>
        {photoPreviews.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {photoPreviews.map((p, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={p.url} alt={p.name} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                <button onClick={() => removePhoto(i)}
                  style={{ position: 'absolute', top: -6, right: -6, background: C.red, border: 'none', borderRadius: '50%', width: 22, height: 22, color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit */}
      {errors.submit && <div style={{ fontSize: 14, color: C.red, fontWeight: 700, marginBottom: 10, textAlign: 'center' }}>{errors.submit}</div>}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          ...btnStyle(C.accent),
          opacity: submitting ? 0.6 : 1,
          animation: shakeSubmit ? 'shake 0.4s ease' : 'none',
        }}
      >
        {submitting ? 'Submitting…' : '✓ Submit Spray Log'}
      </button>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%,60%{transform:translateX(-6px)}
          40%,80%{transform:translateX(6px)}
        }
      `}</style>
    </div>
  )
}

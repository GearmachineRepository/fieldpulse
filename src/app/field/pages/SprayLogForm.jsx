// ═══════════════════════════════════════════
// Spray Log Form — Multi-step submission
//
// Step 1: Property + crew info
// Step 2: Products + equipment
// Step 3: Weather + notes + photos
// Step 4: Review + submit
// ═══════════════════════════════════════════

import { useState, useEffect, useRef } from "react"
import {
  ArrowLeft, ArrowRight, Check, MapPin, Droplets, Cloud,
  Camera, X, Loader2, Plus, Trash2, Search, Navigation,
  Thermometer, Wind as WindIcon, ChevronDown, AlertTriangle,
} from "lucide-react"
import { T } from "@/app/tokens.js"
import useAuth from "@/hooks/useAuth.jsx"
import { getAccounts } from "@/lib/api/accounts.js"
import { getChemicals } from "@/lib/api/chemicals.js"
import { getEquipment } from "@/lib/api/equipment.js"
import { createSprayLog, uploadPhotos } from "@/lib/api/sprayLogs.js"
import { getWeatherByCoords, getSimulatedWeather } from "@/lib/weather.js"

const STEPS = ["Property", "Products", "Conditions", "Review"]

export default function SprayLogForm({ onClose, onSubmitted }) {
  const { employee, crew, vehicle } = useAuth()
  const [step, setStep] = useState(0)

  // Data sources
  const [accounts, setAccounts] = useState([])
  const [chemicals, setChemicals] = useState([])
  const [equipmentList, setEquipmentList] = useState([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [property, setProperty] = useState("")
  const [accountId, setAccountId] = useState(null)
  const [location, setLocation] = useState("")
  const [gps, setGps] = useState(null)
  const [selectedEquipment, setSelectedEquipment] = useState("")
  const [equipmentName, setEquipmentName] = useState("")
  const [totalMixVol, setTotalMixVol] = useState("")
  const [mixUnit, setMixUnit] = useState("gal")
  const [targetPest, setTargetPest] = useState("")
  const [products, setProducts] = useState([])
  const [weather, setWeather] = useState(null)
  const [notes, setNotes] = useState("")
  const [photos, setPhotos] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const crewLead = employee ? `${employee.firstName} ${employee.lastName}` : ""
  const license = employee?.license || ""
  const crewName = crew?.name || ""

  // Load data
  useEffect(() => {
    Promise.all([getAccounts(), getChemicals(), getEquipment()])
      .then(([a, c, e]) => { setAccounts(a); setChemicals(c); setEquipmentList(e) })
      .catch(console.error)
      .finally(() => setLoading(false))

    // Get GPS + weather
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = { lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) }
          setGps(coords)
          setLocation(`GPS: ${coords.lat}, ${coords.lng}`)
          try {
            const w = await getWeatherByCoords(pos.coords.latitude, pos.coords.longitude)
            setWeather(w)
          } catch { setWeather(getSimulatedWeather()) }
        },
        () => setWeather(getSimulatedWeather()),
        { timeout: 8000 }
      )
    } else { setWeather(getSimulatedWeather()) }
  }, [])

  // Navigation
  const canAdvance = () => {
    if (step === 0) return property.trim() && crewLead
    if (step === 1) return products.length > 0
    return true
  }
  const next = () => { if (canAdvance() && step < 3) setStep(step + 1) }
  const prev = () => { if (step > 0) setStep(step - 1) }

  // Submit
  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const logData = {
        vehicleId: vehicle?.id || null,
        crewName,
        crewLead,
        license,
        property: property.trim(),
        location: location || null,
        equipmentId: selectedEquipment ? parseInt(selectedEquipment) : null,
        equipmentName,
        totalMixVol: totalMixVol ? `${totalMixVol} ${mixUnit}` : null,
        targetPest: targetPest || null,
        notes: notes || null,
        weather: weather || { temp: 0, humidity: 0, windSpeed: 0, windDir: "", conditions: "" },
        products: products.map(p => ({
          chemicalId: p.id || null,
          name: p.name,
          epa: p.epa || "N/A",
          amount: `${p.amount} ${p.unit}`,
        })),
      }

      const result = await createSprayLog(logData)

      if (photos.length > 0 && result?.id) {
        try { await uploadPhotos(result.id, photos) }
        catch (e) { console.error('Photo upload failed:', e.message) }
      }

      onSubmitted?.()
    } catch (err) {
      setError(err.message || "Failed to submit")
    }
    setSubmitting(false)
  }

  if (loading) return (
    <FullScreenPage onClose={onClose} title="New Spray Log">
      <div style={{ textAlign: "center", padding: 60 }}>
        <Loader2 size={28} color={T.accent} style={{ animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 14, color: T.textLight, marginTop: 12 }}>Loading...</div>
      </div>
    </FullScreenPage>
  )

  return (
    <FullScreenPage onClose={onClose} title="New Spray Log">
      {/* Progress */}
      <div style={{ display: "flex", gap: 4, padding: "0 20px 16px" }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              height: 4, borderRadius: 2, width: "100%",
              background: i <= step ? T.accent : T.border,
              transition: "background 0.3s",
            }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: i <= step ? T.accent : T.textLight }}>{s}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: "0 20px 100px", flex: 1, overflowY: "auto" }}>
        {step === 0 && (
          <StepProperty
            property={property} setProperty={setProperty}
            accountId={accountId} setAccountId={setAccountId}
            accounts={accounts} crewLead={crewLead} license={license} crewName={crewName}
            location={location} setLocation={setLocation} gps={gps}
          />
        )}
        {step === 1 && (
          <StepProducts
            products={products} setProducts={setProducts}
            chemicals={chemicals} equipmentList={equipmentList}
            selectedEquipment={selectedEquipment} setSelectedEquipment={setSelectedEquipment}
            equipmentName={equipmentName} setEquipmentName={setEquipmentName}
            totalMixVol={totalMixVol} setTotalMixVol={setTotalMixVol}
            mixUnit={mixUnit} setMixUnit={setMixUnit}
            targetPest={targetPest} setTargetPest={setTargetPest}
          />
        )}
        {step === 2 && (
          <StepConditions
            weather={weather} setWeather={setWeather}
            notes={notes} setNotes={setNotes}
            photos={photos} setPhotos={setPhotos}
            photoPreviews={photoPreviews} setPhotoPreviews={setPhotoPreviews}
          />
        )}
        {step === 3 && (
          <StepReview
            property={property} crewLead={crewLead} crewName={crewName} license={license}
            equipmentName={equipmentName} totalMixVol={totalMixVol} mixUnit={mixUnit}
            targetPest={targetPest} products={products} weather={weather} notes={notes}
            photos={photos} location={location} error={error}
          />
        )}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, padding: "12px 20px 28px",
        background: T.card, borderTop: `1px solid ${T.border}`,
        display: "flex", gap: 10, zIndex: 60,
      }}>
        {step > 0 && (
          <button onClick={prev} style={{
            flex: 1, padding: "14px", borderRadius: 3, cursor: "pointer",
            background: "transparent", border: `1.5px solid ${T.border}`,
            color: T.textMed, fontSize: 15, fontWeight: 600, fontFamily: T.font,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            <ArrowLeft size={18} /> Back
          </button>
        )}
        {step < 3 ? (
          <button onClick={next} disabled={!canAdvance()} style={{
            flex: 2, padding: "14px", borderRadius: 3, border: "none", cursor: "pointer",
            background: T.accent, color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: T.font,
            opacity: canAdvance() ? 1 : 0.4, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            Next <ArrowRight size={18} />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting} style={{
            flex: 2, padding: "14px", borderRadius: 3, border: "none", cursor: "pointer",
            background: T.accent, color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: T.font,
            opacity: submitting ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            {submitting ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Submitting...</> : <><Check size={18} /> Submit Log</>}
          </button>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </FullScreenPage>
  )
}

// ═══════════════════════════════════════════
// Full Screen Page wrapper
// ═══════════════════════════════════════════
function FullScreenPage({ onClose, title, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: T.bg, zIndex: 100,
      display: "flex", flexDirection: "column", fontFamily: T.font, color: T.text,
      maxWidth: 430, margin: "0 auto",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px", background: T.card, borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          border: "none", background: "none", cursor: "pointer", fontFamily: T.font,
          fontSize: 14, color: T.textLight, fontWeight: 600, padding: 0,
        }}>Cancel</button>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
        <div style={{ width: 50 }} />
      </div>
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════
// Step 1: Property
// ═══════════════════════════════════════════
function StepProperty({ property, setProperty, accountId, setAccountId, accounts, crewLead, license, crewName, location, setLocation, gps }) {
  const [showSearch, setShowSearch] = useState(false)
  const [searchQ, setSearchQ] = useState("")

  const selectAccount = (acct) => {
    setProperty(acct.name)
    setAccountId(acct.id)
    if (acct.address) {
      const addr = [acct.address, acct.city, acct.state].filter(Boolean).join(", ")
      setLocation(gps ? `GPS: ${gps.lat}, ${gps.lng}` : addr)
    }
    setShowSearch(false)
  }

  const filtered = accounts.filter(a => {
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return a.name.toLowerCase().includes(q) || (a.address || "").toLowerCase().includes(q)
  })

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Property & Crew</div>
      <div style={{ fontSize: 13, color: T.textLight, marginBottom: 20 }}>Where is this application?</div>

      {/* Property selector */}
      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>Property / Account *</label>
        {property ? (
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
            background: T.accentLight, borderRadius: 3, border: `1.5px solid ${T.accentBorder}`,
          }}>
            <MapPin size={18} color={T.accent} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.accent }}>{property}</div>
            </div>
            <button onClick={() => { setProperty(""); setAccountId(null) }} style={{
              border: "none", background: "none", cursor: "pointer", padding: 4,
            }}><X size={16} color={T.accent} /></button>
          </div>
        ) : (
          <button onClick={() => setShowSearch(true)} style={{
            width: "100%", padding: "14px 16px", borderRadius: 3,
            border: `1.5px dashed ${T.border}`, background: T.card, cursor: "pointer",
            fontFamily: T.font, fontSize: 14, color: T.textLight, textAlign: "left",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <Search size={18} /> Select or search a property...
          </button>
        )}
      </div>

      {/* Account search modal */}
      {showSearch && (
        <div style={{ position: "fixed", inset: 0, background: T.bg, zIndex: 110, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 20px", display: "flex", gap: 10, alignItems: "center", borderBottom: `1px solid ${T.border}`, background: T.card }}>
            <button onClick={() => setShowSearch(false)} style={{ border: "none", background: "none", cursor: "pointer", fontFamily: T.font, color: T.textLight, fontWeight: 600 }}>Cancel</button>
            <div style={{
              display: "flex", alignItems: "center", gap: 8, flex: 1, background: T.bg,
              borderRadius: 3, padding: "10px 14px", border: `1px solid ${T.border}`,
            }}>
              <Search size={16} color={T.textLight} />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} autoFocus placeholder="Search properties..."
                style={{ flex: 1, border: "none", outline: "none", fontSize: 16, fontFamily: T.font, background: "transparent", color: T.text }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {filtered.map(a => (
              <button key={a.id} onClick={() => { selectAccount(a); setSearchQ("") }} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 20px",
                border: "none", background: "none", cursor: "pointer", fontFamily: T.font, textAlign: "left",
                borderBottom: `1px solid ${T.border}`,
              }}>
                <MapPin size={16} color={T.accent} style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: T.textLight }}>{a.address}{a.city && `, ${a.city}`}</div>
                </div>
              </button>
            ))}
            {/* Manual entry option */}
            <button onClick={() => setShowSearch(false)} style={{
              display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 20px",
              border: "none", background: "none", cursor: "pointer", fontFamily: T.font, textAlign: "left",
            }}>
              <Plus size={16} color={T.blue} />
              <div style={{ fontSize: 14, fontWeight: 600, color: T.blue }}>
                Type property name manually
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Manual property input (shown if no account selected) */}
      {!property && !showSearch && (
        <div style={{ marginBottom: 16 }}>
          <input value={property} onChange={e => setProperty(e.target.value)}
            placeholder="Or type property name..."
            style={inp} />
        </div>
      )}

      {/* Crew info (read-only) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <ReadOnly label="Crew Lead" value={crewLead || "—"} />
        <ReadOnly label="License #" value={license || "—"} />
        <ReadOnly label="Crew" value={crewName || "—"} />
        <ReadOnly label="Location" value={location ? "GPS captured" : "No GPS"} color={location ? T.accent : T.textLight} />
      </div>

      {gps && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.accent, fontWeight: 600 }}>
          <Navigation size={13} /> GPS: {gps.lat}, {gps.lng}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Step 2: Products + Equipment
// ═══════════════════════════════════════════
function StepProducts({ products, setProducts, chemicals, equipmentList, selectedEquipment, setSelectedEquipment, equipmentName, setEquipmentName, totalMixVol, setTotalMixVol, mixUnit, setMixUnit, targetPest, setTargetPest }) {
  const [showChemSearch, setShowChemSearch] = useState(false)
  const [chemSearchQ, setChemSearchQ] = useState("")

  const addProduct = (chem) => {
    if (products.some(p => p.name === chem.name)) return
    setProducts([...products, { id: chem.id, name: chem.name, epa: chem.epa || "N/A", amount: "", unit: "oz" }])
    setShowChemSearch(false)
    setChemSearchQ("")
  }

  const updateProduct = (idx, field, value) => {
    setProducts(products.map((p, i) => i === idx ? { ...p, [field]: value } : p))
  }

  const removeProduct = (idx) => setProducts(products.filter((_, i) => i !== idx))

  const filteredChems = chemicals.filter(c => {
    if (!chemSearchQ) return true
    const q = chemSearchQ.toLowerCase()
    return c.name.toLowerCase().includes(q) || (c.epa || "").toLowerCase().includes(q)
  })

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Products & Equipment</div>
      <div style={{ fontSize: 13, color: T.textLight, marginBottom: 20 }}>What was applied?</div>

      {/* Products */}
      <label style={lbl}>Products Applied *</label>
      {products.map((p, i) => (
        <div key={p.id || p.name} style={{
          padding: "12px 14px", background: T.card, borderRadius: 3,
          border: `1px solid ${T.border}`, marginBottom: 8,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: T.textLight }}>EPA: {p.epa}</div>
            </div>
            <button onClick={() => removeProduct(i)} style={{ border: "none", background: "none", cursor: "pointer", padding: 4 }}>
              <Trash2 size={14} color={T.red} />
            </button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="number" value={p.amount} onChange={e => updateProduct(i, "amount", e.target.value)}
              placeholder="Amount" style={{ ...inp, flex: 1, marginBottom: 0 }} />
            <select value={p.unit} onChange={e => updateProduct(i, "unit", e.target.value)}
              style={{ ...inp, width: 80, marginBottom: 0 }}>
              <option value="oz">oz</option>
              <option value="fl oz">fl oz</option>
              <option value="ml">ml</option>
              <option value="L">L</option>
              <option value="gal">gal</option>
              <option value="lb">lb</option>
              <option value="g">g</option>
            </select>
          </div>
        </div>
      ))}

      <button onClick={() => setShowChemSearch(true)} style={{
        width: "100%", padding: "12px", borderRadius: 3, border: `1.5px dashed ${T.border}`,
        background: T.card, cursor: "pointer", fontFamily: T.font, fontSize: 14, fontWeight: 600,
        color: T.accent, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 20,
      }}>
        <Plus size={16} /> Add Product
      </button>

      {/* Chemical search sheet */}
      {showChemSearch && (
        <div style={{ position: "fixed", inset: 0, background: T.bg, zIndex: 110, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 20px", display: "flex", gap: 10, alignItems: "center", borderBottom: `1px solid ${T.border}`, background: T.card }}>
            <button onClick={() => { setShowChemSearch(false); setChemSearchQ("") }} style={{ border: "none", background: "none", cursor: "pointer", fontFamily: T.font, color: T.textLight, fontWeight: 600 }}>Cancel</button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, background: T.bg, borderRadius: 3, padding: "10px 14px", border: `1px solid ${T.border}` }}>
              <Search size={16} color={T.textLight} />
              <input value={chemSearchQ} onChange={e => setChemSearchQ(e.target.value)} autoFocus placeholder="Search chemicals..."
                style={{ flex: 1, border: "none", outline: "none", fontSize: 16, fontFamily: T.font, background: "transparent", color: T.text }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredChems.map(c => (
              <button key={c.id} onClick={() => addProduct(c)} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "14px 20px",
                border: "none", background: "none", cursor: "pointer", fontFamily: T.font, textAlign: "left",
                borderBottom: `1px solid ${T.border}`,
                opacity: products.some(p => p.name === c.name) ? 0.4 : 1,
              }}>
                <Droplets size={16} color={T.purple} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: T.textLight }}>EPA: {c.epa || "N/A"}{c.restricted ? " · RESTRICTED" : ""}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Equipment */}
      <label style={lbl}>Equipment</label>
      <select value={selectedEquipment} onChange={e => {
        setSelectedEquipment(e.target.value)
        setEquipmentName(equipmentList.find(eq => String(eq.id) === e.target.value)?.name || "")
      }} style={{ ...inp, marginBottom: 16 }}>
        <option value="">Select equipment...</option>
        {equipmentList.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
      </select>

      {/* Mix volume + target */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8, marginBottom: 16 }}>
        <div>
          <label style={lbl}>Total Mix Volume</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input type="number" value={totalMixVol} onChange={e => setTotalMixVol(e.target.value)}
              placeholder="Amount" style={{ ...inp, flex: 1, marginBottom: 0 }} />
            <select value={mixUnit} onChange={e => setMixUnit(e.target.value)} style={{ ...inp, width: 70, marginBottom: 0 }}>
              <option value="gal">gal</option>
              <option value="L">L</option>
            </select>
          </div>
        </div>
        <div>
          <label style={lbl}>Target Pest</label>
          <input value={targetPest} onChange={e => setTargetPest(e.target.value)}
            placeholder="Optional" style={{ ...inp, marginBottom: 0 }} />
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Step 3: Conditions + Photos
// ═══════════════════════════════════════════
function StepConditions({ weather, setWeather, notes, setNotes, photos, setPhotos, photoPreviews, setPhotoPreviews }) {
  const fileRef = useRef(null)
  const windHigh = weather && weather.windSpeed > 10

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

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Conditions & Photos</div>
      <div style={{ fontSize: 13, color: T.textLight, marginBottom: 20 }}>Weather at time of application</div>

      {/* Weather card */}
      {weather && (
        <div style={{
          padding: "16px", background: T.card, borderRadius: 3,
          border: `1.5px solid ${windHigh ? T.red : T.border}`, marginBottom: 16,
        }}>
          {windHigh && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontSize: 13, fontWeight: 600, color: T.red }}>
              <AlertTriangle size={14} /> High wind — application may drift
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <WeatherField icon={Thermometer} label="Temp" value={`${weather.temp || "--"}°F`} />
            <WeatherField icon={Droplets} label="Humidity" value={`${weather.humidity || "--"}%`} />
            <WeatherField icon={WindIcon} label="Wind" value={`${weather.windSpeed || "--"} mph ${weather.windDir || ""}`} warn={windHigh} />
            <WeatherField icon={Cloud} label="Sky" value={weather.conditions || "--"} />
          </div>
        </div>
      )}

      {/* Notes */}
      <label style={lbl}>Notes</label>
      <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
        placeholder="Application notes, observations..."
        style={{ ...inp, resize: "vertical", minHeight: 60, marginBottom: 16 }} />

      {/* Photos */}
      <label style={lbl}>Photos</label>
      <input ref={fileRef} type="file" accept="image/*" multiple capture="environment"
        onChange={handlePhotos} style={{ display: "none" }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 8 }}>
        {photoPreviews.map((p, i) => (
          <div key={p.name} style={{ position: "relative", borderRadius: 3, overflow: "hidden", aspectRatio: "1", background: T.bg }}>
            <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button onClick={() => removePhoto(i)} style={{
              position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%",
              background: "rgba(0,0,0,0.6)", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><X size={12} color="#fff" /></button>
          </div>
        ))}
        <button onClick={() => fileRef.current?.click()} style={{
          aspectRatio: "1", borderRadius: 3, border: `2px dashed ${T.border}`,
          background: T.card, cursor: "pointer", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 4,
        }}>
          <Camera size={22} color={T.textLight} />
          <span style={{ fontSize: 11, color: T.textLight, fontWeight: 600 }}>Add</span>
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Step 4: Review
// ═══════════════════════════════════════════
function StepReview({ property, crewLead, crewName, license, equipmentName, totalMixVol, mixUnit, targetPest, products, weather, notes, photos, location, error }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Review & Submit</div>
      <div style={{ fontSize: 13, color: T.textLight, marginBottom: 20 }}>Confirm everything looks correct</div>

      {error && (
        <div style={{
          padding: "12px 16px", background: T.redLight, borderRadius: 3,
          border: `1px solid #FECACA`, marginBottom: 16, fontSize: 14, fontWeight: 600, color: T.red,
        }}>{error}</div>
      )}

      <ReviewSection title="Property">
        <ReviewRow label="Name" value={property} />
        <ReviewRow label="Crew" value={crewName} />
        <ReviewRow label="Lead" value={crewLead} />
        <ReviewRow label="License" value={license || "—"} />
        {location && <ReviewRow label="Location" value={location} />}
      </ReviewSection>

      <ReviewSection title={`Products (${products.length})`}>
        {products.map((p, i) => (
          <div key={p.id || p.name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < products.length - 1 ? `1px solid ${T.border}` : "none" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: T.textLight }}>EPA: {p.epa}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.accent }}>{p.amount} {p.unit}</div>
          </div>
        ))}
      </ReviewSection>

      <ReviewSection title="Application">
        {equipmentName && <ReviewRow label="Equipment" value={equipmentName} />}
        {totalMixVol && <ReviewRow label="Total Mix" value={`${totalMixVol} ${mixUnit}`} />}
        {targetPest && <ReviewRow label="Target" value={targetPest} />}
      </ReviewSection>

      {weather && (
        <ReviewSection title="Weather">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
            {weather.temp && <span>{weather.temp}°F</span>}
            {weather.humidity && <span>{weather.humidity}% humidity</span>}
            {weather.windSpeed && <span>{weather.windSpeed} mph {weather.windDir}</span>}
            {weather.conditions && <span>{weather.conditions}</span>}
          </div>
        </ReviewSection>
      )}

      {notes && <ReviewSection title="Notes"><div style={{ fontSize: 14, color: T.textMed, lineHeight: 1.5 }}>{notes}</div></ReviewSection>}

      {photos.length > 0 && (
        <ReviewSection title={`Photos (${photos.length})`}>
          <div style={{ display: "flex", gap: 6 }}>
            {photos.map((_, i) => <div key={i} style={{ width: 40, height: 40, borderRadius: 3, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Camera size={16} color={T.textLight} /></div>)}
          </div>
        </ReviewSection>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Shared helpers
// ═══════════════════════════════════════════
const lbl = { display: "block", fontSize: 12, fontWeight: 600, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }
const inp = { width: "100%", padding: "12px 14px", borderRadius: 3, background: T.card, border: `1.5px solid ${T.border}`, color: T.text, fontSize: 16, fontFamily: T.font, outline: "none", boxSizing: "border-box", marginBottom: 12 }

function ReadOnly({ label, value, color }) {
  return (
    <div style={{ padding: "10px 14px", background: T.card, borderRadius: 3, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: color || T.text }}>{value}</div>
    </div>
  )
}

function WeatherField({ icon: Icon, label, value, warn }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Icon size={16} color={warn ? T.red : T.textLight} />
      <div>
        <div style={{ fontSize: 10, color: T.textLight, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: warn ? T.red : T.text }}>{value}</div>
      </div>
    </div>
  )
}

function ReviewSection({ title, children }) {
  return (
    <div style={{ marginBottom: 16, padding: "14px 16px", background: T.card, borderRadius: 3, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

function ReviewRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
      <span style={{ color: T.textLight }}>{label}</span>
      <span style={{ fontWeight: 600, color: T.text }}>{value}</span>
    </div>
  )
}
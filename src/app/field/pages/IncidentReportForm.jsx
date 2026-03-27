// ═══════════════════════════════════════════
// Incident Report Form — Multi-step submission
//
// Step 1: Type & Basic Info
// Step 2: Description & Parties
// Step 3: Photos & Evidence
// Step 4: Review & Submit
//
// Follows the SprayLogForm wizard pattern.
// ═══════════════════════════════════════════

import { useState, useEffect, useRef } from "react"
import {
  ArrowLeft, ArrowRight, Check, MapPin, Camera, X,
  Loader2, AlertTriangle, Car, HardHat, Eye, Wrench,
  Building, Navigation, Shield, Users, FileText,
} from "lucide-react"
import { T } from "@/app/tokens.js"
import useAuth from "@/hooks/useAuth.jsx"
import { createIncident, uploadIncidentPhoto } from "@/lib/api/incidents.js"
import { getWeatherByCoords, getSimulatedWeather } from "@/lib/weather.js"

const STEPS = ["Type", "Details", "Photos", "Review"]

const INCIDENT_TYPES = [
  { key: "vehicle_accident", label: "Vehicle Accident", icon: Car, color: T.red, desc: "Collision or vehicle damage" },
  { key: "workplace_injury", label: "Workplace Injury", icon: HardHat, color: "#DC2626", desc: "On-the-job injury" },
  { key: "near_miss", label: "Near Miss", icon: Eye, color: T.amber, desc: "Close call, no injury" },
  { key: "equipment_incident", label: "Equipment Incident", icon: Wrench, color: T.purple, desc: "Equipment damage or failure" },
  { key: "property_damage", label: "Property Damage", icon: Building, color: T.blue, desc: "Damage to property" },
]

export default function IncidentReportForm({ onClose, onSubmitted }) {
  const { employee, crew, vehicle } = useAuth()
  const [step, setStep] = useState(0)

  // Form state
  const [incidentType, setIncidentType] = useState("")
  const [title, setTitle] = useState("")
  const [incidentDate, setIncidentDate] = useState(() => {
    const now = new Date()
    return now.toISOString().slice(0, 16) // datetime-local format
  })
  const [location, setLocation] = useState("")
  const [gps, setGps] = useState(null)
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState("low")
  const [injuryOccurred, setInjuryOccurred] = useState(false)
  const [injuryDescription, setInjuryDescription] = useState("")
  const [witnesses, setWitnesses] = useState("")
  const [investigationNotes, setInvestigationNotes] = useState("")
  const [correctiveActions, setCorrectiveActions] = useState("")
  const [photos, setPhotos] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])
  const [photoCaptions, setPhotoCaptions] = useState([])
  const [weather, setWeather] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const reportedBy = employee ? `${employee.firstName} ${employee.lastName}` : ""
  const crewName = crew?.name || ""

  // Get GPS + weather
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = { lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) }
          setGps(coords)
          if (!location) setLocation(`GPS: ${coords.lat}, ${coords.lng}`)
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
    if (step === 0) return incidentType && title.trim()
    if (step === 1) return description.trim()
    return true
  }
  const next = () => { if (canAdvance() && step < 3) setStep(step + 1) }
  const prev = () => { if (step > 0) setStep(step - 1) }

  // Submit
  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        incidentDate,
        location: location || null,
        severity,
        type: incidentType,
        reportedBy,
        status: "open",
        investigationNotes: investigationNotes || null,
        correctiveActions: correctiveActions || null,
        witnesses: witnesses || null,
        injuryOccurred,
        injuryDescription: injuryOccurred ? injuryDescription : null,
      }

      const result = await createIncident(data)

      // Upload photos
      if (photos.length > 0 && result?.id) {
        for (let i = 0; i < photos.length; i++) {
          try {
            await uploadIncidentPhoto(result.id, photos[i], photoCaptions[i] || null)
          } catch (e) { console.error("Photo upload failed:", e.message) }
        }
      }

      onSubmitted?.()
    } catch (err) {
      setError(err.message || "Failed to submit incident report")
    }
    setSubmitting(false)
  }

  const typeInfo = INCIDENT_TYPES.find(t => t.key === incidentType)

  return (
    <FullScreenPage onClose={onClose} title="Report Incident">
      {/* Progress */}
      <div style={{ display: "flex", gap: 4, padding: "0 20px 16px" }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              height: 4, borderRadius: 2, width: "100%",
              background: i <= step ? T.accent : T.border, transition: "background 0.3s",
            }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: i <= step ? T.accent : T.textLight }}>{s}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: "0 20px 100px", flex: 1, overflowY: "auto" }}>
        {step === 0 && (
          <StepType
            incidentType={incidentType} setIncidentType={setIncidentType}
            title={title} setTitle={setTitle}
            incidentDate={incidentDate} setIncidentDate={setIncidentDate}
            location={location} setLocation={setLocation}
            gps={gps} reportedBy={reportedBy} crewName={crewName}
            severity={severity} setSeverity={setSeverity}
            injuryOccurred={injuryOccurred} setInjuryOccurred={setInjuryOccurred}
            injuryDescription={injuryDescription} setInjuryDescription={setInjuryDescription}
          />
        )}
        {step === 1 && (
          <StepDetails
            incidentType={incidentType}
            description={description} setDescription={setDescription}
            witnesses={witnesses} setWitnesses={setWitnesses}
            investigationNotes={investigationNotes} setInvestigationNotes={setInvestigationNotes}
            correctiveActions={correctiveActions} setCorrectiveActions={setCorrectiveActions}
          />
        )}
        {step === 2 && (
          <StepPhotos
            photos={photos} setPhotos={setPhotos}
            photoPreviews={photoPreviews} setPhotoPreviews={setPhotoPreviews}
            photoCaptions={photoCaptions} setPhotoCaptions={setPhotoCaptions}
            incidentType={incidentType}
          />
        )}
        {step === 3 && (
          <StepReview
            incidentType={incidentType} typeInfo={typeInfo}
            title={title} incidentDate={incidentDate}
            location={location} reportedBy={reportedBy} crewName={crewName}
            severity={severity} description={description}
            injuryOccurred={injuryOccurred} injuryDescription={injuryDescription}
            witnesses={witnesses} investigationNotes={investigationNotes}
            correctiveActions={correctiveActions} photos={photos}
            weather={weather} error={error}
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
            background: T.red, color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: T.font,
            opacity: submitting ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            {submitting ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Submitting...</> : <><Shield size={18} /> Submit Report</>}
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
          border: `1.5px solid ${T.red}`, background: `${T.red}10`, cursor: "pointer", fontFamily: T.font,
          fontSize: 13, color: T.red, fontWeight: 600, padding: "6px 14px", borderRadius: 3,
        }}>Cancel</button>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{title}</div>
        <div style={{ width: 50 }} />
      </div>
      {children}
    </div>
  )
}

// ═══════════════════════════════════════════
// Step 1: Type & Basic Info
// ═══════════════════════════════════════════
function StepType({ incidentType, setIncidentType, title, setTitle, incidentDate, setIncidentDate, location, setLocation, gps, reportedBy, crewName, severity, setSeverity, injuryOccurred, setInjuryOccurred, injuryDescription, setInjuryDescription }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Incident Type</div>
      <div style={{ fontSize: 13, color: T.textLight, marginBottom: 20 }}>What happened?</div>

      {/* Type cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {INCIDENT_TYPES.map(t => (
          <button key={t.key} onClick={() => setIncidentType(t.key)} style={{
            padding: 14, borderRadius: 3, cursor: "pointer", textAlign: "left", fontFamily: T.font,
            border: incidentType === t.key ? `2px solid ${t.color}` : `1.5px solid ${T.border}`,
            background: incidentType === t.key ? `${t.color}10` : T.card,
          }}>
            <t.icon size={22} color={t.color} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{t.label}</div>
            <div style={{ fontSize: 11, color: T.textLight, marginTop: 2 }}>{t.desc}</div>
          </button>
        ))}
      </div>

      {/* Title */}
      <label style={lbl}>Title / Brief Summary *</label>
      <input value={title} onChange={e => setTitle(e.target.value)}
        placeholder="e.g. Truck rear-ended at stop sign"
        style={inp} />

      {/* Date/time */}
      <label style={lbl}>Date & Time</label>
      <input type="datetime-local" value={incidentDate}
        onChange={e => setIncidentDate(e.target.value)}
        style={{ ...inp, marginBottom: 16 }} />

      {/* Location */}
      <label style={lbl}>Location</label>
      <input value={location} onChange={e => setLocation(e.target.value)}
        placeholder="Address or description"
        style={inp} />
      {gps && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.accent, fontWeight: 600, marginBottom: 16, marginTop: -4 }}>
          <Navigation size={13} /> GPS: {gps.lat}, {gps.lng}
        </div>
      )}

      {/* Severity */}
      <label style={lbl}>Severity</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["low", "medium", "high", "critical"].map(s => (
          <button key={s} onClick={() => setSeverity(s)} style={{
            flex: 1, padding: "10px 0", borderRadius: 3, fontFamily: T.font,
            fontSize: 12, fontWeight: 600, textTransform: "uppercase", cursor: "pointer",
            border: severity === s ? "none" : `1.5px solid ${T.border}`,
            background: severity === s ? (s === "critical" || s === "high" ? T.red : s === "medium" ? T.amber : T.accent) : T.card,
            color: severity === s ? "#fff" : T.textLight,
          }}>{s}</button>
        ))}
      </div>

      {/* Crew info (read-only) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <ReadOnly label="Reported By" value={reportedBy || "—"} />
        <ReadOnly label="Crew" value={crewName || "—"} />
      </div>

      {/* Injury toggle */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px", background: T.card, borderRadius: 3, border: `1px solid ${T.border}`,
        marginBottom: injuryOccurred ? 10 : 0,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Injury Involved?</div>
          <div style={{ fontSize: 12, color: T.textLight }}>Did anyone get hurt?</div>
        </div>
        <button onClick={() => setInjuryOccurred(!injuryOccurred)} style={{
          width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
          background: injuryOccurred ? T.red : T.border, position: "relative", transition: "background 0.15s",
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: "50%", background: "#fff",
            position: "absolute", top: 2, left: injuryOccurred ? 22 : 2, transition: "left 0.15s",
          }} />
        </button>
      </div>

      {injuryOccurred && (
        <div>
          <label style={lbl}>Injury Description</label>
          <textarea value={injuryDescription} onChange={e => setInjuryDescription(e.target.value)}
            placeholder="Describe the injury, who was affected, treatment given..."
            rows={3} style={{ ...inp, resize: "vertical", minHeight: 60 }} />
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Step 2: Details & Parties
// ═══════════════════════════════════════════
function StepDetails({ incidentType, description, setDescription, witnesses, setWitnesses, investigationNotes, setInvestigationNotes, correctiveActions, setCorrectiveActions }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Details & Parties</div>
      <div style={{ fontSize: 13, color: T.textLight, marginBottom: 20 }}>Describe what happened in detail</div>

      <label style={lbl}>Full Description *</label>
      <textarea value={description} onChange={e => setDescription(e.target.value)}
        placeholder="Describe exactly what happened, step by step..."
        rows={5} style={{ ...inp, resize: "vertical", minHeight: 100 }} />

      <label style={lbl}>Witnesses</label>
      <textarea value={witnesses} onChange={e => setWitnesses(e.target.value)}
        placeholder="Names and contact info of any witnesses"
        rows={2} style={{ ...inp, resize: "vertical", minHeight: 50 }} />

      {incidentType === "vehicle_accident" && (
        <>
          <div style={{
            padding: "12px 16px", background: `${T.amber}15`, borderRadius: 3,
            border: `1px solid ${T.amber}`, marginBottom: 16,
            display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.amber, fontWeight: 600,
          }}>
            <AlertTriangle size={16} /> Document all other driver info below
          </div>
        </>
      )}

      <label style={lbl}>Investigation Notes</label>
      <textarea value={investigationNotes} onChange={e => setInvestigationNotes(e.target.value)}
        placeholder="Other driver details, insurance info, police report #, equipment serial numbers..."
        rows={3} style={{ ...inp, resize: "vertical", minHeight: 60 }} />

      <label style={lbl}>Corrective / Follow-up Actions</label>
      <textarea value={correctiveActions} onChange={e => setCorrectiveActions(e.target.value)}
        placeholder="What was done or needs to be done to resolve this?"
        rows={2} style={{ ...inp, resize: "vertical", minHeight: 50 }} />
    </div>
  )
}

// ═══════════════════════════════════════════
// Step 3: Photos & Evidence
// ═══════════════════════════════════════════
function StepPhotos({ photos, setPhotos, photoPreviews, setPhotoPreviews, photoCaptions, setPhotoCaptions, incidentType }) {
  const fileRef = useRef(null)

  const PHOTO_PROMPTS = (() => {
    const prompts = ["Scene overview"]
    if (incidentType === "vehicle_accident") {
      prompts.unshift("Damage to company vehicle", "Damage to other vehicle")
      prompts.push("License plates", "Other driver info / insurance card")
    }
    if (incidentType === "workplace_injury") {
      prompts.push("Injury area", "Equipment / area involved")
    }
    if (incidentType === "equipment_incident") {
      prompts.push("Damaged equipment", "Serial number / label")
    }
    if (incidentType === "property_damage") {
      prompts.push("Property damage", "Surroundings / context")
    }
    prompts.push("Additional evidence")
    return prompts
  })()

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files)
    setPhotos(prev => [...prev, ...files])
    setPhotoCaptions(prev => [...prev, ...files.map(() => "")])
    files.forEach(f => {
      const r = new FileReader()
      r.onload = ev => setPhotoPreviews(prev => [...prev, { name: f.name, url: ev.target.result }])
      r.readAsDataURL(f)
    })
  }

  const removePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== idx))
    setPhotoCaptions(prev => prev.filter((_, i) => i !== idx))
  }

  const updateCaption = (idx, value) => {
    setPhotoCaptions(prev => prev.map((c, i) => i === idx ? value : c))
  }

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Photos & Evidence</div>
      <div style={{ fontSize: 13, color: T.textLight, marginBottom: 20 }}>Document the scene — the more photos, the better</div>

      {/* Suggested photo prompts */}
      <div style={{
        padding: "12px 16px", background: T.card, borderRadius: 3,
        border: `1px solid ${T.border}`, marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
          Recommended Photos
        </div>
        {PHOTO_PROMPTS.map((prompt, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
            fontSize: 13, color: i < photos.length ? T.accent : T.textMed,
            borderBottom: i < PHOTO_PROMPTS.length - 1 ? `1px solid ${T.border}` : "none",
          }}>
            {i < photos.length ? <Check size={14} color={T.accent} /> : <Camera size={14} color={T.textLight} />}
            {prompt}
          </div>
        ))}
      </div>

      {/* Photo grid */}
      <input ref={fileRef} type="file" accept="image/*" multiple capture="environment"
        onChange={handlePhotos} style={{ display: "none" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 10 }}>
        {photoPreviews.map((p, i) => (
          <div key={p.name + i} style={{
            display: "flex", gap: 10, padding: 10, background: T.card,
            borderRadius: 3, border: `1px solid ${T.border}`,
          }}>
            <div style={{ width: 70, height: 70, borderRadius: 3, overflow: "hidden", flexShrink: 0, background: T.bg }}>
              <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              <input
                value={photoCaptions[i] || ""}
                onChange={e => updateCaption(i, e.target.value)}
                placeholder={PHOTO_PROMPTS[i] || "Caption (optional)"}
                style={{ ...inp, marginBottom: 0, fontSize: 13, padding: "8px 10px" }}
              />
              <div style={{ fontSize: 11, color: T.textLight }}>{p.name}</div>
            </div>
            <button onClick={() => removePhoto(i)} style={{
              border: "none", background: "none", cursor: "pointer", padding: 4, alignSelf: "flex-start",
            }}><X size={14} color={T.red} /></button>
          </div>
        ))}
      </div>

      <button onClick={() => fileRef.current?.click()} style={{
        width: "100%", padding: "14px", borderRadius: 3, border: `2px dashed ${T.border}`,
        background: T.card, cursor: "pointer", fontFamily: T.font, fontSize: 14, fontWeight: 600,
        color: T.accent, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}>
        <Camera size={18} /> {photos.length > 0 ? "Add More Photos" : "Take / Upload Photos"}
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════
// Step 4: Review
// ═══════════════════════════════════════════
function StepReview({ incidentType, typeInfo, title, incidentDate, location, reportedBy, crewName, severity, description, injuryOccurred, injuryDescription, witnesses, investigationNotes, correctiveActions, photos, weather, error }) {
  const severityColors = { low: T.accent, medium: T.amber, high: T.red, critical: T.red }

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Review & Submit</div>
      <div style={{ fontSize: 13, color: T.textLight, marginBottom: 20 }}>Confirm all details before submitting</div>

      {error && (
        <div style={{
          padding: "12px 16px", background: `${T.red}10`, borderRadius: 3,
          border: `1px solid ${T.red}`, marginBottom: 16, fontSize: 14, fontWeight: 600, color: T.red,
        }}>{error}</div>
      )}

      {injuryOccurred && (
        <div style={{
          padding: "12px 16px", background: `${T.red}15`, borderRadius: 3,
          border: `1px solid ${T.red}`, marginBottom: 16,
          display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: T.red,
        }}>
          <AlertTriangle size={16} /> Injury reported — this incident will be flagged
        </div>
      )}

      <ReviewSection title="Incident Info">
        <ReviewRow label="Type" value={typeInfo?.label || incidentType} />
        <ReviewRow label="Title" value={title} />
        <ReviewRow label="Date" value={new Date(incidentDate).toLocaleString()} />
        {location && <ReviewRow label="Location" value={location} />}
        <ReviewRow label="Severity" value={severity.toUpperCase()} color={severityColors[severity]} />
        <ReviewRow label="Reported By" value={reportedBy} />
        <ReviewRow label="Crew" value={crewName} />
      </ReviewSection>

      <ReviewSection title="Description">
        <div style={{ fontSize: 14, color: T.textMed, lineHeight: 1.5 }}>{description}</div>
      </ReviewSection>

      {injuryOccurred && injuryDescription && (
        <ReviewSection title="Injury Details">
          <div style={{ fontSize: 14, color: T.red, lineHeight: 1.5 }}>{injuryDescription}</div>
        </ReviewSection>
      )}

      {witnesses && (
        <ReviewSection title="Witnesses">
          <div style={{ fontSize: 14, color: T.textMed, lineHeight: 1.5 }}>{witnesses}</div>
        </ReviewSection>
      )}

      {investigationNotes && (
        <ReviewSection title="Investigation Notes">
          <div style={{ fontSize: 14, color: T.textMed, lineHeight: 1.5 }}>{investigationNotes}</div>
        </ReviewSection>
      )}

      {correctiveActions && (
        <ReviewSection title="Corrective Actions">
          <div style={{ fontSize: 14, color: T.textMed, lineHeight: 1.5 }}>{correctiveActions}</div>
        </ReviewSection>
      )}

      {photos.length > 0 && (
        <ReviewSection title={`Photos (${photos.length})`}>
          <div style={{ display: "flex", gap: 6 }}>
            {photos.map((_, i) => (
              <div key={i} style={{
                width: 40, height: 40, borderRadius: 3, background: T.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><Camera size={16} color={T.textLight} /></div>
            ))}
          </div>
        </ReviewSection>
      )}

      {weather && (
        <ReviewSection title="Weather at Scene">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
            {weather.temp && <span>{weather.temp}°F</span>}
            {weather.humidity && <span>{weather.humidity}% humidity</span>}
            {weather.windSpeed && <span>{weather.windSpeed} mph {weather.windDir}</span>}
            {weather.conditions && <span>{weather.conditions}</span>}
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

function ReviewSection({ title, children }) {
  return (
    <div style={{ marginBottom: 16, padding: "14px 16px", background: T.card, borderRadius: 3, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  )
}

function ReviewRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
      <span style={{ color: T.textLight }}>{label}</span>
      <span style={{ fontWeight: 600, color: color || T.text }}>{value}</span>
    </div>
  )
}

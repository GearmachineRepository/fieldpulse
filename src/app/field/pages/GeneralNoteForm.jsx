// ═══════════════════════════════════════════
// General Note Form — Multi-step submission
//
// Step 1: Info — title, location, note
// Step 2: Photos — attach photos
// Step 3: Review — confirm + submit
//
// Covers "General Note" + "Photo Doc" (merged).
// ═══════════════════════════════════════════

import { useState, useEffect, useRef } from "react"
import {
  ArrowLeft, ArrowRight, Check, MapPin, Camera, X,
  Loader2, FileText, Navigation,
} from "lucide-react"
import { T } from "@/app/tokens.js"
import useAuth from "@/hooks/useAuth.jsx"
import { createFieldDoc, uploadFieldDocPhotos } from "@/lib/api/fieldDocs.js"

const STEPS = ["Info", "Photos", "Review"]

export default function GeneralNoteForm({ onClose, onSubmitted }) {
  const { employee, crew } = useAuth()
  const [step, setStep] = useState(0)

  // Form state
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [location, setLocation] = useState("")
  const [gps, setGps] = useState(null)
  const [photos, setPhotos] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : ""
  const crewName = crew?.name || ""

  // Get GPS
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) }
          setGps(coords)
          if (!location) setLocation(`GPS: ${coords.lat}, ${coords.lng}`)
        },
        () => {},
        { timeout: 8000 }
      )
    }
  }, [])

  // Navigation
  const canAdvance = () => {
    if (step === 0) return title.trim()
    return true
  }
  const next = () => { if (canAdvance() && step < 2) setStep(step + 1) }
  const prev = () => { if (step > 0) setStep(step - 1) }

  // Submit
  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const data = {
        type: "note",
        title: title.trim(),
        body: body.trim() || null,
        location: location || null,
        gpsLat: gps?.lat || null,
        gpsLng: gps?.lng || null,
        crewName,
        employeeId: employee?.id || null,
        employeeName,
      }

      const result = await createFieldDoc(data)

      // Upload photos
      if (photos.length > 0 && result?.id) {
        try {
          await uploadFieldDocPhotos(result.id, photos)
        } catch (e) { console.error("Photo upload failed:", e.message) }
      }

      onSubmitted?.()
    } catch (err) {
      setError(err.message || "Failed to submit note")
    }
    setSubmitting(false)
  }

  return (
    <FullScreenPage onClose={onClose} title="General Note">
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
          <StepInfo
            title={title} setTitle={setTitle}
            body={body} setBody={setBody}
            location={location} setLocation={setLocation}
            gps={gps} employeeName={employeeName} crewName={crewName}
          />
        )}
        {step === 1 && (
          <StepPhotos
            photos={photos} setPhotos={setPhotos}
            photoPreviews={photoPreviews} setPhotoPreviews={setPhotoPreviews}
          />
        )}
        {step === 2 && (
          <StepReview
            title={title} body={body} location={location}
            employeeName={employeeName} crewName={crewName}
            photos={photos} error={error}
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
        {step < 2 ? (
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
            {submitting ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Submitting...</> : <><Check size={18} /> Submit Note</>}
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
// Step 1: Info
// ═══════════════════════════════════════════
function StepInfo({ title, setTitle, body, setBody, location, setLocation, gps, employeeName, crewName }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Note Details</div>
      <div style={{ fontSize: 13, color: T.textLight, marginBottom: 20 }}>Title your note and add details</div>

      <label style={lbl}>Title *</label>
      <input value={title} onChange={e => setTitle(e.target.value)}
        placeholder="e.g. Property walkthrough, Equipment check..."
        style={inp} />

      <label style={lbl}>Notes / Observations</label>
      <textarea value={body} onChange={e => setBody(e.target.value)}
        placeholder="What did you observe? Any details to record..."
        rows={5} style={{ ...inp, resize: "vertical", minHeight: 100 }} />

      <label style={lbl}>Location</label>
      <input value={location} onChange={e => setLocation(e.target.value)}
        placeholder="Address or description"
        style={inp} />
      {gps && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.accent, fontWeight: 600, marginBottom: 16, marginTop: -4 }}>
          <Navigation size={13} /> GPS: {gps.lat}, {gps.lng}
        </div>
      )}

      {/* Crew info (read-only) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <ReadOnly label="Submitted By" value={employeeName || "—"} />
        <ReadOnly label="Crew" value={crewName || "—"} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Step 2: Photos
// ═══════════════════════════════════════════
function StepPhotos({ photos, setPhotos, photoPreviews, setPhotoPreviews }) {
  const fileRef = useRef(null)

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
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Photos</div>
      <div style={{ fontSize: 13, color: T.textLight, marginBottom: 20 }}>Attach any relevant photos (optional)</div>

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
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{p.name}</div>
              <div style={{ fontSize: 11, color: T.textLight }}>Photo {i + 1}</div>
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
// Step 3: Review
// ═══════════════════════════════════════════
function StepReview({ title, body, location, employeeName, crewName, photos, error }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Review & Submit</div>
      <div style={{ fontSize: 13, color: T.textLight, marginBottom: 20 }}>Confirm details before submitting</div>

      {error && (
        <div style={{
          padding: "12px 16px", background: `${T.red}10`, borderRadius: 3,
          border: `1px solid ${T.red}`, marginBottom: 16, fontSize: 14, fontWeight: 600, color: T.red,
        }}>{error}</div>
      )}

      <ReviewSection title="Note Info">
        <ReviewRow label="Title" value={title} />
        {location && <ReviewRow label="Location" value={location} />}
        <ReviewRow label="Submitted By" value={employeeName} />
        <ReviewRow label="Crew" value={crewName} />
      </ReviewSection>

      {body && (
        <ReviewSection title="Notes">
          <div style={{ fontSize: 14, color: T.textMed, lineHeight: 1.5 }}>{body}</div>
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
    </div>
  )
}

// ═══════════════════════════════════════════
// Shared helpers
// ═══════════════════════════════════════════
const lbl = { display: "block", fontSize: 12, fontWeight: 600, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }
const inp = { width: "100%", padding: "12px 14px", borderRadius: 3, background: T.card, border: `1.5px solid ${T.border}`, color: T.text, fontSize: 16, fontFamily: T.font, outline: "none", boxSizing: "border-box", marginBottom: 12 }

function ReadOnly({ label, value }) {
  return (
    <div style={{ padding: "10px 14px", background: T.card, borderRadius: 3, border: `1px solid ${T.border}` }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{value}</div>
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

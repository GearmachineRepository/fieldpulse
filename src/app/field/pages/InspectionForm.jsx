// ═══════════════════════════════════════════
// Inspection Form — Multi-step submission
//
// Step 1: Info — title, type, location
// Step 2: Checklist — pass/fail/na items
// Step 3: Photos — attach evidence
// Step 4: Review — confirm + submit
//
// Supports site inspections, equipment checks, etc.
// ═══════════════════════════════════════════

import { useState, useEffect, useRef } from "react"
import {
  ArrowLeft, ArrowRight, Check, MapPin, Camera, X,
  Loader2, ClipboardList, Navigation, Plus, CheckCircle,
  XCircle, MinusCircle,
} from "lucide-react"
import { T } from "@/app/tokens.js"
import useAuth from "@/hooks/useAuth.jsx"
import { createFieldDoc, uploadFieldDocPhotos } from "@/lib/api/fieldDocs.js"

const STEPS = ["Info", "Checklist", "Photos", "Review"]

const INSPECTION_TEMPLATES = [
  {
    key: "site",
    label: "Site Inspection",
    items: [
      "Property boundaries clear",
      "Turf condition acceptable",
      "Irrigation system functional",
      "Drainage working properly",
      "No hazardous conditions",
      "Signage in place",
    ],
  },
  {
    key: "equipment",
    label: "Equipment Check",
    items: [
      "Engine starts and runs",
      "Fluid levels adequate",
      "No visible leaks",
      "Blades / attachments secure",
      "Safety guards in place",
      "Tires / wheels in good condition",
      "Lights / signals working",
    ],
  },
  {
    key: "vehicle",
    label: "Vehicle Pre-Trip",
    items: [
      "Tires — adequate tread & pressure",
      "Lights — headlights, brake, signals",
      "Mirrors — clean and adjusted",
      "Fluids — oil, coolant, wiper fluid",
      "Brakes — responsive",
      "Windshield — no cracks, wipers work",
      "Horn — functional",
      "Safety equipment — fire extinguisher, first aid",
      "Trailer hitch / connections secure",
    ],
  },
  {
    key: "custom",
    label: "Custom Inspection",
    items: [],
  },
]

export default function InspectionForm({ onClose, onSubmitted }) {
  const { employee, crew } = useAuth()
  const [step, setStep] = useState(0)

  // Form state
  const [title, setTitle] = useState("")
  const [template, setTemplate] = useState("")
  const [location, setLocation] = useState("")
  const [gps, setGps] = useState(null)
  const [notes, setNotes] = useState("")
  const [checklist, setChecklist] = useState([])
  const [newItem, setNewItem] = useState("")
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

  // Apply template
  const applyTemplate = (key) => {
    setTemplate(key)
    const t = INSPECTION_TEMPLATES.find(t => t.key === key)
    if (t && t.items.length > 0) {
      setChecklist(t.items.map(item => ({ item, status: "pending", note: "" })))
      if (!title && t.label) setTitle(t.label)
    } else {
      setChecklist([])
    }
  }

  // Checklist manipulation
  const updateItem = (idx, field, value) => {
    setChecklist(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c))
  }

  const addItem = () => {
    if (!newItem.trim()) return
    setChecklist(prev => [...prev, { item: newItem.trim(), status: "pending", note: "" }])
    setNewItem("")
  }

  const removeItem = (idx) => {
    setChecklist(prev => prev.filter((_, i) => i !== idx))
  }

  // Navigation
  const canAdvance = () => {
    if (step === 0) return title.trim() && template
    if (step === 1) return checklist.length > 0 && checklist.every(c => c.status !== "pending")
    return true
  }
  const next = () => { if (canAdvance() && step < 3) setStep(step + 1) }
  const prev = () => { if (step > 0) setStep(step - 1) }

  // Submit
  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)
    try {
      const passCount = checklist.filter(c => c.status === "pass").length
      const failCount = checklist.filter(c => c.status === "fail").length
      const naCount = checklist.filter(c => c.status === "na").length
      const overallStatus = failCount > 0 ? "flagged" : "submitted"

      const data = {
        type: "inspection",
        title: title.trim(),
        body: notes.trim() || null,
        location: location || null,
        gpsLat: gps?.lat || null,
        gpsLng: gps?.lng || null,
        crewName,
        employeeId: employee?.id || null,
        employeeName,
        checklist,
        status: overallStatus,
        metadata: {
          template,
          passCount,
          failCount,
          naCount,
          total: checklist.length,
        },
      }

      const result = await createFieldDoc(data)

      if (photos.length > 0 && result?.id) {
        try {
          await uploadFieldDocPhotos(result.id, photos)
        } catch (e) { console.error("Photo upload failed:", e.message) }
      }

      onSubmitted?.()
    } catch (err) {
      setError(err.message || "Failed to submit inspection")
    }
    setSubmitting(false)
  }

  const failCount = checklist.filter(c => c.status === "fail").length

  return (
    <FullScreenPage onClose={onClose} title="Inspection">
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
            template={template} applyTemplate={applyTemplate}
            location={location} setLocation={setLocation}
            gps={gps} employeeName={employeeName} crewName={crewName}
          />
        )}
        {step === 1 && (
          <StepChecklist
            checklist={checklist} updateItem={updateItem}
            removeItem={removeItem} newItem={newItem} setNewItem={setNewItem}
            addItem={addItem} notes={notes} setNotes={setNotes}
          />
        )}
        {step === 2 && (
          <StepPhotos
            photos={photos} setPhotos={setPhotos}
            photoPreviews={photoPreviews} setPhotoPreviews={setPhotoPreviews}
          />
        )}
        {step === 3 && (
          <StepReview
            title={title} template={template} location={location}
            employeeName={employeeName} crewName={crewName}
            checklist={checklist} notes={notes} photos={photos}
            failCount={failCount} error={error}
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
            background: failCount > 0 ? T.red : T.accent, color: "#fff", fontSize: 15, fontWeight: 600, fontFamily: T.font,
            opacity: submitting ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}>
            {submitting ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Submitting...</> : <><Check size={18} /> Submit Inspection</>}
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
function StepInfo({ title, setTitle, template, applyTemplate, location, setLocation, gps, employeeName, crewName }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Inspection Type</div>
      <div style={{ fontSize: 13, color: T.textLight, marginBottom: 20 }}>Choose a template to start</div>

      {/* Template cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        {INSPECTION_TEMPLATES.map(t => (
          <button key={t.key} onClick={() => applyTemplate(t.key)} style={{
            padding: 14, borderRadius: 3, cursor: "pointer", textAlign: "left", fontFamily: T.font,
            border: template === t.key ? `2px solid ${T.accent}` : `1.5px solid ${T.border}`,
            background: template === t.key ? `${T.accent}10` : T.card,
          }}>
            <ClipboardList size={20} color={template === t.key ? T.accent : T.textLight} style={{ marginBottom: 6 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{t.label}</div>
            <div style={{ fontSize: 11, color: T.textLight, marginTop: 2 }}>
              {t.items.length > 0 ? `${t.items.length} items` : "Build your own"}
            </div>
          </button>
        ))}
      </div>

      <label style={lbl}>Title *</label>
      <input value={title} onChange={e => setTitle(e.target.value)}
        placeholder="e.g. 123 Oak St — Site Inspection"
        style={inp} />

      <label style={lbl}>Location</label>
      <input value={location} onChange={e => setLocation(e.target.value)}
        placeholder="Address or description"
        style={inp} />
      {gps && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.accent, fontWeight: 600, marginBottom: 16, marginTop: -4 }}>
          <Navigation size={13} /> GPS: {gps.lat}, {gps.lng}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <ReadOnly label="Inspector" value={employeeName || "—"} />
        <ReadOnly label="Crew" value={crewName || "—"} />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Step 2: Checklist
// ═══════════════════════════════════════════
function StepChecklist({ checklist, updateItem, removeItem, newItem, setNewItem, addItem, notes, setNotes }) {
  const passCount = checklist.filter(c => c.status === "pass").length
  const failCount = checklist.filter(c => c.status === "fail").length
  const pendingCount = checklist.filter(c => c.status === "pending").length

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Inspection Checklist</div>
      <div style={{ fontSize: 13, color: T.textLight, marginBottom: 12 }}>Mark each item pass, fail, or N/A</div>

      {/* Progress summary */}
      <div style={{
        display: "flex", gap: 12, padding: "10px 14px", background: T.card,
        borderRadius: 3, border: `1px solid ${T.border}`, marginBottom: 16, fontSize: 12, fontWeight: 600,
      }}>
        <span style={{ color: T.accent }}>{passCount} Pass</span>
        <span style={{ color: T.red }}>{failCount} Fail</span>
        <span style={{ color: T.textLight }}>{pendingCount} Pending</span>
      </div>

      {/* Checklist items */}
      {checklist.map((c, i) => (
        <div key={i} style={{
          padding: "12px 14px", background: T.card, borderRadius: 3,
          border: `1px solid ${c.status === "fail" ? T.red : T.border}`,
          marginBottom: 8,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, flex: 1 }}>{c.item}</div>
            <button onClick={() => removeItem(i)} style={{
              border: "none", background: "none", cursor: "pointer", padding: 2,
            }}><X size={12} color={T.textLight} /></button>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { key: "pass", label: "Pass", icon: CheckCircle, color: T.accent },
              { key: "fail", label: "Fail", icon: XCircle, color: T.red },
              { key: "na", label: "N/A", icon: MinusCircle, color: T.textLight },
            ].map(opt => (
              <button key={opt.key} onClick={() => updateItem(i, "status", opt.key)} style={{
                flex: 1, padding: "8px 0", borderRadius: 3, fontFamily: T.font,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: c.status === opt.key ? "none" : `1.5px solid ${T.border}`,
                background: c.status === opt.key ? (opt.key === "pass" ? `${T.accent}15` : opt.key === "fail" ? `${T.red}15` : `${T.textLight}15`) : "transparent",
                color: c.status === opt.key ? opt.color : T.textLight,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}>
                <opt.icon size={14} /> {opt.label}
              </button>
            ))}
          </div>
          {c.status === "fail" && (
            <input
              value={c.note} onChange={e => updateItem(i, "note", e.target.value)}
              placeholder="Note about failure..."
              style={{ ...inp, fontSize: 13, padding: "8px 10px", marginTop: 8, marginBottom: 0 }}
            />
          )}
        </div>
      ))}

      {/* Add custom item */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, marginTop: 4 }}>
        <input value={newItem} onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addItem()}
          placeholder="Add custom item..."
          style={{ ...inp, flex: 1, marginBottom: 0 }} />
        <button onClick={addItem} style={{
          padding: "0 14px", borderRadius: 3, border: `1.5px solid ${T.border}`,
          background: T.card, cursor: "pointer",
        }}>
          <Plus size={18} color={T.accent} />
        </button>
      </div>

      <label style={lbl}>Additional Notes</label>
      <textarea value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="Any overall notes or observations..."
        rows={3} style={{ ...inp, resize: "vertical", minHeight: 60 }} />
    </div>
  )
}

// ═══════════════════════════════════════════
// Step 3: Photos
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
      <div style={{ fontSize: 13, color: T.textLight, marginBottom: 20 }}>Document any issues or conditions (optional)</div>

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
// Step 4: Review
// ═══════════════════════════════════════════
function StepReview({ title, template, location, employeeName, crewName, checklist, notes, photos, failCount, error }) {
  const passCount = checklist.filter(c => c.status === "pass").length
  const naCount = checklist.filter(c => c.status === "na").length
  const templateLabel = INSPECTION_TEMPLATES.find(t => t.key === template)?.label || template

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

      {failCount > 0 && (
        <div style={{
          padding: "12px 16px", background: `${T.red}15`, borderRadius: 3,
          border: `1px solid ${T.red}`, marginBottom: 16,
          display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: T.red,
        }}>
          <XCircle size={16} /> {failCount} item{failCount !== 1 ? "s" : ""} failed — this inspection will be flagged
        </div>
      )}

      <ReviewSection title="Inspection Info">
        <ReviewRow label="Title" value={title} />
        <ReviewRow label="Template" value={templateLabel} />
        {location && <ReviewRow label="Location" value={location} />}
        <ReviewRow label="Inspector" value={employeeName} />
        <ReviewRow label="Crew" value={crewName} />
      </ReviewSection>

      <ReviewSection title={`Checklist Results (${checklist.length} items)`}>
        <div style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: 12, fontWeight: 600 }}>
          <span style={{ color: T.accent }}>{passCount} Pass</span>
          <span style={{ color: T.red }}>{failCount} Fail</span>
          <span style={{ color: T.textLight }}>{naCount} N/A</span>
        </div>
        {checklist.map((c, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "6px 0", borderBottom: i < checklist.length - 1 ? `1px solid ${T.border}` : "none",
          }}>
            <span style={{ fontSize: 13, color: T.textMed }}>{c.item}</span>
            <span style={{
              fontSize: 11, fontWeight: 600, textTransform: "uppercase",
              color: c.status === "pass" ? T.accent : c.status === "fail" ? T.red : T.textLight,
            }}>{c.status}</span>
          </div>
        ))}
        {checklist.filter(c => c.status === "fail" && c.note).map((c, i) => (
          <div key={`note-${i}`} style={{
            fontSize: 12, color: T.red, marginTop: 6, padding: "6px 10px",
            background: `${T.red}08`, borderRadius: 3,
          }}>
            {c.item}: {c.note}
          </div>
        ))}
      </ReviewSection>

      {notes && (
        <ReviewSection title="Notes">
          <div style={{ fontSize: 14, color: T.textMed, lineHeight: 1.5 }}>{notes}</div>
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

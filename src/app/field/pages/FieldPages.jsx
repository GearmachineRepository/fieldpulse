// ═══════════════════════════════════════════
// Field Pages — Docs, Schedule, Profile
// ═══════════════════════════════════════════

import {
  Search, Droplets, FileText, Camera, Ruler, Wrench,
  MapPin, Clock, Shield, BookOpen, Phone, Settings, ChevronRight,
} from "lucide-react"
import { T } from "@/app/tokens.js"

// ── Docs ──
export function FieldDocs() {
  return (
    <div>
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 16, color: T.text }}>Field Docs</div>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, background: T.card,
          borderRadius: 3, padding: "12px 14px", border: `1px solid ${T.border}`, marginBottom: 16,
        }}>
          <Search size={18} color={T.textLight} />
          <input placeholder="Search documents..." style={{ border: "none", outline: "none", flex: 1, fontSize: 14, fontFamily: T.font, background: "transparent", color: T.text }} />
        </div>
      </div>
      <div style={{ padding: "0 20px" }}>
        {[
          { type: "Spray Log", location: "Oak Ridge Estates", time: "Today, 2:30 PM", icon: Droplets, color: T.purple, photos: 2 },
          { type: "Field Note", location: "Maple Drive HOA", time: "Today, 11 AM", icon: FileText, color: T.blue, photos: 0 },
          { type: "Photo Doc", location: "Cedar Lane Park", time: "Yesterday", icon: Camera, color: T.amber, photos: 5 },
          { type: "Site Survey", location: "Pine Valley", time: "Mar 6", icon: Ruler, color: "#6366F1", photos: 3 },
          { type: "Maintenance", location: "Elm St Office", time: "Mar 5", icon: Wrench, color: T.textMed, photos: 1 },
        ].map((d, i) => (
          <div key={i} style={{ display: "flex", gap: 14, padding: 16, background: T.card, borderRadius: 3, border: `1px solid ${T.border}`, marginBottom: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 3, background: `${d.color}10`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <d.icon size={20} color={d.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{d.type}</div>
                <div style={{ fontSize: 12, color: T.textLight, flexShrink: 0 }}>{d.time}</div>
              </div>
              <div style={{ fontSize: 13, color: T.textMed, marginTop: 2 }}>{d.location}</div>
              {d.photos > 0 && <div style={{ fontSize: 12, color: T.textLight, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><Camera size={12} /> {d.photos} photos</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Schedule ──
export function FieldSchedule() {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 4, color: T.text }}>My Schedule</div>
      <div style={{ fontSize: 13, color: T.textLight, marginBottom: 20 }}>This week's route stops</div>
      {["Monday", "Tuesday", "Wednesday"].map((day, di) => (
        <div key={di} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>{day}</div>
          {[1, 2].map(j => (
            <div key={j} style={{ padding: "14px 16px", background: T.card, borderRadius: 3, border: `1px solid ${T.border}`, marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <MapPin size={18} color={T.accent} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Property {di * 2 + j}</div>
                <div style={{ fontSize: 12, color: T.textLight }}>123 Example St</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Profile ──
export function FieldProfile() {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28, padding: 20, background: T.card, borderRadius: 3, border: `1px solid ${T.border}` }}>
        <div style={{ width: 56, height: 56, borderRadius: 3, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 600, color: "#fff", flexShrink: 0 }}>JS</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: T.text }}>John Smith</div>
          <div style={{ fontSize: 13, color: T.textLight }}>Crew Alpha · Crew Lead</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: T.accent }} />
            <span style={{ fontSize: 12, color: T.accent, fontWeight: 600 }}>Clocked in · 6h 23m</span>
          </div>
        </div>
      </div>
      {[
        { icon: Clock, label: "Clock Out", color: T.red },
        { icon: Shield, label: "Certifications", color: T.blue },
        { icon: BookOpen, label: "Safety Resources", color: T.amber },
        { icon: Phone, label: "Contact Admin", color: T.accent },
        { icon: Settings, label: "Settings", color: T.textMed },
      ].map((item, i) => (
        <button key={i} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "16px 18px", background: T.card, borderRadius: 3, border: `1px solid ${T.border}`, marginBottom: 8, cursor: "pointer", fontFamily: T.font }}>
          <item.icon size={20} color={item.color} />
          <span style={{ fontSize: 15, fontWeight: 600, color: T.text, flex: 1, textAlign: "left" }}>{item.label}</span>
          <ChevronRight size={18} color={T.textLight} />
        </button>
      ))}
    </div>
  )
}

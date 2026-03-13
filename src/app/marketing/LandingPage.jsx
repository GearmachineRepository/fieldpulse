// ═══════════════════════════════════════════
// Landing Page — Marketing / Public
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Leaf, Zap, Users, MapPin, FileText, Clock, Truck,
  BookOpen, Menu, X,
} from "lucide-react"
import { T } from "@/app/tokens.js"

export default function LandingPage() {
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return (
    <div style={{ minHeight: "100vh", background: "#FAFBFC", fontFamily: T.font }}>
      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: isMobile ? "14px 16px" : "16px 40px", maxWidth: 1280, margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Leaf size={20} color="#fff" />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", color: T.text }}>CruPoint</span>
        </div>
        {isMobile ? (
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ border: "none", background: "none", cursor: "pointer" }}>
            {menuOpen ? <X size={24} color={T.text} /> : <Menu size={24} color={T.text} />}
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {["Features", "Modules", "Pricing", "About"].map(item => (
              <a key={item} href="#" style={{ color: T.textMed, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>{item}</a>
            ))}
            <button onClick={() => navigate("/login")} style={{
              padding: "10px 22px", borderRadius: 10, border: "none", cursor: "pointer",
              background: T.sidebar, color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: T.font,
            }}>Sign In</button>
          </div>
        )}
      </nav>

      {isMobile && menuOpen && (
        <div style={{ padding: "8px 16px 16px", display: "flex", flexDirection: "column", gap: 4, background: "#fff", borderBottom: `1px solid ${T.border}` }}>
          {["Features", "Modules", "Pricing", "About"].map(item => (
            <a key={item} href="#" style={{ color: T.textMed, textDecoration: "none", fontSize: 15, fontWeight: 500, padding: "10px 0" }}>{item}</a>
          ))}
          <button onClick={() => navigate("/login")} style={{
            padding: "12px", borderRadius: 10, border: "none", cursor: "pointer", marginTop: 8,
            background: T.sidebar, color: "#fff", fontSize: 14, fontWeight: 600, fontFamily: T.font, width: "100%",
          }}>Sign In</button>
        </div>
      )}

      {/* Hero */}
      <div style={{
        maxWidth: 1280, margin: "0 auto", padding: isMobile ? "48px 20px 40px" : "80px 40px 60px",
        display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: "center", gap: isMobile ? 40 : 60,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: T.accentLight, border: `1px solid ${T.accentBorder}`,
            borderRadius: 20, padding: "6px 14px", marginBottom: 24,
          }}>
            <Zap size={14} color={T.accent} />
            <span style={{ fontSize: 13, fontWeight: 600, color: T.accent }}>Go paperless with your crews</span>
          </div>
          <h1 style={{ fontSize: isMobile ? 36 : 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-1.5px", margin: "0 0 20px", color: T.text }}>
            Manage your<br /><span style={{ color: T.accent }}>field operations</span><br />from anywhere
          </h1>
          <p style={{ fontSize: isMobile ? 16 : 18, color: T.textMed, lineHeight: 1.6, margin: "0 0 36px", maxWidth: 480 }}>
            Track crews, document field work, manage routes, and stay compliant — all from one platform your team actually wants to use.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => navigate("/login")} style={{
              padding: "14px 28px", borderRadius: 12, border: "none", cursor: "pointer",
              background: T.accent, color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: T.font,
              boxShadow: "0 4px 14px rgba(47,111,237,0.3)",
            }}>Start Free Trial</button>
            <button style={{
              padding: "14px 28px", borderRadius: 12, cursor: "pointer",
              background: "transparent", color: T.text, fontSize: 16, fontWeight: 600,
              fontFamily: T.font, border: `1.5px solid ${T.border}`,
            }}>Watch Demo</button>
          </div>
        </div>

        {!isMobile && (
          <div style={{ flex: 1, background: T.sidebar, borderRadius: 20, padding: 24, boxShadow: T.shadowLg }}>
            <div style={{ background: T.bg, borderRadius: 14, padding: 20 }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                {[
                  { label: "Active Crews", val: "4", icon: Users, color: T.accent },
                  { label: "Stops Today", val: "23", icon: MapPin, color: T.blue },
                  { label: "Docs Filed", val: "12", icon: FileText, color: T.amber },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, background: "#fff", borderRadius: 10, padding: "14px 16px", border: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <div style={{ fontSize: 11, color: T.textLight, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
                        <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: T.text }}>{s.val}</div>
                      </div>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <s.icon size={16} color={s.color} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", borderRadius: 10, padding: 16, border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: T.text }}>Today's Activity</div>
                {[
                  { name: "Crew Alpha", action: "Completed spray at Oak Ridge", time: "2m ago", color: T.accent },
                  { name: "Crew Beta", action: "Clocked in — en route", time: "15m ago", color: T.blue },
                  { name: "Crew Gamma", action: "Uploaded 3 field photos", time: "1h ago", color: T.amber },
                ].map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, background: a.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{a.name}</span>
                      <span style={{ fontSize: 13, color: T.textMed }}> — {a.action}</span>
                    </div>
                    <span style={{ fontSize: 12, color: T.textLight }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Features */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "40px 20px 60px" : "60px 40px 80px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, letterSpacing: "-1px", margin: 0, color: T.text }}>Everything your crews need</h2>
          <p style={{ fontSize: 16, color: T.textMed, marginTop: 12 }}>Core tools included. Specialized modules when you need them.</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
          {[
            { icon: Users, title: "Crew Management", desc: "Organize teams, assign leads, track certifications" },
            { icon: MapPin, title: "Routes & Scheduling", desc: "Plan stops, optimize routes, weekly views" },
            { icon: FileText, title: "Field Documentation", desc: "Photos, notes, GPS — paperless from day one" },
            { icon: Clock, title: "Clock In / Out", desc: "Daily roster, time tracking, crew accountability" },
            { icon: Truck, title: "Fleet Tracking", desc: "Vehicles, assignments, maintenance logs" },
            { icon: BookOpen, title: "Safety & Resources", desc: "SDS library, safety docs, always accessible" },
          ].map((f, i) => (
            <div key={i} style={{ background: T.card, borderRadius: 16, padding: isMobile ? 22 : 28, border: `1px solid ${T.border}` }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: T.accentLight, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <f.icon size={22} color={T.accent} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: T.text }}>{f.title}</div>
              <div style={{ fontSize: 14, color: T.textMed, lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 32, background: `linear-gradient(135deg, ${T.sidebar} 0%, #1E293B 100%)`,
          borderRadius: 20, padding: isMobile ? "28px 22px" : "40px 48px",
          display: "flex", flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Specialized Modules</div>
            <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: "#fff", marginBottom: 8 }}>Need spray tracking? Irrigation? Pest control?</div>
            <div style={{ fontSize: 15, color: "#94A3B8", maxWidth: 500 }}>Add industry-specific tools to your account. Only pay for what your business needs.</div>
          </div>
          <button style={{
            padding: "14px 28px", borderRadius: 12, border: "none", cursor: "pointer",
            background: T.accent, color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: T.font, flexShrink: 0, whiteSpace: "nowrap",
          }}>Explore Modules</button>
        </div>
      </div>
    </div>
  )
}

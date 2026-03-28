// ═══════════════════════════════════════════
// Field Login — Crew select → Employee → PIN
//
// Only shown AFTER device is registered with
// a company code. Shows company name in header.
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import { Leaf, ArrowLeft, Eye, EyeOff, Users, Building2, Unlink } from "lucide-react"
import { T } from "@/app/tokens.js"
import useAuth from "@/hooks/useAuth.jsx"

export default function FieldLoginScreen({ companyName, onUnregister }) {
  const { loginCrew, getCrewLoginTiles } = useAuth()

  const [tiles, setTiles]         = useState(null)
  const [selectedCrew, setCrew]   = useState(null)
  const [selectedEmp, setEmp]     = useState(null)
  const [pin, setPin]             = useState("")
  const [error, setError]         = useState(null)
  const [loading, setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showPin, setShowPin]     = useState(false)

  useEffect(() => {
    getCrewLoginTiles()
      .then(setTiles)
      .catch(() => setError("Cannot connect to server"))
      .finally(() => setLoading(false))
  }, [getCrewLoginTiles])

  const handleSubmit = async () => {
    if (!selectedEmp || pin.length < 4) return
    setError(null)
    setSubmitting(true)
    try {
      await loginCrew(selectedEmp.id, pin)
    } catch {
      setError("Invalid PIN — try again")
      setPin("")
    } finally {
      setSubmitting(false)
    }
  }

  const backToCrews = () => { setCrew(null); setEmp(null); setPin(""); setError(null) }
  const backToEmployees = () => { setEmp(null); setPin(""); setError(null) }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.font }}>
      {/* Header with company name */}
      <div style={{ background: T.sidebar, padding: "24px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 3, background: T.accent,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Leaf size={22} color={T.card} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, color: T.card }}>CruPoint</div>
              <div style={{ fontSize: 12, color: "#64748B" }}>Field App</div>
            </div>
          </div>
        </div>

        {/* Company badge */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: 16, padding: "10px 14px", background: "#1E293B", borderRadius: 3,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={16} color={T.accent} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.card }}>{companyName || "Connected"}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>Device registered</div>
            </div>
          </div>
          <button onClick={onUnregister} title="Unregister device" style={{
            border: "none", background: "none", cursor: "pointer", padding: 6,
            borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Unlink size={16} color="#64748B" />
          </button>
        </div>
      </div>

      <div style={{ padding: 20, maxWidth: 430, margin: "0 auto" }}>
        {loading && <div style={{ textAlign: "center", padding: 40, color: T.textLight }}>Loading crews...</div>}

        {!loading && error && !selectedEmp && (
          <div style={{ padding: 16, background: T.redLight, borderRadius: 3, color: T.red, fontSize: 14, fontWeight: 600, textAlign: "center" }}>{error}</div>
        )}

        {/* Step 1: Select Crew */}
        {!loading && !selectedCrew && tiles && (
          <>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: T.text }}>Who's working today?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tiles.crews.map(crew => (
                <button key={crew.id} onClick={() => setCrew(crew)} style={{
                  padding: "16px 18px", background: T.card, borderRadius: 3,
                  border: `1.5px solid ${T.border}`, cursor: "pointer", fontFamily: T.font,
                  width: "100%", textAlign: "left",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 600, color: T.text }}>{crew.name}</div>
                      <div style={{ fontSize: 13, color: T.textLight, marginTop: 2 }}>
                        {crew.employees.length} member{crew.employees.length !== 1 ? "s" : ""}
                        {crew.vehicle ? ` · ${crew.vehicle.name}` : ""}
                      </div>
                    </div>
                    <Users size={20} color={T.textLight} />
                  </div>
                  {crew.employees.length > 0 && (
                    <div style={{ display: "flex", marginTop: 10 }}>
                      {crew.employees.slice(0, 5).map((emp, i) => (
                        <div key={emp.id} style={{
                          width: 32, height: 32, borderRadius: "50%", border: "2px solid #fff",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 11, fontWeight: 600, color: T.card, marginLeft: i > 0 ? -8 : 0,
                          background: ["#2F6FED", "#3B82F6", "#F59E0B", "#EF4444", "#7C3AED"][i % 5],
                        }}>
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              ))}
              {tiles.crews.length === 0 && (
                <div style={{ padding: 24, textAlign: "center", color: T.textLight, fontSize: 14 }}>
                  No crews found. Ask your admin to set up crews and employees.
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 2: Select Employee */}
        {selectedCrew && !selectedEmp && (
          <>
            <button onClick={backToCrews} style={{
              display: "flex", alignItems: "center", gap: 6, border: "none", background: "none",
              cursor: "pointer", fontFamily: T.font, fontSize: 13, color: T.textLight, fontWeight: 600,
              marginBottom: 16, padding: 0,
            }}>
              <ArrowLeft size={16} /> Back to crews
            </button>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: T.text }}>{selectedCrew.name}</div>
            <div style={{ fontSize: 13, color: T.textLight, marginBottom: 16 }}>Select your name</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {selectedCrew.employees.filter(e => e.has_pin).length === 0 && (
                <div style={{ padding: 16, color: T.textLight, fontSize: 14, textAlign: "center" }}>
                  No employees with PINs in this crew.
                </div>
              )}
              {selectedCrew.employees.filter(e => e.has_pin).map(emp => (
                <button key={emp.id} onClick={() => setEmp(emp)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                  background: T.card, borderRadius: 3, border: `1.5px solid ${T.border}`,
                  cursor: "pointer", fontFamily: T.font, width: "100%", textAlign: "left",
                }}>
                  {emp.photo_filename ? (
                    <img src={`/uploads/${emp.photo_filename}`} alt="" style={{
                      width: 40, height: 40, borderRadius: 3, objectFit: "cover",
                    }} />
                  ) : (
                    <div style={{
                      width: 40, height: 40, borderRadius: 3,
                      background: emp.is_crew_lead ? T.accent : T.blue,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 600, color: T.card,
                    }}>
                      {emp.first_name[0]}{emp.last_name[0]}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{emp.first_name} {emp.last_name}</div>
                  </div>
                  {emp.is_crew_lead && (
                    <span style={{ fontSize: 11, fontWeight: 600, background: T.accentLight, color: T.accent, padding: "3px 8px", borderRadius: 3 }}>Lead</span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 3: Enter PIN */}
        {selectedEmp && (
          <>
            <button onClick={backToEmployees} style={{
              display: "flex", alignItems: "center", gap: 6, border: "none", background: "none",
              cursor: "pointer", fontFamily: T.font, fontSize: 13, color: T.textLight, fontWeight: 600,
              marginBottom: 16, padding: 0,
            }}>
              <ArrowLeft size={16} /> Back
            </button>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              {selectedEmp.photo_filename ? (
                <img src={`/uploads/${selectedEmp.photo_filename}`} alt="" style={{
                  width: 56, height: 56, borderRadius: 3, objectFit: "cover", margin: "0 auto 10px", display: "block",
                }} />
              ) : (
                <div style={{
                  width: 56, height: 56, borderRadius: 3, background: T.accent, margin: "0 auto 10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 600, color: T.card,
                }}>
                  {selectedEmp.first_name[0]}{selectedEmp.last_name[0]}
                </div>
              )}
              <div style={{ fontSize: 18, fontWeight: 600, color: T.text }}>{selectedEmp.first_name} {selectedEmp.last_name}</div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 600, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Enter your PIN</div>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <input
                type={showPin ? "text" : "password"}
                inputMode="numeric" maxLength={6} value={pin} autoFocus
                onChange={e => { setPin(e.target.value.replace(/\D/g, "")); setError(null) }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="••••"
                style={{
                  width: "100%", padding: "16px 48px 16px 16px", borderRadius: 3,
                  background: error ? T.redLight : T.bg,
                  border: `1.5px solid ${error ? T.red : T.border}`,
                  color: T.text, fontSize: 24, fontWeight: 600, textAlign: "center",
                  letterSpacing: 12, fontFamily: T.font, outline: "none", boxSizing: "border-box",
                }}
              />
              <button onClick={() => setShowPin(!showPin)} style={{
                position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                border: "none", background: "none", cursor: "pointer", padding: 4,
              }}>
                {showPin ? <EyeOff size={18} color={T.textLight} /> : <Eye size={18} color={T.textLight} />}
              </button>
            </div>
            {error && <div style={{ fontSize: 13, fontWeight: 600, color: T.red, textAlign: "center", marginBottom: 12 }}>{error}</div>}
            <button onClick={handleSubmit} disabled={submitting || pin.length < 4} style={{
              width: "100%", padding: "14px", borderRadius: 3, border: "none", cursor: "pointer",
              background: T.blue, color: T.card, fontSize: 16, fontWeight: 600, fontFamily: T.font,
              opacity: (submitting || pin.length < 4) ? 0.5 : 1,
            }}>
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

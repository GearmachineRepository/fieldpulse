// ═══════════════════════════════════════════
// Field Profile — Employee info, clock-in, resources
// Certifications always visible. Bottom sheet for resource filtering.
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import {
  Clock, Shield, BookOpen, ChevronRight, LogOut, Users,
  CheckCircle2, Loader2, Search, ExternalLink, Download,
  FileText, Pin, Truck, Award, Hash, AlertCircle,
} from "lucide-react"
import { T } from "@/app/tokens.js"
import useAuth from "@/hooks/useAuth.jsx"
import { submitRoster, getTodayRoster } from "@/lib/api/rosters.js"
import { getEmployees } from "@/lib/api/employees.js"
import { getResources, getResourceCategories } from "@/lib/api/resources.js"
import { BottomSheet, BottomSheetOption, FilterButton } from "@/app/field/components/BottomSheet.jsx"

export default function FieldProfile() {
  const { employee, crew, vehicle, logout } = useAuth()
  const [view, setView] = useState("main")

  if (view === "clockin") return <ClockInView crew={crew} employee={employee} onBack={() => setView("main")} />
  if (view === "resources") return <ResourcesView onBack={() => setView("main")} />
  if (view === "certs") return <CertsView employee={employee} onBack={() => setView("main")} />

  return (
    <div style={{ padding: 20 }}>
      {/* Profile card */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16, marginBottom: 24,
        padding: 20, background: T.card, borderRadius: 16, border: `1px solid ${T.border}`,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14, background: T.accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, fontWeight: 800, color: "#fff", flexShrink: 0,
        }}>
          {(employee?.firstName?.[0] || "")}{(employee?.lastName?.[0] || "")}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>
            {employee?.firstName} {employee?.lastName}
          </div>
          <div style={{ fontSize: 13, color: T.textLight }}>
            {crew?.name || "No crew"}{employee?.isCrewLead ? " · Crew Lead" : ""}
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        <InfoCard icon={Shield} label="License" value={employee?.license} placeholder="Not set" color={T.accent} />
        <InfoCard icon={Award} label="Cert #" value={employee?.certNumber} placeholder="Not set" color={T.blue} />
        <InfoCard icon={Users} label="Crew" value={crew?.name} placeholder="Unassigned" color={T.purple} />
        <InfoCard icon={Truck} label="Vehicle" value={vehicle?.name} placeholder="None" color={T.amber} />
      </div>

      {/* Menu */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <MenuButton icon={Clock} label="Clock In / Out" color={T.blue} onClick={() => setView("clockin")} />
        <MenuButton icon={BookOpen} label="Safety & Resources" sublabel="SDS sheets, manuals, policies" color={T.amber} onClick={() => setView("resources")} />
        <MenuButton icon={Shield} label="My Certifications" sublabel={employee?.license ? `License: ${employee.license}` : "View details"} color={T.accent} onClick={() => setView("certs")} />
        <div style={{ height: 12 }} />
        <MenuButton icon={LogOut} label="Sign Out" color={T.red} onClick={logout} />
      </div>
    </div>
  )
}

function InfoCard({ icon: Icon, label, value, placeholder, color }) {
  const hasValue = !!value
  return (
    <div style={{
      padding: "14px 16px", background: T.card, borderRadius: 12,
      border: `1px solid ${T.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <Icon size={14} color={hasValue ? color : T.textLight} />
        <span style={{ fontSize: 10, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: hasValue ? T.text : T.textLight }}>
        {value || placeholder}
      </div>
    </div>
  )
}

function MenuButton({ icon: Icon, label, sublabel, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 14, width: "100%",
      padding: "16px 18px", background: T.card, borderRadius: 12,
      border: `1px solid ${T.border}`, cursor: "pointer", fontFamily: T.font,
    }}>
      <Icon size={20} color={color} />
      <div style={{ flex: 1, textAlign: "left" }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: T.text }}>{label}</span>
        {sublabel && <div style={{ fontSize: 12, color: T.textLight, marginTop: 1 }}>{sublabel}</div>}
      </div>
      <ChevronRight size={18} color={T.textLight} />
    </button>
  )
}

// ═══════════════════════════════════════════
// Certifications View
// ═══════════════════════════════════════════
function CertsView({ employee, onBack }) {
  const certs = [
    { label: "Applicator License", value: employee?.license, icon: Shield, color: T.accent },
    { label: "Certification Number", value: employee?.certNumber, icon: Award, color: T.blue },
  ]

  return (
    <div style={{ padding: 20 }}>
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6, border: "none", background: "none",
        cursor: "pointer", fontFamily: T.font, fontSize: 14, color: T.textLight, fontWeight: 600,
        padding: 0, marginBottom: 16,
      }}>← Back</button>

      <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 6 }}>My Certifications</div>
      <div style={{ fontSize: 13, color: T.textLight, marginBottom: 20 }}>
        Contact your admin to update certification details.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {certs.map((cert, i) => (
          <div key={i} style={{
            padding: "18px 20px", background: T.card, borderRadius: 14,
            border: `1px solid ${T.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <cert.icon size={18} color={cert.value ? cert.color : T.textLight} />
              <span style={{ fontSize: 13, fontWeight: 700, color: T.textLight, textTransform: "uppercase", letterSpacing: 0.5 }}>{cert.label}</span>
            </div>
            {cert.value ? (
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{cert.value}</div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <AlertCircle size={14} color={T.amber} />
                <span style={{ fontSize: 14, fontWeight: 600, color: T.amber }}>Not set — contact admin</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 24, padding: "14px 18px", background: T.blueLight, borderRadius: 12,
        border: `1px solid ${T.blue}20`, fontSize: 13, color: T.blue, lineHeight: 1.5,
      }}>
        Training records and certification renewals will be tracked here in a future update.
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// Clock In View
// ═══════════════════════════════════════════
function ClockInView({ crew, employee, onBack }) {
  const [crewMembers, setCrewMembers] = useState([])
  const [todayRoster, setTodayRoster] = useState(null)
  const [selected, setSelected] = useState([])
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const allEmps = await getEmployees()
        const members = allEmps.filter(e => e.default_crew_id === crew?.id)
        setCrewMembers(members)
        const roster = await getTodayRoster(crew?.id)
        setTodayRoster(roster)
        if (roster) {
          setSelected(roster.members.map(m => ({ id: m.employeeId, name: m.name })))
          setNotes(roster.notes || "")
        } else {
          setSelected(members.map(e => ({ id: e.id, name: `${e.first_name} ${e.last_name}` })))
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [crew])

  const toggleMember = (emp) => {
    const exists = selected.find(m => m.id === emp.id)
    if (exists) setSelected(selected.filter(m => m.id !== emp.id))
    else setSelected([...selected, { id: emp.id, name: `${emp.first_name} ${emp.last_name}` }])
  }

  const handleSubmit = async () => {
    if (selected.length === 0) return
    setSubmitting(true)
    try {
      await submitRoster({
        crewId: crew?.id, crewName: crew?.name || "—",
        submittedById: employee?.id,
        submittedByName: `${employee?.firstName || ""} ${employee?.lastName || ""}`.trim(),
        members: selected.map(m => ({ id: m.id, name: m.name, present: true })),
        notes: notes || null,
      })
      setTodayRoster(await getTodayRoster(crew?.id))
    } catch {}
    setSubmitting(false)
  }

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })

  if (loading) return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <Loader2 size={24} color={T.textLight} style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ padding: 20 }}>
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6, border: "none", background: "none",
        cursor: "pointer", fontFamily: T.font, fontSize: 14, color: T.textLight, fontWeight: 600,
        padding: 0, marginBottom: 16,
      }}>← Back</button>

      <div style={{ fontSize: 14, color: T.textLight, marginBottom: 4 }}>{today}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 20 }}>
        {crew?.name || "My Crew"} — Clock In
      </div>

      {todayRoster && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
          background: T.accentLight, borderRadius: 12, border: `1px solid ${T.accentBorder}`, marginBottom: 20,
        }}>
          <CheckCircle2 size={22} color={T.accent} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.accent }}>Crew Clocked In</div>
            <div style={{ fontSize: 12, color: "#047857" }}>{selected.length} members today</div>
          </div>
          <button onClick={() => setTodayRoster(null)} style={{
            padding: "6px 14px", borderRadius: 8, border: `1px solid ${T.accentBorder}`,
            background: "#fff", cursor: "pointer", fontFamily: T.font, fontSize: 12,
            fontWeight: 600, color: T.accent,
          }}>Edit</button>
        </div>
      )}

      {!todayRoster && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.textLight, marginBottom: 10 }}>Who's working today?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {crewMembers.map(emp => {
              const isSelected = selected.some(m => m.id === emp.id)
              return (
                <button key={emp.id} onClick={() => toggleMember(emp)} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                  background: T.card, borderRadius: 12,
                  border: `1.5px solid ${isSelected ? T.accent : T.border}`,
                  cursor: "pointer", fontFamily: T.font, width: "100%", textAlign: "left",
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6,
                    border: `2px solid ${isSelected ? T.accent : T.border}`,
                    background: isSelected ? T.accent : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{isSelected && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{emp.first_name} {emp.last_name}</div>
                  </div>
                  {emp.is_crew_lead && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: T.accentLight, color: T.accent, padding: "2px 6px", borderRadius: 4 }}>Lead</span>
                  )}
                </button>
              )
            })}
          </div>

          <div style={{ marginBottom: 16 }}>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Notes (optional)"
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 10, background: T.bg,
                border: `1.5px solid ${T.border}`, color: T.text, fontSize: 14, fontFamily: T.font,
                outline: "none", resize: "vertical", boxSizing: "border-box",
              }} />
          </div>

          <button onClick={handleSubmit} disabled={submitting || selected.length === 0} style={{
            width: "100%", padding: "16px", borderRadius: 12, border: "none", cursor: "pointer",
            background: T.accent, color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: T.font,
            opacity: (submitting || selected.length === 0) ? 0.5 : 1,
          }}>
            {submitting ? "Submitting..." : `Clock In ${selected.length} Member${selected.length !== 1 ? "s" : ""}`}
          </button>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════
// Resources View — Bottom sheet filter
// ═══════════════════════════════════════════
function ResourcesView({ onBack }) {
  const [resources, setResources] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState("")
  const [activeCategory, setActiveCategory] = useState(null)
  const [showFilter, setShowFilter] = useState(false)

  useEffect(() => {
    Promise.all([getResources(), getResourceCategories()])
      .then(([res, cats]) => { setResources(res); setCategories(cats) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = resources.filter(r => {
    if (activeCategory && r.categoryId !== activeCategory) return false
    if (!searchQ) return true
    const q = searchQ.toLowerCase()
    return r.title.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q)
  })

  const activeCatName = activeCategory ? categories.find(c => c.id === activeCategory)?.name : null

  return (
    <div style={{ padding: 20 }}>
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 6, border: "none", background: "none",
        cursor: "pointer", fontFamily: T.font, fontSize: 14, color: T.textLight, fontWeight: 600,
        padding: 0, marginBottom: 16,
      }}>← Back</button>

      <div style={{ fontSize: 22, fontWeight: 800, color: T.text, marginBottom: 16 }}>Safety & Resources</div>

      {/* Search + filter button */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, background: T.card, flex: 1,
          borderRadius: 12, padding: "12px 14px", border: `1px solid ${T.border}`,
        }}>
          <Search size={18} color={T.textLight} />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
            placeholder="Search..."
            style={{ border: "none", outline: "none", flex: 1, fontSize: 14, fontFamily: T.font, background: "transparent", color: T.text }} />
        </div>
        <FilterButton
          label="Filter"
          activeLabel={activeCatName}
          onClick={() => setShowFilter(true)}
        />
      </div>

      {/* Bottom sheet filter */}
      <BottomSheet open={showFilter} onClose={() => setShowFilter(false)} title="Filter by Category">
        <BottomSheetOption label="All Resources" count={resources.length}
          active={!activeCategory}
          onClick={() => { setActiveCategory(null); setShowFilter(false) }} />

        {categories.map(cat => (
          <BottomSheetOption key={cat.id} label={cat.name}
            count={cat.resourceCount} color={cat.color}
            active={activeCategory === cat.id}
            onClick={() => { setActiveCategory(cat.id); setShowFilter(false) }} />
        ))}
      </BottomSheet>

      {/* Resource list */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 30 }}>
          <Loader2 size={24} color={T.textLight} style={{ animation: "spin 1s linear infinite" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: "32px 16px", background: T.card, borderRadius: 14,
          border: `1px dashed ${T.border}`, textAlign: "center",
        }}>
          <BookOpen size={32} color={T.textLight} strokeWidth={1} style={{ margin: "0 auto 12px" }} />
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 4 }}>
            {searchQ || activeCategory ? "No matches" : "No resources"}
          </div>
          <div style={{ fontSize: 13, color: T.textLight }}>
            {searchQ ? "Try different search terms." : "Your admin hasn't added resources yet."}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(r => {
            const isFile = r.resourceType === "file"
            return (
              <a key={r.id}
                href={isFile ? `/uploads/${r.filename}` : r.url}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: "flex", gap: 14, padding: "14px 16px", background: T.card,
                  borderRadius: 12, border: `1px solid ${T.border}`, textDecoration: "none",
                }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: isFile ? `${T.accent}10` : `${T.blue}10`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isFile ? <FileText size={20} color={T.accent} /> : <ExternalLink size={20} color={T.blue} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.title}
                    </div>
                    {r.pinned && <Pin size={11} color={T.amber} />}
                  </div>
                  {r.description && (
                    <div style={{ fontSize: 12, color: T.textLight, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.description}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                    {r.categoryName && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: r.categoryColor || T.textLight }}>
                        {r.categoryName}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                  {isFile ? <Download size={16} color={T.accent} /> : <ExternalLink size={16} color={T.blue} />}
                </div>
              </a>
            )
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

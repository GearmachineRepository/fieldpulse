// ═══════════════════════════════════════════
// Field Shell — /app/*
// ═══════════════════════════════════════════

import { useState } from "react"
import { Home, FileText, Calendar, User } from "lucide-react"
import { T } from "@/app/tokens.js"
import useAuth from "@/hooks/useAuth.jsx"
import { getDeviceRegistration, clearDeviceRegistration } from "@/lib/api/device.js"
import CompanyCodeScreen from "@/app/auth/CompanyCodeScreen.jsx"
import FieldLoginScreen from "@/app/auth/FieldLoginScreen.jsx"
import FieldHome from "@/app/field/pages/FieldHome.jsx"
import FieldDocs from "@/app/field/pages/FieldDocs.jsx"
import FieldSchedule from "@/app/field/pages/FieldSchedule.jsx"
import FieldProfile from "@/app/field/pages/FieldProfile.jsx"
import NewDocModal from "@/app/field/components/NewDocModal.jsx"
import SprayLogForm from "@/app/field/pages/SprayLogForm.jsx"

const TABS = [
  { key: "home", icon: Home, label: "Home" },
  { key: "docs", icon: FileText, label: "Docs" },
  { key: "schedule", icon: Calendar, label: "Schedule" },
  { key: "profile", icon: User, label: "Profile" },
]

export default function FieldShell() {
  const { isField, restoring, logout } = useAuth()
  const [tab, setTab] = useState("home")
  const [showNewDoc, setShowNewDoc] = useState(false)
  const [activeForm, setActiveForm] = useState(null) // "spray-log", etc.
  const [deviceRegistration, setDeviceRegistration] = useState(() => getDeviceRegistration())

  const handleDeviceRegistered = (company) => {
    setDeviceRegistration({ companyName: company.name, companyCode: company.code })
  }

  const handleUnregisterDevice = () => {
    clearDeviceRegistration()
    setDeviceRegistration(null)
    logout()
  }

  const handleDocTypeSelected = (type) => {
    setShowNewDoc(false)
    if (type === "spray-log") {
      setActiveForm("spray-log")
    }
    // Other types will get forms later
  }

  const handleFormSubmitted = () => {
    setActiveForm(null)
    setTab("docs") // Navigate to docs to see the new submission
  }

  // Loading
  if (restoring) {
    return (
      <div style={{
        maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: T.bg,
        display: "flex", alignItems: "center", justifyContent: "center", fontFamily: T.font,
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>Loading…</div>
      </div>
    )
  }

  // Device not registered
  if (!deviceRegistration) {
    return <CompanyCodeScreen onRegistered={handleDeviceRegistered} />
  }

  // Not logged in
  if (!isField) {
    return <FieldLoginScreen companyName={deviceRegistration.companyName} onUnregister={handleUnregisterDevice} />
  }

  // Active form (full screen, overlays everything)
  if (activeForm === "spray-log") {
    return <SprayLogForm onClose={() => setActiveForm(null)} onSubmitted={handleFormSubmitted} />
  }

  // Logged in — full field app
  return (
    <div style={{
      maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: T.bg,
      position: "relative", boxShadow: "0 0 60px rgba(0,0,0,0.08)",
      fontFamily: T.font, color: T.text,
    }}>
      <div style={{ height: 44, background: T.sidebar }} />
      
      <main style={{ paddingBottom: 80 }}>
        {tab === "home" && <FieldHome onNewDoc={() => setShowNewDoc(true)} onNavigate={setTab} />}
        {tab === "docs" && <FieldDocs />}
        {tab === "schedule" && <FieldSchedule />}
        {tab === "profile" && <FieldProfile />}
      </main>

      {/* New Doc type picker */}
      {showNewDoc && <NewDocModal onClose={() => setShowNewDoc(false)} onSelectType={handleDocTypeSelected} />}

      {/* Bottom tab bar */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 430, background: T.card,
        borderTop: `1px solid ${T.border}`, display: "flex",
        padding: "8px 16px 24px", zIndex: 50,
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            border: "none", background: "none", cursor: "pointer", fontFamily: T.font,
            color: tab === t.key ? T.accent : T.textLight, padding: "6px 0",
          }}>
            <t.icon size={22} strokeWidth={tab === t.key ? 2.5 : 1.5} />
            <span style={{ fontSize: 11, fontWeight: tab === t.key ? 700 : 500 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

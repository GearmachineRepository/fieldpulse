// ═══════════════════════════════════════════
// Field Shell — /app/*
// ═══════════════════════════════════════════

import { useState } from 'react'
import { Home, FileText, Calendar, User } from 'lucide-react'
import useAuth from '@/hooks/useAuth.jsx'
import { ModulesProvider } from '@/hooks/useModules.jsx'
import { getDeviceRegistration, clearDeviceRegistration } from '@/lib/api/device.js'
import CompanyCodeScreen from '@/app/auth/CompanyCodeScreen.jsx'
import FieldLoginScreen from '@/app/auth/FieldLoginScreen.jsx'
import FieldHome from '@/app/field/pages/FieldHome.jsx'
import FieldDocs from '@/app/field/pages/FieldDocs.jsx'
import FieldSchedule from '@/app/field/pages/FieldSchedule.jsx'
import FieldProfile from '@/app/field/pages/FieldProfile.jsx'
import NewDocModal from '@/app/field/components/NewDocModal.jsx'
import SprayLogForm from '@/app/field/pages/SprayLogForm.jsx'
import IncidentReportForm from '@/app/field/pages/IncidentReportForm.jsx'
import GeneralNoteForm from '@/app/field/pages/GeneralNoteForm.jsx'
import InspectionForm from '@/app/field/pages/InspectionForm.jsx'
import s from './FieldShell.module.css'

const TABS = [
  { key: 'home', icon: Home, label: 'Home' },
  { key: 'docs', icon: FileText, label: 'Docs' },
  { key: 'schedule', icon: Calendar, label: 'Schedule' },
  { key: 'profile', icon: User, label: 'Profile' },
]

export default function FieldShell() {
  const { isField, restoring, logout } = useAuth()
  const [tab, setTab] = useState('home')
  const [showNewDoc, setShowNewDoc] = useState(false)
  const [activeForm, setActiveForm] = useState(null) // "spray-log", etc.
  const [profileInitialView, setProfileInitialView] = useState(null)

  const handleNavigate = (target) => {
    if (target === 'clockin') {
      setProfileInitialView('clockin')
      setTab('profile')
    } else {
      setProfileInitialView(null)
      setTab(target)
    }
  }
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
    if (['spray-log', 'incident', 'general-note', 'inspection'].includes(type)) {
      setActiveForm(type)
    }
  }

  const handleFormSubmitted = () => {
    setActiveForm(null)
    setTab('docs') // Navigate to docs to see the new submission
  }

  // Loading
  if (restoring) {
    return (
      <div className={s.loading}>
        <div className={s.loadingText}>Loading…</div>
      </div>
    )
  }

  // Device not registered
  if (!deviceRegistration) {
    return <CompanyCodeScreen onRegistered={handleDeviceRegistered} />
  }

  // Not logged in
  if (!isField) {
    return (
      <FieldLoginScreen
        companyName={deviceRegistration.companyName}
        onUnregister={handleUnregisterDevice}
      />
    )
  }

  // Active form (full screen, overlays everything)
  if (activeForm === 'spray-log') {
    return (
      <ModulesProvider>
        <SprayLogForm onClose={() => setActiveForm(null)} onSubmitted={handleFormSubmitted} />
      </ModulesProvider>
    )
  }
  if (activeForm === 'incident') {
    return (
      <ModulesProvider>
        <IncidentReportForm onClose={() => setActiveForm(null)} onSubmitted={handleFormSubmitted} />
      </ModulesProvider>
    )
  }
  if (activeForm === 'general-note') {
    return (
      <ModulesProvider>
        <GeneralNoteForm onClose={() => setActiveForm(null)} onSubmitted={handleFormSubmitted} />
      </ModulesProvider>
    )
  }
  if (activeForm === 'inspection') {
    return (
      <ModulesProvider>
        <InspectionForm onClose={() => setActiveForm(null)} onSubmitted={handleFormSubmitted} />
      </ModulesProvider>
    )
  }

  // Logged in — full field app
  return (
    <ModulesProvider>
      <div className={s.wrapper}>
        <div className={s.statusBar} />

        <main className={s.content}>
          {tab === 'home' && (
            <FieldHome onNewDoc={() => setShowNewDoc(true)} onNavigate={handleNavigate} />
          )}
          {tab === 'docs' && <FieldDocs />}
          {tab === 'schedule' && <FieldSchedule />}
          {tab === 'profile' && (
            <FieldProfile
              initialView={profileInitialView}
              onViewConsumed={() => setProfileInitialView(null)}
            />
          )}
        </main>

        {/* New Doc type picker */}
        {showNewDoc && (
          <NewDocModal onClose={() => setShowNewDoc(false)} onSelectType={handleDocTypeSelected} />
        )}

        {/* Bottom tab bar */}
        <div className={s.tabBar}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={s.tabBtn}
              data-active={tab === t.key}
            >
              <t.icon size={22} strokeWidth={tab === t.key ? 2.5 : 1.5} />
              <span className={s.tabLabel}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </ModulesProvider>
  )
}

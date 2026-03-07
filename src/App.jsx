// ═══════════════════════════════════════════
// App — Root router
// This file should stay nearly empty forever.
// All logic lives inside the three shells.
// ═══════════════════════════════════════════

import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { C, FONT } from '@/config/index.js'

// Lazy-load each shell so their JS bundles are only downloaded when needed.
// A crew member on a tablet never downloads admin code. An admin on a desktop
// never downloads field-app code. This is the main performance win of splitting.
const MarketingShell = lazy(() => import('@/marketing/MarketingShell.jsx'))
const FieldShell     = lazy(() => import('@/field/FieldShell.jsx'))
const AdminShell     = lazy(() => import('@/admin/AdminShell.jsx'))

// Minimal loading state shown during the brief shell bundle download.
function ShellLoader() {
  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: C.bg, fontFamily: FONT,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>💧</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Loading…</div>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <Suspense fallback={<ShellLoader />}>
      <Routes>
        {/* ── Public marketing site ── */}
        <Route path="/" element={<MarketingShell />} />

        {/* ── Field app — crew PIN login + daily tools ── */}
        <Route path="/app/*" element={<FieldShell />} />

        {/* ── Admin dashboard — company management ── */}
        <Route path="/admin/*" element={<AdminShell />} />

        {/* ── Catch-all → marketing root ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
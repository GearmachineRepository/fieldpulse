// ═══════════════════════════════════════════
// App — Root Router (Clean)
//
// /          → Landing page
// /login     → Admin login
// /admin/*   → Admin dashboard (protected)
// /app/*     → Field app (auth handled internally)
// ═══════════════════════════════════════════

import { Routes, Route, Navigate } from "react-router-dom"
import { lazy, Suspense } from "react"
import { T } from "@/app/tokens.js"
import { Leaf } from "lucide-react"

const LandingPage     = lazy(() => import("@/app/marketing/LandingPage.jsx"))
const AdminLoginPage  = lazy(() => import("@/app/auth/AdminLoginPage.jsx"))
const DashboardShell  = lazy(() => import("@/app/dashboard/DashboardShell.jsx"))
const FieldShell      = lazy(() => import("@/app/field/FieldShell.jsx"))

function ShellLoader() {
  return (
    <main style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: T.bg, fontFamily: T.font,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, background: T.accent,
          margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Leaf size={24} color="#fff" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>Loading…</div>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <Suspense fallback={<ShellLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/admin/*" element={<DashboardShell />} />
        <Route path="/app/*" element={<FieldShell />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

// ═══════════════════════════════════════════
// App — Root Router
//
// /              → Landing page
// /login         → Admin login
// /dashboard/*   → Admin dashboard (protected)
// /app/*         → Field app (auth handled internally)
// /admin/*       → Redirect to /dashboard (backward compat)
// ═══════════════════════════════════════════

import { Routes, Route, Navigate } from "react-router-dom"
import { lazy, Suspense } from "react"
import { T } from "@/app/tokens.js"

const LandingPage       = lazy(() => import("@/app/marketing/LandingPage.jsx"))
const PricingPage       = lazy(() => import("@/app/marketing/PricingPage.jsx"))
const AdminLoginPage    = lazy(() => import("@/app/auth/AdminLoginPage.jsx"))
const SignupPage        = lazy(() => import("@/app/auth/SignupPage.jsx"))
const ResetPasswordPage = lazy(() => import("@/app/auth/ResetPasswordPage.jsx"))
const DashboardShell    = lazy(() => import("@/app/dashboard/DashboardShell.jsx"))
const FieldShell        = lazy(() => import("@/app/field/FieldShell.jsx"))

// Dashboard pages
const DashboardHome       = lazy(() => import("@/app/dashboard/pages/DashboardHome.jsx"))
const SchedulePage        = lazy(() => import("@/app/dashboard/pages/SchedulePage.jsx"))
const ProjectsPage        = lazy(() => import("@/app/dashboard/pages/ProjectsPage.jsx"))
const ClockInPage         = lazy(() => import("@/app/dashboard/pages/ClockInPage.jsx"))
const EmployeesPage       = lazy(() => import("@/app/dashboard/pages/EmployeesPage.jsx"))
const CrewsPage           = lazy(() => import("@/app/dashboard/pages/CrewsPage.jsx"))
const FleetPage           = lazy(() => import("@/app/dashboard/pages/FleetPage.jsx"))       // Vehicles
const EquipmentPage       = lazy(() => import("@/app/dashboard/pages/EquipmentPage.jsx"))
const TrainingPage        = lazy(() => import("@/app/dashboard/pages/TrainingPage.jsx"))
const CertificationsPage  = lazy(() => import("@/app/dashboard/pages/CertificationsPage.jsx"))
const IncidentsPage       = lazy(() => import("@/app/dashboard/pages/IncidentsPage.jsx"))
const ResourcesPage       = lazy(() => import("@/app/dashboard/pages/ResourcesPage.jsx"))   // Documents
const SDSPage             = lazy(() => import("@/app/dashboard/pages/SDSPage.jsx"))
const ReportsPage         = lazy(() => import("@/app/dashboard/pages/ReportsPage.jsx"))
const CrewPerformancePage = lazy(() => import("@/app/dashboard/pages/CrewPerformancePage.jsx"))
const ComplianceReportPage = lazy(() => import("@/app/dashboard/pages/ComplianceReportPage.jsx"))
const ModulePage          = lazy(() => import("@/app/dashboard/pages/ModulePage.jsx"))
const PlaceholderPage     = lazy(() => import("@/app/dashboard/pages/PlaceholderPage.jsx"))

function ShellLoader() {
  return (
    <main style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: T.bg, fontFamily: T.font,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 44, height: 44, borderRadius: 4, background: T.accent,
          margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg viewBox="0 0 14 14" fill="none" style={{ width: 20, height: 20 }}>
            <circle cx="7" cy="5" r="2.4" fill="#1A0D00" />
            <path d="M7 8.5C4.5 8.5 2.5 10 2.5 11h9C11.5 10 9.5 8.5 7 8.5z" fill="#1A0D00" />
          </svg>
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>Loading…</div>
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
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Dashboard — nested routes rendered via <Outlet /> in Shell */}
        <Route path="/dashboard" element={<DashboardShell />}>
          <Route index element={<DashboardHome />} />
          {/* Projects */}
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          {/* Operations */}
          <Route path="clock-in" element={<ClockInPage />} />
          {/* People */}
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="crews" element={<CrewsPage />} />
          {/* Fleet */}
          <Route path="vehicles" element={<FleetPage />} />
          <Route path="equipment" element={<EquipmentPage />} />
          {/* Compliance */}
          <Route path="training" element={<TrainingPage />} />
          <Route path="certifications" element={<CertificationsPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          {/* Resources */}
          <Route path="documents" element={<ResourcesPage />} />
          <Route path="sds" element={<SDSPage />} />
          {/* Reports */}
          <Route path="reports" element={<ReportsPage />} />
          <Route path="crew-performance" element={<CrewPerformancePage />} />
          <Route path="compliance-report" element={<ComplianceReportPage />} />
          {/* Other */}
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
          <Route path="mod-:moduleKey" element={<ModulePage />} />
          {/* Backward compat redirects for old routes */}
          <Route path="team" element={<Navigate to="/dashboard/employees" replace />} />
          <Route path="jobs" element={<Navigate to="/dashboard/projects" replace />} />
          <Route path="accounts" element={<Navigate to="/dashboard/projects" replace />} />
          <Route path="fleet" element={<Navigate to="/dashboard/vehicles" replace />} />
          <Route path="resources" element={<Navigate to="/dashboard/documents" replace />} />
          <Route path="field-docs" element={<Navigate to="/dashboard/documents" replace />} />
          <Route path="*" element={<PlaceholderPage title="Page not found" />} />
        </Route>

        {/* Backward compat: /admin → /dashboard */}
        <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />

        <Route path="/app/*" element={<FieldShell />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

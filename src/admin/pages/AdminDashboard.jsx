// ═══════════════════════════════════════════
// Admin Dashboard — Router
// Add new sections by: 1) create file, 2) import here, 3) add route, 4) add to AdminSidebar NAV_GROUPS
// ═══════════════════════════════════════════

import AdminHome from '@/admin/pages/admin/AdminHome.jsx'
import SprayLogsSection from '@/admin/pages/admin/SprayLogsSection.jsx'
import CrewRostersSection from '@/admin/pages/admin/CrewRostersSection.jsx'
import VehiclesSection from '@/admin/pages/admin/VehiclesSection.jsx'
import TeamSection from '@/admin/pages/admin/TeamSection.jsx'
import InventorySection from '@/admin/pages/admin/InventorySection.jsx'
import AccountsSection from '@/admin/pages/admin/AccountsSection.jsx'
import RoutesSection from '@/admin/pages/admin/RoutesSection.jsx'      // ← Phase 3

export default function AdminDashboard({ page, chemicals, equipment, crews, employees, logs, accounts, onRefresh, showToast, onNav }) {
  // ── Operations ──
  if (page === 'admin-home')       return <AdminHome crews={crews} employees={employees} onNav={onNav} />
  if (page === 'admin-spraylogs')  return <SprayLogsSection logs={logs} showToast={showToast} onRefresh={onRefresh} />
  if (page === 'admin-rosters')    return <CrewRostersSection crews={crews} employees={employees} showToast={showToast} />
  if (page === 'admin-routes')     return <RoutesSection crews={crews} accounts={accounts} onRefresh={onRefresh} showToast={showToast} />  // ← Phase 3

  // ── Manage ──
  if (page === 'admin-team')       return <TeamSection employees={employees} crews={crews} onRefresh={onRefresh} showToast={showToast} />
  if (page === 'admin-accounts')   return <AccountsSection accounts={accounts} onRefresh={onRefresh} showToast={showToast} />
  if (page === 'admin-vehicles')   return <VehiclesSection crews={crews} onRefresh={onRefresh} showToast={showToast} />
  if (page === 'admin-inventory')  return <InventorySection chemicals={chemicals} equipment={equipment} onRefresh={onRefresh} showToast={showToast} />

  // ── Fallback ──
  return <AdminHome crews={crews} employees={employees} onNav={onNav} />
}
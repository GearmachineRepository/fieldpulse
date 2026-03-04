// ═══════════════════════════════════════════
// Admin Dashboard — Router
// Add new sections by: 1) create file, 2) import here, 3) add route, 4) add to AdminSidebar NAV_GROUPS
// ═══════════════════════════════════════════

import AdminHome from './admin/AdminHome.jsx'
import SprayLogsSection from './admin/SprayLogsSection.jsx'
import CrewRostersSection from './admin/CrewRostersSection.jsx'
import VehiclesSection from './admin/VehiclesSection.jsx'
import TeamSection from './admin/TeamSection.jsx'
import InventorySection from './admin/InventorySection.jsx'

export default function AdminDashboard({ page, chemicals, equipment, crews, employees, logs, onRefresh, showToast, onNav }) {
  // ── Operations ──
  if (page === 'admin-home')       return <AdminHome crews={crews} employees={employees} onNav={onNav} />
  if (page === 'admin-spraylogs')  return <SprayLogsSection logs={logs} showToast={showToast} onRefresh={onRefresh} />
  if (page === 'admin-rosters')    return <CrewRostersSection crews={crews} employees={employees} showToast={showToast} />

  // ── Manage ──
  if (page === 'admin-team')       return <TeamSection employees={employees} crews={crews} onRefresh={onRefresh} showToast={showToast} />
  if (page === 'admin-vehicles')   return <VehiclesSection crews={crews} onRefresh={onRefresh} showToast={showToast} />
  if (page === 'admin-inventory')  return <InventorySection chemicals={chemicals} equipment={equipment} onRefresh={onRefresh} showToast={showToast} />

  // ── Fallback (unknown page) ──
  return <AdminHome crews={crews} employees={employees} onNav={onNav} />
}
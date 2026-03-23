// ═══════════════════════════════════════════
// useRole — Role-based access hook
//
// Three roles: owner, manager, employee
// - owner: full access to everything
// - manager: projects, employees, reports
//   (no billing/settings)
// - employee: field app only — clock-in,
//   project resources, form submission
//
// In production this reads from the user's
// role in the database. For now it derives
// from the auth context.
// ═══════════════════════════════════════════

import { useMemo } from 'react'
import useAuth from './useAuth.jsx'

export default function useRole() {
  const { admin, employee } = useAuth()

  return useMemo(() => {
    // Determine current role
    const role = admin?.role || (employee ? 'employee' : null) || 'owner'

    return {
      role,
      isOwner: role === 'owner',
      isManager: role === 'manager' || role === 'owner',
      isEmployee: role === 'employee',

      /** Check if user has at least the given role level */
      hasAccess: (requiredRole) => {
        const hierarchy = { employee: 0, manager: 1, owner: 2 }
        return (hierarchy[role] ?? -1) >= (hierarchy[requiredRole] ?? 999)
      },
    }
  }, [admin, employee])
}

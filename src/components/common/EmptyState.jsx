// ═══════════════════════════════════════════
// EmptyState — consistent "no data" placeholder
// Previously duplicated inline across History,
// AllLogs, RoutesList, etc.
// ═══════════════════════════════════════════

import { C } from '../../config/colors.js'

/**
 * @param {{ icon?: string, title: string, subtitle?: string }} props
 */
export default function EmptyState({ icon = '📭', title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 14, color: C.textLight }}>{subtitle}</div>
      )}
    </div>
  )
}

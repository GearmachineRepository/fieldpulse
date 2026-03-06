// ═══════════════════════════════════════════
// Toast — floating feedback notification
// ═══════════════════════════════════════════

import { C } from '../../config/colors.js'
import { FONT } from '../../config/constants.js'

/**
 * @param {{ message: string|null }} props
 */
export default function Toast({ message }) {
  if (!message) return null
  return (
    <div style={{
      position: 'fixed',
      bottom: 32,
      left: '50%',
      transform: 'translateX(-50%)',
      background: C.sidebar,
      color: '#fff',
      padding: '14px 28px',
      borderRadius: 16,
      fontSize: 15,
      fontWeight: 700,
      fontFamily: FONT,
      zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
    }}>
      {message}
    </div>
  )
}

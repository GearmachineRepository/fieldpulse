// ═══════════════════════════════════════════
// AppHeader — top navigation bar
// Extracted from App.jsx's inline render block
// ═══════════════════════════════════════════

import { APP, C, FONT } from '../../config/index.js'

/**
 * @param {{
 *   pageTitle: string,
 *   isAdmin: boolean,
 *   displayName: string,
 *   displaySub?: string,
 *   onMenuOpen: () => void,
 *   onLogout: () => void,
 * }} props
 */
export default function AppHeader({ pageTitle, isAdmin, displayName, displaySub, onMenuOpen, onLogout }) {
  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 10,
      background: C.sidebar,
      padding: '0 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0 10px' }}>

        {/* ── Hamburger ── */}
        <div
          tabIndex={0}
          role="button"
          onClick={onMenuOpen}
          onKeyDown={e => e.key === 'Enter' && onMenuOpen()}
          style={{ cursor: 'pointer', padding: '6px 2px', display: 'flex', flexDirection: 'column', gap: 4, outline: 'none' }}
          aria-label="Open menu"
        >
          <div style={{ width: 22, height: 2.5, background: '#fff', borderRadius: 2 }} />
          <div style={{ width: 22, height: 2.5, background: '#fff', borderRadius: 2 }} />
          <div style={{ width: 16, height: 2.5, background: '#fff', borderRadius: 2 }} />
        </div>

        {/* ── Brand + page title ── */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 3,
            color: isAdmin ? C.amber : C.accent,
            fontWeight: 800,
            lineHeight: 1,
          }}>
            {APP.name}{isAdmin ? ' · ADMIN' : ''}
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.3, color: '#fff' }}>
            {pageTitle}
          </div>
        </div>

        {/* ── User info + sign out ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textAlign: 'right', lineHeight: 1.3 }}>
            {displayName}
            {displaySub && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{displaySub}</div>
            )}
          </div>
          <button
            tabIndex={0}
            onClick={onLogout}
            onKeyDown={e => e.key === 'Enter' && onLogout()}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              fontSize: 13,
              cursor: 'pointer',
              outline: 'none',
              background: C.red,
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(220,38,38,0.2)',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
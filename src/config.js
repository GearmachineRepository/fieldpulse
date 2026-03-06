// ═══════════════════════════════════════════
// App Config — Change branding here, it updates everywhere
// ═══════════════════════════════════════════

export const APP = {
  name: import.meta.env.VITE_APP_NAME || 'FieldPulse',
  tagline: import.meta.env.VITE_APP_TAGLINE || 'Field Manager',
  version: '6.0.0',
}

// Color palette — used across all components
export const C = {
  bg: '#F4F3EF',
  card: '#FFFFFF',
  cardBorder: '#E8E6E0',
  text: '#1A1A18',
  textMed: '#4A4A45',
  textLight: '#8A8A82',
  accent: '#2D7A3A',
  accentLight: '#E8F5EA',
  accentBorder: '#B8DEC0',
  blue: '#2563EB',
  blueLight: '#EFF6FF',
  blueBorder: '#BFDBFE',
  amber: '#D97706',
  amberLight: '#FFFBEB',
  amberBorder: '#FDE68A',
  red: '#DC2626',
  redLight: '#FEF2F2',
  redBorder: '#FECACA',
  sidebar: '#1B1B19',
  sidebarHover: '#2A2A26',
}

// Fonts
export const FONT = "'Nunito Sans', 'Avenir', 'Segoe UI', sans-serif"
export const MONO = "'DM Mono', 'SF Mono', monospace"

// Signal word badge colors
export const SIG_COLORS = {
  CAUTION: { bg: C.accentLight, border: C.accentBorder, badge: '#16a34a' },
  WARNING: { bg: C.amberLight, border: C.amberBorder, badge: '#d97706' },
  DANGER: { bg: C.redLight, border: C.redBorder, badge: '#dc2626' },
}

// Shared input / card style helpers
export const cardStyle = (overrides = {}) => ({
  background: C.card,
  border: `1.5px solid ${C.cardBorder}`,
  borderRadius: 16,
  padding: '16px 18px',
  marginBottom: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  ...overrides,
})

export const labelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: C.textLight,
  textTransform: 'uppercase',
  letterSpacing: 1.2,
  marginBottom: 6,
}

export const inputStyle = (overrides = {}) => ({
  width: '100%',
  padding: '14px 16px',
  borderRadius: 12,
  background: '#FAFAF7',
  border: `1.5px solid ${C.cardBorder}`,
  color: C.text,
  fontSize: 16,
  fontFamily: FONT,
  outline: 'none',
  boxSizing: 'border-box',
  ...overrides,
})

export const btnStyle = (bg = C.accent, color = '#fff', overrides = {}) => ({
  padding: '16px',
  borderRadius: 14,
  textAlign: 'center',
  fontSize: 17,
  fontWeight: 800,
  cursor: 'pointer',
  background: bg,
  color,
  border: 'none',
  boxShadow: `0 2px 8px ${bg}30`,
  width: '100%',
  ...overrides,
})

// Wind directions
export const WIND_DIRS = [
  'N','NNE','NE','ENE','E','ESE','SE','SSE',
  'S','SSW','SW','WSW','W','WNW','NW','NNW',
]

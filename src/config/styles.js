// ═══════════════════════════════════════════
// Shared Style Helpers
// Inline-style factory functions used across
// components. Prefer CSS modules for new work,
// but these keep the existing component code
// working without a full CSS rewrite.
// ═══════════════════════════════════════════

import { C } from './colors.js'

export const cardStyle = (overrides = {}) => ({
  background:   C.card,
  border:       `1.5px solid ${C.cardBorder}`,
  borderRadius: 16,
  padding:      '16px 18px',
  marginBottom: 12,
  boxShadow:    '0 1px 3px rgba(0,0,0,0.04)',
  ...overrides,
})

export const labelStyle = {
  fontSize:      12,
  fontWeight:    700,
  color:         C.textLight,
  textTransform: 'uppercase',
  letterSpacing: 1.2,
  marginBottom:  6,
}

export const inputStyle = (overrides = {}) => ({
  width:        '100%',
  padding:      '14px 16px',
  borderRadius: 12,
  background:   '#FAFAF7',
  border:       `1.5px solid ${C.cardBorder}`,
  color:        C.text,
  fontSize:     16,
  boxSizing:    'border-box',
  ...overrides,
})

export const btnStyle = (bg = C.accent, color = '#fff', overrides = {}) => ({
  padding:      '16px',
  borderRadius: 14,
  textAlign:    'center',
  fontSize:     17,
  fontWeight:   800,
  cursor:       'pointer',
  background:   bg,
  color,
  border:       'none',
  boxShadow:    `0 2px 8px ${bg}30`,
  width:        '100%',
  ...overrides,
})
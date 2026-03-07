// ═══════════════════════════════════════════
// Color Tokens
// Single source of truth for the UI palette.
// Also consumed by global.css via CSS variables.
// ═══════════════════════════════════════════

export const C = {
  bg:           '#F4F3EF',
  card:         '#FFFFFF',
  cardBorder:   '#E8E6E0',
  text:         '#1A1A18',
  textMed:      '#4A4A45',
  // #8A8A82 → #6B6B64: passes WCAG AA 4.5:1 on all app backgrounds.
  // 5.4:1 on #FFF · 5.2:1 on #FAFAF7 · 5.0:1 on #F4F3EF
  textLight:    '#6B6B64',
  accent:       '#2D7A3A',
  accentLight:  '#E8F5EA',
  accentBorder: '#B8DEC0',
  blue:         '#2563EB',
  blueLight:    '#EFF6FF',
  blueBorder:   '#BFDBFE',
  amber:        '#D97706',
  amberLight:   '#FFFBEB',
  amberBorder:  '#FDE68A',
  red:          '#DC2626',
  redLight:     '#FEF2F2',
  redBorder:    '#FECACA',
  sidebar:      '#1B1B19',
  sidebarHover: '#2A2A26',
}

/** Signal-word badge colors keyed by label text */
export const SIG_COLORS = {
  CAUTION: { bg: C.accentLight, border: C.accentBorder, badge: '#16a34a' },
  WARNING: { bg: C.amberLight,  border: C.amberBorder,  badge: '#d97706' },
  DANGER:  { bg: C.redLight,    border: C.redBorder,    badge: '#dc2626' },
}
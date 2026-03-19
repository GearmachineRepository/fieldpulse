// ═══════════════════════════════════════════
// Design Tokens — JS Bridge
//
// Maps to CSS custom properties defined in
// src/ui/tokens/colors.css + typography.css + spacing.css.
//
// Use CSS variables directly in CSS Modules.
// Use this T object only for inline style={{}} that
// hasn't been migrated to CSS Modules yet.
//
// Import as: import { T } from '@/app/tokens.js'
// ═══════════════════════════════════════════

export const T = {
  // Surface
  bg: '#F4F5F7',
  card: '#FFFFFF',
  border: '#DDE2E8',

  // Sidebar / Rail (dark warm)
  railBg: 'hsl(30, 8%, 11%)',
  sidebar: 'hsl(30, 8%, 14%)',
  sidebarText: 'hsl(30, 8%, 70%)',
  sidebarHover: 'hsl(30, 8%, 18%)',
  sidebarActive: 'hsla(38, 92%, 50%, 0.08)',
  sidebarDivider: 'hsl(30, 8%, 22%)',
  sidebarSection: 'hsl(30, 8%, 50%)',

  // Text
  text: '#0F1923',
  textMed: '#4A5568',
  textLight: '#8896A4',

  // Accent (Amber)
  accent: '#D97706',
  accentLight: '#FEF3DC',
  accentBorder: '#FDE8B4',

  // Semantic
  blue: '#2563EB',
  blueLight: '#EBF2FF',
  amber: '#E8930A',
  amberLight: '#FEF3DC',
  red: '#DC2626',
  redLight: '#FEF2F2',
  green: '#059669',
  greenLight: '#ECFDF5',
  purple: '#7C3AED',
  purpleLight: '#F5F3FF',

  // Typography
  font: "'IBM Plex Sans', system-ui, sans-serif",
  mono: "'IBM Plex Mono', monospace",

  // Layout
  radius: '3px',
  radiusSm: '2px',

  // Shadows
  shadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
  shadowMd: '0 4px 12px rgba(0,0,0,0.07)',
  shadowLg: '0 10px 40px rgba(0,0,0,0.1)',
}

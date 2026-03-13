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
  bg: '#F8F9FB',
  card: '#FFFFFF',
  border: '#E5E7EB',

  // Sidebar
  sidebar: '#0F172A',
  sidebarHover: '#1E293B',
  sidebarActive: '#334155',

  // Text
  text: '#0F172A',
  textMed: '#475569',
  textLight: '#64748B',

  // Accent (Emerald)
  accent: '#059669',
  accentLight: '#ECFDF5',
  accentBorder: '#A7F3D0',

  // Semantic
  blue: '#3B82F6',
  blueLight: '#EFF6FF',
  amber: '#F59E0B',
  amberLight: '#FFFBEB',
  red: '#EF4444',
  redLight: '#FEF2F2',
  purple: '#7C3AED',
  purpleLight: '#F5F3FF',

  // Typography
  font: "'Inter', -apple-system, system-ui, sans-serif",

  // Layout
  radius: '12px',
  radiusSm: '8px',

  // Shadows
  shadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
  shadowMd: '0 4px 12px rgba(0,0,0,0.07)',
  shadowLg: '0 10px 40px rgba(0,0,0,0.1)',
}

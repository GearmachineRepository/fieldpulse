// ═══════════════════════════════════════════
// useTheme — Theme state management
//
// Reads theme from localStorage (default: 'light').
// Sets data-theme attribute on <html> to toggle
// the CSS variable block in colors.css.
//
// Future: persist to Supabase user_preferences.theme
// ═══════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react'

const LS_KEY = 'crupoint-theme'

export default function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem(LS_KEY) || 'light' } catch { return 'light' }
  })

  const applyTheme = useCallback((t) => {
    document.documentElement.dataset.theme = t
    setThemeState(t)
    try { localStorage.setItem(LS_KEY, t) } catch { /* noop */ }
  }, [])

  const setTheme = useCallback((t) => {
    applyTheme(t)
  }, [applyTheme])

  const toggleTheme = useCallback(() => {
    applyTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, applyTheme])

  // Apply on mount
  useEffect(() => {
    applyTheme(theme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { theme, setTheme, toggleTheme }
}

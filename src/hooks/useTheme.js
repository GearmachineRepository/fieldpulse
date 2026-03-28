// ═══════════════════════════════════════════
// useTheme — Theme state management
// ═══════════════════════════════════════════

import { useState, useCallback, useEffect } from 'react'

const LS_KEY = 'fp_theme'

export default function useTheme() {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(LS_KEY) || 'light'
    } catch {
      return 'light'
    }
  })

  const applyTheme = useCallback((t) => {
    document.documentElement.dataset.theme = t
    setThemeState(t)
    try {
      localStorage.setItem(LS_KEY, t)
    } catch {
      /* noop */
    }
  }, [])

  const setTheme = useCallback(
    (t) => {
      applyTheme(t)
    },
    [applyTheme],
  )

  const toggleTheme = useCallback(() => {
    applyTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, applyTheme])

  useEffect(() => {
    applyTheme(theme) // eslint-disable-line react-hooks/set-state-in-effect -- Apply theme to DOM on mount
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- Mount-only; applyTheme is stable (useCallback)

  return { theme, setTheme, toggleTheme }
}

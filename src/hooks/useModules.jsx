// ═══════════════════════════════════════════
// useModules — Module state provider + hook
//
// Fetches per-org module state from the API.
// Falls back to the static registry (modules.js)
// if the API hasn't been called yet or fails.
//
// Usage:
//   // Wrap your dashboard in <ModulesProvider>
//   <ModulesProvider>
//     <DashboardShell />
//   </ModulesProvider>
//
//   // In any child component:
//   const { isEnabled, enabledModules, toggleModule } = useModules()
// ═══════════════════════════════════════════

import { useState, useCallback, useEffect, createContext, useContext, useRef } from 'react'
import { ALL_MODULES, ENABLED_MODULES } from '@/app/modules.js'
import { getModules, toggleModule as apiToggle } from '@/lib/api/modules.js'

const ModulesContext = createContext(null)

export function ModulesProvider({ children }) {
  // Start with static registry as default
  const [enabledKeys, setEnabledKeys] = useState(
    () => new Set(ENABLED_MODULES.map(m => m.key))
  )
  const [loaded, setLoaded] = useState(false)
  const fetched = useRef(false)

  // Fetch org module state from API on mount
  useEffect(() => {
    if (fetched.current) return
    fetched.current = true

    getModules()
      .then(rows => {
        if (rows.length > 0) {
          // API returned org-specific state — use it
          const keys = new Set()
          rows.forEach(r => { if (r.enabled) keys.add(r.module_key) })
          setEnabledKeys(keys)
        }
        // If no rows, org hasn't configured modules yet — keep static defaults
      })
      .catch(() => {
        // API unavailable (e.g. table not migrated yet) — keep static defaults
      })
      .finally(() => setLoaded(true))
  }, [])

  const isEnabled = useCallback(
    (key) => enabledKeys.has(key),
    [enabledKeys]
  )

  const enabledModules = ALL_MODULES.filter(m => enabledKeys.has(m.key))

  const toggleModule = useCallback(async (key, enabled) => {
    // Optimistic update
    setEnabledKeys(prev => {
      const next = new Set(prev)
      if (enabled) next.add(key)
      else next.delete(key)
      return next
    })

    try {
      await apiToggle(key, enabled)
      // Background re-fetch to confirm server state
      getModules()
        .then(rows => {
          if (rows.length > 0) {
            const keys = new Set()
            rows.forEach(r => { if (r.enabled) keys.add(r.module_key) })
            setEnabledKeys(keys)
          }
        })
        .catch(() => { /* keep optimistic state */ })
    } catch {
      // Revert on failure
      setEnabledKeys(prev => {
        const next = new Set(prev)
        if (enabled) next.delete(key)
        else next.add(key)
        return next
      })
      throw new Error('Failed to update module')
    }
  }, [])

  const value = {
    isEnabled,
    enabledModules,
    allModules: ALL_MODULES,
    toggleModule,
    loaded,
  }

  return <ModulesContext.Provider value={value}>{children}</ModulesContext.Provider>
}

export default function useModules() {
  const ctx = useContext(ModulesContext)
  // Fallback for components outside the provider (e.g. field app)
  if (!ctx) {
    const enabledSet = new Set(ENABLED_MODULES.map(m => m.key))
    return {
      isEnabled: (key) => enabledSet.has(key),
      enabledModules: ENABLED_MODULES,
      allModules: ALL_MODULES,
      toggleModule: async () => {},
      loaded: true,
    }
  }
  return ctx
}

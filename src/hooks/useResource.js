// ═══════════════════════════════════════════
// useResource — Generic Data Hook
//
// Provides a standard fetch → loading → data → error
// lifecycle for any API resource. Domain hooks
// (useChemicals, useEquipment, etc.) wrap this
// with their specific API calls.
//
// Pattern: fetch on mount or on-demand, with
// built-in loading and error states.
// ═══════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * @param {() => Promise<T[]>} fetchFn  API call that returns the resource list
 * @param {{ immediate?: boolean }} [options]
 * @returns {{
 *   data: T[],
 *   loading: boolean,
 *   error: Error|null,
 *   refresh: () => Promise<void>,
 *   set: (data: T[]) => void,
 * }}
 *
 * @example
 * const chemicals = useResource(() => getChemicals(), { immediate: true })
 * // chemicals.data, chemicals.loading, chemicals.refresh()
 */
export default function useResource(fetchFn, options = {}) {
  const { immediate = false } = options
  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(immediate)
  const [error, setError]     = useState(null)
  const fetchRef              = useRef(fetchFn)
  fetchRef.current            = fetchFn

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchRef.current()
      setData(result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch on mount if immediate
  useEffect(() => {
    if (immediate) refresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refresh, set: setData }
}

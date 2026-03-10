// ═══════════════════════════════════════════
// useCrud — Core data hook with full CRUD
//
// Every domain hook (useChemicals, useCrews, etc.)
// wraps this. It provides:
//   data, loading, error, refresh, create, update, remove
//
// Usage:
//   const chemicals = useCrud({
//     fetchFn: getChemicals,
//     createFn: createChemical,
//     updateFn: updateChemical,
//     deleteFn: deleteChemical,
//   })
//   chemicals.data        → [...]
//   chemicals.loading     → true/false
//   chemicals.refresh()   → re-fetch
//   chemicals.create(d)   → POST + auto-refresh
//   chemicals.update(id,d)→ PUT  + auto-refresh
//   chemicals.remove(id)  → DEL  + auto-refresh
// ═══════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * @param {{
 *   fetchFn: () => Promise<T[]>,
 *   createFn?: (data) => Promise,
 *   updateFn?: (id, data) => Promise,
 *   deleteFn?: (id) => Promise,
 *   immediate?: boolean,
 * }} config
 */
export default function useCrud(config) {
  const {
    fetchFn,
    createFn,
    updateFn,
    deleteFn,
    immediate = false,
  } = config

  const [data, setData]       = useState([])
  const [loading, setLoading] = useState(immediate)
  const [error, setError]     = useState(null)

  // Keep refs so refresh() is stable across renders
  const fetchRef  = useRef(fetchFn)
  const createRef = useRef(createFn)
  const updateRef = useRef(updateFn)
  const deleteRef = useRef(deleteFn)
  fetchRef.current  = fetchFn
  createRef.current = createFn
  updateRef.current = updateFn
  deleteRef.current = deleteFn

  // ── Fetch ──
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchRef.current()
      setData(result)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Create → auto-refresh ──
  const create = useCallback(async (payload) => {
    if (!createRef.current) throw new Error('No createFn provided')
    const result = await createRef.current(payload)
    await refresh()
    return result
  }, [refresh])

  // ── Update → auto-refresh ──
  const update = useCallback(async (id, payload) => {
    if (!updateRef.current) throw new Error('No updateFn provided')
    const result = await updateRef.current(id, payload)
    await refresh()
    return result
  }, [refresh])

  // ── Delete → auto-refresh ──
  const remove = useCallback(async (id) => {
    if (!deleteRef.current) throw new Error('No deleteFn provided')
    const result = await deleteRef.current(id)
    await refresh()
    return result
  }, [refresh])

  // ── Auto-fetch on mount if immediate ──
  useEffect(() => {
    if (immediate) refresh().catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    loading,
    error,
    refresh,
    create:  createFn ? create : undefined,
    update:  updateFn ? update : undefined,
    remove:  deleteFn ? remove : undefined,
    set:     setData,
  }
}

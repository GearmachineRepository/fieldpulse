// ═══════════════════════════════════════════
// usePageData — Per-page lazy data loading
//
// Replaces the monolithic DataProvider pattern.
// Each page declares what data it needs via
// direct hook calls. Includes a simple in-memory
// cache (60s TTL) so navigating between pages
// doesn't re-fetch stale data.
//
// Usage:
//   const employees = usePageData('employees', {
//     fetchFn: getEmployees,
//     createFn: createEmployee,
//     updateFn: updateEmployee,
//     deleteFn: deleteEmployee,
//   })
//   // Returns: { data, loading, error, refresh, create, update, remove }
// ═══════════════════════════════════════════

import { useState, useCallback, useRef, useEffect } from 'react'

const CACHE_TTL = 60_000 // 60 seconds
const cache = new Map()

/**
 * @param {string} cacheKey — unique key for this data domain (e.g. 'employees', 'crews')
 * @param {{
 *   fetchFn: () => Promise<T[]>,
 *   createFn?: (data) => Promise,
 *   updateFn?: (id, data) => Promise,
 *   deleteFn?: (id) => Promise,
 * }} config
 */
export default function usePageData(cacheKey, config) {
  const { fetchFn, createFn, updateFn, deleteFn } = config

  // Check cache for initial data
  const cached = cache.get(cacheKey)
  const hasFreshCache = cached && (Date.now() - cached.timestamp < CACHE_TTL)

  const [data, setData] = useState(hasFreshCache ? cached.data : [])
  const [loading, setLoading] = useState(!hasFreshCache)
  const [error, setError] = useState(null)

  // Stable refs for functions
  const fetchRef = useRef(fetchFn)
  const createRef = useRef(createFn)
  const updateRef = useRef(updateFn)
  const deleteRef = useRef(deleteFn)
  fetchRef.current = fetchFn
  createRef.current = createFn
  updateRef.current = updateFn
  deleteRef.current = deleteFn

  // ── Fetch + cache ──
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchRef.current()
      setData(result)
      cache.set(cacheKey, { data: result, timestamp: Date.now() })
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [cacheKey])

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

  // ── Auto-fetch on mount (if no fresh cache) ──
  useEffect(() => {
    if (!hasFreshCache) {
      refresh().catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    loading,
    error,
    refresh,
    create: createFn ? create : undefined,
    update: updateFn ? update : undefined,
    remove: deleteFn ? remove : undefined,
    set: setData,
  }
}

/**
 * Invalidate a specific cache entry (useful after cross-domain mutations)
 */
export function invalidateCache(cacheKey) {
  cache.delete(cacheKey)
}

/**
 * Clear all cached data
 */
export function clearAllCache() {
  cache.clear()
}

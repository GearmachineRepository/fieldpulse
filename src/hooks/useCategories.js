// ═══════════════════════════════════════════
// useCategories — Fetches categories by scope
// ═══════════════════════════════════════════

import { useState, useEffect, useCallback } from "react"
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api/categories.js"

export default function useCategories(scope) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const rows = await getCategories(scope)
      setData(rows)
    } catch {
      // API may not be available yet (migration pending)
    } finally {
      setLoading(false)
    }
  }, [scope])

  useEffect(() => { refresh() }, [refresh])

  const create = useCallback(async (name, color) => {
    const row = await createCategory({ scope, name, color })
    setData(prev => [...prev, row])
    return row
  }, [scope])

  const update = useCallback(async (id, name, color) => {
    await updateCategory(id, { name, color })
    setData(prev => prev.map(c => c.id === id ? { ...c, name, ...(color ? { color } : {}) } : c))
  }, [])

  const remove = useCallback(async (id) => {
    await deleteCategory(id)
    setData(prev => prev.filter(c => c.id !== id))
  }, [])

  return { data, loading, refresh, create, update, remove }
}

// ═══════════════════════════════════════════
// Categories API — Shared, org-scoped categories
// ═══════════════════════════════════════════
import { request } from './core.js'

export const getCategories     = (scope) => request(`/categories?scope=${scope}`)
export const createCategory    = (d)     => request('/categories', { method: 'POST', body: JSON.stringify(d) })
export const updateCategory    = (id, d) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const reorderCategories = (ids)   => request('/categories/reorder', { method: 'PATCH', body: JSON.stringify({ ids }) })
export const deleteCategory    = (id)    => request(`/categories/${id}`, { method: 'DELETE' })

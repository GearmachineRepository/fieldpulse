// ═══════════════════════════════════════════
// Categories API — Shared, org-scoped categories
// ═══════════════════════════════════════════
import type { Category, Id } from '@/types'
import { request } from './core.js'

export const getCategories = (scope: string): Promise<Category[]> =>
  request<Category[]>(`/categories?scope=${scope}`)
export const createCategory = (d: Partial<Category>): Promise<Category> =>
  request<Category>('/categories', { method: 'POST', body: JSON.stringify(d) })
export const updateCategory = (id: Id, d: Partial<Category>): Promise<Category> =>
  request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const reorderCategories = (ids: Id[]): Promise<void> =>
  request<void>('/categories/reorder', { method: 'PATCH', body: JSON.stringify({ ids }) })
export const deleteCategory = (id: Id): Promise<void> =>
  request<void>(`/categories/${id}`, { method: 'DELETE' })

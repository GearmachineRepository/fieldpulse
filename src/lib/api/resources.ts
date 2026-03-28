// ═══════════════════════════════════════════
// Resources API — Resource library CRUD + file uploads
// ═══════════════════════════════════════════
import { request, buildQuery, multipartRequest } from './core.js'
import type { Id, Resource, ResourceCategory, Account } from '@/types'

interface ResourceUploadMeta {
  title?: string
  description?: string
  categoryId?: Id
  pinned?: boolean
  tags?: string[]
}

// Categories
export const getResourceCategories = (): Promise<ResourceCategory[]> => request<ResourceCategory[]>('/resources/categories')
export const createResourceCategory = (d: Partial<ResourceCategory>): Promise<ResourceCategory> =>
  request<ResourceCategory>('/resources/categories', { method: 'POST', body: JSON.stringify(d) })
export const updateResourceCategory = (id: Id, d: Partial<ResourceCategory>): Promise<ResourceCategory> =>
  request<ResourceCategory>(`/resources/categories/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteResourceCategory = (id: Id): Promise<void> =>
  request<void>(`/resources/categories/${id}`, { method: 'DELETE' })

// Resources
export const getResources = (params: Record<string, unknown> = {}): Promise<Resource[]> => request<Resource[]>(`/resources${buildQuery(params)}`)
export const createResource = (d: Partial<Resource>): Promise<Resource> =>
  request<Resource>('/resources', { method: 'POST', body: JSON.stringify(d) })
export const updateResource = (id: Id, d: Partial<Resource>): Promise<Resource> =>
  request<Resource>(`/resources/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteResource = (id: Id): Promise<void> => request<void>(`/resources/${id}`, { method: 'DELETE' })

export const uploadResource = async (file: File, metadata: ResourceUploadMeta = {}): Promise<Resource> => {
  const fd = new FormData()
  fd.append('file', file)
  if (metadata.title) fd.append('title', metadata.title)
  if (metadata.description) fd.append('description', metadata.description)
  if (metadata.categoryId) fd.append('categoryId', String(metadata.categoryId))
  if (metadata.pinned) fd.append('pinned', 'true')
  if (metadata.tags) fd.append('tags', JSON.stringify(metadata.tags))
  return multipartRequest<Resource>('/resources/upload', fd)
}

export const replaceResourceFile = async (id: Id, file: File): Promise<Resource> => {
  const fd = new FormData()
  fd.append('file', file)
  return multipartRequest<Resource>(`/resources/${id}/file`, fd, 'PUT')
}

// Resource → Account linking (reverse direction)
export const getResourceAccounts = (resourceId: Id): Promise<Account[]> => request<Account[]>(`/resources/${resourceId}/accounts`)
export const linkResourceToAccount = (resourceId: Id, accountId: Id): Promise<void> =>
  request<void>(`/resources/${resourceId}/accounts`, {
    method: 'POST',
    body: JSON.stringify({ accountId }),
  })
export const unlinkResourceFromAccount = (resourceId: Id, accountId: Id): Promise<void> =>
  request<void>(`/resources/${resourceId}/accounts/${accountId}`, { method: 'DELETE' })

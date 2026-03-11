import { request, multipartRequest } from './core.js'

// Categories
export const getResourceCategories    = ()      => request('/resources/categories')
export const createResourceCategory   = (d)     => request('/resources/categories', { method: 'POST', body: JSON.stringify(d) })
export const updateResourceCategory   = (id, d) => request(`/resources/categories/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteResourceCategory   = (id)    => request(`/resources/categories/${id}`, { method: 'DELETE' })

// Resources
export const getResources       = (params = {}) => {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) { if (v != null && v !== '') q.set(k, v) }
  const s = q.toString()
  return request(`/resources${s ? `?${s}` : ''}`)
}
export const createResource     = (d)     => request('/resources', { method: 'POST', body: JSON.stringify(d) })
export const updateResource     = (id, d) => request(`/resources/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteResource     = (id)    => request(`/resources/${id}`, { method: 'DELETE' })

export const uploadResource = async (file, metadata = {}) => {
  const fd = new FormData()
  fd.append('file', file)
  if (metadata.title) fd.append('title', metadata.title)
  if (metadata.description) fd.append('description', metadata.description)
  if (metadata.categoryId) fd.append('categoryId', String(metadata.categoryId))
  if (metadata.pinned) fd.append('pinned', 'true')
  if (metadata.tags) fd.append('tags', JSON.stringify(metadata.tags))
  return multipartRequest('/resources/upload', fd)
}

export const replaceResourceFile = async (id, file) => {
  const fd = new FormData()
  fd.append('file', file)
  return multipartRequest(`/resources/${id}/file`, fd, 'PUT')
}

// Resource → Account linking (reverse direction)
export const getResourceAccounts      = (resourceId) => request(`/resources/${resourceId}/accounts`)
export const linkResourceToAccount    = (resourceId, accountId) => request(`/resources/${resourceId}/accounts`, { method: 'POST', body: JSON.stringify({ accountId }) })
export const unlinkResourceFromAccount = (resourceId, accountId) => request(`/resources/${resourceId}/accounts/${accountId}`, { method: 'DELETE' })
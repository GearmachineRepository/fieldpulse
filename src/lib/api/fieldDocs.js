// ═══════════════════════════════════════════
// Field Docs API — General notes, inspections, etc.
// ═══════════════════════════════════════════
import { request, multipartRequest, buildQuery } from './core.js'

export const getFieldDocs    = (params = {}) => request(`/field-docs${buildQuery(params)}`)
export const getFieldDoc     = (id)          => request(`/field-docs/${id}`)
export const createFieldDoc  = (data)        => request('/field-docs', { method: 'POST', body: JSON.stringify(data) })
export const updateFieldDoc  = (id, data)    => request(`/field-docs/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteFieldDoc  = (id)          => request(`/field-docs/${id}`, { method: 'DELETE' })

export const uploadFieldDocPhotos = async (docId, files) => {
  const fd = new FormData()
  files.forEach(f => fd.append('photos', f))
  return multipartRequest(`/field-docs/${docId}/photos`, fd)
}

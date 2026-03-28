// ═══════════════════════════════════════════
// Field Docs API — General notes, inspections, etc.
// ═══════════════════════════════════════════
import type { Id, FieldDoc, Photo } from '@/types'
import { request, multipartRequest, buildQuery } from './core.js'

export const getFieldDocs = (params: Record<string, unknown> = {}): Promise<FieldDoc[]> =>
  request<FieldDoc[]>(`/field-docs${buildQuery(params)}`)
export const getFieldDoc = (id: Id): Promise<FieldDoc> =>
  request<FieldDoc>(`/field-docs/${id}`)
export const createFieldDoc = (data: Partial<FieldDoc>): Promise<FieldDoc> =>
  request<FieldDoc>('/field-docs', { method: 'POST', body: JSON.stringify(data) })
export const updateFieldDoc = (id: Id, data: Partial<FieldDoc>): Promise<FieldDoc> =>
  request<FieldDoc>(`/field-docs/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteFieldDoc = (id: Id): Promise<void> =>
  request<void>(`/field-docs/${id}`, { method: 'DELETE' })

export const uploadFieldDocPhotos = async (docId: Id, files: File[]): Promise<Photo[]> => {
  const fd = new FormData()
  files.forEach((f) => fd.append('photos', f))
  return multipartRequest<Photo[]>(`/field-docs/${docId}/photos`, fd)
}

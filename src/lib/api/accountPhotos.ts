// ═══════════════════════════════════════════
// Account Photos API — Property/job site photos
// ═══════════════════════════════════════════
import type { Id, Photo } from '@/types'
import { request, multipartRequest } from './core.js'

export const getAccountPhotos = (accountId: Id): Promise<Photo[]> =>
  request<Photo[]>(`/accounts/${accountId}/photos`)

export const uploadAccountPhoto = (accountId: Id, file: File, caption?: string): Promise<Photo> => {
  const fd = new FormData()
  fd.append('photo', file)
  if (caption) fd.append('caption', caption)
  return multipartRequest<Photo>(`/accounts/${accountId}/photos`, fd)
}

export const deleteAccountPhoto = (accountId: Id, photoId: Id): Promise<void> =>
  request<void>(`/accounts/${accountId}/photos/${photoId}`, { method: 'DELETE' })

// ═══════════════════════════════════════════
// Account Photos API — Property/job site photos
// ═══════════════════════════════════════════
import { request, multipartRequest } from './core.js'

export const getAccountPhotos = (accountId) => request(`/accounts/${accountId}/photos`)

export const uploadAccountPhoto = (accountId, file, caption) => {
  const fd = new FormData()
  fd.append('photo', file)
  if (caption) fd.append('caption', caption)
  return multipartRequest(`/accounts/${accountId}/photos`, fd)
}

export const deleteAccountPhoto = (accountId, photoId) =>
  request(`/accounts/${accountId}/photos/${photoId}`, { method: 'DELETE' })

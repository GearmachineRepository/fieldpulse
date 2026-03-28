// ═══════════════════════════════════════════
// Certifications API — Certification CRUD operations
// ═══════════════════════════════════════════
import type { Id, Certification, CertificationType } from '@/types'
import { request, buildQuery } from './core.js'

export const getCertifications = (): Promise<Certification[]> =>
  request<Certification[]>('/certifications')
export const getEmployeeCertifications = (employeeId: Id): Promise<Certification[]> =>
  request<Certification[]>(`/certifications/employee/${employeeId}`)
export const getExpiringCertifications = (days: number = 30): Promise<Certification[]> =>
  request<Certification[]>(`/certifications/expiring${buildQuery({ days })}`)
export const createCertification = (data: Partial<Certification>): Promise<Certification> =>
  request<Certification>('/certifications', { method: 'POST', body: JSON.stringify(data) })
export const updateCertification = (id: Id, data: Partial<Certification>): Promise<Certification> =>
  request<Certification>(`/certifications/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteCertification = (id: Id): Promise<void> =>
  request<void>(`/certifications/${id}`, { method: 'DELETE' })

export const getCertificationTypes = (): Promise<CertificationType[]> =>
  request<CertificationType[]>('/certifications/types')
export const createCertificationType = (data: Partial<CertificationType>): Promise<CertificationType> =>
  request<CertificationType>('/certifications/types', { method: 'POST', body: JSON.stringify(data) })
export const updateCertificationType = (id: Id, data: Partial<CertificationType>): Promise<CertificationType> =>
  request<CertificationType>(`/certifications/types/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteCertificationType = (id: Id): Promise<void> =>
  request<void>(`/certifications/types/${id}`, { method: 'DELETE' })

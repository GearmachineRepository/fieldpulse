// ═══════════════════════════════════════════
// Certifications API — Certification CRUD operations
// ═══════════════════════════════════════════
import { request } from './core.js'

export const getCertifications = () => request('/certifications')
export const getEmployeeCertifications = (employeeId) => request(`/certifications/employee/${employeeId}`)
export const getExpiringCertifications = (days = 30) => request(`/certifications/expiring?days=${days}`)
export const createCertification = (data) => request('/certifications', { method: 'POST', body: JSON.stringify(data) })
export const updateCertification = (id, data) => request(`/certifications/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteCertification = (id) => request(`/certifications/${id}`, { method: 'DELETE' })

export const getCertificationTypes = () => request('/certifications/types')
export const createCertificationType = (data) => request('/certifications/types', { method: 'POST', body: JSON.stringify(data) })
export const updateCertificationType = (id, data) => request(`/certifications/types/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteCertificationType = (id) => request(`/certifications/types/${id}`, { method: 'DELETE' })

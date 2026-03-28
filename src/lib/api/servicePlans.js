// ═══════════════════════════════════════════
// Service Plans API — Recurring service plan management
// ═══════════════════════════════════════════
import { request, buildQuery } from './core.js'

// Service Plan CRUD
export const getServicePlans = (params = {}) => request(`/service-plans${buildQuery(params)}`)
export const getServicePlan = (id) => request(`/service-plans/${id}`)
export const createServicePlan = (d) =>
  request('/service-plans', { method: 'POST', body: JSON.stringify(d) })
export const updateServicePlan = (id, d) =>
  request(`/service-plans/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteServicePlan = (id) => request(`/service-plans/${id}`, { method: 'DELETE' })

// Quick status change
export const setServicePlanStatus = (id, status) =>
  request(`/service-plans/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })

// Exceptions
export const addServiceException = (planId, d) =>
  request(`/service-plans/${planId}/exceptions`, { method: 'POST', body: JSON.stringify(d) })
export const removeServiceException = (planId, exId) =>
  request(`/service-plans/${planId}/exceptions/${exId}`, { method: 'DELETE' })

// Calculated visits
export const getVisits = (start, end, params = {}) =>
  request(`/service-plans/schedule/visits${buildQuery({ start, end, ...params })}`)
export const getTodayVisits = (params = {}) =>
  request(`/service-plans/schedule/today${buildQuery(params)}`)

// ═══════════════════════════════════════════
// Service Plans API — Recurring service plan management
// ═══════════════════════════════════════════
import { request, buildQuery } from './core.js'
import type { Id, ServicePlan, ServiceException, Visit } from '@/types'

// Service Plan CRUD
export const getServicePlans = (params: Record<string, unknown> = {}): Promise<ServicePlan[]> => request<ServicePlan[]>(`/service-plans${buildQuery(params)}`)
export const getServicePlan = (id: Id): Promise<ServicePlan> => request<ServicePlan>(`/service-plans/${id}`)
export const createServicePlan = (d: Partial<ServicePlan>): Promise<ServicePlan> =>
  request<ServicePlan>('/service-plans', { method: 'POST', body: JSON.stringify(d) })
export const updateServicePlan = (id: Id, d: Partial<ServicePlan>): Promise<ServicePlan> =>
  request<ServicePlan>(`/service-plans/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteServicePlan = (id: Id): Promise<void> => request<void>(`/service-plans/${id}`, { method: 'DELETE' })

// Quick status change
export const setServicePlanStatus = (id: Id, status: string): Promise<ServicePlan> =>
  request<ServicePlan>(`/service-plans/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })

// Exceptions
export const addServiceException = (planId: Id, d: Partial<ServiceException>): Promise<ServiceException> =>
  request<ServiceException>(`/service-plans/${planId}/exceptions`, { method: 'POST', body: JSON.stringify(d) })
export const removeServiceException = (planId: Id, exId: Id): Promise<void> =>
  request<void>(`/service-plans/${planId}/exceptions/${exId}`, { method: 'DELETE' })

// Calculated visits
export const getVisits = (start: string, end: string, params: Record<string, unknown> = {}): Promise<Visit[]> =>
  request<Visit[]>(`/service-plans/schedule/visits${buildQuery({ start, end, ...params })}`)
export const getTodayVisits = (params: Record<string, unknown> = {}): Promise<Visit[]> =>
  request<Visit[]>(`/service-plans/schedule/today${buildQuery(params)}`)

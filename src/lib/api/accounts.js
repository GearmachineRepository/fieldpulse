import { request, buildQuery } from './core.js'

export const getAccounts     = (params = {}) => request(`/accounts${buildQuery(params)}`)
export const createAccount   = (d)           => request('/accounts',     { method: 'POST',   body: JSON.stringify(d) })
export const updateAccount   = (id, d)       => request(`/accounts/${id}`, { method: 'PUT',  body: JSON.stringify(d) })
export const deleteAccount   = (id)          => request(`/accounts/${id}`, { method: 'DELETE' })
export const geocodeAddress  = (address)     => request('/accounts/geocode', { method: 'POST', body: JSON.stringify({ address }) })

// Targeted update for estimated service time
export const patchAccountTime = (id, estimatedMinutes) => request(`/accounts/${id}/estimated-time`, { method: 'PATCH', body: JSON.stringify({ estimatedMinutes }) })

// Account-linked resources
export const getAccountResources   = (accountId) => request(`/accounts/${accountId}/resources`)
export const linkAccountResource   = (accountId, resourceId) => request(`/accounts/${accountId}/resources`, { method: 'POST', body: JSON.stringify({ resourceId }) })
export const unlinkAccountResource = (accountId, resourceId) => request(`/accounts/${accountId}/resources/${resourceId}`, { method: 'DELETE' })
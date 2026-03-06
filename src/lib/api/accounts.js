import { request, buildQuery } from './core.js'

export const getAccounts     = (params = {}) => request(`/accounts${buildQuery(params)}`)
export const createAccount   = (d)           => request('/accounts',     { method: 'POST',   body: JSON.stringify(d) })
export const updateAccount   = (id, d)       => request(`/accounts/${id}`, { method: 'PUT',  body: JSON.stringify(d) })
export const deleteAccount   = (id)          => request(`/accounts/${id}`, { method: 'DELETE' })
export const geocodeAddress  = (address)     => request('/accounts/geocode', { method: 'POST', body: JSON.stringify({ address }) })

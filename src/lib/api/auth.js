import { request, setAuthToken } from './core.js'

export const checkHealth   = () => request('/health')
export const getAdminsList = () => request('/admins/list')

export const verifyPin = async (vehicleId, pin) => {
  const r = await request('/auth/verify-pin', { method: 'POST', body: JSON.stringify({ vehicleId, pin }) })
  if (r.token) setAuthToken(r.token)
  return r
}

export const verifyAdminPin = async (adminId, pin) => {
  const r = await request('/auth/admin-pin', { method: 'POST', body: JSON.stringify({ adminId, pin }) })
  if (r.token) setAuthToken(r.token)
  return r
}

export const crewLogin = async (employeeId, pin) => {
  const r = await request('/auth/crew-login', { method: 'POST', body: JSON.stringify({ employeeId, pin }) })
  if (r.token) setAuthToken(r.token)
  return r
}

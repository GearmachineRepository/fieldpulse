// ═══════════════════════════════════════════
// Account Groups API — Group management for accounts
// ═══════════════════════════════════════════
import { request } from './core.js'

export const getAccountGroups = () => request('/account-groups')
export const createAccountGroup = (d) =>
  request('/account-groups', { method: 'POST', body: JSON.stringify(d) })
export const updateAccountGroup = (id, d) =>
  request(`/account-groups/${id}`, { method: 'PUT', body: JSON.stringify(d) })
export const deleteAccountGroup = (id) => request(`/account-groups/${id}`, { method: 'DELETE' })

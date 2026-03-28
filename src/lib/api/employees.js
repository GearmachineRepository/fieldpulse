// ═══════════════════════════════════════════
// Employees API — Employee CRUD operations
// ═══════════════════════════════════════════
import { request, multipartRequest } from './core.js'

export const getEmployees = () => request('/employees')

export const createEmployee = async (data, photoFile) => {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => {
    if (v != null) fd.append(k, v)
  })
  if (photoFile) fd.append('photo', photoFile)
  return multipartRequest('/employees', fd)
}

export const updateEmployee = async (id, data, photoFile) => {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => {
    if (v != null) fd.append(k, v)
  })
  if (photoFile) fd.append('photo', photoFile)
  return multipartRequest(`/employees/${id}`, fd, 'PUT')
}

export const deleteEmployee = (id) => request(`/employees/${id}`, { method: 'DELETE' })

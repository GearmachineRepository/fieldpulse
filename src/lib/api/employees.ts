// ═══════════════════════════════════════════
// Employees API — Employee CRUD operations
// ═══════════════════════════════════════════
import type { Employee, Id } from '@/types'
import { request, multipartRequest } from './core.js'

export const getEmployees = (): Promise<Employee[]> => request<Employee[]>('/employees')

export const createEmployee = async (data: Partial<Employee>, photoFile?: File): Promise<Employee> => {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => {
    if (v != null) fd.append(k, v as string)
  })
  if (photoFile) fd.append('photo', photoFile)
  return multipartRequest<Employee>('/employees', fd)
}

export const updateEmployee = async (id: Id, data: Partial<Employee>, photoFile?: File): Promise<Employee> => {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => {
    if (v != null) fd.append(k, v as string)
  })
  if (photoFile) fd.append('photo', photoFile)
  return multipartRequest<Employee>(`/employees/${id}`, fd, 'PUT')
}

export const deleteEmployee = (id: Id): Promise<void> =>
  request<void>(`/employees/${id}`, { method: 'DELETE' })

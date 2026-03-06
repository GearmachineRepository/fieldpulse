import { request } from './core.js'

export const getChemicals    = ()        => request('/chemicals')
export const createChemical  = (d)       => request('/chemicals',     { method: 'POST',   body: JSON.stringify(d) })
export const updateChemical  = (id, d)   => request(`/chemicals/${id}`, { method: 'PUT',  body: JSON.stringify(d) })
export const deleteChemical  = (id)      => request(`/chemicals/${id}`, { method: 'DELETE' })

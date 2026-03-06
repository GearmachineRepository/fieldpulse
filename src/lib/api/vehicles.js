import { request } from './core.js'

export const getVehicles    = ()        => request('/vehicles')
export const createVehicle  = (d)       => request('/vehicles',     { method: 'POST',   body: JSON.stringify(d) })
export const updateVehicle  = (id, d)   => request(`/vehicles/${id}`, { method: 'PUT',  body: JSON.stringify(d) })
export const deleteVehicle  = (id)      => request(`/vehicles/${id}`, { method: 'DELETE' })

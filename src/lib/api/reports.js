import { request, buildQuery } from './core.js'

export const getPurReport      = (month, year) => request(`/reports/pur${buildQuery({ month, year })}`)
export const getPurReportRange = (start, end)  => request(`/reports/pur${buildQuery({ start, end })}`)
export const getRosterReport   = (start, end)  => request(`/reports/rosters${buildQuery({ start, end })}`)

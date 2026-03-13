// ═══════════════════════════════════════════
// Reports API — Report data fetching
// ═══════════════════════════════════════════
import { request, buildQuery } from './core.js'

// PUR Report — chemical usage summary
export const getPurReport      = (month, year) => request(`/reports/pur${buildQuery({ month, year })}`)
export const getPurReportRange = (start, end)  => request(`/reports/pur${buildQuery({ start, end })}`)

// Roster / Attendance report
export const getRosterReport   = (start, end)  => request(`/reports/rosters${buildQuery({ start, end })}`)

// Work completion log
export const getCompletionReport = (params = {}) => request(`/routes/completions/log${buildQuery(params)}`)

// Spray logs (full list with filters)
export const getSprayLogsReport = (params = {}) => request(`/spray-logs${buildQuery(params)}`)
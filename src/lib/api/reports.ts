// ═══════════════════════════════════════════
// Reports API — Report data fetching
// ═══════════════════════════════════════════
import { request, buildQuery } from './core.js'
import type { PurReport, RosterReport, CompletionReport, SprayLog } from '@/types'

// PUR Report — chemical usage summary
export const getPurReport = (month: number, year: number): Promise<PurReport> => request<PurReport>(`/reports/pur${buildQuery({ month, year })}`)
export const getPurReportRange = (start: string, end: string): Promise<PurReport> =>
  request<PurReport>(`/reports/pur${buildQuery({ start, end })}`)

// Roster / Attendance report
export const getRosterReport = (start: string, end: string): Promise<RosterReport> =>
  request<RosterReport>(`/reports/rosters${buildQuery({ start, end })}`)

// Work completion log
export const getCompletionReport = (params: Record<string, unknown> = {}): Promise<CompletionReport> =>
  request<CompletionReport>(`/routes/completions/log${buildQuery(params)}`)

// Spray logs (full list with filters)
export const getSprayLogsReport = (params: Record<string, unknown> = {}): Promise<SprayLog[]> => request<SprayLog[]>(`/spray-logs${buildQuery(params)}`)

// ═══════════════════════════════════════════
// Format Utilities (server-side)
// Row-to-object mappers shared across routes.
// ═══════════════════════════════════════════

import { DAY_NAMES } from '../constants/index.js'
import { formatShortDate, formatTime } from './date.js'

/**
 * Maps a raw spray_logs row (with joined products/photos/members)
 * into the API response shape consumed by the frontend.
 * @param {object} row
 */
export function formatSprayLog(row) {
  return {
    id: row.id,
    crewName: row.crew_name,
    crewLead: row.crew_lead,
    license: row.license,
    property: row.property,
    location: row.location,
    equipment: row.equipment_name,
    totalMixVol: row.total_mix_vol,
    targetPest: row.target_pest,
    notes: row.notes,
    date: formatShortDate(row.created_at),
    time: formatTime(row.created_at),
    weather: {
      temp: row.wx_temp,
      humidity: row.wx_humidity,
      windSpeed: row.wx_wind_speed,
      windDir: row.wx_wind_dir,
      conditions: row.wx_conditions,
    },
    products: (row.products || [])
      .filter(p => p.id !== null)
      .map(p => ({ name: p.chemicalName, epa: p.epa, ozConcentrate: p.amount })),
    photos: (row.photos || []).filter(p => p.id !== null),
    members: (row.members || []).filter(m => m.id !== null),
    status: 'synced',
  }
}

/**
 * Maps a raw routes row into the API response shape.
 * @param {object} row
 */
export function formatRoute(row) {
  return {
    id: row.id,
    name: row.name,
    crewId: row.crew_id,
    crewName: row.crew_name,
    dayOfWeek: row.day_of_week,
    dayName: row.day_of_week != null ? DAY_NAMES[row.day_of_week] : null,
    color: row.color || '#2F6FED',
    notes: row.notes,
    stopCount: parseInt(row.stop_count || 0),
    active: row.active,
  }
}

/**
 * Maps a raw route_stops row (joined with accounts) into the API shape.
 * @param {object} row
 */
export function formatStop(row) {
  return {
    id: row.id,
    routeId: row.route_id,
    stopOrder: row.stop_order,
    notes: row.notes,
    account: {
      id: row.account_id,
      name: row.account_name,
      address: row.address,
      city: row.city,
      state: row.state,
      zip: row.zip,
      latitude: row.latitude,
      longitude: row.longitude,
      contactName: row.contact_name,
      contactPhone: row.contact_phone,
      notes: row.account_notes,
    },
  }
}

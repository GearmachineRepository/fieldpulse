// ═══════════════════════════════════════════
// Server Constants
// Single source of truth for values used
// across multiple route modules.
// ═══════════════════════════════════════════

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export const ROUTE_STATUS_OPTIONS = [
  { value: 'completed', label: 'Completed' },
  { value: 'partial', label: 'Partial' },
  { value: 'skipped', label: 'Skipped' },
  { value: 'not_home', label: 'Not Home' },
]

export const MAX_UPLOAD_SIZE_MB = 15
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

export const ALLOWED_FILE_TYPES = /jpeg|jpg|png|gif|webp|heic|pdf/i

export const SPRAY_LOG_DEFAULT_LIMIT = 50
export const SPRAY_LOG_MAX_LIMIT = 500

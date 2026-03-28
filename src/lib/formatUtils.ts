// ═══════════════════════════════════════════
// Format Utilities — Shared formatting helpers
// ═══════════════════════════════════════════

/**
 * US state name → two-letter abbreviation map.
 * Returns the input unchanged if not found.
 */
const STATE_MAP: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
  'district of columbia': 'DC',
}

export function abbreviateState(input: string | null | undefined): string {
  if (!input) return 'CA'
  const trimmed = input.trim()
  if (trimmed.length <= 2) return trimmed.toUpperCase()
  return STATE_MAP[trimmed.toLowerCase()] || trimmed
}

/**
 * Formats byte count to human-readable file size.
 * e.g. 1536 → "1.5 KB", 2621440 → "2.5 MB"
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let size = bytes
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024
    i++
  }
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

/** Color presets for groups, categories, and tags */
export const ITEM_COLORS: readonly string[] = [
  '#2F6FED',
  '#3B82F6',
  '#F59E0B',
  '#EF4444',
  '#7C3AED',
  '#0891B2',
  '#DB2777',
  '#65A30D',
  '#92400E',
  '#475569',
]

/** Standard asset statuses shared across fleet and equipment */
export const ASSET_STATUSES = ['Active', 'Out of Service', 'Retired'] as const

export type AssetStatus = (typeof ASSET_STATUSES)[number]

/**
 * Maps an asset status string to a StatusBadge variant.
 * Used by FleetPage and EquipmentPage.
 */
export function getStatusVariant(status: string): string {
  switch (status) {
    case 'Active':
      return 'green'
    case 'Out of Service':
      return 'amber'
    case 'Retired':
      return 'gray'
    default:
      return 'green'
  }
}

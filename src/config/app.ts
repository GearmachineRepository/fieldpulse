// ═══════════════════════════════════════════
// App Config — branding & version
// Change VITE_APP_NAME / VITE_APP_TAGLINE in .env
// ═══════════════════════════════════════════

import type { AppConfig } from '@/types'

export const APP: AppConfig = {
  name: import.meta.env.VITE_APP_NAME || 'CruPoint',
  tagline: import.meta.env.VITE_APP_TAGLINE || 'Field Manager',
  version: '1.0.0',
}

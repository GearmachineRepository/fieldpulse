// ═══════════════════════════════════════════
// Supabase Admin Client — Server-side only
//
// Uses the SERVICE_ROLE_KEY which bypasses RLS.
// NEVER expose this client or key to the frontend.
//
// Usage:
//   import supabase from '../lib/supabase.js'
//   const { data, error } = await supabase.auth.admin.listUsers()
// ═══════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'
import { logger } from '../utils/logger.js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  logger.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set — Supabase client unavailable')
}

const supabase = url && serviceKey
  ? createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

export default supabase

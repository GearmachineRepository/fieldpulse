// ═══════════════════════════════════════════
// Migration 013 — Modules table
//
// Tracks which modules are enabled per org.
//
// Run: node server/migrations/013-modules.js
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration 013: Modules')
  console.log('═══════════════════════════════════════\n')

  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
  })

  try {
    // 1. Create modules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        org_id UUID NOT NULL,
        module_key TEXT NOT NULL,
        enabled BOOLEAN DEFAULT false,
        config JSONB,
        enabled_at TIMESTAMPTZ,
        UNIQUE(org_id, module_key)
      )
    `)
    console.log('  ✓ Created modules table')

    // 2. Create index
    await pool.query('CREATE INDEX IF NOT EXISTS idx_modules_org ON modules(org_id)')
    console.log('  ✓ Created indexes')

    console.log('\n  Migration complete.\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

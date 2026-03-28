// ═══════════════════════════════════════════
// Migration 016 — Add location + notes to sds_entries
//
// Run: node server/migrations/016-sds-location-notes.js
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration 016: SDS location + notes')
  console.log('═══════════════════════════════════════\n')

  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
  })

  try {
    await pool.query(`ALTER TABLE sds_entries ADD COLUMN IF NOT EXISTS location TEXT`)
    console.log('  ✓ Added location column')

    await pool.query(`ALTER TABLE sds_entries ADD COLUMN IF NOT EXISTS notes TEXT`)
    console.log('  ✓ Added notes column')

    console.log('\n  Migration complete.\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

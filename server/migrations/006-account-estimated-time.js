// ═══════════════════════════════════════════
// Migration 006 — Account Estimated Time
//
// Adds a default estimated_minutes column to
// accounts so route stops auto-populate from
// the jobsite's expected service duration.
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
  })

  try {
    console.log('\n  Migration 006 — Account Estimated Time\n')

    await pool.query(`
      ALTER TABLE accounts
      ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER DEFAULT 30
    `)
    console.log('  ✓ Added estimated_minutes column to accounts (default 30)')

    console.log('\n  Done. Run: npm run dev\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

// ═══════════════════════════════════════════
// Migration 012 — Dashboard pins table
//
// Stores per-company dashboard card pin state + ordering.
//
// Run: node server/migrations/012-dashboard-pins.js
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration 012: Dashboard Pins')
  console.log('═══════════════════════════════════════\n')

  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
  })

  try {
    // 1. Create dashboard_pins table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dashboard_pins (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        company_id UUID REFERENCES companies(id),
        card_key TEXT NOT NULL,
        position INTEGER,
        enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(company_id, card_key)
      )
    `)
    console.log('  ✓ Created dashboard_pins table')

    // 2. Create index
    await pool.query('CREATE INDEX IF NOT EXISTS idx_dashboard_pins_company ON dashboard_pins(company_id)')
    console.log('  ✓ Created indexes')

    // 3. Enable RLS
    await pool.query('ALTER TABLE dashboard_pins ENABLE ROW LEVEL SECURITY')
    await pool.query(`
      CREATE POLICY dashboard_pins_company_isolation ON dashboard_pins
        USING (company_id = current_setting('app.company_id')::uuid)
    `)
    console.log('  ✓ Enabled RLS with company_id isolation')

    console.log('\n  Migration complete.\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

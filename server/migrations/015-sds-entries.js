// ═══════════════════════════════════════════
// Migration 015 — SDS entries table
//
// Safety Data Sheet records with hazard tracking.
//
// Run: node server/migrations/015-sds-entries.js
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration 015: SDS Entries')
  console.log('═══════════════════════════════════════\n')

  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
  })

  try {
    // 1. Create sds_entries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sds_entries (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        company_id UUID REFERENCES companies(id),
        product_name TEXT NOT NULL,
        manufacturer TEXT,
        cas_number TEXT,
        hazard_classes TEXT[],
        category TEXT,
        pdf_url TEXT,
        external_id TEXT,
        source TEXT DEFAULT 'manual',
        last_updated TIMESTAMPTZ,
        pinned BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('  ✓ Created sds_entries table')

    // 2. Create indexes
    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_sds_entries_company ON sds_entries(company_id)',
    )
    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_sds_entries_product ON sds_entries(company_id, product_name)',
    )
    console.log('  ✓ Created indexes')

    // 3. Enable RLS
    await pool.query('ALTER TABLE sds_entries ENABLE ROW LEVEL SECURITY')
    await pool.query(`
      CREATE POLICY sds_entries_company_isolation ON sds_entries
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

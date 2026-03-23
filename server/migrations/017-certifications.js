// ═══════════════════════════════════════════
// Migration 017 — Certifications table
//
// Employee certifications and license tracking.
//
// Run: node server/migrations/017-certifications.js
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration 017: Certifications')
  console.log('═══════════════════════════════════════\n')

  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
  })

  try {
    // 1. Create certifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS certifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        company_id UUID REFERENCES companies(id),
        employee_id UUID REFERENCES employees(id),
        cert_type TEXT,
        cert_name TEXT,
        issuing_body TEXT,
        issued_date DATE,
        expiry_date DATE,
        document_url TEXT,
        status TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('  ✓ Created certifications table')

    // 2. Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_certifications_company ON certifications(company_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_certifications_employee ON certifications(employee_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_certifications_expiry ON certifications(company_id, expiry_date)')
    console.log('  ✓ Created indexes')

    // 3. Enable RLS
    await pool.query('ALTER TABLE certifications ENABLE ROW LEVEL SECURITY')
    await pool.query(`
      CREATE POLICY certifications_company_isolation ON certifications
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

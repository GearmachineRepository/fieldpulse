// ═══════════════════════════════════════════
// Migration 016 — Incidents table
//
// Incident reports with locking, signatures, and GPS.
//
// Run: node server/migrations/016-incidents.js
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration 016: Incidents')
  console.log('═══════════════════════════════════════\n')

  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
  })

  try {
    // 1. Create incidents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        company_id UUID REFERENCES companies(id),
        reported_by UUID REFERENCES employees(id),
        incident_type TEXT,
        incident_date TIMESTAMPTZ NOT NULL,
        location TEXT,
        gps_coordinates POINT,
        description TEXT,
        parties_involved JSONB,
        photos TEXT[],
        witness_info JSONB,
        police_report_num TEXT,
        supervisor_notified_at TIMESTAMPTZ,
        status TEXT DEFAULT 'open',
        signed_by UUID REFERENCES employees(id),
        signed_at TIMESTAMPTZ,
        signature_token TEXT,
        report_locked BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('  ✓ Created incidents table')

    // 2. Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_incidents_company ON incidents(company_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_incidents_date ON incidents(company_id, incident_date)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(company_id, status)')
    console.log('  ✓ Created indexes')

    // 3. Enable RLS
    await pool.query('ALTER TABLE incidents ENABLE ROW LEVEL SECURITY')
    await pool.query(`
      CREATE POLICY incidents_company_isolation ON incidents
        USING (company_id = current_setting('app.company_id')::uuid)
    `)
    console.log('  ✓ Enabled RLS with company_id isolation')

    // 4. No-update policy for locked reports
    await pool.query(`
      CREATE POLICY incidents_no_update_locked ON incidents
        AS RESTRICTIVE
        FOR UPDATE
        USING (report_locked = false)
    `)
    console.log('  ✓ Created no_update_locked policy')

    console.log('\n  Migration complete.\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

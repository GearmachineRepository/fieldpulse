// ═══════════════════════════════════════════
// Migration 022 — Incidents table (revised)
//
// Incident reports with locking for compliance.
// Uses integer PK + org_id UUID for tenant isolation.
//
// Run: node server/migrations/022-incidents.js
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration 022: Incidents (revised)')
  console.log('═══════════════════════════════════════\n')

  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
  })

  try {
    // 1. Drop old incidents table if it exists (from migration 016)
    await pool.query('DROP TABLE IF EXISTS incidents CASCADE')
    console.log('  ✓ Dropped old incidents table (if any)')

    // 2. Create incidents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id SERIAL PRIMARY KEY,
        org_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        incident_date TIMESTAMPTZ NOT NULL,
        location VARCHAR(255),
        severity VARCHAR(50) DEFAULT 'low',
        type VARCHAR(100),
        reported_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
        status VARCHAR(50) DEFAULT 'open',
        report_locked BOOLEAN DEFAULT false,
        investigation_notes TEXT,
        corrective_actions TEXT,
        witnesses TEXT,
        injury_occurred BOOLEAN DEFAULT false,
        injury_description TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `)
    console.log('  ✓ Created incidents table')

    // 3. Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_incidents_org ON incidents(org_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_incidents_date ON incidents(incident_date)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status)')
    console.log('  ✓ Created indexes')

    console.log('\n  Migration complete.\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

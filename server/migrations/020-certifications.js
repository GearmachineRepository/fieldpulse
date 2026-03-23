// ═══════════════════════════════════════════
// Migration 020 — Certifications tables
//
// certification_types: org-level cert type definitions
// certifications: employee certifications with expiry tracking
//
// Run: node server/migrations/020-certifications.js
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration 020: Certifications')
  console.log('═══════════════════════════════════════\n')

  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
  })

  try {
    // 1. Create certification_types table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS certification_types (
        id SERIAL PRIMARY KEY,
        org_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        validity_months INTEGER,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `)
    console.log('  ✓ Created certification_types table')

    // 2. Create certification_types index
    await pool.query('CREATE INDEX IF NOT EXISTS idx_cert_types_org ON certification_types(org_id)')
    console.log('  ✓ Created certification_types indexes')

    // 3. Create certifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS certifications (
        id SERIAL PRIMARY KEY,
        org_id UUID NOT NULL,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        certification_type_id INTEGER REFERENCES certification_types(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        issuing_authority VARCHAR(255),
        cert_number VARCHAR(255),
        issued_date DATE,
        expiry_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        attachment_path TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `)
    console.log('  ✓ Created certifications table')

    // 4. Create certifications indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_certs_org ON certifications(org_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_certs_employee ON certifications(employee_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_certs_expiry ON certifications(expiry_date)')
    console.log('  ✓ Created certifications indexes')

    console.log('\n  Migration complete.\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

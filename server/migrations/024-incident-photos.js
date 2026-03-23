// ═══════════════════════════════════════════
// Migration 024 — Incident Photos table
//
// Stores photo metadata for incident reports.
// Actual files live in Supabase Storage bucket "incident-photos".
//
// Run: node server/migrations/024-incident-photos.js
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration 024: Incident Photos')
  console.log('═══════════════════════════════════════\n')

  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
  })

  try {
    // 1. Create incident_photos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS incident_photos (
        id SERIAL PRIMARY KEY,
        org_id UUID NOT NULL,
        incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255),
        mime_type VARCHAR(100),
        size_bytes INTEGER,
        storage_path TEXT NOT NULL,
        caption TEXT,
        uploaded_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `)
    console.log('  ✓ Created incident_photos table')

    // 2. Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_incident_photos_incident ON incident_photos(incident_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_incident_photos_org ON incident_photos(org_id)')
    console.log('  ✓ Created indexes')

    console.log('\n  Migration complete.\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

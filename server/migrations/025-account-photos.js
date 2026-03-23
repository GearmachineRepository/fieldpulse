// ═══════════════════════════════════════════
// Migration 025 — Account / Property Photos
//
// Stores photo metadata for jobs/properties.
// Actual files live in Supabase Storage "uploads" bucket.
//
// Run: node server/migrations/025-account-photos.js
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration 025: Account Photos')
  console.log('═══════════════════════════════════════\n')

  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
  })

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS account_photos (
        id SERIAL PRIMARY KEY,
        org_id UUID NOT NULL,
        account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
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
    console.log('  ✓ Created account_photos table')

    await pool.query('CREATE INDEX IF NOT EXISTS idx_account_photos_account ON account_photos(account_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_account_photos_org ON account_photos(org_id)')
    console.log('  ✓ Created indexes')

    console.log('\n  Migration complete.\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

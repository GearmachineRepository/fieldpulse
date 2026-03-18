// ═══════════════════════════════════════════
// Migration 005 — Account-linked Resources
//
// Creates a junction table linking resources
// to accounts (jobsites). Enables crews to see
// site-specific documents from their schedule.
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
    console.log('\n  Migration 005 — Account-linked Resources\n')

    // Junction table: many-to-many between accounts and resources
    await pool.query(`
      CREATE TABLE IF NOT EXISTS account_resources (
        id SERIAL PRIMARY KEY,
        account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(account_id, resource_id)
      )
    `)
    console.log('  ✓ account_resources table created')

    // Index for fast lookups by account
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_account_resources_account
      ON account_resources(account_id)
    `)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_account_resources_resource
      ON account_resources(resource_id)
    `)
    console.log('  ✓ Indexes created')

    console.log('\n  Done. Run: npm run dev\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

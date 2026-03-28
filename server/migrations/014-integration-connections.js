// ═══════════════════════════════════════════
// Migration 014 — Integration connections table
//
// Stores OAuth/API connections to third-party providers.
//
// Run: node server/migrations/014-integration-connections.js
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration 014: Integration Connections')
  console.log('═══════════════════════════════════════\n')

  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
  })

  try {
    // 1. Create integration_connections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS integration_connections (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        company_id UUID REFERENCES organizations(id),
        provider TEXT NOT NULL,
        status TEXT DEFAULT 'disconnected',
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMPTZ,
        config JSONB,
        connected_at TIMESTAMPTZ,
        last_sync_at TIMESTAMPTZ
      )
    `)
    console.log('  ✓ Created integration_connections table')

    // 2. Create index
    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_integration_connections_company ON integration_connections(company_id)',
    )
    console.log('  ✓ Created indexes')

    // 3. Enable RLS
    await pool.query('ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY')
    await pool.query(`
      CREATE POLICY integration_connections_company_isolation ON integration_connections
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

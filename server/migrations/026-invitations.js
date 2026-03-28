// ═══════════════════════════════════════════
// Migration 026 — Invitations + Admin Permissions
//
// 1. Creates invitations table for team invites
// 2. Adds permissions JSONB column to admins
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration: Invitations + Permissions')
  console.log('═══════════════════════════════════════\n')

  const isRemote = process.env.DB_SSL === 'true'
  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
    ...(isRemote && { ssl: { rejectUnauthorized: false } }),
  })

  try {
    // 1. Create invitations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invitations (
        id SERIAL PRIMARY KEY,
        org_id INTEGER NOT NULL,
        email VARCHAR(255) NOT NULL,
        role VARCHAR(30) NOT NULL DEFAULT 'manager',
        permissions JSONB DEFAULT '{}',
        invited_by INTEGER NOT NULL,
        token VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        expires_at TIMESTAMPTZ NOT NULL,
        accepted_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('  ✓ Created invitations table')

    // 2. Indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_invitations_org ON invitations(org_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email)')
    console.log('  ✓ Created indexes')

    // 3. Add permissions column to admins
    await pool.query("ALTER TABLE admins ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'")
    console.log('  ✓ Added permissions column to admins')

    console.log('\n  Migration complete ✓\n')
  } catch (err) {
    console.error('Migration failed:', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()

// ═══════════════════════════════════════════
// Migration 023 — Organization detail columns
//
// Adds phone, address, city, state, zip to organizations
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration: Organization detail columns')
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
    await pool.query(`
      ALTER TABLE organizations
        ADD COLUMN IF NOT EXISTS phone   VARCHAR(30),
        ADD COLUMN IF NOT EXISTS address VARCHAR(300),
        ADD COLUMN IF NOT EXISTS city    VARCHAR(100),
        ADD COLUMN IF NOT EXISTS state   VARCHAR(50),
        ADD COLUMN IF NOT EXISTS zip     VARCHAR(20)
    `)
    console.log('  ✓ Added phone, address, city, state, zip to organizations')

    console.log('\n  Migration complete.\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

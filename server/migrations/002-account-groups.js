// ═══════════════════════════════════════════
// Migration: Account Groups
//
// Run: node server/migrations/002-account-groups.js
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration: Account Groups')
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
      CREATE TABLE IF NOT EXISTS account_groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(20) DEFAULT '#475569',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('  ✓ account_groups table created')

    await pool.query(`
      ALTER TABLE accounts ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES account_groups(id)
    `)
    console.log('  ✓ group_id column added to accounts')

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_accounts_group ON accounts(group_id)
    `)
    console.log('  ✓ Index created')

    // Seed default groups
    const existing = await pool.query('SELECT COUNT(*) FROM account_groups')
    if (parseInt(existing.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO account_groups (name, color) VALUES
          ('Zone A', '#059669'),
          ('Zone B', '#3B82F6'),
          ('Zone C', '#F59E0B')
      `)
      console.log('  ✓ Default groups seeded (Zone A, B, C)')
    }

    console.log('\n  Migration complete.\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

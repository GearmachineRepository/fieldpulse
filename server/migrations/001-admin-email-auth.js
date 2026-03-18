// ═══════════════════════════════════════════
// Migration: Add email auth to admins table
//
// Run: node server/migrations/001-admin-email-auth.js
//
// Adds email + password_hash columns to admins.
// Seeds the default admin with email/password.
// Keeps pin_hash for backward compat (can remove later).
// ═══════════════════════════════════════════

import pg from 'pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration: Admin Email Auth')
  console.log('═══════════════════════════════════════\n')

  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
  })

  try {
    // ── Add columns ──
    console.log('  Adding email column...')
    await pool.query(`
      ALTER TABLE admins
      ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE
    `)

    console.log('  Adding password_hash column...')
    await pool.query(`
      ALTER TABLE admins
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)
    `)

    // ── Create index on email ──
    console.log('  Creating email index...')
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_admins_email
      ON admins(email) WHERE email IS NOT NULL
    `)

    // ── Seed default admin with email + password ──
    // Check if the default admin already has an email
    const existing = await pool.query(
      "SELECT id, email FROM admins WHERE name = 'Admin' AND active = true LIMIT 1"
    )

    if (existing.rows.length > 0 && !existing.rows[0].email) {
      const passwordHash = await bcrypt.hash('admin123', 10)
      await pool.query(
        'UPDATE admins SET email = $1, password_hash = $2 WHERE id = $3',
        ['admin@crupoint.com', passwordHash, existing.rows[0].id]
      )
      console.log('  ✓ Default admin updated with email auth')
      console.log('')
      console.log('  ┌─────────────────────────────────────┐')
      console.log('  │  Default admin login:                │')
      console.log('  │  Email:    admin@crupoint.com      │')
      console.log('  │  Password: admin123                  │')
      console.log('  │                                      │')
      console.log('  │  ⚠ Change this in production!        │')
      console.log('  └─────────────────────────────────────┘')
    } else if (existing.rows.length > 0) {
      console.log('  ✓ Default admin already has email — skipping seed')
    } else {
      // No admin exists at all — create one
      const passwordHash = await bcrypt.hash('admin123', 10)
      const pinHash = await bcrypt.hash('0000', 10)
      await pool.query(
        "INSERT INTO admins (name, email, password_hash, pin_hash, role) VALUES ('Admin', 'admin@crupoint.com', $1, $2, 'owner')",
        [passwordHash, pinHash]
      )
      console.log('  ✓ Admin created with email auth')
    }

    console.log('\n  Migration complete.\n')
  } catch (err) {
    console.error('  ✗ Migration failed:', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()

// Migration 009 — Add trial_ends_at to admins
import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

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
  await pool.query('ALTER TABLE admins ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ')
  console.log('  Migration 009 — Added trial_ends_at column to admins')
} catch (err) {
  console.error('  ✗', err.message)
} finally {
  await pool.end()
}

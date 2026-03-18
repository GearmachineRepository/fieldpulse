// ═══════════════════════════════════════════
// Database Setup — Schema creation + seed data
// ═══════════════════════════════════════════

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { isSafeDbName } from './middleware/validate.js'

dotenv.config()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function setup() {
  console.log('\n═══════════════════════════════════════')
  console.log('  CruPoint — Database Setup (Phase 2)')
  console.log('═══════════════════════════════════════\n')

  const dbName = process.env.DB_NAME || 'crupoint'

  // Validate DB name to prevent SQL injection in CREATE DATABASE
  if (!isSafeDbName(dbName)) {
    console.error(`  ✗ Invalid database name "${dbName}" — only alphanumeric and underscores allowed.`)
    process.exit(1)
  }

  const isSupabase = !!process.env.SUPABASE_URL
  const isRemote = process.env.DB_SSL === 'true'
  const sslConfig = isRemote ? { ssl: { rejectUnauthorized: false } } : {}

  // ── Create database (local PostgreSQL only) ──
  // Supabase always uses the 'postgres' database — no CREATE DATABASE allowed.
  if (!isSupabase) {
    const adminPool = new pg.Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: 'postgres',
      ...sslConfig,
    })

    try {
      const dbCheck = await adminPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName])
      if (dbCheck.rows.length === 0) {
        console.log(`  Creating database "${dbName}"...`)
        // Safe because we validated dbName above
        await adminPool.query(`CREATE DATABASE ${dbName}`)
        console.log(`  ✓ Database created`)
      } else {
        console.log(`  ✓ Database "${dbName}" exists`)
      }
    } catch (err) {
      console.error(`  ✗ ${err.message}`)
    } finally {
      await adminPool.end()
    }
  } else {
    console.log('  Supabase detected — skipping database creation')
  }

  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
    ...sslConfig,
  })

  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
    await pool.query(schema)
    console.log('  ✓ Tables created and seed data inserted')

    // Set real bcrypt hashes for seed data
    const vehiclePin = await bcrypt.hash('1234', 10)
    await pool.query('UPDATE vehicles SET pin_hash = $1 WHERE pin_hash = $2', [vehiclePin, '$2a$10$placeholder'])

    const adminPin = await bcrypt.hash('0000', 10)
    await pool.query('UPDATE admins SET pin_hash = $1 WHERE pin_hash = $2', [adminPin, '$2a$10$placeholder'])

    const empPin = await bcrypt.hash('1111', 10)
    await pool.query('UPDATE employees SET pin_hash = $1 WHERE pin_hash = $2', [empPin, '$2a$10$placeholder'])

    // Warn about default PINs
    console.log('\n  ⚠ WARNING: Default PINs are set (1234, 0000, 1111).')
    console.log('    Change these before deploying to production!')

    // Ensure indexes exist
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS idx_spray_logs_created ON spray_logs(created_at DESC)')
      await pool.query('CREATE INDEX IF NOT EXISTS idx_spray_logs_vehicle ON spray_logs(vehicle_id)')
      await pool.query('CREATE INDEX IF NOT EXISTS idx_spray_logs_crew ON spray_logs(crew_name)')
      await pool.query('CREATE INDEX IF NOT EXISTS idx_daily_rosters_date ON daily_crew_rosters(work_date DESC)')
      await pool.query('CREATE INDEX IF NOT EXISTS idx_daily_rosters_crew ON daily_crew_rosters(crew_id)')
      await pool.query('CREATE INDEX IF NOT EXISTS idx_daily_roster_members_roster ON daily_roster_members(roster_id)')
      await pool.query('ALTER TABLE daily_roster_members ADD COLUMN IF NOT EXISTS present BOOLEAN DEFAULT true')
      await pool.query('ALTER TABLE employees ADD COLUMN IF NOT EXISTS cert_number VARCHAR(100)')
    } catch { /* tables/columns already exist */ }

    // Create uploads directory
    const uploadsDir = path.join(__dirname, '..', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
      console.log('  ✓ Uploads directory created')
    }

    const counts = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM admins) AS admins,
        (SELECT COUNT(*) FROM crews) AS crews,
        (SELECT COUNT(*) FROM vehicles) AS vehicles,
        (SELECT COUNT(*) FROM equipment) AS equipment,
        (SELECT COUNT(*) FROM chemicals) AS chemicals,
        (SELECT COUNT(*) FROM employees) AS employees
    `)
    const c = counts.rows[0]
    console.log(`\n  Database ready:`)
    console.log(`    ${c.admins} admin(s)    │ ${c.crews} crews`)
    console.log(`    ${c.vehicles} vehicle(s)  │ ${c.equipment} equipment`)
    console.log(`    ${c.chemicals} chemicals  │ ${c.employees} employees`)
    console.log('\n  Default logins:')
    console.log('    Crew:  Any crew lead → PIN 1111')
    console.log('    Admin: Admin         → PIN 0000')
    console.log('\n  Run: npm run dev\n')
  } catch (err) {
    console.error('  ✗', err.message)
    if (err.message.includes('already exists')) {
      console.log('  (Tables exist — this is fine. Run: npm run dev)\n')
    }
  } finally {
    await pool.end()
  }
}

setup()
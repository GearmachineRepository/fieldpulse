import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function setup() {
  console.log('\n═══════════════════════════════════════')
  console.log('  FieldPulse — Database Setup (Phase 2)')
  console.log('═══════════════════════════════════════\n')

  const adminPool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres',
  })

  const dbName = process.env.DB_NAME || 'fieldpulse'

  try {
    const dbCheck = await adminPool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName])
    if (dbCheck.rows.length === 0) {
      console.log(`  Creating database "${dbName}"...`)
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

  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
  })

  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
    await pool.query(schema)
    console.log('  ✓ Tables created and seed data inserted')

    // Set real bcrypt hashes
    const vehiclePin = await bcrypt.hash('1234', 10)
    await pool.query('UPDATE vehicles SET pin_hash = $1 WHERE name = $2', [vehiclePin, 'Truck 1'])
    console.log('  ✓ Vehicle PIN set (Truck 1 → 1234)')

    const adminPin = await bcrypt.hash('0000', 10)
    await pool.query('UPDATE admins SET pin_hash = $1 WHERE name = $2', [adminPin, 'Admin'])
    console.log('  ✓ Admin PIN set (Admin → 0000)')

    // Set employee PINs
    const empPin = await bcrypt.hash('1111', 10)
    await pool.query('UPDATE employees SET pin_hash = $1 WHERE pin_hash = $2 OR pin_hash IS NULL', [empPin, '$2a$10$placeholder'])
    const empCount = (await pool.query('SELECT COUNT(*) FROM employees')).rows[0].count
    if (parseInt(empCount) > 0) console.log(`  ✓ Employee PINs set (all employees → 1111)`)

    // Run migrations for existing databases
    try {
      await pool.query('ALTER TABLE employees ADD COLUMN IF NOT EXISTS pin_hash VARCHAR(255)')
      await pool.query('ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_crew_lead BOOLEAN DEFAULT false')
    } catch { /* columns already exist */ }

    // Create uploads directory
    const uploadsDir = path.join(__dirname, '..', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
      console.log('  ✓ Uploads directory created')
    }

    const counts = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM admins) as admins,
        (SELECT COUNT(*) FROM crews) as crews,
        (SELECT COUNT(*) FROM vehicles) as vehicles,
        (SELECT COUNT(*) FROM equipment) as equipment,
        (SELECT COUNT(*) FROM chemicals) as chemicals,
        (SELECT COUNT(*) FROM employees) as employees
    `)
    const c = counts.rows[0]
    console.log(`\n  Database ready:`)
    console.log(`    ${c.admins} admin(s)    │ ${c.crews} crews`)
    console.log(`    ${c.vehicles} vehicle(s)  │ ${c.equipment} equipment`)
    console.log(`    ${c.chemicals} chemicals  │ ${c.employees} employees`)
    console.log('\n  Default logins:')
    console.log('    Crew:    Any employee → PIN 1111')
    console.log('    Vehicle: Truck 1      → PIN 1234')
    console.log('    Admin:   Admin        → PIN 0000')
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

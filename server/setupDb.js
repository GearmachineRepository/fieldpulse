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
  console.log('  FieldPulse — Database Setup')
  console.log('═══════════════════════════════════════\n')

  // First, connect without a database to create it if needed
  const adminPool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres',  // Connect to default database
  })

  const dbName = process.env.DB_NAME || 'fieldpulse'

  try {
    // Check if database exists
    const dbCheck = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]
    )

    if (dbCheck.rows.length === 0) {
      console.log(`  Creating database "${dbName}"...`)
      await adminPool.query(`CREATE DATABASE ${dbName}`)
      console.log(`  ✓ Database "${dbName}" created`)
    } else {
      console.log(`  ✓ Database "${dbName}" already exists`)
    }
  } catch (err) {
    console.error(`  ✗ Could not check/create database: ${err.message}`)
    console.error('    You may need to create it manually:')
    console.error(`    createdb ${dbName}`)
  } finally {
    await adminPool.end()
  }

  // Now connect to the fieldpulse database and run schema
  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: dbName,
  })

  try {
    // Read and run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
    await pool.query(schema)
    console.log('  ✓ Tables created and seed data inserted')

    // Create default vehicle with a real bcrypt hash
    // Default PIN: 1234
    const pinHash = await bcrypt.hash('1234', 10)
    await pool.query(
      `UPDATE vehicles SET pin_hash = $1 WHERE name = 'Truck 1'`,
      [pinHash]
    )
    console.log('  ✓ Default vehicle PIN set (Truck 1 → PIN: 1234)')

    // Verify
    const counts = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM equipment) as equipment,
        (SELECT COUNT(*) FROM chemicals) as chemicals,
        (SELECT COUNT(*) FROM vehicles) as vehicles
    `)
    const c = counts.rows[0]
    console.log(`\n  Database ready:`)
    console.log(`    ${c.equipment} equipment items`)
    console.log(`    ${c.chemicals} chemicals`)
    console.log(`    ${c.vehicles} vehicle(s)`)
    console.log('\n  You can now run: npm run dev\n')

  } catch (err) {
    console.error('  ✗ Schema setup failed:', err.message)
    if (err.message.includes('already exists')) {
      console.log('  (Tables may already exist — this is fine)')
      console.log('\n  You can now run: npm run dev\n')
    }
  } finally {
    await pool.end()
  }
}

setup()

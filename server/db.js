// ═══════════════════════════════════════════
// Database — PostgreSQL connection pool
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fieldpulse',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',

  // Pool tuning — sensible defaults for a single-server app
  max: 10,                        // max concurrent connections
  idleTimeoutMillis: 30_000,      // close idle connections after 30s
  connectionTimeoutMillis: 5_000, // fail fast if DB is unreachable
})

// Surface connection errors at startup rather than silently on first query
pool.on('error', (err) => {
  console.error('  ✗ Unexpected PostgreSQL pool error:', err.message)
})

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('  ✓ Connected to PostgreSQL'))
  .catch(err => {
    console.error('  ✗ PostgreSQL connection failed:', err.message)
    console.error('    Make sure PostgreSQL is running and the "fieldpulse" database exists.')
    console.error('    See README.md for setup instructions.')
  })

export default pool

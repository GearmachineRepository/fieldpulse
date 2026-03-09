import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

// Return DATE columns as 'YYYY-MM-DD' strings, not JS Date objects
pg.types.setTypeParser(1082, (val) => val)

const pool = new pg.Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'fieldpulse',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max:                    10,
  idleTimeoutMillis:      30_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (err) => {
  console.error('  ✗ Unexpected PostgreSQL pool error:', err.message)
})

pool.query('SELECT NOW()')
  .then(() => console.log('  ✓ Connected to PostgreSQL'))
  .catch(err => {
    console.error('  ✗ PostgreSQL connection failed:', err.message)
    console.error('    Make sure PostgreSQL is running and the "fieldpulse" database exists.')
    console.error('    See README.md for setup instructions.')
  })

export default pool
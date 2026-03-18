// ═══════════════════════════════════════════
// Database — PostgreSQL connection pool
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
import { logger } from './utils/logger.js'

dotenv.config()

// Return DATE columns as 'YYYY-MM-DD' strings, not JS Date objects
pg.types.setTypeParser(1082, (val) => val)

const isRemote = process.env.DB_SSL === 'true'

const pool = new pg.Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'crupoint',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max:                    10,
  idleTimeoutMillis:      30_000,
  connectionTimeoutMillis: 5_000,
  ...(isRemote && { ssl: { rejectUnauthorized: false } }),
})

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected PostgreSQL pool error')
})

pool.query('SELECT NOW()')
  .then(() => logger.info('Connected to PostgreSQL'))
  .catch(err => {
    logger.error({ err }, 'PostgreSQL connection failed — ensure the database exists and is running')
  })

export default pool
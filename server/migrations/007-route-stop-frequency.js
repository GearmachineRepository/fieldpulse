// ═══════════════════════════════════════════
// Migration 007 — Route Stop Frequency + Exceptions
//
// Frequency lives on route_stops directly.
// No separate service_plans table needed.
// Exceptions handle skips and pauses per stop.
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
  })

  try {
    console.log('\n  Migration 007 — Route Stop Frequency + Exceptions\n')

    // Add frequency columns to route_stops
    await pool.query(`ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) DEFAULT 'weekly'`)
    await pool.query(`ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS interval_weeks INTEGER DEFAULT 1`)
    await pool.query(`ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS season_start VARCHAR(5)`)
    await pool.query(`ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS season_end VARCHAR(5)`)
    await pool.query(`ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS service_status VARCHAR(20) DEFAULT 'active'`)
    await pool.query(`ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE`)
    await pool.query(`ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS end_date DATE`)
    console.log('  ✓ Added frequency columns to route_stops')

    // Exceptions table (skips, pauses per stop)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stop_exceptions (
        id              SERIAL PRIMARY KEY,
        route_stop_id   INTEGER NOT NULL REFERENCES route_stops(id) ON DELETE CASCADE,
        exception_type  VARCHAR(20) NOT NULL,
        date_start      DATE NOT NULL,
        date_end        DATE,
        reason          TEXT,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('  ✓ Created stop_exceptions table')

    await pool.query('CREATE INDEX IF NOT EXISTS idx_se_stop ON stop_exceptions(route_stop_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_se_dates ON stop_exceptions(date_start, date_end)')
    console.log('  ✓ Created indexes')

    // Drop service_plans and service_exceptions if they exist (from earlier attempts)
    await pool.query('DROP TABLE IF EXISTS service_exceptions CASCADE')
    await pool.query('DROP TABLE IF EXISTS service_plans CASCADE')
    console.log('  ✓ Cleaned up old service_plans tables (if any)')

    console.log('\n  Route stop columns:')
    console.log('    frequency       — weekly | biweekly | monthly | custom')
    console.log('    interval_weeks  — 1=weekly, 2=biweekly, 4=monthly, custom=N')
    console.log('    season_start    — MM-DD (null = year-round)')
    console.log('    season_end      — MM-DD')
    console.log('    service_status  — active | paused | canceled')
    console.log('    start_date      — when service begins')
    console.log('    end_date        — when service ends (null = indefinite)')
    console.log('\n  Done. Run: npm run dev\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

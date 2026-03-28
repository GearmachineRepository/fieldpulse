// ═══════════════════════════════════════════
// Migration 007 — Service Plans + Exceptions
//
// Service plans define recurring visit schedules.
// Visits are calculated on the fly, not pre-generated.
// Exceptions handle skips, pauses, and one-offs.
// Completions are the only real records created.
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
    console.log('\n  Migration 007 — Service Plans + Exceptions\n')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_plans (
        id              SERIAL PRIMARY KEY,
        account_id      INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        status          VARCHAR(20) NOT NULL DEFAULT 'active',
        frequency       VARCHAR(30) NOT NULL DEFAULT 'weekly',
        interval_weeks  INTEGER DEFAULT 1,
        preferred_days  INTEGER[] DEFAULT '{1}',
        route_id        INTEGER REFERENCES routes(id) ON DELETE SET NULL,
        start_date      DATE DEFAULT CURRENT_DATE,
        end_date        DATE,
        season_start    VARCHAR(5),
        season_end      VARCHAR(5),
        notes           TEXT,
        active          BOOLEAN DEFAULT true,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('  ✓ Created service_plans table')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_exceptions (
        id                SERIAL PRIMARY KEY,
        service_plan_id   INTEGER NOT NULL REFERENCES service_plans(id) ON DELETE CASCADE,
        exception_type    VARCHAR(20) NOT NULL,
        date_start        DATE NOT NULL,
        date_end          DATE,
        reason            TEXT,
        created_at        TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('  ✓ Created service_exceptions table')

    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_sp_account ON service_plans(account_id) WHERE active = true',
    )
    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_sp_route ON service_plans(route_id) WHERE active = true',
    )
    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_sp_status ON service_plans(status) WHERE active = true',
    )
    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_se_plan ON service_exceptions(service_plan_id)',
    )
    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_se_dates ON service_exceptions(date_start, date_end)',
    )
    console.log('  ✓ Created indexes')

    console.log('\n  Done. Run: npm run dev\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

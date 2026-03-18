// ═══════════════════════════════════════════
// Migration: Schedule Events
//
// Run: node server/migrations/003-schedule-events.js
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration: Schedule Events')
  console.log('═══════════════════════════════════════\n')

  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
  })

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schedule_events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        notes TEXT,
        event_date DATE NOT NULL,
        start_time VARCHAR(10),
        end_time VARCHAR(10),
        event_type VARCHAR(30) DEFAULT 'task',
        color VARCHAR(20) DEFAULT '#3B82F6',
        crew_id INTEGER REFERENCES crews(id),
        account_id INTEGER REFERENCES accounts(id),
        completed BOOLEAN DEFAULT false,
        completed_at TIMESTAMPTZ,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('  ✓ schedule_events table created')

    await pool.query('CREATE INDEX IF NOT EXISTS idx_events_date ON schedule_events(event_date)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_events_crew ON schedule_events(crew_id)')
    console.log('  ✓ Indexes created')

    console.log('\n  Migration complete.\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

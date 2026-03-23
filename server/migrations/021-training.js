// ═══════════════════════════════════════════
// Migration 021 — Training sessions + signoffs
//
// training_sessions: tracks all training events per org
// training_signoffs: append-only employee sign-off records (legal requirement)
//
// Run: node server/migrations/021-training.js
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration 021: Training')
  console.log('═══════════════════════════════════════\n')

  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
  })

  try {
    // 1. Create training_sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS training_sessions (
        id SERIAL PRIMARY KEY,
        org_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        trainer VARCHAR(255),
        training_date DATE NOT NULL,
        duration_hours NUMERIC(5,2),
        location VARCHAR(255),
        type VARCHAR(100),
        status VARCHAR(50) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      )
    `)
    console.log('  ✓ Created training_sessions table')

    // 2. Create indexes for training_sessions
    await pool.query('CREATE INDEX IF NOT EXISTS idx_training_org ON training_sessions(org_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_training_date ON training_sessions(training_date)')
    console.log('  ✓ Created training_sessions indexes')

    // 3. Create training_signoffs table (append-only)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS training_signoffs (
        id SERIAL PRIMARY KEY,
        org_id UUID NOT NULL,
        training_session_id INTEGER NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        signed_at TIMESTAMPTZ DEFAULT now(),
        signature_data TEXT,
        notes TEXT,
        UNIQUE(training_session_id, employee_id)
      )
    `)
    console.log('  ✓ Created training_signoffs table')

    // 4. Create indexes for training_signoffs
    await pool.query('CREATE INDEX IF NOT EXISTS idx_signoffs_session ON training_signoffs(training_session_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_signoffs_employee ON training_signoffs(employee_id)')
    console.log('  ✓ Created training_signoffs indexes')

    console.log('\n  Migration complete.\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

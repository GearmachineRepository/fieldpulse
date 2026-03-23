// ═══════════════════════════════════════════
// Migration 018 — Training sessions + signoffs
//
// Training records with immutable employee sign-off trail.
//
// Run: node server/migrations/018-training.js
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration 018: Training')
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
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        company_id UUID REFERENCES companies(id),
        session_type TEXT,
        title TEXT NOT NULL,
        conducted_by TEXT,
        session_date TIMESTAMPTZ NOT NULL,
        description TEXT,
        video_url TEXT,
        all_signed BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('  ✓ Created training_sessions table')

    // 2. Create training_signoffs table (immutable)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS training_signoffs (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        session_id UUID REFERENCES training_sessions(id),
        employee_id UUID REFERENCES employees(id),
        signed_at TIMESTAMPTZ,
        signature_token TEXT NOT NULL,
        session_token TEXT,
        ip_address INET,
        locked BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(session_id, employee_id)
      )
    `)
    console.log('  ✓ Created training_signoffs table')

    // 3. Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_training_sessions_company ON training_sessions(company_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON training_sessions(company_id, session_date)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_training_signoffs_session ON training_signoffs(session_id)')
    await pool.query('CREATE INDEX IF NOT EXISTS idx_training_signoffs_employee ON training_signoffs(employee_id)')
    console.log('  ✓ Created indexes')

    // 4. Enable RLS on training_sessions
    await pool.query('ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY')
    await pool.query(`
      CREATE POLICY training_sessions_company_isolation ON training_sessions
        USING (company_id = current_setting('app.company_id')::uuid)
    `)
    console.log('  ✓ Enabled RLS on training_sessions')

    // 5. Enable RLS on training_signoffs (via session join)
    await pool.query('ALTER TABLE training_signoffs ENABLE ROW LEVEL SECURITY')
    await pool.query(`
      CREATE POLICY training_signoffs_company_isolation ON training_signoffs
        USING (
          session_id IN (
            SELECT id FROM training_sessions
            WHERE company_id = current_setting('app.company_id')::uuid
          )
        )
    `)
    console.log('  ✓ Enabled RLS on training_signoffs')

    // 6. No-update policy on training_signoffs (immutable)
    await pool.query(`
      CREATE POLICY training_signoffs_no_update ON training_signoffs
        AS RESTRICTIVE
        FOR UPDATE
        USING (false)
    `)
    console.log('  ✓ Created no_update policy on training_signoffs')

    console.log('\n  Migration complete.\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

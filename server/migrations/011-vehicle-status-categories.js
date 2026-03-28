// ═══════════════════════════════════════════
// Migration 011 — Vehicle status + shared categories table
//
// 1. Adds status column to vehicles
// 2. Creates shared categories table (org-scoped, multi-scope)
//
// Run: node server/migrations/011-vehicle-status-categories.js
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration 011: Vehicle status + Categories')
  console.log('═══════════════════════════════════════\n')

  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
  })

  try {
    // 1. Add status column to vehicles
    await pool.query(`
      ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Active'
    `)
    console.log('  ✓ Added status column to vehicles')

    // 2. Create shared categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        org_id UUID NOT NULL REFERENCES organizations(id),
        scope VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(20) DEFAULT '#475569',
        sort_order INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(org_id, scope, name)
      )
    `)
    console.log('  ✓ Created categories table')

    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_categories_org_scope ON categories(org_id, scope)',
    )
    console.log('  ✓ Created indexes')

    // 3. Seed default categories for each org
    const orgs = await pool.query('SELECT id FROM organizations')
    for (const org of orgs.rows) {
      const existing = await pool.query('SELECT COUNT(*) FROM categories WHERE org_id = $1', [
        org.id,
      ])
      if (parseInt(existing.rows[0].count) > 0) {
        console.log(`  ⊘ Org ${org.id} already has categories — skipping seed`)
        continue
      }

      await pool.query(
        `
        INSERT INTO categories (org_id, scope, name, sort_order) VALUES
          ($1, 'sds', 'Herbicides', 1),
          ($1, 'sds', 'Pesticides', 2),
          ($1, 'sds', 'Fertilizers', 3),
          ($1, 'sds', 'Solvents', 4),
          ($1, 'sds', 'Other', 5),
          ($1, 'equipment', 'Mowers', 1),
          ($1, 'equipment', 'Trenchers', 2),
          ($1, 'equipment', 'Compactors', 3),
          ($1, 'equipment', 'Blowers', 4),
          ($1, 'equipment', 'Other', 5)
      `,
        [org.id],
      )
      console.log(`  ✓ Seeded categories for org ${org.id}`)
    }

    console.log('\n  Migration complete.\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

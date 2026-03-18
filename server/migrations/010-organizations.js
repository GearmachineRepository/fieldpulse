// ═══════════════════════════════════════════
// Migration 010 — Organizations + Multi-tenant org_id
//
// 1. Creates organizations table
// 2. Adds org_id to all tenant-scoped tables
// 3. Creates a default org and backfills existing data
// 4. Sets org_id NOT NULL after backfill
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration: Organizations + Multi-tenant')
  console.log('═══════════════════════════════════════\n')

  const isRemote = process.env.DB_SSL === 'true'
  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
    ...(isRemote && { ssl: { rejectUnauthorized: false } }),
  })

  try {
    // 1. Create organizations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        owner_id INTEGER,
        plan VARCHAR(30) DEFAULT 'trial',
        trial_ends_at TIMESTAMPTZ,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('  ✓ organizations table created')

    // 2. Add org_id to all tenant-scoped tables
    const tables = [
      'admins', 'crews', 'vehicles', 'employees', 'equipment', 'chemicals',
      'spray_logs', 'accounts', 'account_groups', 'routes',
      'schedule_events', 'resource_categories', 'resources',
      'daily_crew_rosters', 'service_plans',
    ]

    for (const table of tables) {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id)`)
    }
    console.log(`  ✓ Added org_id to ${tables.length} tables`)

    // 3. Create indexes for org_id
    for (const table of tables) {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_${table}_org ON ${table}(org_id)`)
    }
    console.log('  ✓ Created org_id indexes')

    // 4. Create default organization from existing data
    const existingOrg = await pool.query("SELECT id FROM organizations WHERE slug = 'default' LIMIT 1")

    let orgId
    if (existingOrg.rows.length > 0) {
      orgId = existingOrg.rows[0].id
      console.log('  ✓ Default organization already exists')
    } else {
      // Find the first admin to set as owner
      const firstAdmin = await pool.query('SELECT id FROM admins WHERE active = true ORDER BY id LIMIT 1')
      const ownerId = firstAdmin.rows[0]?.id || null

      const orgResult = await pool.query(
        `INSERT INTO organizations (name, slug, owner_id, plan, trial_ends_at)
         VALUES ('My Organization', 'default', $1, 'trial', NOW() + INTERVAL '14 days')
         RETURNING id`,
        [ownerId]
      )
      orgId = orgResult.rows[0].id
      console.log(`  ✓ Created default organization: ${orgId}`)
    }

    // 5. Backfill org_id for all existing data
    for (const table of tables) {
      const result = await pool.query(
        `UPDATE ${table} SET org_id = $1 WHERE org_id IS NULL`,
        [orgId]
      )
      if (result.rowCount > 0) {
        console.log(`    ✓ Backfilled ${result.rowCount} rows in ${table}`)
      }
    }

    // 6. Set org_id NOT NULL (after backfill)
    for (const table of tables) {
      try {
        await pool.query(`ALTER TABLE ${table} ALTER COLUMN org_id SET NOT NULL`)
      } catch (err) {
        // May fail if table has rows without org_id from other sources
        console.log(`    ⚠ Could not set NOT NULL on ${table}.org_id: ${err.message}`)
      }
    }
    console.log('  ✓ Set org_id NOT NULL on all tables')

    console.log('\n  Migration complete.\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

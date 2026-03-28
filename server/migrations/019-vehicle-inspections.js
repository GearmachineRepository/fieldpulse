// ═══════════════════════════════════════════
// Migration 019 — Vehicle inspections + work orders
//
// Pre-trip inspection records and defect-driven work orders.
//
// Run: node server/migrations/019-vehicle-inspections.js
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration 019: Vehicle Inspections + Work Orders')
  console.log('═══════════════════════════════════════\n')

  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
  })

  try {
    // 1. Create vehicle_inspections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicle_inspections (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        company_id UUID REFERENCES companies(id),
        vehicle_id UUID REFERENCES vehicles(id),
        submitted_by UUID REFERENCES employees(id),
        inspection_date TIMESTAMPTZ NOT NULL,
        items JSONB,
        has_flags BOOLEAN DEFAULT false,
        status TEXT DEFAULT 'submitted',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('  ✓ Created vehicle_inspections table')

    // 2. Create work_orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS work_orders (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        company_id UUID REFERENCES companies(id),
        vehicle_id UUID REFERENCES vehicles(id),
        inspection_id UUID REFERENCES vehicle_inspections(id),
        assigned_mechanic UUID REFERENCES employees(id),
        defect_description TEXT,
        status TEXT DEFAULT 'open',
        acknowledged_at TIMESTAMPTZ,
        acknowledged_by UUID REFERENCES employees(id),
        resolved_at TIMESTAMPTZ,
        resolved_by UUID REFERENCES employees(id),
        resolution_notes TEXT,
        vehicle_released BOOLEAN DEFAULT false,
        released_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('  ✓ Created work_orders table')

    // 3. Create indexes
    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_company ON vehicle_inspections(company_id)',
    )
    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vehicle ON vehicle_inspections(vehicle_id)',
    )
    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_date ON vehicle_inspections(company_id, inspection_date)',
    )
    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_work_orders_company ON work_orders(company_id)',
    )
    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle ON work_orders(vehicle_id)',
    )
    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_work_orders_inspection ON work_orders(inspection_id)',
    )
    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(company_id, status)',
    )
    console.log('  ✓ Created indexes')

    // 4. Enable RLS on vehicle_inspections
    await pool.query('ALTER TABLE vehicle_inspections ENABLE ROW LEVEL SECURITY')
    await pool.query(`
      CREATE POLICY vehicle_inspections_company_isolation ON vehicle_inspections
        USING (company_id = current_setting('app.company_id')::uuid)
    `)
    console.log('  ✓ Enabled RLS on vehicle_inspections')

    // 5. Enable RLS on work_orders
    await pool.query('ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY')
    await pool.query(`
      CREATE POLICY work_orders_company_isolation ON work_orders
        USING (company_id = current_setting('app.company_id')::uuid)
    `)
    console.log('  ✓ Enabled RLS on work_orders')

    console.log('\n  Migration complete.\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

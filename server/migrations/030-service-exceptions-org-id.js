// Migration 030 — Add org_id to service_exceptions
//
// service_exceptions was created in migration 007, before
// migration 010 added org_id to other tables. This backfills
// org_id from the parent service_plans table.

export default {
  name: '030-service-exceptions-org-id',

  async up(db) {
    // Add nullable column first
    await db.query(`
      ALTER TABLE service_exceptions
      ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES organizations(id)
    `)

    // Backfill from parent service_plans
    await db.query(`
      UPDATE service_exceptions se
      SET org_id = sp.org_id
      FROM service_plans sp
      WHERE se.service_plan_id = sp.id
        AND se.org_id IS NULL
    `)

    // Set NOT NULL after backfill
    await db.query(`
      ALTER TABLE service_exceptions
      ALTER COLUMN org_id SET NOT NULL
    `)

    // Create index
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_service_exceptions_org
      ON service_exceptions(org_id)
    `)
  },

  async down(db) {
    await db.query('ALTER TABLE service_exceptions DROP COLUMN IF EXISTS org_id')
  },
}

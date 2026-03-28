// Migration 031 — Rename company_id → org_id
//
// dashboard_pins and integration_connections used company_id
// while every other table uses org_id. This aligns them.

export default {
  name: '031-rename-company-id-to-org-id',

  async up(db) {
    // ── dashboard_pins ──
    await db.query('ALTER TABLE dashboard_pins RENAME COLUMN company_id TO org_id')
    await db.query('DROP INDEX IF EXISTS idx_dashboard_pins_company')
    await db.query('CREATE INDEX IF NOT EXISTS idx_dashboard_pins_org ON dashboard_pins(org_id)')

    // Drop and recreate the unique constraint with the new column name
    await db.query('ALTER TABLE dashboard_pins DROP CONSTRAINT IF EXISTS dashboard_pins_company_id_card_key_key')
    await db.query('ALTER TABLE dashboard_pins ADD CONSTRAINT dashboard_pins_org_id_card_key_key UNIQUE(org_id, card_key)')

    // RLS policy — drop old, create new
    await db.query('DROP POLICY IF EXISTS dashboard_pins_company_isolation ON dashboard_pins')
    await db.query(`
      CREATE POLICY dashboard_pins_org_isolation ON dashboard_pins
        USING (org_id = current_setting('app.org_id')::uuid)
    `)

    // ── integration_connections ──
    await db.query('ALTER TABLE integration_connections RENAME COLUMN company_id TO org_id')
    await db.query('DROP INDEX IF EXISTS idx_integration_connections_company')
    await db.query('CREATE INDEX IF NOT EXISTS idx_integration_connections_org ON integration_connections(org_id)')

    // RLS policy — drop old, create new
    await db.query('DROP POLICY IF EXISTS integration_connections_company_isolation ON integration_connections')
    await db.query(`
      CREATE POLICY integration_connections_org_isolation ON integration_connections
        USING (org_id = current_setting('app.org_id')::uuid)
    `)
  },

  async down(db) {
    // Reverse: rename org_id back to company_id
    await db.query('ALTER TABLE dashboard_pins RENAME COLUMN org_id TO company_id')
    await db.query('ALTER TABLE integration_connections RENAME COLUMN org_id TO company_id')
  },
}

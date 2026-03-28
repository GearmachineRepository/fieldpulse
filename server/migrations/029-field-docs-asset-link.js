// Migration 029: Add asset_type + asset_id to field_docs
// Links inspections to specific vehicles or equipment
export async function up(db) {
  await db.query(`
    ALTER TABLE field_docs
      ADD COLUMN IF NOT EXISTS asset_type VARCHAR(30),
      ADD COLUMN IF NOT EXISTS asset_id INTEGER,
      ADD COLUMN IF NOT EXISTS asset_name VARCHAR(200);

    CREATE INDEX IF NOT EXISTS idx_field_docs_asset
      ON field_docs (asset_type, asset_id)
      WHERE asset_type IS NOT NULL;
  `)
}

// Migration 028 — Registration codes (revocable, expirable)
//
// Replaces static CompanyCode env var with database-backed
// codes that admins can generate, set expiry on, and revoke.

export default {
  name: '028-registration-codes',

  async up(db) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS registration_codes (
        id          SERIAL PRIMARY KEY,
        org_id      UUID NOT NULL,
        code        VARCHAR(20) NOT NULL UNIQUE,
        label       VARCHAR(100),
        expires_at  TIMESTAMPTZ,
        revoked     BOOLEAN DEFAULT false,
        created_by  INTEGER,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_reg_codes_org ON registration_codes(org_id);
      CREATE INDEX IF NOT EXISTS idx_reg_codes_code ON registration_codes(code);
    `)
  },

  async down(db) {
    await db.query(`DROP TABLE IF EXISTS registration_codes;`)
  },
}

// ═══════════════════════════════════════════
// Migration 027 — Field Docs (general notes, inspections, etc.)
// ═══════════════════════════════════════════

import db from '../db.js'

export default async function migrate027() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS field_docs (
      id SERIAL PRIMARY KEY,
      org_id UUID NOT NULL,
      type VARCHAR(30) NOT NULL,
      title VARCHAR(255) NOT NULL,
      body TEXT,
      location VARCHAR(255),
      gps_lat DECIMAL(10,7),
      gps_lng DECIMAL(10,7),
      crew_name VARCHAR(100),
      employee_id INTEGER,
      employee_name VARCHAR(100),
      checklist JSONB,
      status VARCHAR(20) DEFAULT 'submitted',
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_field_docs_org ON field_docs(org_id);
    CREATE INDEX IF NOT EXISTS idx_field_docs_type ON field_docs(type);
    CREATE INDEX IF NOT EXISTS idx_field_docs_created ON field_docs(created_at DESC);

    CREATE TABLE IF NOT EXISTS field_doc_photos (
      id SERIAL PRIMARY KEY,
      field_doc_id INTEGER NOT NULL REFERENCES field_docs(id) ON DELETE CASCADE,
      org_id UUID NOT NULL,
      filename VARCHAR(255) NOT NULL,
      original_name VARCHAR(255),
      mime_type VARCHAR(100),
      size_bytes INTEGER,
      storage_path VARCHAR(500),
      caption VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_field_doc_photos_doc ON field_doc_photos(field_doc_id);
  `)

  console.log('  ✓ 027 — field_docs + field_doc_photos tables')
}

// ═══════════════════════════════════════════
// Migration: Resources Library
//
// Run: node server/migrations/004-resources.js
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration: Resources Library')
  console.log('═══════════════════════════════════════\n')

  const pool = new pg.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'crupoint',
  })

  try {
    // Resource categories
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resource_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(30) DEFAULT 'folder',
        color VARCHAR(20) DEFAULT '#475569',
        sort_order INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('  ✓ resource_categories table created')

    // Resources (links or files)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS resources (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES resource_categories(id),
        resource_type VARCHAR(20) DEFAULT 'link',
        url VARCHAR(500),
        filename VARCHAR(255),
        original_name VARCHAR(255),
        mime_type VARCHAR(100),
        file_size INTEGER,
        tags TEXT[],
        pinned BOOLEAN DEFAULT false,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)
    console.log('  ✓ resources table created')

    await pool.query('CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category_id)')
    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_resources_pinned ON resources(pinned DESC, created_at DESC)',
    )
    console.log('  ✓ Indexes created')

    // Seed default categories
    const existing = await pool.query('SELECT COUNT(*) FROM resource_categories')
    if (parseInt(existing.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO resource_categories (name, icon, color, sort_order) VALUES
          ('SDS Sheets', 'shield', '#EF4444', 1),
          ('Safety Manuals', 'book-open', '#F59E0B', 2),
          ('Chemical Labels', 'tag', '#7C3AED', 3),
          ('Training Materials', 'graduation-cap', '#3B82F6', 4),
          ('Company Policies', 'file-text', '#059669', 5),
          ('Equipment Manuals', 'wrench', '#0891B2', 6)
      `)
      console.log('  ✓ Default categories seeded')
    }

    console.log('\n  Migration complete.\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

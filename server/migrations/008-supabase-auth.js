// ═══════════════════════════════════════════
// Migration 008 — Supabase Auth Integration
//
// 1. Adds supabase_uid column to admins table
// 2. Creates Supabase Auth users for existing admins
// 3. Links them via supabase_uid
// ═══════════════════════════════════════════

import pg from 'pg'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config()

async function migrate() {
  console.log('\n═══════════════════════════════════════')
  console.log('  Migration: Supabase Auth')
  console.log('═══════════════════════════════════════\n')

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('  ✗ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

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
    // 1. Add supabase_uid column
    await pool.query('ALTER TABLE admins ADD COLUMN IF NOT EXISTS supabase_uid UUID UNIQUE')
    console.log('  ✓ Added supabase_uid column to admins')

    // 2. Get existing admins that need Supabase Auth users
    const admins = await pool.query(
      'SELECT id, name, email, role, password_hash FROM admins WHERE active = true AND email IS NOT NULL AND supabase_uid IS NULL',
    )

    if (admins.rows.length === 0) {
      console.log('  ✓ No admins to migrate (already migrated or no email set)')
    }

    for (const admin of admins.rows) {
      // Check if a Supabase Auth user with this email already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existing = existingUsers?.users?.find(
        (u) => u.email?.toLowerCase() === admin.email.toLowerCase(),
      )

      let uid
      if (existing) {
        uid = existing.id
        console.log(`  ✓ Supabase Auth user already exists for ${admin.email}`)
      } else {
        // Create Supabase Auth user with a temporary password
        // Admins will need to reset their password on first login
        const tempPassword = `CruPoint-Reset-${Date.now()}-${Math.random().toString(36).slice(2)}`
        const { data, error } = await supabase.auth.admin.createUser({
          email: admin.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            admin_id: admin.id,
            name: admin.name,
            role: admin.role,
          },
        })

        if (error) {
          console.error(
            `  ✗ Failed to create Supabase Auth user for ${admin.email}:`,
            error.message,
          )
          continue
        }
        uid = data.user.id
        console.log(`  ✓ Created Supabase Auth user for ${admin.email}`)
      }

      // Link the Supabase Auth user to the admins table
      await pool.query('UPDATE admins SET supabase_uid = $1 WHERE id = $2', [uid, admin.id])
      console.log(`  ✓ Linked admin ${admin.email} → ${uid}`)
    }

    console.log('\n  ┌─────────────────────────────────────┐')
    console.log('  │  Supabase Auth migration complete    │')
    console.log('  │                                      │')
    console.log('  │  Existing admins must reset their    │')
    console.log('  │  password via "Forgot password?"     │')
    console.log('  │  on the login page.                  │')
    console.log('  └─────────────────────────────────────┘')
    console.log('\n  Migration complete.\n')
  } catch (err) {
    console.error('  ✗', err.message)
  } finally {
    await pool.end()
  }
}

migrate()

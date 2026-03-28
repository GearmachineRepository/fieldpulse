// ═══════════════════════════════════════════
// DB Utilities — query helpers
// ═══════════════════════════════════════════

import pool from '../db.js'
import { AppError } from './AppError.js'

/**
 * Runs a callback inside a PostgreSQL transaction.
 * Automatically commits on success and rolls back on error.
 *
 * @param {(client: import('pg').PoolClient) => Promise<T>} callback
 * @returns {Promise<T>}
 */
export async function withTransaction(callback) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/**
 * Extracts the org_id from req.user.
 * Throws 403 if no org_id is present.
 */
export function getOrgId(req) {
  const orgId = req.user?.orgId
  if (!orgId) throw new AppError('Organization context required', 403)
  return orgId
}

/**
 * Builds a parameterized WHERE clause from a map of column → value.
 * Skips entries where value is null/undefined.
 *
 * @param {Record<string, unknown>} conditions  e.g. { 'sl.vehicle_id': vehicleId }
 * @param {unknown[]} params  Existing params array to append to
 * @returns {{ whereStr: string, params: unknown[] }}
 */
export function buildWhere(conditions, params = []) {
  const clauses = []
  for (const [col, val] of Object.entries(conditions)) {
    if (val == null) continue
    params.push(val)
    clauses.push(`${col} = $${params.length}`)
  }
  const whereStr = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''
  return { whereStr, params }
}

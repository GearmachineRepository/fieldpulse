// ═══════════════════════════════════════════
// SDS Public Route — QR code access (no auth)
//
// Serves SDS entries by ID for field crews
// scanning QR codes. Redirects to PDF if available,
// otherwise returns basic SDS info as JSON.
// ═══════════════════════════════════════════

import { Router } from 'express'
import db from '../db.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

/** @route GET /sds/:id — Public SDS access (no auth required) */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const r = await db.query(
      `SELECT id, name, type, epa, active_ingredient, signal_word,
            restricted, sds_url, label_url, created_at
     FROM chemicals
     WHERE id = $1`,
      [req.params.id],
    )

    if (r.rows.length === 0) {
      return res.status(404).json({ error: 'SDS entry not found' })
    }

    const entry = r.rows[0]

    // If a PDF URL exists, redirect to it
    if (entry.sds_url) {
      return res.redirect(entry.sds_url)
    }

    // Otherwise return the entry as JSON
    res.json({
      id: entry.id,
      name: entry.name,
      type: entry.type,
      epa: entry.epa,
      active_ingredient: entry.active_ingredient,
      signal_word: entry.signal_word,
      restricted: entry.restricted,
    })
  }),
)

export default router

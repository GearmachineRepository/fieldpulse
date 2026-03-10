// ═══════════════════════════════════════════
// Device Routes — Company code verification
//
// Validates a company code for field device
// registration. In single-tenant mode, checks
// against the CompanyCode env var. In multi-
// tenant mode, this would query an orgs table.
// ═══════════════════════════════════════════

import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { validateBody } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

// Rate-limit: 5 attempts per 15 min per IP
const codeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts — try again later' },
})

/**
 * @route POST /api/device/verify-code
 * Public — validates a company code for field device registration.
 *
 * Single-tenant: checks against CompanyCode env var.
 * Multi-tenant (future): query organizations table by code.
 *
 * Returns company name on success so the device can display it.
 */
router.post('/verify-code',
  codeLimiter,
  validateBody({ code: { required: true, type: 'string' } }),
  asyncHandler(async (req, res) => {
    const { code } = req.body
    const validCode = process.env.CompanyCode

    if (!validCode) {
      return res.status(500).json({ error: 'Company code not configured on server' })
    }

    // Case-insensitive, trimmed comparison
    if (code.trim().toUpperCase() !== validCode.trim().toUpperCase()) {
      return res.status(401).json({ error: 'Invalid company code' })
    }

    // Return company info — in multi-tenant this would come from the DB
    res.json({
      valid: true,
      company: {
        name: process.env.VITE_APP_NAME || 'FieldPulse',
        code: validCode.trim().toUpperCase(),
      },
    })
  })
)

export default router

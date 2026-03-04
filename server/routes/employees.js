// ═══════════════════════════════════════════
// Employee Routes
// ═══════════════════════════════════════════

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateIdParam } from '../middleware/validate.js'

export default function employeeRoutes(upload) {
  const router = Router()

  router.get('/', requireAuth, async (req, res) => {
    try {
      const r = await db.query(
        `SELECT e.*, c.name AS crew_name,
                CASE WHEN e.pin_hash IS NOT NULL THEN true ELSE false END AS has_pin
         FROM employees e LEFT JOIN crews c ON c.id = e.default_crew_id
         WHERE e.active = true ORDER BY e.last_name, e.first_name`
      )
      res.json(r.rows.map(row => ({ ...row, cert_number: row.cert_number || null })))
    } catch (e) {
      console.error('GET /employees error:', e)
      res.status(500).json({ error: 'Server error' })
    }
  })

  router.post('/', requireAuth, upload.single('photo'), async (req, res) => {
    try {
      const { firstName, lastName, phone, licenseNumber, certNumber, defaultCrewId, pin, isCrewLead } = req.body
      if (!firstName || !lastName) {
        return res.status(400).json({ error: 'firstName and lastName are required' })
      }
      const photoFilename = req.file ? req.file.filename : null
      const pinHash = pin ? await bcrypt.hash(pin, 10) : null
      const r = await db.query(
        `INSERT INTO employees (first_name, last_name, phone, license_number, cert_number, photo_filename, pin_hash, is_crew_lead, default_crew_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [firstName, lastName, phone || null, licenseNumber || null, certNumber || null,
         photoFilename, pinHash, isCrewLead === 'true' || isCrewLead === true, defaultCrewId || null]
      )
      res.json(r.rows[0])
    } catch (e) {
      console.error('POST /employees error:', e)
      res.status(500).json({ error: 'Failed' })
    }
  })

  router.put('/:id', requireAuth, validateIdParam, upload.single('photo'), async (req, res) => {
    try {
      const { firstName, lastName, phone, licenseNumber, certNumber, defaultCrewId, pin, isCrewLead } = req.body
      const photoFilename = req.file ? req.file.filename : undefined

      let query, params
      if (pin) {
        const pinHash = await bcrypt.hash(pin, 10)
        if (photoFilename) {
          query = `UPDATE employees SET first_name=$1, last_name=$2, phone=$3, license_number=$4, cert_number=$5,
                   photo_filename=$6, pin_hash=$7, is_crew_lead=$8, default_crew_id=$9 WHERE id=$10`
          params = [firstName, lastName, phone, licenseNumber, certNumber, photoFilename, pinHash,
                    isCrewLead === 'true' || isCrewLead === true, defaultCrewId || null, req.params.id]
        } else {
          query = `UPDATE employees SET first_name=$1, last_name=$2, phone=$3, license_number=$4, cert_number=$5,
                   pin_hash=$6, is_crew_lead=$7, default_crew_id=$8 WHERE id=$9`
          params = [firstName, lastName, phone, licenseNumber, certNumber, pinHash,
                    isCrewLead === 'true' || isCrewLead === true, defaultCrewId || null, req.params.id]
        }
      } else {
        if (photoFilename) {
          query = `UPDATE employees SET first_name=$1, last_name=$2, phone=$3, license_number=$4, cert_number=$5,
                   photo_filename=$6, is_crew_lead=$7, default_crew_id=$8 WHERE id=$9`
          params = [firstName, lastName, phone, licenseNumber, certNumber, photoFilename,
                    isCrewLead === 'true' || isCrewLead === true, defaultCrewId || null, req.params.id]
        } else {
          query = `UPDATE employees SET first_name=$1, last_name=$2, phone=$3, license_number=$4, cert_number=$5,
                   is_crew_lead=$6, default_crew_id=$7 WHERE id=$8`
          params = [firstName, lastName, phone, licenseNumber, certNumber,
                    isCrewLead === 'true' || isCrewLead === true, defaultCrewId || null, req.params.id]
        }
      }

      await db.query(query, params)
      res.json({ success: true })
    } catch (e) {
      console.error('PUT /employees error:', e)
      res.status(500).json({ error: 'Failed' })
    }
  })

  router.delete('/:id', requireAuth, validateIdParam, async (req, res) => {
    try {
      await db.query('UPDATE employees SET active = false WHERE id = $1', [req.params.id])
      res.json({ success: true })
    } catch (e) {
      console.error('DELETE /employees error:', e)
      res.status(500).json({ error: 'Failed' })
    }
  })

  return router
}
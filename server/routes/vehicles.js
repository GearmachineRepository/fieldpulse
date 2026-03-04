// ═══════════════════════════════════════════
// Vehicle Routes
// ═══════════════════════════════════════════

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateBody, validateIdParam } from '../middleware/validate.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const r = await db.query(
      'SELECT id, name, crew_name, license_plate, vin, make_model, year, truck_number FROM vehicles WHERE active = true ORDER BY name'
    )
    res.json(r.rows)
  } catch (e) {
    console.error('GET /vehicles error:', e)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/',
  requireAuth,
  validateBody({ name: { required: true, type: 'string', maxLength: 100 }, pin: { required: true, type: 'string' } }),
  async (req, res) => {
    try {
      const { name, pin, crewName, licensePlate, vin, makeModel, year, truckNumber } = req.body
      const h = await bcrypt.hash(pin, 10)
      const r = await db.query(
        'INSERT INTO vehicles (name, pin_hash, crew_name, license_plate, vin, make_model, year, truck_number) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, name, crew_name',
        [name, h, crewName, licensePlate, vin, makeModel, year ? parseInt(year) : null, truckNumber]
      )
      res.json(r.rows[0])
    } catch (e) {
      console.error('POST /vehicles error:', e)
      res.status(500).json({ error: 'Failed' })
    }
  }
)

router.put('/:id',
  requireAuth, validateIdParam,
  async (req, res) => {
    try {
      const { name, pin, crewName, licensePlate, vin, makeModel, year, truckNumber } = req.body
      if (pin) {
        const h = await bcrypt.hash(pin, 10)
        await db.query(
          'UPDATE vehicles SET name=$1, pin_hash=$2, crew_name=$3, license_plate=$4, vin=$5, make_model=$6, year=$7, truck_number=$8 WHERE id=$9',
          [name, h, crewName, licensePlate, vin, makeModel, year ? parseInt(year) : null, truckNumber, req.params.id]
        )
      } else {
        await db.query(
          'UPDATE vehicles SET name=$1, crew_name=$2, license_plate=$3, vin=$4, make_model=$5, year=$6, truck_number=$7 WHERE id=$8',
          [name, crewName, licensePlate, vin, makeModel, year ? parseInt(year) : null, truckNumber, req.params.id]
        )
      }
      res.json({ success: true })
    } catch (e) {
      console.error('PUT /vehicles error:', e)
      res.status(500).json({ error: 'Failed' })
    }
  }
)

router.delete('/:id', requireAuth, validateIdParam, async (req, res) => {
  try {
    await db.query('UPDATE vehicles SET active = false WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (e) {
    console.error('DELETE /vehicles error:', e)
    res.status(500).json({ error: 'Failed' })
  }
})

export default router
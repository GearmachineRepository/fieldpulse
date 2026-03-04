import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import db from './db.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// ═══════════════════════════════════════════
// AUTH — Vehicle PIN verification
// ═══════════════════════════════════════════

app.post('/api/auth/verify-pin', async (req, res) => {
  try {
    const { vehicleId, pin } = req.body
    const result = await db.query(
      'SELECT id, name, crew_name, pin_hash FROM vehicles WHERE id = $1 AND active = true',
      [vehicleId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' })
    }
    const vehicle = result.rows[0]
    const valid = await bcrypt.compare(pin, vehicle.pin_hash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid PIN' })
    }
    res.json({
      id: vehicle.id,
      name: vehicle.name,
      crewName: vehicle.crew_name,
    })
  } catch (err) {
    console.error('Auth error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

app.get('/api/vehicles', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, crew_name FROM vehicles WHERE active = true ORDER BY name'
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ═══════════════════════════════════════════
// EQUIPMENT
// ═══════════════════════════════════════════

app.get('/api/equipment', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, type FROM equipment WHERE active = true ORDER BY name'
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ═══════════════════════════════════════════
// CHEMICALS
// ═══════════════════════════════════════════

app.get('/api/chemicals', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, type, epa, active_ingredient,
             signal_word, restricted, sds_url, label_url,
             wx_temp, wx_humidity, wx_wind, wx_conditions
      FROM chemicals WHERE active = true ORDER BY name
    `)
    // Transform DB rows to frontend format
    const chemicals = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      epa: row.epa,
      ai: row.active_ingredient,
      signal: row.signal_word,
      restricted: row.restricted,
      sdsUrl: row.sds_url,
      labelUrl: row.label_url,
      wxRestrictions: {
        temp: row.wx_temp,
        humidity: row.wx_humidity,
        windSpeed: row.wx_wind,
        conditions: row.wx_conditions,
      },
    }))
    res.json(chemicals)
  } catch (err) {
    console.error('Chemicals error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ═══════════════════════════════════════════
// SPRAY LOGS
// ═══════════════════════════════════════════

// Create a new spray log
app.post('/api/spray-logs', async (req, res) => {
  const client = await db.connect()
  try {
    await client.query('BEGIN')

    const {
      vehicleId, crewName, crewLead, license,
      property, location, equipmentId, equipmentName,
      totalMixVol, targetPest, notes,
      weather, products,
    } = req.body

    // Insert the main log
    const logResult = await client.query(`
      INSERT INTO spray_logs (
        vehicle_id, crew_name, crew_lead, license,
        property, location, equipment_id, equipment_name,
        total_mix_vol, target_pest, notes,
        wx_temp, wx_humidity, wx_wind_speed, wx_wind_dir, wx_conditions
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING id, created_at
    `, [
      vehicleId, crewName, crewLead, license,
      property, location, equipmentId, equipmentName,
      totalMixVol, targetPest, notes,
      weather.temp, weather.humidity, weather.windSpeed,
      weather.windDir, weather.conditions,
    ])

    const logId = logResult.rows[0].id
    const createdAt = logResult.rows[0].created_at

    // Insert each product in the mix
    for (const p of products) {
      await client.query(`
        INSERT INTO spray_log_products (spray_log_id, chemical_id, chemical_name, epa, amount)
        VALUES ($1, $2, $3, $4, $5)
      `, [logId, p.chemicalId || null, p.name, p.epa, p.amount])
    }

    await client.query('COMMIT')

    res.json({ id: logId, createdAt })

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Spray log error:', err)
    res.status(500).json({ error: 'Failed to save spray log' })
  } finally {
    client.release()
  }
})

// Get spray log history
app.get('/api/spray-logs', async (req, res) => {
  try {
    const { vehicleId, limit = 50 } = req.query

    let query = `
      SELECT sl.*,
        json_agg(json_build_object(
          'id', slp.id,
          'chemicalName', slp.chemical_name,
          'epa', slp.epa,
          'amount', slp.amount
        )) as products
      FROM spray_logs sl
      LEFT JOIN spray_log_products slp ON slp.spray_log_id = sl.id
    `
    const params = []

    if (vehicleId) {
      query += ' WHERE sl.vehicle_id = $1'
      params.push(vehicleId)
    }

    query += ` GROUP BY sl.id ORDER BY sl.created_at DESC LIMIT $${params.length + 1}`
    params.push(limit)

    const result = await db.query(query, params)

    // Transform to frontend format
    const logs = result.rows.map(row => ({
      id: row.id,
      crewName: row.crew_name,
      crewLead: row.crew_lead,
      license: row.license,
      property: row.property,
      location: row.location,
      equipment: row.equipment_name,
      totalMixVol: row.total_mix_vol,
      targetPest: row.target_pest,
      notes: row.notes,
      date: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date(row.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      weather: {
        temp: row.wx_temp,
        humidity: row.wx_humidity,
        windSpeed: row.wx_wind_speed,
        windDir: row.wx_wind_dir,
        conditions: row.wx_conditions,
      },
      products: (row.products || []).filter(p => p.id !== null).map(p => ({
        name: p.chemicalName,
        epa: p.epa,
        ozConcentrate: p.amount,
      })),
      status: 'synced',
    }))

    res.json(logs)

  } catch (err) {
    console.error('Fetch logs error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ═══════════════════════════════════════════
// Health check
// ═══════════════════════════════════════════

app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1')
    res.json({ status: 'ok', database: 'connected' })
  } catch {
    res.status(500).json({ status: 'error', database: 'disconnected' })
  }
})

// ═══════════════════════════════════════════
// Start server
// ═══════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`\n  FieldPulse API server running on http://localhost:${PORT}`)
  console.log(`  Health check: http://localhost:${PORT}/api/health\n`)
})

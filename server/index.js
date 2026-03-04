import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import db from './db.js'

dotenv.config()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Photo uploads config
const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6)
    const ext = path.extname(file.originalname)
    cb(null, `spray-${unique}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } })

// Serve uploaded photos
app.use('/uploads', express.static(uploadsDir))

// ═══════════════════════════════════════════
// AUTH — Vehicle PIN
// ═══════════════════════════════════════════
app.post('/api/auth/verify-pin', async (req, res) => {
  try {
    const { vehicleId, pin } = req.body
    const result = await db.query('SELECT id, name, crew_name, pin_hash FROM vehicles WHERE id=$1 AND active=true', [vehicleId])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' })
    const v = result.rows[0]
    if (!(await bcrypt.compare(pin, v.pin_hash))) return res.status(401).json({ error: 'Invalid PIN' })
    res.json({ id: v.id, name: v.name, crewName: v.crew_name })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

// AUTH — Admin PIN
app.post('/api/auth/admin-pin', async (req, res) => {
  try {
    const { adminId, pin } = req.body
    const result = await db.query('SELECT id, name, role, pin_hash FROM admins WHERE id=$1 AND active=true', [adminId])
    if (result.rows.length === 0) return res.status(404).json({ error: 'Admin not found' })
    const a = result.rows[0]
    if (!(await bcrypt.compare(pin, a.pin_hash))) return res.status(401).json({ error: 'Invalid PIN' })
    res.json({ id: a.id, name: a.name, role: a.role })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

app.get('/api/admins/list', async (req, res) => {
  try {
    const r = await db.query('SELECT id, name, role FROM admins WHERE active=true ORDER BY name')
    res.json(r.rows)
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})

// ═══════════════════════════════════════════
// VEHICLES
// ═══════════════════════════════════════════
app.get('/api/vehicles', async (req, res) => {
  try {
    const r = await db.query('SELECT id, name, crew_name FROM vehicles WHERE active=true ORDER BY name')
    res.json(r.rows)
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})

app.post('/api/vehicles', async (req, res) => {
  try {
    const { name, pin, crewName } = req.body
    const pinHash = await bcrypt.hash(pin, 10)
    const r = await db.query(
      'INSERT INTO vehicles (name, pin_hash, crew_name) VALUES ($1,$2,$3) RETURNING id, name, crew_name',
      [name, pinHash, crewName || null]
    )
    res.json(r.rows[0])
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create vehicle' }) }
})

app.put('/api/vehicles/:id', async (req, res) => {
  try {
    const { name, pin, crewName } = req.body
    if (pin) {
      const pinHash = await bcrypt.hash(pin, 10)
      await db.query('UPDATE vehicles SET name=$1, pin_hash=$2, crew_name=$3 WHERE id=$4', [name, pinHash, crewName, req.params.id])
    } else {
      await db.query('UPDATE vehicles SET name=$1, crew_name=$2 WHERE id=$3', [name, crewName, req.params.id])
    }
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: 'Failed to update' }) }
})

app.delete('/api/vehicles/:id', async (req, res) => {
  try {
    await db.query('UPDATE vehicles SET active=false WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: 'Failed to delete' }) }
})

// ═══════════════════════════════════════════
// CREWS
// ═══════════════════════════════════════════
app.get('/api/crews', async (req, res) => {
  try {
    const r = await db.query('SELECT id, name, lead_name FROM crews WHERE active=true ORDER BY name')
    res.json(r.rows)
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})

app.post('/api/crews', async (req, res) => {
  try {
    const { name, leadName } = req.body
    const r = await db.query('INSERT INTO crews (name, lead_name) VALUES ($1,$2) RETURNING id, name, lead_name', [name, leadName || null])
    res.json(r.rows[0])
  } catch (err) { res.status(500).json({ error: 'Failed to create crew' }) }
})

app.put('/api/crews/:id', async (req, res) => {
  try {
    const { name, leadName } = req.body
    await db.query('UPDATE crews SET name=$1, lead_name=$2 WHERE id=$3', [name, leadName, req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: 'Failed to update' }) }
})

app.delete('/api/crews/:id', async (req, res) => {
  try {
    await db.query('UPDATE crews SET active=false WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: 'Failed to delete' }) }
})

// ═══════════════════════════════════════════
// EQUIPMENT
// ═══════════════════════════════════════════
app.get('/api/equipment', async (req, res) => {
  try {
    const r = await db.query('SELECT id, name, type FROM equipment WHERE active=true ORDER BY name')
    res.json(r.rows)
  } catch (err) { res.status(500).json({ error: 'Server error' }) }
})

app.post('/api/equipment', async (req, res) => {
  try {
    const { name, type } = req.body
    const r = await db.query('INSERT INTO equipment (name, type) VALUES ($1,$2) RETURNING id, name, type', [name, type || null])
    res.json(r.rows[0])
  } catch (err) { res.status(500).json({ error: 'Failed to create' }) }
})

app.put('/api/equipment/:id', async (req, res) => {
  try {
    const { name, type } = req.body
    await db.query('UPDATE equipment SET name=$1, type=$2 WHERE id=$3', [name, type, req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: 'Failed to update' }) }
})

app.delete('/api/equipment/:id', async (req, res) => {
  try {
    await db.query('UPDATE equipment SET active=false WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: 'Failed to delete' }) }
})

// ═══════════════════════════════════════════
// CHEMICALS
// ═══════════════════════════════════════════
app.get('/api/chemicals', async (req, res) => {
  try {
    const r = await db.query(`SELECT id, name, type, epa, active_ingredient, signal_word, restricted, sds_url, label_url, wx_temp, wx_humidity, wx_wind, wx_conditions FROM chemicals WHERE active=true ORDER BY name`)
    const chemicals = r.rows.map(row => ({
      id: row.id, name: row.name, type: row.type, epa: row.epa, ai: row.active_ingredient,
      signal: row.signal_word, restricted: row.restricted, sdsUrl: row.sds_url, labelUrl: row.label_url,
      wxRestrictions: { temp: row.wx_temp, humidity: row.wx_humidity, windSpeed: row.wx_wind, conditions: row.wx_conditions },
    }))
    res.json(chemicals)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

app.post('/api/chemicals', async (req, res) => {
  try {
    const b = req.body
    const r = await db.query(`INSERT INTO chemicals (name,type,epa,active_ingredient,signal_word,restricted,sds_url,label_url,wx_temp,wx_humidity,wx_wind,wx_conditions)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [b.name, b.type, b.epa, b.ai, b.signal || 'CAUTION', b.restricted || false, b.sdsUrl, b.labelUrl,
       b.wxTemp ? JSON.stringify(b.wxTemp) : null, b.wxHumidity ? JSON.stringify(b.wxHumidity) : null,
       b.wxWind ? JSON.stringify(b.wxWind) : null, b.wxConditions ? JSON.stringify(b.wxConditions) : null])
    res.json({ id: r.rows[0].id })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create' }) }
})

app.put('/api/chemicals/:id', async (req, res) => {
  try {
    const b = req.body
    await db.query(`UPDATE chemicals SET name=$1,type=$2,epa=$3,active_ingredient=$4,signal_word=$5,restricted=$6,sds_url=$7,label_url=$8,wx_temp=$9,wx_humidity=$10,wx_wind=$11,wx_conditions=$12 WHERE id=$13`,
      [b.name, b.type, b.epa, b.ai, b.signal, b.restricted, b.sdsUrl, b.labelUrl,
       b.wxTemp ? JSON.stringify(b.wxTemp) : null, b.wxHumidity ? JSON.stringify(b.wxHumidity) : null,
       b.wxWind ? JSON.stringify(b.wxWind) : null, b.wxConditions ? JSON.stringify(b.wxConditions) : null, req.params.id])
    res.json({ success: true })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update' }) }
})

app.delete('/api/chemicals/:id', async (req, res) => {
  try {
    await db.query('UPDATE chemicals SET active=false WHERE id=$1', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: 'Failed to delete' }) }
})

// ═══════════════════════════════════════════
// SPRAY LOGS
// ═══════════════════════════════════════════
app.post('/api/spray-logs', async (req, res) => {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const b = req.body
    const logResult = await client.query(`
      INSERT INTO spray_logs (vehicle_id,crew_name,crew_lead,license,property,location,equipment_id,equipment_name,total_mix_vol,target_pest,notes,wx_temp,wx_humidity,wx_wind_speed,wx_wind_dir,wx_conditions)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id, created_at`,
      [b.vehicleId, b.crewName, b.crewLead, b.license, b.property, b.location, b.equipmentId, b.equipmentName,
       b.totalMixVol, b.targetPest, b.notes, b.weather.temp, b.weather.humidity, b.weather.windSpeed, b.weather.windDir, b.weather.conditions])
    const logId = logResult.rows[0].id
    for (const p of b.products) {
      await client.query('INSERT INTO spray_log_products (spray_log_id,chemical_id,chemical_name,epa,amount) VALUES ($1,$2,$3,$4,$5)',
        [logId, p.chemicalId || null, p.name, p.epa, p.amount])
    }
    await client.query('COMMIT')
    res.json({ id: logId, createdAt: logResult.rows[0].created_at })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err); res.status(500).json({ error: 'Failed to save' })
  } finally { client.release() }
})

// Upload photos to a spray log
app.post('/api/spray-logs/:id/photos', upload.array('photos', 10), async (req, res) => {
  try {
    const logId = req.params.id
    const saved = []
    for (const f of req.files) {
      const r = await db.query(
        'INSERT INTO spray_log_photos (spray_log_id, filename, original_name, mime_type, size_bytes) VALUES ($1,$2,$3,$4,$5) RETURNING id, filename, original_name',
        [logId, f.filename, f.originalname, f.mimetype, f.size]
      )
      saved.push(r.rows[0])
    }
    res.json(saved)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Upload failed' }) }
})

// Get spray logs with products and photos
app.get('/api/spray-logs', async (req, res) => {
  try {
    const { vehicleId, limit = 50 } = req.query
    let where = ''
    const params = []
    if (vehicleId) { where = 'WHERE sl.vehicle_id = $1'; params.push(vehicleId) }
    const result = await db.query(`
      SELECT sl.*,
        COALESCE((SELECT json_agg(json_build_object('id',slp.id,'chemicalName',slp.chemical_name,'epa',slp.epa,'amount',slp.amount))
          FROM spray_log_products slp WHERE slp.spray_log_id=sl.id), '[]') as products,
        COALESCE((SELECT json_agg(json_build_object('id',ph.id,'filename',ph.filename,'originalName',ph.original_name))
          FROM spray_log_photos ph WHERE ph.spray_log_id=sl.id), '[]') as photos
      FROM spray_logs sl ${where}
      ORDER BY sl.created_at DESC LIMIT $${params.length + 1}`, [...params, limit])

    const logs = result.rows.map(row => ({
      id: row.id, crewName: row.crew_name, crewLead: row.crew_lead, license: row.license,
      property: row.property, location: row.location, equipment: row.equipment_name,
      totalMixVol: row.total_mix_vol, targetPest: row.target_pest, notes: row.notes,
      date: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date(row.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      weather: { temp: row.wx_temp, humidity: row.wx_humidity, windSpeed: row.wx_wind_speed, windDir: row.wx_wind_dir, conditions: row.wx_conditions },
      products: (row.products || []).filter(p => p.id !== null).map(p => ({ name: p.chemicalName, epa: p.epa, ozConcentrate: p.amount })),
      photos: (row.photos || []).filter(p => p.id !== null),
      status: 'synced',
    }))
    res.json(logs)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

// ═══════════════════════════════════════════
// PUR MONTHLY REPORT
// ═══════════════════════════════════════════
app.get('/api/reports/pur', async (req, res) => {
  try {
    const { month, year } = req.query
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 1).toISOString().split('T')[0]

    const result = await db.query(`
      SELECT slp.chemical_name, slp.epa, slp.amount, sl.created_at, sl.crew_name, sl.property
      FROM spray_log_products slp
      JOIN spray_logs sl ON sl.id = slp.spray_log_id
      WHERE sl.created_at >= $1 AND sl.created_at < $2
      ORDER BY slp.chemical_name, sl.created_at
    `, [startDate, endDate])

    // Aggregate by product
    const byProduct = {}
    for (const row of result.rows) {
      const key = `${row.chemical_name}|${row.epa}`
      if (!byProduct[key]) {
        byProduct[key] = { name: row.chemical_name, epa: row.epa, totalAmount: 0, unit: '', appCount: 0, applications: [] }
      }
      // Parse amount like "3 oz" → 3 and "oz"
      const match = row.amount.match(/^([\d.]+)\s*(.*)$/)
      if (match) {
        byProduct[key].totalAmount += parseFloat(match[1])
        byProduct[key].unit = match[2] || 'oz'
      }
      byProduct[key].appCount++
      byProduct[key].applications.push({
        date: new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        crew: row.crew_name, property: row.property, amount: row.amount,
      })
    }

    res.json({
      month: parseInt(month), year: parseInt(year),
      products: Object.values(byProduct),
      totalApplications: result.rows.length,
    })
  } catch (err) { console.error(err); res.status(500).json({ error: 'Report failed' }) }
})

// Health check
app.get('/api/health', async (req, res) => {
  try { await db.query('SELECT 1'); res.json({ status: 'ok' }) }
  catch { res.status(500).json({ status: 'error' }) }
})

app.listen(PORT, () => {
  console.log(`\n  FieldPulse API: http://localhost:${PORT}`)
  console.log(`  Health check:  http://localhost:${PORT}/api/health\n`)
})

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

// Uploads
const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
const storage = multer.diskStorage({
  destination: (r, f, cb) => cb(null, uploadsDir),
  filename: (r, f, cb) => cb(null, `${Date.now()}-${Math.round(Math.random()*1e6)}${path.extname(f.originalname)}`),
})
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } })
app.use('/uploads', express.static(uploadsDir))

// ── AUTH ──
app.post('/api/auth/verify-pin', async (req, res) => {
  try {
    const { vehicleId, pin } = req.body
    const r = await db.query('SELECT id,name,crew_name,pin_hash FROM vehicles WHERE id=$1 AND active=true', [vehicleId])
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' })
    if (!(await bcrypt.compare(pin, r.rows[0].pin_hash))) return res.status(401).json({ error: 'Invalid PIN' })
    const v = r.rows[0]; res.json({ id: v.id, name: v.name, crewName: v.crew_name })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

app.post('/api/auth/admin-pin', async (req, res) => {
  try {
    const { adminId, pin } = req.body
    const r = await db.query('SELECT id,name,role,pin_hash FROM admins WHERE id=$1 AND active=true', [adminId])
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' })
    if (!(await bcrypt.compare(pin, r.rows[0].pin_hash))) return res.status(401).json({ error: 'Invalid PIN' })
    const a = r.rows[0]; res.json({ id: a.id, name: a.name, role: a.role })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

app.get('/api/admins/list', async (req, res) => {
  try { res.json((await db.query('SELECT id,name,role FROM admins WHERE active=true ORDER BY name')).rows) }
  catch { res.status(500).json({ error: 'Server error' }) }
})

// ── VEHICLES ──
app.get('/api/vehicles', async (req, res) => {
  try {
    const r = await db.query('SELECT id,name,crew_name,license_plate,vin,make_model,year,truck_number FROM vehicles WHERE active=true ORDER BY name')
    res.json(r.rows)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

app.post('/api/vehicles', async (req, res) => {
  try {
    const { name, pin, crewName, licensePlate, vin, makeModel, year, truckNumber } = req.body
    const h = await bcrypt.hash(pin, 10)
    const r = await db.query('INSERT INTO vehicles (name,pin_hash,crew_name,license_plate,vin,make_model,year,truck_number) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,name,crew_name',
      [name, h, crewName, licensePlate, vin, makeModel, year ? parseInt(year) : null, truckNumber])
    res.json(r.rows[0])
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }) }
})

app.put('/api/vehicles/:id', async (req, res) => {
  try {
    const { name, pin, crewName, licensePlate, vin, makeModel, year, truckNumber } = req.body
    if (pin) {
      const h = await bcrypt.hash(pin, 10)
      await db.query('UPDATE vehicles SET name=$1,pin_hash=$2,crew_name=$3,license_plate=$4,vin=$5,make_model=$6,year=$7,truck_number=$8 WHERE id=$9',
        [name, h, crewName, licensePlate, vin, makeModel, year ? parseInt(year) : null, truckNumber, req.params.id])
    } else {
      await db.query('UPDATE vehicles SET name=$1,crew_name=$2,license_plate=$3,vin=$4,make_model=$5,year=$6,truck_number=$7 WHERE id=$8',
        [name, crewName, licensePlate, vin, makeModel, year ? parseInt(year) : null, truckNumber, req.params.id])
    }
    res.json({ success: true })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }) }
})

app.delete('/api/vehicles/:id', async (req, res) => {
  try { await db.query('UPDATE vehicles SET active=false WHERE id=$1', [req.params.id]); res.json({ success: true }) }
  catch { res.status(500).json({ error: 'Failed' }) }
})

// ── CREWS ──
app.get('/api/crews', async (req, res) => {
  try { res.json((await db.query('SELECT id,name,lead_name FROM crews WHERE active=true ORDER BY name')).rows) }
  catch { res.status(500).json({ error: 'Server error' }) }
})
app.post('/api/crews', async (req, res) => {
  try { const { name, leadName } = req.body; res.json((await db.query('INSERT INTO crews (name,lead_name) VALUES ($1,$2) RETURNING *', [name, leadName])).rows[0]) }
  catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }) }
})
app.put('/api/crews/:id', async (req, res) => {
  try { const { name, leadName } = req.body; await db.query('UPDATE crews SET name=$1,lead_name=$2 WHERE id=$3', [name, leadName, req.params.id]); res.json({ success: true }) }
  catch { res.status(500).json({ error: 'Failed' }) }
})
app.delete('/api/crews/:id', async (req, res) => {
  try { await db.query('UPDATE crews SET active=false WHERE id=$1', [req.params.id]); res.json({ success: true }) }
  catch { res.status(500).json({ error: 'Failed' }) }
})

// ── EMPLOYEES ──
app.get('/api/employees', async (req, res) => {
  try {
    const r = await db.query(`SELECT e.*, c.name as crew_name FROM employees e LEFT JOIN crews c ON c.id = e.default_crew_id WHERE e.active=true ORDER BY e.last_name, e.first_name`)
    res.json(r.rows)
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

app.post('/api/employees', upload.single('photo'), async (req, res) => {
  try {
    const { firstName, lastName, phone, licenseNumber, defaultCrewId } = req.body
    const photoFilename = req.file ? req.file.filename : null
    const r = await db.query(
      'INSERT INTO employees (first_name,last_name,phone,license_number,photo_filename,default_crew_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [firstName, lastName, phone, licenseNumber, photoFilename, defaultCrewId || null])
    res.json(r.rows[0])
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }) }
})

app.put('/api/employees/:id', upload.single('photo'), async (req, res) => {
  try {
    const { firstName, lastName, phone, licenseNumber, defaultCrewId } = req.body
    if (req.file) {
      await db.query('UPDATE employees SET first_name=$1,last_name=$2,phone=$3,license_number=$4,photo_filename=$5,default_crew_id=$6 WHERE id=$7',
        [firstName, lastName, phone, licenseNumber, req.file.filename, defaultCrewId || null, req.params.id])
    } else {
      await db.query('UPDATE employees SET first_name=$1,last_name=$2,phone=$3,license_number=$4,default_crew_id=$5 WHERE id=$6',
        [firstName, lastName, phone, licenseNumber, defaultCrewId || null, req.params.id])
    }
    res.json({ success: true })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }) }
})

app.delete('/api/employees/:id', async (req, res) => {
  try { await db.query('UPDATE employees SET active=false WHERE id=$1', [req.params.id]); res.json({ success: true }) }
  catch { res.status(500).json({ error: 'Failed' }) }
})

// ── EQUIPMENT ──
app.get('/api/equipment', async (req, res) => {
  try { res.json((await db.query('SELECT id,name,type FROM equipment WHERE active=true ORDER BY name')).rows) }
  catch { res.status(500).json({ error: 'Server error' }) }
})
app.post('/api/equipment', async (req, res) => {
  try { const { name, type } = req.body; res.json((await db.query('INSERT INTO equipment (name,type) VALUES ($1,$2) RETURNING *', [name, type])).rows[0]) }
  catch { res.status(500).json({ error: 'Failed' }) }
})
app.put('/api/equipment/:id', async (req, res) => {
  try { const { name, type } = req.body; await db.query('UPDATE equipment SET name=$1,type=$2 WHERE id=$3', [name, type, req.params.id]); res.json({ success: true }) }
  catch { res.status(500).json({ error: 'Failed' }) }
})
app.delete('/api/equipment/:id', async (req, res) => {
  try { await db.query('UPDATE equipment SET active=false WHERE id=$1', [req.params.id]); res.json({ success: true }) }
  catch { res.status(500).json({ error: 'Failed' }) }
})

// ── CHEMICALS ──
app.get('/api/chemicals', async (req, res) => {
  try {
    const r = await db.query('SELECT * FROM chemicals WHERE active=true ORDER BY name')
    res.json(r.rows.map(row => ({
      id: row.id, name: row.name, type: row.type, epa: row.epa, ai: row.active_ingredient,
      signal: row.signal_word, restricted: row.restricted, sdsUrl: row.sds_url, labelUrl: row.label_url,
      wxRestrictions: { temp: row.wx_temp, humidity: row.wx_humidity, windSpeed: row.wx_wind, conditions: row.wx_conditions },
    })))
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})
app.post('/api/chemicals', async (req, res) => {
  try {
    const b = req.body
    const r = await db.query(`INSERT INTO chemicals (name,type,epa,active_ingredient,signal_word,restricted,sds_url,label_url,wx_temp,wx_humidity,wx_wind,wx_conditions) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [b.name,b.type,b.epa,b.ai,b.signal||'CAUTION',b.restricted||false,b.sdsUrl,b.labelUrl,
       b.wxTemp?JSON.stringify(b.wxTemp):null,b.wxHumidity?JSON.stringify(b.wxHumidity):null,
       b.wxWind?JSON.stringify(b.wxWind):null,b.wxConditions?JSON.stringify(b.wxConditions):null])
    res.json({ id: r.rows[0].id })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }) }
})
app.put('/api/chemicals/:id', async (req, res) => {
  try {
    const b = req.body
    await db.query(`UPDATE chemicals SET name=$1,type=$2,epa=$3,active_ingredient=$4,signal_word=$5,restricted=$6,sds_url=$7,label_url=$8,wx_temp=$9,wx_humidity=$10,wx_wind=$11,wx_conditions=$12 WHERE id=$13`,
      [b.name,b.type,b.epa,b.ai,b.signal,b.restricted,b.sdsUrl,b.labelUrl,
       b.wxTemp?JSON.stringify(b.wxTemp):null,b.wxHumidity?JSON.stringify(b.wxHumidity):null,
       b.wxWind?JSON.stringify(b.wxWind):null,b.wxConditions?JSON.stringify(b.wxConditions):null,req.params.id])
    res.json({ success: true })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }) }
})
app.delete('/api/chemicals/:id', async (req, res) => {
  try { await db.query('UPDATE chemicals SET active=false WHERE id=$1', [req.params.id]); res.json({ success: true }) }
  catch { res.status(500).json({ error: 'Failed' }) }
})

// ── SPRAY LOGS ──
app.post('/api/spray-logs', async (req, res) => {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const b = req.body
    const logR = await client.query(`INSERT INTO spray_logs (vehicle_id,crew_name,crew_lead,license,property,location,equipment_id,equipment_name,total_mix_vol,target_pest,notes,wx_temp,wx_humidity,wx_wind_speed,wx_wind_dir,wx_conditions)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id,created_at`,
      [b.vehicleId,b.crewName,b.crewLead,b.license,b.property,b.location,b.equipmentId,b.equipmentName,
       b.totalMixVol,b.targetPest,b.notes,b.weather.temp,b.weather.humidity,b.weather.windSpeed,b.weather.windDir,b.weather.conditions])
    const logId = logR.rows[0].id
    for (const p of b.products) {
      await client.query('INSERT INTO spray_log_products (spray_log_id,chemical_id,chemical_name,epa,amount) VALUES ($1,$2,$3,$4,$5)',
        [logId, p.chemicalId||null, p.name, p.epa, p.amount])
    }
    // Crew members
    if (b.crewMembers && b.crewMembers.length > 0) {
      for (const m of b.crewMembers) {
        await client.query('INSERT INTO spray_log_members (spray_log_id,employee_id,employee_name) VALUES ($1,$2,$3)',
          [logId, m.id, m.name])
      }
    }
    await client.query('COMMIT')
    res.json({ id: logId, createdAt: logR.rows[0].created_at })
  } catch (e) { await client.query('ROLLBACK'); console.error(e); res.status(500).json({ error: 'Failed' }) }
  finally { client.release() }
})

app.post('/api/spray-logs/:id/photos', upload.array('photos', 10), async (req, res) => {
  try {
    const saved = []
    for (const f of req.files) {
      const r = await db.query('INSERT INTO spray_log_photos (spray_log_id,filename,original_name,mime_type,size_bytes) VALUES ($1,$2,$3,$4,$5) RETURNING id,filename,original_name',
        [req.params.id, f.filename, f.originalname, f.mimetype, f.size])
      saved.push(r.rows[0])
    }
    res.json(saved)
  } catch (e) { console.error(e); res.status(500).json({ error: 'Upload failed' }) }
})

app.get('/api/spray-logs', async (req, res) => {
  try {
    const { vehicleId, limit = 50 } = req.query
    let where = '', params = []
    if (vehicleId) { where = 'WHERE sl.vehicle_id = $1'; params.push(vehicleId) }
    const result = await db.query(`
      SELECT sl.*,
        COALESCE((SELECT json_agg(json_build_object('id',slp.id,'chemicalName',slp.chemical_name,'epa',slp.epa,'amount',slp.amount)) FROM spray_log_products slp WHERE slp.spray_log_id=sl.id),'[]') as products,
        COALESCE((SELECT json_agg(json_build_object('id',ph.id,'filename',ph.filename,'originalName',ph.original_name)) FROM spray_log_photos ph WHERE ph.spray_log_id=sl.id),'[]') as photos,
        COALESCE((SELECT json_agg(json_build_object('id',sm.id,'employeeId',sm.employee_id,'name',sm.employee_name)) FROM spray_log_members sm WHERE sm.spray_log_id=sl.id),'[]') as members
      FROM spray_logs sl ${where} ORDER BY sl.created_at DESC LIMIT $${params.length+1}`, [...params, limit])

    res.json(result.rows.map(row => ({
      id: row.id, crewName: row.crew_name, crewLead: row.crew_lead, license: row.license,
      property: row.property, location: row.location, equipment: row.equipment_name,
      totalMixVol: row.total_mix_vol, targetPest: row.target_pest, notes: row.notes,
      date: new Date(row.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),
      time: new Date(row.created_at).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}),
      weather: { temp: row.wx_temp, humidity: row.wx_humidity, windSpeed: row.wx_wind_speed, windDir: row.wx_wind_dir, conditions: row.wx_conditions },
      products: (row.products||[]).filter(p=>p.id!==null).map(p=>({name:p.chemicalName,epa:p.epa,ozConcentrate:p.amount})),
      photos: (row.photos||[]).filter(p=>p.id!==null),
      members: (row.members||[]).filter(m=>m.id!==null),
      status: 'synced',
    })))
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

// ── PUR REPORT ──
app.get('/api/reports/pur', async (req, res) => {
  try {
    const { month, year } = req.query
    const start = `${year}-${String(month).padStart(2,'0')}-01`
    const end = new Date(year, month, 1).toISOString().split('T')[0]
    const result = await db.query(`SELECT slp.chemical_name,slp.epa,slp.amount,sl.created_at,sl.crew_name,sl.property
      FROM spray_log_products slp JOIN spray_logs sl ON sl.id=slp.spray_log_id
      WHERE sl.created_at>=$1 AND sl.created_at<$2 ORDER BY slp.chemical_name`, [start, end])
    const byProduct = {}
    for (const row of result.rows) {
      const key = `${row.chemical_name}|${row.epa}`
      if (!byProduct[key]) byProduct[key] = { name: row.chemical_name, epa: row.epa, totalAmount: 0, unit: '', appCount: 0, applications: [] }
      const match = row.amount.match(/^([\d.]+)\s*(.*)$/)
      if (match) { byProduct[key].totalAmount += parseFloat(match[1]); byProduct[key].unit = match[2] || 'oz' }
      byProduct[key].appCount++
      byProduct[key].applications.push({ date: new Date(row.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}), crew: row.crew_name, property: row.property, amount: row.amount })
    }
    res.json({ month: parseInt(month), year: parseInt(year), products: Object.values(byProduct), totalApplications: result.rows.length })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }) }
})

app.get('/api/health', async (req, res) => {
  try { await db.query('SELECT 1'); res.json({ status: 'ok' }) }
  catch { res.status(500).json({ status: 'error' }) }
})

app.listen(PORT, () => console.log(`\n  FieldPulse API: http://localhost:${PORT}\n`))

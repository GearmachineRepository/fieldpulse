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

app.post('/api/auth/crew-login', async (req, res) => {
  try {
    const { employeeId, pin } = req.body
    const r = await db.query(
      `SELECT e.id, e.first_name, e.last_name, e.license_number, e.cert_number, e.pin_hash, e.is_crew_lead, e.default_crew_id,
              c.name as crew_name, c.lead_name,
              v.id as vehicle_id, v.name as vehicle_name
       FROM employees e
       LEFT JOIN crews c ON c.id = e.default_crew_id
       LEFT JOIN vehicles v ON v.crew_name = c.name AND v.active = true
       WHERE e.id = $1 AND e.active = true`, [employeeId])
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' })
    const emp = r.rows[0]
    if (!emp.pin_hash) return res.status(401).json({ error: 'No PIN set for this employee' })
    if (!(await bcrypt.compare(pin, emp.pin_hash))) return res.status(401).json({ error: 'Invalid PIN' })
    res.json({
      employee: { id: emp.id, firstName: emp.first_name, lastName: emp.last_name, license: emp.license_number, certNumber: emp.cert_number, isCrewLead: emp.is_crew_lead },
      crew: emp.default_crew_id ? { id: emp.default_crew_id, name: emp.crew_name } : null,
      vehicle: emp.vehicle_id ? { id: emp.vehicle_id, name: emp.vehicle_name } : null,
    })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

app.get('/api/crews/login-tiles', async (req, res) => {
  try {
    const crews = await db.query('SELECT id, name, lead_name FROM crews WHERE active = true ORDER BY name')
    const employees = await db.query(
      `SELECT e.id, e.first_name, e.last_name, e.default_crew_id, e.photo_filename, e.is_crew_lead,
              CASE WHEN e.pin_hash IS NOT NULL THEN true ELSE false END as has_pin
       FROM employees e WHERE e.active = true ORDER BY e.is_crew_lead DESC, e.last_name, e.first_name`)
    const vehicles = await db.query(
      `SELECT v.id, v.name, v.crew_name, c.id as crew_id
       FROM vehicles v LEFT JOIN crews c ON c.name = v.crew_name
       WHERE v.active = true ORDER BY v.name`)
    res.json({
      crews: crews.rows.map(c => ({
        ...c,
        employees: employees.rows.filter(e => e.default_crew_id === c.id),
        vehicle: vehicles.rows.find(v => v.crew_id === c.id) || null,
      })),
      unassigned: employees.rows.filter(e => !e.default_crew_id),
    })
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
    const r = await db.query(`SELECT e.*, c.name as crew_name,
      CASE WHEN e.pin_hash IS NOT NULL THEN true ELSE false END as has_pin
      FROM employees e LEFT JOIN crews c ON c.id = e.default_crew_id WHERE e.active=true ORDER BY e.last_name, e.first_name`)
    res.json(r.rows.map(row => ({ ...row, cert_number: row.cert_number || null })))
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

app.post('/api/employees', upload.single('photo'), async (req, res) => {
  try {
    const { firstName, lastName, phone, licenseNumber, certNumber, defaultCrewId, pin, isCrewLead } = req.body
    const photoFilename = req.file ? req.file.filename : null
    const pinHash = pin ? await bcrypt.hash(pin, 10) : null
    const r = await db.query(
      'INSERT INTO employees (first_name,last_name,phone,license_number,cert_number,photo_filename,pin_hash,is_crew_lead,default_crew_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [firstName, lastName, phone, licenseNumber, certNumber || null, photoFilename, pinHash, isCrewLead === 'true' || isCrewLead === true, defaultCrewId || null])
    res.json(r.rows[0])
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }) }
})

app.put('/api/employees/:id', upload.single('photo'), async (req, res) => {
  try {
    const { firstName, lastName, phone, licenseNumber, certNumber, defaultCrewId, pin, isCrewLead } = req.body
    const lead = isCrewLead === 'true' || isCrewLead === true
    const sets = ['first_name=$1', 'last_name=$2', 'phone=$3', 'license_number=$4', 'cert_number=$5', 'is_crew_lead=$6', 'default_crew_id=$7']
    const params = [firstName, lastName, phone, licenseNumber, certNumber || null, lead, defaultCrewId || null]
    let idx = params.length
    if (pin) { idx++; sets.push(`pin_hash=$${idx}`); params.push(await bcrypt.hash(pin, 10)) }
    if (req.file) { idx++; sets.push(`photo_filename=$${idx}`); params.push(req.file.filename) }
    idx++; params.push(req.params.id)
    await db.query(`UPDATE employees SET ${sets.join(',')} WHERE id=$${idx}`, params)
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
    const { vehicleId, crewName, limit = 50 } = req.query
    let where = [], params = []
    if (vehicleId) { params.push(vehicleId); where.push(`sl.vehicle_id = $${params.length}`) }
    if (crewName) { params.push(crewName); where.push(`sl.crew_name = $${params.length}`) }
    const whereStr = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''
    params.push(limit)
    const result = await db.query(`
      SELECT sl.*,
        COALESCE((SELECT json_agg(json_build_object('id',slp.id,'chemicalName',slp.chemical_name,'epa',slp.epa,'amount',slp.amount)) FROM spray_log_products slp WHERE slp.spray_log_id=sl.id),'[]') as products,
        COALESCE((SELECT json_agg(json_build_object('id',ph.id,'filename',ph.filename,'originalName',ph.original_name)) FROM spray_log_photos ph WHERE ph.spray_log_id=sl.id),'[]') as photos,
        COALESCE((SELECT json_agg(json_build_object('id',sm.id,'employeeId',sm.employee_id,'name',sm.employee_name)) FROM spray_log_members sm WHERE sm.spray_log_id=sl.id),'[]') as members
      FROM spray_logs sl ${whereStr} ORDER BY sl.created_at DESC LIMIT $${params.length}`, params)

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

app.delete('/api/spray-logs/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM spray_logs WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to delete' }) }
})

// ── DAILY CREW ROSTERS ──
app.post('/api/rosters', async (req, res) => {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { crewId, crewName, submittedById, submittedByName, workDate, members, notes } = req.body
    const date = workDate || new Date().toISOString().split('T')[0]
    // Upsert: delete existing roster for this crew+date
    if (crewId) {
      const existing = await client.query('SELECT id FROM daily_crew_rosters WHERE crew_id = $1 AND work_date = $2', [crewId, date])
      for (const row of existing.rows) {
        await client.query('DELETE FROM daily_roster_members WHERE roster_id = $1', [row.id])
        await client.query('DELETE FROM daily_crew_rosters WHERE id = $1', [row.id])
      }
    }
    const rosterR = await client.query(
      `INSERT INTO daily_crew_rosters (crew_id, crew_name, submitted_by_id, submitted_by_name, work_date, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, created_at`,
      [crewId, crewName, submittedById, submittedByName, date, notes || null])
    const rosterId = rosterR.rows[0].id
    for (const m of members) {
      await client.query('INSERT INTO daily_roster_members (roster_id, employee_id, employee_name, present) VALUES ($1,$2,$3,$4)',
        [rosterId, m.id, m.name, m.present !== false])
    }
    await client.query('COMMIT')
    res.json({ id: rosterId, createdAt: rosterR.rows[0].created_at })
  } catch (e) { await client.query('ROLLBACK'); console.error(e); res.status(500).json({ error: 'Failed' }) }
  finally { client.release() }
})

app.get('/api/rosters', async (req, res) => {
  try {
    const { crewId, date, limit = 50 } = req.query
    let where = [], params = []
    if (crewId) { params.push(crewId); where.push(`r.crew_id = $${params.length}`) }
    if (date) { params.push(date); where.push(`r.work_date = $${params.length}`) }
    const whereStr = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''
    params.push(limit)
    const result = await db.query(`
      SELECT r.*,
        COALESCE((SELECT json_agg(json_build_object('id',m.id,'employeeId',m.employee_id,'name',m.employee_name,'present',m.present))
          FROM daily_roster_members m WHERE m.roster_id=r.id),'[]') as members
      FROM daily_crew_rosters r ${whereStr}
      ORDER BY r.work_date DESC, r.created_at DESC
      LIMIT $${params.length}`, params)
    res.json(result.rows.map(row => ({
      id: row.id, crewId: row.crew_id, crewName: row.crew_name,
      submittedBy: row.submitted_by_name, workDate: row.work_date,
      date: new Date(row.work_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      notes: row.notes,
      members: (row.members || []).filter(m => m.id !== null),
      createdAt: row.created_at,
    })))
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

app.get('/api/rosters/today', async (req, res) => {
  try {
    const { crewId } = req.query
    const today = new Date().toISOString().split('T')[0]
    let where = 'WHERE r.work_date = $1', params = [today]
    if (crewId) { params.push(crewId); where += ` AND r.crew_id = $${params.length}` }
    const result = await db.query(`
      SELECT r.*,
        COALESCE((SELECT json_agg(json_build_object('id',m.id,'employeeId',m.employee_id,'name',m.employee_name,'present',m.present))
          FROM daily_roster_members m WHERE m.roster_id=r.id),'[]') as members
      FROM daily_crew_rosters r ${where}
      ORDER BY r.created_at DESC LIMIT 1`, params)
    if (result.rows.length === 0) return res.json(null)
    const row = result.rows[0]
    res.json({
      id: row.id, crewId: row.crew_id, crewName: row.crew_name,
      submittedBy: row.submitted_by_name, workDate: row.work_date,
      notes: row.notes,
      members: (row.members || []).filter(m => m.id !== null),
    })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

app.get('/api/rosters/attendance-today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const crewsR = await db.query(`SELECT c.id, c.name, c.lead_name FROM crews c WHERE c.active = true ORDER BY c.name`)
    const empsR = await db.query(`SELECT e.id, e.first_name, e.last_name, e.default_crew_id FROM employees e WHERE e.active = true`)
    const rostersR = await db.query(`
      SELECT r.crew_id, r.crew_name, r.submitted_by_name,
        COALESCE((SELECT json_agg(json_build_object('employeeId',m.employee_id,'name',m.employee_name))
          FROM daily_roster_members m WHERE m.roster_id=r.id),'[]') as members
      FROM daily_crew_rosters r WHERE r.work_date = $1
      ORDER BY r.created_at DESC`, [today])
    // Latest roster per crew
    const rosterByCrewId = {}
    for (const r of rostersR.rows) { if (!rosterByCrewId[r.crew_id]) rosterByCrewId[r.crew_id] = r }
    // Collect all rostered employee IDs
    const rosteredIds = new Set()
    const crewAttendance = crewsR.rows.map(crew => {
      const roster = rosterByCrewId[crew.id]
      if (!roster) return { crewId: crew.id, crewName: crew.name, submitted: false, memberCount: 0, members: [] }
      const members = (roster.members || []).filter(m => m.employeeId !== null)
      members.forEach(m => rosteredIds.add(m.employeeId))
      return { crewId: crew.id, crewName: crew.name, submitted: true, submittedBy: roster.submitted_by_name,
        memberCount: members.length, members: members.map(m => m.name) }
    })
    // Find employees not on any roster today
    const unrostered = empsR.rows.filter(e => !rosteredIds.has(e.id)).map(e => ({
      id: e.id, name: `${e.first_name} ${e.last_name}`,
      defaultCrew: crewsR.rows.find(c => c.id === e.default_crew_id)?.name || null,
    }))
    res.json({ crews: crewAttendance, unrostered, totalWorking: rosteredIds.size, totalEmployees: empsR.rows.length })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }) }
})

app.delete('/api/rosters/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM daily_roster_members WHERE roster_id = $1', [req.params.id])
    await db.query('DELETE FROM daily_crew_rosters WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }) }
})

app.get('/api/reports/rosters', async (req, res) => {
  try {
    const { start, end } = req.query
    if (!start || !end) return res.status(400).json({ error: 'start and end required' })
    const result = await db.query(`
      SELECT r.id, r.crew_name, r.submitted_by_name, r.work_date, r.notes,
        COALESCE((SELECT json_agg(json_build_object('employeeId',m.employee_id,'name',m.employee_name,'present',m.present))
          FROM daily_roster_members m WHERE m.roster_id=r.id),'[]') as members
      FROM daily_crew_rosters r
      WHERE r.work_date >= $1 AND r.work_date < $2
      ORDER BY r.work_date DESC, r.crew_name`, [start, end])
    // Summarize by crew
    const byCrewDate = {}
    for (const row of result.rows) {
      const key = row.crew_name
      if (!byCrewDate[key]) byCrewDate[key] = { crewName: key, daysWorked: 0, totalMembers: new Set(), totalAbsences: 0, rosters: [] }
      byCrewDate[key].daysWorked++
      const members = (row.members || []).filter(m => m.employeeId !== null)
      const presentMembers = members.filter(m => m.present !== false)
      const absentMembers = members.filter(m => m.present === false)
      presentMembers.forEach(m => byCrewDate[key].totalMembers.add(m.name))
      byCrewDate[key].totalAbsences += absentMembers.length
      byCrewDate[key].rosters.push({
        date: new Date(row.work_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        lead: row.submitted_by_name,
        memberCount: presentMembers.length,
        absentCount: absentMembers.length,
        members: presentMembers.map(m => m.name),
        absent: absentMembers.map(m => m.name),
      })
    }
    const crews = Object.values(byCrewDate).map(c => ({
      ...c, totalMembers: c.totalMembers.size,
    }))
    res.json({ start, end, totalRosters: result.rows.length, crews })
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed' }) }
})

// ── PUR REPORT ──
app.get('/api/reports/pur', async (req, res) => {
  try {
    const { month, year, start: startParam, end: endParam } = req.query
    let start, end
    if (startParam && endParam) {
      start = startParam; end = endParam
    } else {
      start = `${year}-${String(month).padStart(2,'0')}-01`
      end = new Date(year, month, 1).toISOString().split('T')[0]
    }
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

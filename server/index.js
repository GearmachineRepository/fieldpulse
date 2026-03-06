// ═══════════════════════════════════════════
// FieldPulse API — Express Server
// ═══════════════════════════════════════════

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import db from './db.js'

import authRoutes     from './routes/auth.js'
import adminsRoutes   from './routes/admins.js'
import vehicleRoutes  from './routes/vehicles.js'
import crewRoutes     from './routes/crews.js'
import employeeRoutes from './routes/employees.js'
import equipmentRoutes from './routes/equipment.js'
import chemicalRoutes from './routes/chemicals.js'
import sprayLogRoutes from './routes/sprayLogs.js'
import rosterRoutes   from './routes/rosters.js'
import reportRoutes   from './routes/reports.js'
import accountRoutes  from './routes/accounts.js'
import routeRoutes    from './routes/routes.js'

import { createUpload }           from './middleware/upload.js'
import { notFound, errorHandler } from './middleware/error.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app  = express()
const PORT = process.env.PORT || 3001

// ── CORS ──
// Comma-separated allowed origins from env (see .env.example)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3001')
  .split(',').map(o => o.trim())

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: Origin ${origin} not allowed`))
  },
  credentials: true,
}))

// ── Body parsing ──
app.use(express.json({ limit: '1mb' }))

// ── File uploads ──
const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
const upload = createUpload(uploadsDir)

app.use('/uploads', express.static(uploadsDir))

// ── Routes — public (no auth) ──
app.use('/api/auth',   authRoutes)
app.use('/api/admins', adminsRoutes)
app.use('/api/crews',  crewRoutes)

// ── Routes — protected (auth applied inside each router) ──
app.use('/api/vehicles',   vehicleRoutes)
app.use('/api/employees',  employeeRoutes(upload))
app.use('/api/equipment',  equipmentRoutes)
app.use('/api/chemicals',  chemicalRoutes)
app.use('/api/spray-logs', sprayLogRoutes(upload))
app.use('/api/rosters',    rosterRoutes)
app.use('/api/reports',    reportRoutes)
app.use('/api/accounts',   accountRoutes)
app.use('/api/routes',     routeRoutes(upload))

// ── Health check ──
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1')
    res.json({ status: 'ok' })
  } catch {
    res.status(500).json({ status: 'error' })
  }
})

// ── 404 + error handlers — must be last ──
app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => console.log(`\n  FieldPulse API → http://localhost:${PORT}\n`))

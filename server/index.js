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

// Route modules
import authRoutes from './routes/auth.js'
import adminsRoutes from './routes/admins.js'
import vehicleRoutes from './routes/vehicles.js'
import crewRoutes from './routes/crews.js'
import employeeRoutes from './routes/employees.js'
import equipmentRoutes from './routes/equipment.js'
import chemicalRoutes from './routes/chemicals.js'
import sprayLogRoutes from './routes/sprayLogs.js'
import rosterRoutes from './routes/rosters.js'
import reportRoutes from './routes/reports.js'
import accountRoutes from './routes/accounts.js'
import routeRoutes from './routes/routes.js'
import { createUpload } from './middleware/upload.js'
import { notFound, errorHandler } from './middleware/error.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

// ── Allowed origins ──
// In dev, allow both localhost ports. In production, restrict to your domain.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3001')
  .split(',')
  .map(o => o.trim())

// ── Global middleware ──
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: Origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))

// ── File uploads config ──
const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
const upload = createUpload(uploadsDir)

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir))

// ── Mount routes ──
// Public routes (no auth — needed for login screens)
app.use('/api/auth', authRoutes)
app.use('/api/admins', adminsRoutes)
app.use('/api/crews', crewRoutes)

// Protected routes (auth is applied inside each route module)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/employees', employeeRoutes(upload))
app.use('/api/equipment', equipmentRoutes)
app.use('/api/chemicals', chemicalRoutes)
app.use('/api/spray-logs', sprayLogRoutes(upload))
app.use('/api/rosters', rosterRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/routes', routeRoutes(upload))

// ── Health check ──
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1')
    res.json({ status: 'ok' })
  } catch {
    res.status(500).json({ status: 'error' })
  }
})

// ── 404 + error handlers (must be last) ──
app.use(notFound)
app.use(errorHandler)

// ── Start server ──
app.listen(PORT, () => console.log(`\n  FieldPulse API: http://localhost:${PORT}\n`))

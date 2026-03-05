// ═══════════════════════════════════════════
// FieldPulse API — Express Server
// ═══════════════════════════════════════════

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
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
import routeRoutes from './routes/routes.js'             // ← Phase 3
import { requireAuth } from './middleware/auth.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

// ── Global middleware ──
app.use(cors())
app.use(express.json())

// ── File uploads config ──
const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`),
})
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } })

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir))

// ── Mount routes ──
// Public routes (no auth — needed for login screens)
app.use('/api/auth', authRoutes)
app.use('/api/admins', adminsRoutes)
app.use('/api/crews', crewRoutes)
app.use('/api/vehicles', requireAuth, async (req, res, next) => { next() })

// Protected routes
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/employees', employeeRoutes(upload))
app.use('/api/equipment', equipmentRoutes)
app.use('/api/chemicals', chemicalRoutes)
app.use('/api/spray-logs', sprayLogRoutes(upload))
app.use('/api/rosters', rosterRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/routes', routeRoutes(upload))               // ← Phase 3

// ── Health check ──
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1')
    res.json({ status: 'ok' })
  } catch {
    res.status(500).json({ status: 'error' })
  }
})

// ── Start server ──
app.listen(PORT, () => console.log(`\n  FieldPulse API: http://localhost:${PORT}\n`))
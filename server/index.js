// ═══════════════════════════════════════════
// CruPoint API — Express Server
// ═══════════════════════════════════════════

import * as Sentry from '@sentry/node'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import pinoHttp from 'pino-http'
import db from './db.js'
import { logger } from './utils/logger.js'

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
import deviceRoutes from './routes/device.js'
import accountGroupRoutes from './routes/accountGroups.js'
import scheduleEventRoutes from './routes/scheduleEvents.js'
import resourceRoutes from './routes/resources.js'
import servicePlanRoutes from './routes/servicePlans.js'
import categoryRoutes from './routes/categories.js'
import moduleRoutes from './routes/modules.js'
import certificationRoutes from './routes/certifications.js'
import trainingRoutes from './routes/training.js'
import incidentRoutes from './routes/incidents.js'
import sdsRoutes from './routes/sds.js'
import sdsPublicRoutes from './routes/sdsPublic.js'
import integrationRoutes from './routes/integrations.js'
import dashboardPinRoutes from './routes/dashboardPins.js'
import organizationRoutes from './routes/organization.js'
import invitationRoutes from './routes/invitations.js'
import fieldDocRoutes from './routes/fieldDocs.js'

import { createUpload, uploadToStorage } from './middleware/upload.js'
import { notFound, errorHandler } from './middleware/error.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const isDev = process.env.NODE_ENV !== 'production'

// ── Validate required env vars ──
const REQUIRED_ENV = ['DB_HOST', 'DB_NAME', 'DB_USER']
if (!isDev) REQUIRED_ENV.push('JWT_SECRET', 'ALLOWED_ORIGINS')

const missing = REQUIRED_ENV.filter((k) => !process.env[k])
if (missing.length > 0) {
  logger.fatal(`Missing required environment variables: ${missing.join(', ')}`)
  logger.fatal('Copy .env.example to .env and fill in the values.')
  process.exit(1)
}

if (process.env.SENTRY_DSN) {
  logger.info('Sentry error tracking enabled')
}

// ── Request logging ──
app.use(
  pinoHttp({
    logger,
    autoLogging: false,
    serializers: {
      req: (req) => ({ method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }),
)

// ── Security headers via helmet ──
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", ...(isDev ? ["'unsafe-eval'", "'unsafe-inline'"] : [])],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://tile.openstreetmap.org',
          'https://*.tile.openstreetmap.org',
          'https://cdnjs.cloudflare.com',
        ],
        connectSrc: [
          "'self'",
          'https://api.openweathermap.org',
          'https://geocoding.geo.census.gov',
          'https://nominatim.openstreetmap.org',
        ],
        fontSrc: ["'self'"],
        frameAncestors: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
  }),
)

// ── CORS ──
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:5173,https://localhost:5173,http://localhost:3001'
)
  .split(',')
  .map((o) => o.trim())

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true)
      cb(new Error(`CORS: Origin ${origin} not allowed`))
    },
    credentials: true,
  }),
)

// ── Global rate limiter — prevent resource exhaustion ──
app.use(
  '/api/',
  rateLimit({
    windowMs: 60_000,
    max: isDev ? 1000 : 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests — slow down' },
  }),
)

// ── Body parsing ──
app.use(express.json({ limit: '1mb' }))

// ── File uploads ──
const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
const upload = createUpload(uploadsDir)

// Serve uploaded files — Supabase Storage redirect or local disk fallback
if (process.env.SUPABASE_URL) {
  app.get('/uploads/:filename', (req, res) => {
    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/uploads/${req.params.filename}`
    res.redirect(publicUrl)
  })
} else {
  app.use(
    '/uploads',
    express.static(uploadsDir, {
      setHeaders: (res) => {
        res.setHeader('Content-Disposition', 'attachment')
      },
    }),
  )
}

// ── Routes — public (no auth required) ──
app.use('/api/auth', authRoutes)
app.use('/api/admins', adminsRoutes)
app.use('/sds', sdsPublicRoutes)

// ── Routes — protected (auth applied inside each router) ──
app.use('/api/crews', crewRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/employees', employeeRoutes(upload, uploadToStorage))
app.use('/api/equipment', equipmentRoutes)
app.use('/api/chemicals', chemicalRoutes)
app.use('/api/spray-logs', sprayLogRoutes(upload, uploadToStorage))
app.use('/api/rosters', rosterRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/routes', routeRoutes(upload, uploadToStorage))
app.use('/api/device', deviceRoutes)
app.use('/api/account-groups', accountGroupRoutes)
app.use('/api/schedule-events', scheduleEventRoutes)
app.use('/api/resources', resourceRoutes)
app.use('/api/service-plans', servicePlanRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/modules', moduleRoutes)
app.use('/api/certifications', certificationRoutes)
app.use('/api/training', trainingRoutes)
app.use('/api/incidents', incidentRoutes)
app.use('/api/sds', sdsRoutes)
app.use('/api/integrations', integrationRoutes)
app.use('/api/dashboard-pins', dashboardPinRoutes)
app.use('/api/organization', organizationRoutes)
app.use('/api/invitations', invitationRoutes)
app.use('/api/field-docs', fieldDocRoutes(upload, uploadToStorage))

// ── Health check ──
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1')
    res.json({ status: 'ok' })
  } catch {
    res.status(500).json({ status: 'error' })
  }
})

// ── Production: serve built frontend ──
if (!isDev) {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next()
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// ── Error handlers — must be last ──
app.use(notFound)
Sentry.setupExpressErrorHandler(app)
app.use(errorHandler)

// ═══════════════════════════════════════════
// Start server + graceful shutdown
// ═══════════════════════════════════════════

const server = app.listen(PORT, () => {
  logger.info(`CruPoint API → http://localhost:${PORT}`)
})

function gracefulShutdown(signal) {
  logger.info({ signal }, 'Shutdown signal received — closing server')
  server.close(() => {
    logger.info('HTTP server closed')
    db.end().then(() => {
      logger.info('Database pool closed')
      process.exit(0)
    })
  })
  setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit')
    process.exit(1)
  }, 10_000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection')
  Sentry.captureException(reason)
})

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception — shutting down')
  Sentry.captureException(err)
  gracefulShutdown('uncaughtException')
})

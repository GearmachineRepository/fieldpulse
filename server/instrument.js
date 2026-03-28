// ═══════════════════════════════════════════
// Sentry Instrumentation — must load BEFORE app
// Loaded via --import flag in package.json
// ═══════════════════════════════════════════

import * as Sentry from '@sentry/node'
import dotenv from 'dotenv'

dotenv.config()

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  })
}

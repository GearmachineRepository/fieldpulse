// ═══════════════════════════════════════════
// Logger — Pino structured logging
//
// Produces JSON logs in production (for Datadog,
// Elastic, CloudWatch, etc.) and pretty-printed
// logs in development.
//
// Usage:
//   import { logger } from '../utils/logger.js'
//   logger.info('Server started')
//   logger.error({ err, route: '/api/foo' }, 'Request failed')
// ═══════════════════════════════════════════

import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

/**
 * Shared application logger.
 * - Development: pretty-printed, colorized, level: debug
 * - Production:  JSON, level: info (pipe to your log aggregator)
 *
 * @type {import('pino').Logger}
 */
export const logger = pino({
  level: isDev ? 'debug' : 'info',

  // Pretty-print in dev (requires pino-pretty as a dev dependency)
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
})

// ═══════════════════════════════════════════
// Logger — Pino structured logging
// ═══════════════════════════════════════════

import pino from 'pino'

const isDev = process.env.NODE_ENV !== 'production'

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

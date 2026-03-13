// ═══════════════════════════════════════════
// PM2 Ecosystem Config
//
// Usage:
//   pm2 start ecosystem.config.cjs
//   pm2 restart crupoint
//   pm2 logs crupoint
//   pm2 monit
//
// Note: .cjs extension because PM2 doesn't
// support ESM config files yet.
// ═══════════════════════════════════════════

module.exports = {
  apps: [{
    name: 'crupoint',
    script: 'server/index.js',

    // Cluster mode — one process per CPU core
    instances: 'max',
    exec_mode: 'cluster',

    // Auto-restart on crash, but cap retries
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',

    // Environment variables for production
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
    },

    // Environment variables for development
    env_development: {
      NODE_ENV: 'development',
      PORT: 3001,
    },

    // Log management
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true,

    // Graceful shutdown — give 10s for in-flight requests
    kill_timeout: 10000,
    listen_timeout: 8000,

    // Watch for file changes (dev only — disable in production)
    watch: false,
  }],
}

/**
 * ecosystem.config.js — PM2 Process Manager Configuration
 * 
 * Use this to run and manage PathshalaKhoj in a VPS / Linux VM production environment.
 * Run: pm2 start ecosystem.config.js
 */
module.exports = {
  apps: [
    {
      name: 'pathshalakhoj-server',
      script: './backend/server.js',
      instances: 1, // SQLite DatabaseSync runs in single thread (1 instance is optimal to avoid DB locks)
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
};

const app = require('./app');
const config = require('./config/env');
const { getDatabase } = require('./config/database');

// Ensure database tables are initialized
try {
  getDatabase();
  console.log('[DATABASE] SQLite database initialized successfully');
} catch (err) {
  console.error('[DATABASE ERROR] Failed to initialize database:', err);
  process.exit(1);
}

const server = app.listen(config.port, () => {
  console.log('====================================================');
  console.log(`🛡️  Cloud DDoS Protection Gateway & Web Services`);
  console.log(`📡 Listening on http://localhost:${config.port}`);
  console.log(`⚙️  Environment: ${config.nodeEnv}`);
  console.log(`🔍 Health Endpoint: http://localhost:${config.port}/health`);
  console.log(`📊 Admin Metrics: http://localhost:${config.port}/api/admin/metrics`);
  console.log('====================================================');
});

module.exports = server;

const path = require('path');
require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'fallback_development_secret_key_change_in_prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  databasePath: process.env.DATABASE_PATH || path.join(__dirname, '../../data/ddos_protection.sqlite'),
  
  // DDoS Detection & Mitigation tuning
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000, // 1 minute
  maxRequestsPerWindow: parseInt(process.env.MAX_REQUESTS_PER_WINDOW, 10) || 60, // Max 60 req/min per IP
  endpointSurgeThreshold: parseInt(process.env.ENDPOINT_SURGE_THRESHOLD, 10) || 30, // Max 30 req/min on single sensitive endpoint
  quarantineDurationMs: parseInt(process.env.QUARANTINE_DURATION_MS, 10) || 30000, // 30 sec auto-recovery cooldown
  telemetryBufferSize: parseInt(process.env.TELEMETRY_BUFFER_SIZE, 10) || 1000
};

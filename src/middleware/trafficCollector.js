const metricsService = require('../services/metricsService');

/**
 * Normalizes client IP address, handling proxy headers (x-forwarded-for).
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || req.ip || '127.0.0.1';
}

function trafficCollector(req, res, next) {
  const startTime = Date.now();
  req.clientIp = getClientIp(req);
  req.userAgent = req.headers['user-agent'] || 'unknown';

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    // Update global metrics
    const isBlocked = res.statusCode === 429 || res.statusCode === 403;
    metricsService.recordRequest(isBlocked);
  });

  next();
}

module.exports = {
  trafficCollector,
  getClientIp
};

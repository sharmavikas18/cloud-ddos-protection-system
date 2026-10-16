const detectionEngine = require('../services/detectionEngine');

/**
 * Real-time Rate Limiter and DDoS Inspection Gate
 */
function rateLimiterMiddleware(req, res, next) {
  // Allow health checks
  if (req.path === '/health') {
    return next();
  }

  const inspection = detectionEngine.inspectRequest({
    ip: req.clientIp,
    endpoint: req.baseUrl + req.path,
    userAgent: req.userAgent,
    method: req.method
  });

  if (inspection.isThreat) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit or anomaly threshold breached. Defensive quarantine initiated.',
      patternDetected: inspection.pattern,
      highAvailabilityAction: 'Automatic self-healing cooldown initiated to protect upstream cloud services.'
    });
  }

  next();
}

module.exports = rateLimiterMiddleware;

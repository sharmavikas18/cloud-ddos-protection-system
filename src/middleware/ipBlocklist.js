const BlocklistModel = require('../models/blocklistModel');

/**
 * Edge Filter Middleware: Rejects traffic from quarantined IPs
 * before application logic executes.
 */
function ipBlocklistMiddleware(req, res, next) {
  // Allow health check to always bypass for cloud load balancers
  if (req.path === '/health') {
    return next();
  }

  const blocked = BlocklistModel.isIpBlocked(req.clientIp);
  if (blocked) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((new Date(blocked.expires_at).getTime() - Date.now()) / 1000)
    );

    res.set('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Your IP has been temporarily quarantined due to suspicious traffic patterns.',
      reason: blocked.reason,
      retryAfterSeconds,
      autoRecoveryStatus: 'Active cooldown in progress. Access will automatically restore once timer expires.'
    });
  }

  next();
}

module.exports = ipBlocklistMiddleware;

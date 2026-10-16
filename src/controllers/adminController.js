const BlocklistModel = require('../models/blocklistModel');
const AttackEventModel = require('../models/attackEventModel');
const metricsService = require('../services/metricsService');
const detectionEngine = require('../services/detectionEngine');
const mitigationService = require('../services/mitigationService');

class AdminController {
  static getMetrics(req, res) {
    const liveMetrics = metricsService.getMetrics();
    const stats = AttackEventModel.getStatsSummary();
    const pulsingStatus = detectionEngine.evaluatePeriodicPulsing();

    res.json({
      system: liveMetrics,
      incidents: stats,
      anomalyAnalytics: {
        periodicPulsing: pulsingStatus
      }
    });
  }

  static getAttacks(req, res) {
    const limit = parseInt(req.query.limit, 10) || 50;
    const attacks = AttackEventModel.getRecentAttacks(limit);
    res.json({
      count: attacks.length,
      attacks
    });
  }

  static getBlockedIps(req, res) {
    const blocked = BlocklistModel.getActiveBlockedIps();
    res.json({
      activeQuarantines: blocked.length,
      blockedIps: blocked
    });
  }

  static unblockIp(req, res) {
    const { ip } = req.params;
    if (!ip) {
      return res.status(400).json({ error: 'IP address parameter is required' });
    }
    const success = mitigationService.manualUnblock(ip);
    res.json({
      message: success ? `IP ${ip} was unblocked successfully` : `IP ${ip} was not actively blocked`,
      unblocked: success
    });
  }
}

module.exports = AdminController;

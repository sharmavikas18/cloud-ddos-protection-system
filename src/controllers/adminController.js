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

  static async triggerSimulation(req, res) {
    const { pattern = 'pattern1' } = req.body;
    const simulator = require('../../tools/attack-simulator');
    try {
      if (pattern === 'pattern1') {
        await simulator.simulatePattern1SingleIpFlood(65);
      } else if (pattern === 'pattern2') {
        await simulator.simulatePattern2BotnetCluster(35);
      } else if (pattern === 'pattern3') {
        await simulator.simulatePattern3EndpointSurge(40);
      } else {
        await simulator.simulateNormalTraffic(5);
      }
      res.json({ success: true, message: `Simulation for ${pattern} completed successfully.` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = AdminController;

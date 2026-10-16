const config = require('../config/env');
const BlocklistModel = require('../models/blocklistModel');
const AttackEventModel = require('../models/attackEventModel');

class MitigationService {
  /**
   * Automatically quarantines the attacking IP, logs the incident,
   * and schedules the self-healing auto-unban.
   */
  triggerMitigation({ patternName, sourceIp, targetEndpoint, requestCount, severity = 'HIGH', details = {} }) {
    // 1. Add IP to quarantine blocklist with TTL
    const blockRecord = BlocklistModel.addBlockedIp({
      ipAddress: sourceIp,
      reason: `Automated mitigation triggered: ${patternName}`,
      patternDetected: patternName,
      durationMs: config.quarantineDurationMs
    });

    // 2. Persist attack event log for forensics & analytics
    const event = AttackEventModel.logAttack({
      patternName,
      sourceIp,
      targetEndpoint,
      requestCount,
      severity,
      details
    });

    console.warn(`[DDoS MITIGATION] Quarantined IP: ${sourceIp} | Pattern: ${patternName} | Expiry: ${blockRecord.expiresAt}`);
    return { blockRecord, event };
  }

  /**
   * Manual override to unban an IP immediately.
   */
  manualUnblock(ipAddress) {
    return BlocklistModel.unblockIp(ipAddress);
  }
}

module.exports = new MitigationService();

const { getDatabase } = require('../config/database');

class BlocklistModel {
  /**
   * Adds an IP to the quarantine blocklist with an expiration date.
   */
  static addBlockedIp({ ipAddress, reason, patternDetected, durationMs = 30000 }) {
    const db = getDatabase();
    const expiresAt = new Date(Date.now() + durationMs).toISOString();

    // Check if active block exists
    const existing = db.prepare(`
      SELECT id FROM blocked_ips WHERE ip_address = ? AND is_active = 1
    `).get(ipAddress);

    if (existing) {
      // Extend block
      const updateQuery = db.prepare(`
        UPDATE blocked_ips 
        SET expires_at = ?, reason = ?, pattern_detected = ? 
        WHERE id = ?
      `);
      updateQuery.run(expiresAt, reason, patternDetected, existing.id);
      return { id: existing.id, ipAddress, expiresAt, updated: true };
    }

    const insertQuery = db.prepare(`
      INSERT INTO blocked_ips (ip_address, reason, pattern_detected, expires_at, is_active)
      VALUES (?, ?, ?, ?, 1)
    `);
    const result = insertQuery.run(ipAddress, reason, patternDetected, expiresAt);
    return {
      id: Number(result.lastInsertRowid),
      ipAddress,
      reason,
      patternDetected,
      expiresAt
    };
  }

  /**
   * Checks if an IP is actively blocked. Automatically expires outdated blocks.
   */
  static isIpBlocked(ipAddress) {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Inactivate expired blocks for this IP
    db.prepare(`
      UPDATE blocked_ips 
      SET is_active = 0 
      WHERE ip_address = ? AND is_active = 1 AND expires_at <= ?
    `).run(ipAddress, now);

    const active = db.prepare(`
      SELECT * FROM blocked_ips 
      WHERE ip_address = ? AND is_active = 1 AND expires_at > ?
    `).get(ipAddress, now);

    return active || null;
  }

  /**
   * Returns all actively quarantined IPs.
   */
  static getActiveBlockedIps() {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Clean expired
    db.prepare(`
      UPDATE blocked_ips 
      SET is_active = 0 
      WHERE is_active = 1 AND expires_at <= ?
    `).run(now);

    return db.prepare(`
      SELECT id, ip_address, reason, pattern_detected, blocked_at, expires_at 
      FROM blocked_ips 
      WHERE is_active = 1 
      ORDER BY blocked_at DESC
    `).all();
  }

  /**
   * Manually unblocks an IP.
   */
  static unblockIp(ipAddress) {
    const db = getDatabase();
    const query = db.prepare(`
      UPDATE blocked_ips 
      SET is_active = 0 
      WHERE ip_address = ? AND is_active = 1
    `);
    const result = query.run(ipAddress);
    return result.changes > 0;
  }
}

module.exports = BlocklistModel;

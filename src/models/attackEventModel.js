const { getDatabase } = require('../config/database');

class AttackEventModel {
  static logAttack({ patternName, sourceIp, targetEndpoint, requestCount, severity = 'HIGH', details = '' }) {
    const db = getDatabase();
    const query = db.prepare(`
      INSERT INTO attack_events (pattern_name, source_ip, target_endpoint, request_count, severity, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = query.run(
      patternName,
      sourceIp,
      targetEndpoint,
      requestCount,
      severity,
      typeof details === 'object' ? JSON.stringify(details) : String(details)
    );
    return {
      id: Number(result.lastInsertRowid),
      patternName,
      sourceIp,
      targetEndpoint,
      requestCount,
      severity,
      details,
      timestamp: new Date().toISOString()
    };
  }

  static getRecentAttacks(limit = 20) {
    const db = getDatabase();
    const query = db.prepare(`
      SELECT * FROM attack_events 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    return query.all(limit);
  }

  static getStatsSummary() {
    const db = getDatabase();
    const totalAttacks = db.prepare('SELECT COUNT(*) as count FROM attack_events').get().count;
    const patternBreakdown = db.prepare(`
      SELECT pattern_name, COUNT(*) as count 
      FROM attack_events 
      GROUP BY pattern_name
    `).all();
    const activeBlocks = db.prepare(`
      SELECT COUNT(*) as count 
      FROM blocked_ips 
      WHERE is_active = 1 AND expires_at > ?
    `).get(new Date().toISOString()).count;

    return {
      totalAttacks,
      activeBlocks,
      patternBreakdown
    };
  }
}

module.exports = AttackEventModel;

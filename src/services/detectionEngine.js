const config = require('../config/env');
const mitigationService = require('./mitigationService');

class DetectionEngine {
  constructor() {
    // In-memory sliding windows for real-time, low-latency evaluation
    // Map<ip, Array<timestamp>>
    this.ipWindows = new Map();

    // Map<endpoint, Array<{ ip, timestamp }>>
    this.endpointWindows = new Map();

    // Map<userAgent, Array<{ ip, timestamp }>>
    this.fingerprintWindows = new Map();

    // Array<{ timestamp, count }> for periodic pulsing pattern analysis
    this.trafficTimeSeries = [];

    // Periodic cleanup interval (every 30 seconds)
    setInterval(() => this.cleanupOldEntries(), 30000).unref();
  }

  /**
   * Main inspection hook called for every incoming request.
   * Runs in non-blocking O(1) average time.
   */
  inspectRequest({ ip, endpoint, userAgent, method }) {
    const now = Date.now();
    const windowStart = now - config.rateLimitWindowMs;

    // 1. Record & Evaluate Pattern 1: Single IP Volumetric Flood
    const ipTimestamps = this.recordIpHit(ip, now, windowStart);
    if (ipTimestamps.length > config.maxRequestsPerWindow) {
      mitigationService.triggerMitigation({
        patternName: 'PATTERN_1_VOLUMETRIC_IP_FLOOD',
        sourceIp: ip,
        targetEndpoint: endpoint,
        requestCount: ipTimestamps.length,
        severity: 'CRITICAL',
        details: {
          detectedRate: `${ipTimestamps.length} reqs / ${config.rateLimitWindowMs / 1000}s`,
          threshold: config.maxRequestsPerWindow,
          userAgent
        }
      });
      return { isThreat: true, pattern: 'PATTERN_1_VOLUMETRIC_IP_FLOOD' };
    }

    // 2. Record & Evaluate Pattern 3: Unexplained Surge to Single Endpoint
    const endpointHits = this.recordEndpointHit(endpoint, ip, now, windowStart);
    if (endpointHits.length > config.endpointSurgeThreshold) {
      // Check if surge is dominated by this IP or clustered
      const ipSpecificEndpointHits = endpointHits.filter(h => h.ip === ip).length;
      if (ipSpecificEndpointHits > (config.endpointSurgeThreshold * 0.7)) {
        mitigationService.triggerMitigation({
          patternName: 'PATTERN_3_ENDPOINT_SURGE_ATTACK',
          sourceIp: ip,
          targetEndpoint: endpoint,
          requestCount: ipSpecificEndpointHits,
          severity: 'HIGH',
          details: {
            endpointHits: endpointHits.length,
            threshold: config.endpointSurgeThreshold
          }
        });
        return { isThreat: true, pattern: 'PATTERN_3_ENDPOINT_SURGE_ATTACK' };
      }
    }

    // 3. Record & Evaluate Pattern 2: Behavioral Profile Clustering (Botnet)
    if (userAgent && userAgent !== 'unknown') {
      const fingerprintHits = this.recordFingerprintHit(userAgent, ip, now, windowStart);
      const uniqueIps = new Set(fingerprintHits.map(h => h.ip));
      // If > 20 requests sharing exact same profile from 3+ distinct IPs in small window
      if (fingerprintHits.length > 25 && uniqueIps.size >= 3) {
        mitigationService.triggerMitigation({
          patternName: 'PATTERN_2_BEHAVIORAL_BOTNET_CLUSTER',
          sourceIp: ip,
          targetEndpoint: endpoint,
          requestCount: fingerprintHits.length,
          severity: 'CRITICAL',
          details: {
            profile: userAgent,
            distinctBotIps: Array.from(uniqueIps),
            totalProfileRequests: fingerprintHits.length
          }
        });
        return { isThreat: true, pattern: 'PATTERN_2_BEHAVIORAL_BOTNET_CLUSTER' };
      }
    }

    // 4. Record Global Traffic Time-Series for Pattern 4 (Pulsing / Spiking attacks)
    this.recordTimeSeriesHit(now);

    return { isThreat: false };
  }

  recordIpHit(ip, now, windowStart) {
    if (!this.ipWindows.has(ip)) {
      this.ipWindows.set(ip, []);
    }
    const timestamps = this.ipWindows.get(ip);
    timestamps.push(now);

    // Filter within sliding window
    const filtered = timestamps.filter(t => t >= windowStart);
    this.ipWindows.set(ip, filtered);
    return filtered;
  }

  recordEndpointHit(endpoint, ip, now, windowStart) {
    if (!this.endpointWindows.has(endpoint)) {
      this.endpointWindows.set(endpoint, []);
    }
    const hits = this.endpointWindows.get(endpoint);
    hits.push({ ip, timestamp: now });
    const filtered = hits.filter(h => h.timestamp >= windowStart);
    this.endpointWindows.set(endpoint, filtered);
    return filtered;
  }

  recordFingerprintHit(userAgent, ip, now, windowStart) {
    if (!this.fingerprintWindows.has(userAgent)) {
      this.fingerprintWindows.set(userAgent, []);
    }
    const hits = this.fingerprintWindows.get(userAgent);
    hits.push({ ip, timestamp: now });
    const filtered = hits.filter(h => h.timestamp >= windowStart);
    this.fingerprintWindows.set(userAgent, filtered);
    return filtered;
  }

  recordTimeSeriesHit(now) {
    const currentSecond = Math.floor(now / 1000);
    const lastEntry = this.trafficTimeSeries[this.trafficTimeSeries.length - 1];
    if (lastEntry && lastEntry.second === currentSecond) {
      lastEntry.count += 1;
    } else {
      this.trafficTimeSeries.push({ second: currentSecond, count: 1 });
      if (this.trafficTimeSeries.length > 300) { // Keep last 5 minutes (300 seconds)
        this.trafficTimeSeries.shift();
      }
    }
  }

  /**
   * Evaluates Pattern 4: Periodic pulsing / harmonic spikes.
   */
  evaluatePeriodicPulsing() {
    if (this.trafficTimeSeries.length < 20) return null;
    const counts = this.trafficTimeSeries.map(t => t.count);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const max = Math.max(...counts);

    // If max spike is > 4x average and standard deviation indicates pulsing
    if (max > 15 && max > (avg * 3.5)) {
      return {
        detected: true,
        maxSpikeRps: max,
        averageRps: Number(avg.toFixed(2))
      };
    }
    return { detected: false };
  }

  cleanupOldEntries() {
    const windowStart = Date.now() - config.rateLimitWindowMs;
    for (const [ip, timestamps] of this.ipWindows.entries()) {
      const valid = timestamps.filter(t => t >= windowStart);
      if (valid.length === 0) {
        this.ipWindows.delete(ip);
      } else {
        this.ipWindows.set(ip, valid);
      }
    }
  }

  reset() {
    this.ipWindows.clear();
    this.endpointWindows.clear();
    this.fingerprintWindows.clear();
    this.trafficTimeSeries = [];
  }
}

// Singleton instance
module.exports = new DetectionEngine();

class MetricsService {
  constructor() {
    this.totalRequests = 0;
    this.blockedRequests = 0;
    this.startTime = Date.now();
    this.recentRequests = []; // Timestamps of recent requests
  }

  recordRequest(isBlocked = false) {
    this.totalRequests += 1;
    if (isBlocked) {
      this.blockedRequests += 1;
    }
    const now = Date.now();
    this.recentRequests.push(now);

    // Keep only last 10 seconds for real-time RPS calculation
    const cutoff = now - 10000;
    this.recentRequests = this.recentRequests.filter(t => t >= cutoff);
  }

  getMetrics() {
    const now = Date.now();
    const cutoff = now - 10000;
    this.recentRequests = this.recentRequests.filter(t => t >= cutoff);
    const rps = Number((this.recentRequests.length / 10).toFixed(2));
    const uptimeSec = Math.floor((now - this.startTime) / 1000);

    return {
      status: 'UP',
      uptimeSeconds: uptimeSec,
      totalRequests: this.totalRequests,
      blockedRequests: this.blockedRequests,
      currentRps: rps,
      protectionStatus: 'ACTIVE'
    };
  }

  reset() {
    this.totalRequests = 0;
    this.blockedRequests = 0;
    this.recentRequests = [];
  }
}

module.exports = new MetricsService();

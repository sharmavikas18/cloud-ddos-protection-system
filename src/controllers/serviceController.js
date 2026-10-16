class ServiceController {
  static getPublicData(req, res) {
    res.json({
      service: 'Cloud Public Portal',
      status: 'AVAILABLE',
      timestamp: new Date().toISOString(),
      content: 'This public service endpoint is operational and protected by Cloud DDoS Guard.'
    });
  }

  static getComputeHeavy(req, res) {
    // Simulate some CPU compute (often targeted by L7 DoS attacks)
    let sum = 0;
    for (let i = 0; i < 50000; i++) {
      sum += Math.sqrt(i);
    }
    res.json({
      service: 'High Compute Reporting API',
      status: 'AVAILABLE',
      resultChecksum: sum.toFixed(2),
      timestamp: new Date().toISOString()
    });
  }

  static getUserDashboard(req, res) {
    res.json({
      service: 'Customer Portal',
      user: req.user.email,
      accountBalance: 12500.50,
      recentActivity: [
        { id: 1, action: 'Invoice payment', amount: '$450.00' },
        { id: 2, action: 'Cloud storage subscription renewal', amount: '$49.99' }
      ]
    });
  }
}

module.exports = ServiceController;

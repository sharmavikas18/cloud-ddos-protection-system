const express = require('express');
const cors = require('cors');
const { trafficCollector } = require('./middleware/trafficCollector');
const ipBlocklistMiddleware = require('./middleware/ipBlocklist');
const rateLimiterMiddleware = require('./middleware/rateLimiter');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const metricsService = require('./services/metricsService');

const app = express();

// Standard parsers & security headers
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Non-blocking telemetry ingestion
app.use(trafficCollector);

// Edge DDoS Protection Layers
app.use(ipBlocklistMiddleware);
app.use(rateLimiterMiddleware);

// Cloud High Availability & Health probe
app.get('/health', (req, res) => {
  const metrics = metricsService.getMetrics();
  res.status(200).json({
    status: 'HEALTHY',
    service: 'Cloud DDoS Protection Gateway',
    timestamp: new Date().toISOString(),
    metrics
  });
});

// Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/services', serviceRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;

const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/serviceController');
const { requireAuth } = require('../middleware/authMiddleware');

router.get('/public', ServiceController.getPublicData);
router.get('/heavy', ServiceController.getComputeHeavy);
router.get('/dashboard', requireAuth, ServiceController.getUserDashboard);

module.exports = router;

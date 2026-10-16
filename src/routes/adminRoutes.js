const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/authMiddleware');

// In development/demo, allow read metrics with optional auth, or require admin/analyst
router.get('/metrics', AdminController.getMetrics);
router.get('/attacks', AdminController.getAttacks);
router.get('/blocked-ips', AdminController.getBlockedIps);
router.post('/unblock/:ip', AdminController.unblockIp);

module.exports = router;

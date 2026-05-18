const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/overview', authenticate, authorize('admin'), analyticsController.getOverview);
router.get('/agents', authenticate, authorize('admin'), analyticsController.getAgentPerformance);

module.exports = router;

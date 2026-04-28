// src/routes/reporting.js
const express = require('express');
const router = express.Router();
const reportingController = require('../controllers/reportingController');
const { authenticate, authorize } = require('../middleware/auth');

// All reporting endpoints require authentication (and typically Admin/Manager roles)
router.get('/jobs-per-week', authenticate, authorize('Admin', 'Manager'), reportingController.getJobsPerWeek);
router.get('/revenue-by-service', authenticate, authorize('Admin', 'Manager'), reportingController.getRevenueByService);
router.get('/jobs-by-status', authenticate, reportingController.getJobsByStatus);

module.exports = router;
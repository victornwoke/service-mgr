// src/routes/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/', dashboardController.getDashboardOverview);
router.get('/today', dashboardController.getTodaysSchedule);
router.get('/overdue', dashboardController.getOverdueJobs);
router.get('/customers/:id', dashboardController.getCustomer360);
router.get('/stats/jobs', dashboardController.getJobStats);

module.exports = router;
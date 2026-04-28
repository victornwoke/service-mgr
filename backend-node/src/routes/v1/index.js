// src/routes/v1/index.js
// Central router for all API endpoints v1
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

router.use('/auth', authLimiter, require('./auth'));
router.use('/customers', authenticate, require('./customers'));
router.use('/jobs', authenticate, require('./jobs'));
router.use('/staff', authenticate, authorize('Admin'), require('./staff'));
router.use('/invoices', authenticate, require('./invoices'));
router.use('/dashboard', authenticate, require('./dashboard'));
router.use('/tasks', authenticate, authorize('Admin'), require('./tasks'));
router.use('/audit', authenticate, authorize('Admin'), require('../audit'));
router.use('/services', authenticate, require('./services'));
router.use('/reporting', authenticate, require('../reporting'));
router.use('/', authenticate, require('../jobNotes'));

module.exports = router;

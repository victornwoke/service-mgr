// src/routes/index.js
// Central router for all API endpoints
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.use('/auth', require('./auth'));
router.use('/customers', authenticate, require('./customers'));
router.use('/jobs', authenticate, require('./jobs'));
router.use('/staff', authenticate, authorize('Admin'), require('./staff'));
router.use('/invoices', authenticate, require('./invoices'));
router.use('/dashboard', authenticate, require('./dashboard'));

module.exports = router;

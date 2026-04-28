// src/routes/services.js
const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, servicesController.getAllServices);
router.get('/:id', authenticate, servicesController.getServiceById);
router.post('/', authenticate, authorize('Admin'), servicesController.createService);
router.put('/:id', authenticate, authorize('Admin'), servicesController.updateService);
router.delete('/:id', authenticate, authorize('Admin'), servicesController.deleteService);

module.exports = router;
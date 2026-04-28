// src/routes/customers.js
const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customersController');

router.get('/', customersController.getAllCustomers);
router.get('/:id', customersController.getCustomerById);
router.post('/', customersController.createCustomer);
router.put('/:id', customersController.updateCustomer);
router.delete('/:id', customersController.deleteCustomer);

module.exports = router;

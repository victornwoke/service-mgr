// src/controllers/customersController.js
const { Customer, Job } = require('../models');
const { auditLog, captureChanges } = require('../services/auditService');
const Joi = require('joi');
const { Op } = require('sequelize');
const sanitizeHtml = require('sanitize-html');

const customerSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow('').allow(null),
  address: Joi.string().allow('').allow(null),
  notes: Joi.string().allow('').allow(null)
});

const handleError = (res, err) => {
  console.error(err);
  if (err.isJoi) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: err.details.map(detail => detail.message)
    });
  }
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: err.errors.map(e => e.message)
    });
  }
  return res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

const buildSearchWhere = (searchTerm) => {
  if (!searchTerm) return {};
  const term = `%${searchTerm}%`;
  return {
    [Op.or]: [
      { name: { [Op.iLike]: term } },
      { email: { [Op.iLike]: term } },
      { phone: { [Op.iLike]: term } },
      { address: { [Op.iLike]: term } }
    ]
  };
};

exports.getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;
    
    const where = buildSearchWhere(search);
    
    const { count, rows } = await Customer.findAndCountAll({
      where,
      include: [{
        model: Job,
        attributes: ['id', 'service', 'status', 'scheduledAt']
      }],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      customers: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit),
        hasNext: parseInt(page) < Math.ceil(count / limit),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, { 
      include: [{
        model: Job,
        attributes: ['id', 'service', 'status', 'scheduledAt', 'notes'],
        include: ['Invoice']
      }]
    });
    if (!customer) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Customer not found'
      });
    }
    res.json(customer);
  } catch (err) {
    handleError(res, err);
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { error, value } = customerSchema.validate(req.body);
    if (error) {
      throw error;
    }
    // Sanitize text fields
    if (value.notes) value.notes = sanitizeHtml(value.notes, { allowedTags: [], allowedAttributes: {} });
    const customer = await Customer.create(value);
    
    // Audit log
    await auditLog({
      userId: req.user.id,
      action: 'CREATE',
      entityType: 'Customer',
      entityId: customer.id,
      changes: { fields: { ...value, notes: '[sanitized]' } },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(201).json(customer);
  } catch (err) {
    handleError(res, err);
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { error, value } = customerSchema.validate(req.body);
    if (error) {
      throw error;
    }
    // Sanitize text fields
    if (value.notes) value.notes = sanitizeHtml(value.notes, { allowedTags: [], allowedAttributes: {} });
    
    // Get old values for audit
    const existing = await Customer.findByPk(req.params.id);
    if (!existing) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Customer not found'
      });
    }
    
    const [updated] = await Customer.update(value, { where: { id: req.params.id } });
    if (!updated) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Customer not found'
      });
    }
    
    const customer = await Customer.findByPk(req.params.id);
    
    // Audit log
    const changes = require('../services/auditService').captureChanges(
      existing.get({ plain: true }),
      customer.get({ plain: true })
    );
    await auditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'Customer',
      entityId: customer.id,
      changes,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json(customer);
  } catch (err) {
    handleError(res, err);
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const existing = await Customer.findByPk(req.params.id);
    if (!existing) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Customer not found'
      });
    }
    
    const deleted = await Customer.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Customer not found'
      });
    }
    
    // Audit log
    await auditLog({
      userId: req.user.id,
      action: 'DELETE',
      entityType: 'Customer',
      entityId: existing.id,
      changes: { deleted: true },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(204).send();
  } catch (err) {
    handleError(res, err);
  }
};
// src/controllers/servicesController.js
const { Service } = require('../models');
const Joi = require('joi');

const serviceSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().allow('').allow(null),
  defaultRate: Joi.number().precision(2).min(0).allow(null),
  isActive: Joi.boolean().default(true)
});

const handleError = (res, err) => {
  console.error(err);
  if (err.isJoi) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: err.details.map(d => d.message)
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

exports.getAllServices = async (req, res) => {
  try {
    const { active } = req.query;
    const where = {};
    if (active !== undefined) where.isActive = active === 'true';
    const services = await Service.findAll({ where, order: [['name', 'ASC']] });
    res.json(services);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Service not found' });
    }
    res.json(service);
  } catch (err) {
    handleError(res, err);
  }
};

exports.createService = async (req, res) => {
  try {
    const { error, value } = serviceSchema.validate(req.body);
    if (error) throw error;
    const service = await Service.create(value);
    res.status(201).json(service);
  } catch (err) {
    handleError(res, err);
  }
};

exports.updateService = async (req, res) => {
  try {
    const { error, value } = serviceSchema.validate(req.body);
    if (error) throw error;
    const [updated] = await Service.update(value, { where: { id: req.params.id } });
    if (!updated) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Service not found' });
    }
    const service = await Service.findByPk(req.params.id);
    res.json(service);
  } catch (err) {
    handleError(res, err);
  }
};

exports.deleteService = async (req, res) => {
  try {
    const deleted = await Service.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Service not found' });
    }
    res.status(204).send();
  } catch (err) {
    handleError(res, err);
  }
};
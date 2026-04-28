// src/controllers/jobsController.js
const { Job, Customer, Staff, Invoice, Payment } = require('../models');
const { auditLog, captureChanges } = require('../services/auditService');
const { scheduleJobReminder, scheduleFollowUp } = require('../services/taskService');
const Joi = require('joi');
const { Op } = require('sequelize');
const sanitizeHtml = require('sanitize-html');

const jobSchema = Joi.object({
  customerId: Joi.number().integer().positive().required(),
  staffId: Joi.number().integer().positive().allow(null).allow(''),
  service: Joi.string().min(1).max(100).required(),
  status: Joi.string().valid('Pending', 'Quote', 'Booked', 'In Progress', 'Completed', 'Invoiced').default('Pending'),
  scheduledAt: Joi.date().iso(),
  notes: Joi.string().allow('').allow(null)
});

const updateJobSchema = Joi.object({
  customerId: Joi.number().integer().positive(),
  staffId: Joi.number().integer().positive().allow(null).allow(''),
  service: Joi.string().min(1).max(100),
  status: Joi.string().valid('Pending', 'Quote', 'Booked', 'In Progress', 'Completed', 'Invoiced'),
  scheduledAt: Joi.date().iso(),
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
      { service: { [Op.iLike]: term } },
      { notes: { [Op.iLike]: term } },
      { '$Customer.name$': { [Op.iLike]: term } }
    ]
  };
};

exports.getAllJobs = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, staffId, customerId, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    const searchWhere = buildSearchWhere(search);
    
    if (Object.keys(searchWhere).length > 0) {
      where[Op.and] = [searchWhere];
    }
    
    if (status) where.status = status;
    if (staffId) where.staffId = parseInt(staffId);
    if (customerId) where.customerId = parseInt(customerId);
    
    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) where.scheduledAt[Op.gte] = new Date(startDate);
      if (endDate) where.scheduledAt[Op.lte] = new Date(endDate);
    }
    
    const { count, rows } = await Job.findAndCountAll({
      where,
      include: [
        { model: Customer, attributes: ['id', 'name', 'email'] },
        { model: Staff, attributes: ['id', 'name'] },
        { model: Invoice, attributes: ['id', 'total', 'status'] }
      ],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['scheduledAt', 'ASC']]
    });
    
    res.json({
      jobs: rows,
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

exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findByPk(req.params.id, { 
      include: [
        { model: Customer, attributes: ['id', 'name', 'email', 'phone', 'address'] },
        { model: Staff, attributes: ['id', 'name', 'email'] },
        {
          model: Invoice,
          attributes: ['id', 'total', 'status', 'issuedAt', 'pdfUrl'],
          include: [{ model: Payment }]
        }
      ]
    });
    if (!job) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Job not found'
      });
    }
    res.json(job);
  } catch (err) {
    handleError(res, err);
  }
};

exports.createJob = async (req, res) => {
  try {
    const { error, value } = jobSchema.validate(req.body);
    if (error) {
      throw error;
    }
    // Sanitize notes and handle empty strings for optional integers
    if (value.notes) value.notes = sanitizeHtml(value.notes, { allowedTags: [], allowedAttributes: {} });
    if (value.staffId === '') value.staffId = null; // Convert empty string to null
    const job = await Job.create(value);
    const jobWithAssociations = await Job.findByPk(job.id, {
      include: [
        { model: Customer, attributes: ['id', 'name'] },
        { model: Staff, attributes: ['id', 'name'] }
      ]
    });
    
    // Audit log
    await auditLog({
      userId: req.user.id,
      action: 'CREATE',
      entityType: 'Job',
      entityId: job.id,
      changes: { fields: { ...value, notes: value.notes ? '[sanitized]' : null } },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Schedule reminder task if job has a future scheduledAt
    if (job.scheduledAt && new Date(job.scheduledAt) > new Date()) {
      await scheduleJobReminder(job.id, job.scheduledAt);
    }
    
    res.status(201).json(jobWithAssociations);
  } catch (err) {
    handleError(res, err);
  }
};

exports.updateJob = async (req, res) => {
  try {
    const { error, value } = updateJobSchema.validate(req.body);
    if (error) {
      throw error;
    }
    // Sanitize notes and handle empty strings for optional integers
    if (value.notes) value.notes = sanitizeHtml(value.notes, { allowedTags: [], allowedAttributes: {} });
    if (value.staffId === '') value.staffId = null; // Convert empty string to null

    const existing = await Job.findByPk(req.params.id);
    if (!existing) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Job not found'
      });
    }

    const [updated] = await Job.update(value, { where: { id: req.params.id } });
    if (!updated) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Job not found'
      });
    }

    const job = await Job.findByPk(req.params.id, {
      include: [
        { model: Customer, attributes: ['id', 'name'] },
        { model: Staff, attributes: ['id', 'name'] }
      ]
    });

    // If status changed to "Completed", schedule follow‑up task
    const oldStatus = existing.status;
    const newStatus = job.status;
    if (oldStatus !== 'Completed' && newStatus === 'Completed') {
      await scheduleFollowUp(job.id);
    }

    // Audit log
    const changes = captureChanges(
      existing.get({ plain: true }),
      job.get({ plain: true })
    );
    await auditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'Job',
      entityId: job.id,
      changes,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json(job);
  } catch (err) {
    handleError(res, err);
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const existing = await Job.findByPk(req.params.id);
    if (!existing) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Job not found'
      });
    }
    
    const deleted = await Job.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Job not found'
      });
    }
    
    // Audit log
    await auditLog({
      userId: req.user.id,
      action: 'DELETE',
      entityType: 'Job',
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
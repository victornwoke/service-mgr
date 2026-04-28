// src/controllers/invoicesController.js
const { Invoice, Job, Payment } = require('../models');
const { auditLog, captureChanges } = require('../services/auditService');
const Joi = require('joi');

const invoiceSchema = Joi.object({
  jobId: Joi.number().integer().positive().required(),
  total: Joi.number().precision(2).positive().required(),
  status: Joi.string().valid('Paid', 'Unpaid').default('Unpaid'),
  issuedAt: Joi.date().iso(),
  pdfUrl: Joi.string().allow('').allow(null)
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

exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({ 
      include: [
        { model: Job, attributes: ['id', 'service'] },
        { model: Payment }
      ],
      order: [['issuedAt', 'DESC']]
    });
    res.json(invoices);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, { 
      include: [
        { model: Job, attributes: ['id', 'service', 'customerId'] },
        { model: Payment }
      ]
    });
    if (!invoice) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Invoice not found'
      });
    }
    res.json(invoice);
  } catch (err) {
    handleError(res, err);
  }
};

exports.createInvoice = async (req, res) => {
  try {
    const { error, value } = invoiceSchema.validate(req.body);
    if (error) {
      throw error;
    }
    const invoice = await Invoice.create(value);

    // Update job status to 'Invoiced'
    await Job.update({ status: 'Invoiced' }, { where: { id: value.jobId } });

    // Add job details to response
    const invoiceWithJob = await Invoice.findByPk(invoice.id, {
      include: [{ model: Job, attributes: ['id', 'service'] }]
    });

    // Audit log
    await auditLog({
      userId: req.user.id,
      action: 'CREATE',
      entityType: 'Invoice',
      entityId: invoice.id,
      changes: { fields: value },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json(invoiceWithJob);
  } catch (err) {
    handleError(res, err);
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const { error, value } = invoiceSchema.validate(req.body);
    if (error) {
      throw error;
    }
    
    const existing = await Invoice.findByPk(req.params.id);
    if (!existing) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Invoice not found'
      });
    }
    
    const [updated] = await Invoice.update(value, { where: { id: req.params.id } });
    if (!updated) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Invoice not found'
      });
    }
    
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [{ model: Job, attributes: ['id', 'service'] }]
    });
    
    // Audit log
    const changes = captureChanges(
      existing.get({ plain: true }),
      invoice.get({ plain: true })
    );
    await auditLog({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'Invoice',
      entityId: invoice.id,
      changes,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json(invoice);
  } catch (err) {
    handleError(res, err);
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const existing = await Invoice.findByPk(req.params.id);
    if (!existing) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Invoice not found'
      });
    }
    
    const deleted = await Invoice.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Invoice not found'
      });
    }
    
    // Audit log
    await auditLog({
      userId: req.user.id,
      action: 'DELETE',
      entityType: 'Invoice',
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
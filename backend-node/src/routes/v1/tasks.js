// src/routes/v1/tasks.js
const express = require('express');
const router = express.Router();
const { Task } = require('../models');
const Joi = require('joi');
const { authenticate, authorize } = require('../middleware/auth');

const taskSchema = Joi.object({
  type: Joi.string().valid('job_reminder', 'follow_up', 'daily_summary').required(),
  payload: Joi.object().required(),
  scheduledAt: Joi.date().iso().required()
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
  // Handle Sequelize validation errors
  if err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError' {
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

// Get all tasks with optional filtering and pagination
router.get('/', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (type) where.type = type;
    
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Task.findAndCountAll({
      where,
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['scheduledAt', 'ASC']]
    });
    
    res.json({
      tasks: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (err) {
    handleError(res, err);
  }
});

// Get task by ID
router.get('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Task not found'
      });
    }
    res.json(task);
  } catch (err) {
    handleError(res, err);
  }
});

// Create a new task
router.post('/', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { error, value } = taskSchema.validate(req.body);
    if (error) {
      throw error;
    }
    const task = await Task.create(value);
    res.status(201).json(task);
  } catch (err) {
    handleError(res, err);
  }
});

// Update task status (typically used by worker)
router.patch('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { status, retryCount, lastError, startedAt, completedAt } = req.body;
    const updateData = {};
    
    if (status !== undefined) updateData.status = status;
    if (retryCount !== undefined) updateData.retryCount = retryCount;
    if (lastError !== undefined) updateData.lastError = lastError;
    if (startedAt !== undefined) updateData.startedAt = startedAt;
    if (completedAt !== undefined) updateData.completedAt = completedAt;
    
    const [updated] = await Task.update(updateData, { where: { id: req.params.id } });
    if (!updated) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Task not found'
      });
    }
    
    const task = await Task.findByPk(req.params.id);
    res.json(task);
  } catch (err) {
    handleError(res, err);
  }
});

// Delete task (admin only)
router.delete('/:id', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const deleted = await Task.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Task not found'
      });
    }
    res.status(204).send();
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;
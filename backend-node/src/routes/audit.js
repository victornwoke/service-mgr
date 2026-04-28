// src/routes/audit.js
const express = require('express');
const router = express.Router();
const { AuditLog } = require('../models');
const Joi = require('joi');
const { authenticate, authorize } = require('../middleware/auth');

const handleError = (res, err) => {
  console.error(err);
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Internal Server Error'
  });
};

// Get audit logs with filters
router.get('/', authenticate, authorize('Admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, entityType, entityId, userId, action } = req.query;
    const offset = (page - 1) * limit;
    
    const where = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = parseInt(entityId);
    if (userId) where.userId = parseInt(userId);
    if (action) where.action = action;
    
    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      logs: rows,
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

module.exports = router;
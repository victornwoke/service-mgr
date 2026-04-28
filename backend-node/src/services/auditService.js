// src/services/auditService.js
const { AuditLog } = require('../models');

/**
 * Log an audit event
 * @param {Object} options - { userId, action, entityType, entityId, changes, ipAddress, userAgent }
 */
exports.auditLog = async (options) => {
  try {
    await AuditLog.create({
      userId: options.userId || null,
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      changes: options.changes || null,
      ipAddress: options.ipAddress || null,
      userAgent: options.userAgent || null,
      createdAt: new Date()
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

/**
 * Capture before and after values for an update
 */
exports.captureChanges = (oldValues, newValues, excludedFields = ['updatedAt', 'createdAt']) => {
  const changes = {};
  Object.keys(oldValues).forEach(key => {
    if (excludedFields.includes(key)) return;
    if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
      changes[key] = { old: oldValues[key], new: newValues[key] };
    }
  });
  return Object.keys(changes).length ? changes : null;
};
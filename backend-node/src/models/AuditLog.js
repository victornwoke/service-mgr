// src/models/AuditLog.js
module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('AuditLog', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: true }, // staff ID who performed action
    action: { type: DataTypes.STRING, allowNull: false }, // CREATE, UPDATE, DELETE, LOGIN, etc.
    entityType: { type: DataTypes.STRING, allowNull: false }, // e.g., Job, Customer, Invoice
    entityId: { type: DataTypes.INTEGER, allowNull: false },
    changes: { type: DataTypes.JSONB, allowNull: true }, // { old: {...}, new: {...} }
    ipAddress: { type: DataTypes.STRING, allowNull: true },
    userAgent: { type: DataTypes.STRING, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    timestamps: false,
    indexes: [
      { fields: ['entityType', 'entityId'] },
      { fields: ['userId'] },
      { fields: ['createdAt'] }
    ]
  });
};
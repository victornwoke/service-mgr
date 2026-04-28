// src/models/Task.js
module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('Task', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    type: { type: DataTypes.STRING, allowNull: false }, // e.g., 'job_reminder', 'follow_up', 'daily_summary'
    payload: { type: DataTypes.JSONB, allowNull: false }, // task-specific data
    status: { type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'), defaultValue: 'pending' },
    retryCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastError: { type: DataTypes.TEXT, allowNull: true },
    scheduledAt: { type: DataTypes.DATE, allowNull: false }, // when the task should be run
    startedAt: { type: DataTypes.DATE, allowNull: true },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, { timestamps: false }); // we'll manage timestamps manually for clarity
};
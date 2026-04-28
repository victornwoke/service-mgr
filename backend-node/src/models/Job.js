// src/models/Job.js
module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('Job', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    customerId: { type: DataTypes.INTEGER, allowNull: false },
    staffId: { type: DataTypes.INTEGER },
    service: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM('Pending', 'Quote', 'Booked', 'In Progress', 'Completed', 'Invoiced'), defaultValue: 'Pending' },
    scheduledAt: { type: DataTypes.DATE },
    notes: { type: DataTypes.TEXT },
  }, { timestamps: true });
};
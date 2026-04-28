// src/models/Invoice.js
module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('Invoice', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    jobId: { type: DataTypes.INTEGER, allowNull: false },
    total: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    status: { type: DataTypes.ENUM('Paid', 'Unpaid'), defaultValue: 'Unpaid' },
    issuedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    pdfUrl: { type: DataTypes.STRING },
  }, { timestamps: true });
};
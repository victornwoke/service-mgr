// src/models/Payment.js
module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('Payment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    invoiceId: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10,2), allowNull: false },
    paidAt: { type: DataTypes.DATE },
    method: { type: DataTypes.STRING },
  }, { timestamps: true });
};
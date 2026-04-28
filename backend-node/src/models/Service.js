// src/models/Service.js
module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('Service', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { notEmpty: true } },
    description: { type: DataTypes.TEXT, allowNull: true },
    defaultRate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    timestamps: true,
    indexes: [{ fields: ['name'] }]
  });
};
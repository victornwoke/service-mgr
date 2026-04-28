// src/models/Staff.js
module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('Staff', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    role: {
      type: DataTypes.ENUM('Owner', 'Admin', 'Manager', 'Staff'),
      defaultValue: 'Staff'
    },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
  }, {
    timestamps: true,
    tableName: 'Staff' // Explicitly set table name to match migration
  });
};
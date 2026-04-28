// src/models/JobNote.js
module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  return sequelize.define('JobNote', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    jobId: { type: DataTypes.INTEGER, allowNull: false },
    staffId: { type: DataTypes.INTEGER, allowNull: true }, // who added the note
    content: { type: DataTypes.TEXT, allowNull: false, validate: { notEmpty: true } },
    isSystemGenerated: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    timestamps: true,
    indexes: [
      { fields: ['jobId'] },
      { fields: ['staffId'] },
      { fields: ['createdAt'] }
    ]
  });
};
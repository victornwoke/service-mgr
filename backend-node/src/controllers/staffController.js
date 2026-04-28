// src/controllers/staffController.js
const { Staff, Job } = require('../models');
const bcrypt = require('bcryptjs');
const Joi = require('joi');

const staffSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).allow('').allow(null),
  role: Joi.string().valid('Admin', 'Staff').default('Staff')
});

const handleError = (res, err) => {
  console.error(err);
  if (err.isJoi) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: err.details.map(detail => detail.message)
    });
  }
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: err.errors.map(e => e.message)
    });
  }
  return res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.findAll({ 
      include: [Job],
      attributes: { exclude: ['passwordHash'] }
    });
    res.json(staff);
  } catch (err) {
    handleError(res, err);
  }
};

exports.getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findByPk(req.params.id, { 
      include: [Job],
      attributes: { exclude: ['passwordHash'] }
    });
    if (!staff) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Staff not found'
      });
    }
    res.json(staff);
  } catch (err) {
    handleError(res, err);
  }
};

exports.createStaff = async (req, res) => {
  try {
    const { error, value } = staffSchema.validate(req.body);
    if (error) {
      throw error;
    }
    const { password, ...rest } = value;
    if (!password) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Password is required'
      });
    }
    const hash = await bcrypt.hash(password, 10);
    const staff = await Staff.create({ ...rest, passwordHash: hash });
    
    const response = staff.toJSON();
    delete response.passwordHash;
    res.status(201).json(response);
  } catch (err) {
    handleError(res, err);
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { error, value } = staffSchema.validate(req.body);
    if (error) {
      throw error;
    }
    
    const { password, ...updateData } = value;
    
    // If updating password, hash it
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    
    const [updated] = await Staff.update(updateData, { where: { id: req.params.id } });
    if (!updated) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Staff not found'
      });
    }
    
    const staff = await Staff.findByPk(req.params.id, { 
      include: [Job],
      attributes: { exclude: ['passwordHash'] }
    });
    res.json(staff);
  } catch (err) {
    handleError(res, err);
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const deleted = await Staff.destroy({ where: { id: req.params.id } });
    if (!deleted) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Staff not found'
      });
    }
    res.status(204).send();
  } catch (err) {
    handleError(res, err);
  }
};
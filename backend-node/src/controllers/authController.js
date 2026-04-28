// src/controllers/authController.js
const { Staff } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
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
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      code: 'CONFLICT',
      message: 'User with this email already exists',
      details: 'Please use a different email address'
    });
  }
  return res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

exports.login = async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      throw error;
    }
    const { email, password } = value;
    
    const user = await Staff.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials'
      });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid credentials'
      });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (err) {
    handleError(res, err);
  }
};

exports.register = async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      throw error;
    }
    const { name, email, password, role } = value;
    const hash = await bcrypt.hash(password, 10);
    const user = await Staff.create({ name, email, passwordHash: hash, role: role || 'Staff' });
    res.status(201).json({ 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role 
    });
  } catch (err) {
    handleError(res, err);
  }
};
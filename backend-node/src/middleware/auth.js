// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { Staff } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const INTERNAL_TOKEN = process.env.INTERNAL_SERVICE_TOKEN || 'internal-secret-token';

exports.authenticate = async (req, res, next) => {
  // Check for internal service token first
  const internalToken = req.headers['x-service-token'];
  if (internalToken && internalToken === INTERNAL_TOKEN) {
    req.user = { id: 'system', role: 'Admin', name: 'System Worker' };
    return next();
  }

  // Regular JWT auth
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'No token provided'
    });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = await Staff.findByPk(payload.id);
    if (!req.user) {
      return res.status(401).json({
        code: 'UNAUTHORIZED',
        message: 'Invalid user'
      });
    }
    next();
  } catch (err) {
    return res.status(401).json({
      code: 'UNAUTHORIZED',
      message: 'Invalid token'
    });
  }
};

exports.authorize = (roles = []) => {
  if (typeof roles === 'string') roles = [roles];
  return (req, res, next) => {
    if (!roles.length || roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      code: 'FORBIDDEN',
      message: 'Forbidden'
    });
  };
};
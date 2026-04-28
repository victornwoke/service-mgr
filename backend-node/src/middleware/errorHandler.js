// src/middleware/errorHandler.js
const { logger } = require('./logger');

const errorHandler = (err, req, res, next) => {
  // Log the error with request details
  logger.error({
    msg: err.message,
    stack: err.stack,
    code: err.code || 'INTERNAL_ERROR',
    path: req.path,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user ? req.user.id : null
  }, 'Request error');

  // Determine status code and response format
  let statusCode = 500;
  let response = {
    code: 'INTERNAL_ERROR',
    message: 'Internal Server Error'
  };

  // Custom error handling for known types
  if (err.isJoi) {
    statusCode = 400;
    response = {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: err.details.map(d => d.message)
    };
  } else if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    response = {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: err.errors.map(e => e.message)
    };
  } else if (err.code === 'RATE_LIMIT_EXCEEDED' || err.message.includes('rate limit')) {
    statusCode = 429;
    response = {
      code: 'RATE_LIMIT_EXCEEDED',
      message: err.message
    };
  } else if (err.code === 'UNAUTHORIZED' || err.message === 'Invalid token') {
    statusCode = 401;
    response = {
      code: 'UNAUTHORIZED',
      message: err.message
    };
  } else if (err.code === 'FORBIDDEN') {
    statusCode = 403;
    response = {
      code: 'FORBIDDEN',
      message: 'Forbidden'
    };
  } else if (err.code === 'NOT_FOUND') {
    statusCode = 404;
    response = {
      code: 'NOT_FOUND',
      message: err.message
    };
  } else if (process.env.NODE_ENV === 'development') {
    // In development, send error details
    response.details = err.message;
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
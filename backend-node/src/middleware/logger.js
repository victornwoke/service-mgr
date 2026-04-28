// src/middleware/logger.js
const pino = require('pino');
const pinoHttp = require('pino-http');

// Create a transport for structured logging
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'production'
    ? undefined  // Use JSON format in production for structured logging
    : undefined // Use default pretty printing in development
});

// HTTP request logging middleware
const httpLogger = pinoHttp({
  logger: logger.child({ req: {} }),
  autoLogging: process.env.NODE_ENV !== 'test',
  genReqId: (req) => {
    // Generate a short unique ID for correlation
    return require('crypto').randomBytes(4).toString('hex');
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type']
      }
    }),
    res: (res) => ({
      statusCode: res.statusCode
    }),
    err: (err) => ({
      message: err.message,
      stack: err.stack,
      name: err.name
    })
  }
});

// Metrics recording middleware (runs after response finishes)
const recordMetrics = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { recordRequest } = require('../services/metrics');
    const path = req.route?.path || req.path;
    recordRequest(path, req.method, res.statusCode, duration);
  });
  next();
};

// Attach logger to request object for use in controllers
const requestLogger = (req, res, next) => {
  req.log = httpLogger;
  next();
};

// Export both the base logger and the middleware
module.exports = {
  logger,
  httpLogger,
  requestLogger,
  recordMetrics
};
// src/app.js
require('dotenv').config();
const express = require('express');
const apiRouter = require('./routes');
const { sequelize } = require('./models');

const app = express();

// Security middleware
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // allow inline scripts; tighten later with nonce/hash
      styleSrc: ["'self'", "'unsafe-inline'"], // MUI uses inline styles; tighten later
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:3000", "http://localhost:8081"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  }
}));

// CORS
const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting for API endpoints only
const { generalLimiter } = require('./middleware/rateLimit');
app.use('/api', generalLimiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging with correlation ID
const { requestLogger, recordMetrics } = require('./middleware/logger');
app.use(requestLogger);
app.use(recordMetrics);

// API routes with versioning
app.use('/api/v1', apiRouter);

// Health check endpoints (no auth)
app.get('/healthz', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', error: err.message });
  }
});

app.get('/readyz', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: 'ready', checks: { database: 'connected' } });
  } catch (err) {
    res.status(503).json({ status: 'not ready', checks: { database: 'disconnected' } });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Service Manager API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});


// Metrics endpoint (must be before error handler)
const { getMetrics } = require('./services/metrics');
app.get('/metrics', (req, res) => {
  res.json(getMetrics());
});

// Error handling (must be last)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = { app, sequelize };
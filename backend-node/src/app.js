// src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes/v1');
const { sequelize } = require('./models');
const { generalLimiter } = require('./middleware/rateLimit');
const { requestLogger, recordMetrics } = require('./middleware/logger');
const { getMetrics } = require('./services/metrics');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// 1. GLOBAL MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(recordMetrics);

// 2. DYNAMIC CORS (Allows local dev + env overrides)
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',') 
  : ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// 3. PUBLIC DIAGNOSTIC ROUTES (Above Rate Limiter)
app.get('/healthz', (req, res) => res.status(200).json({ status: 'UP' }));

app.get('/readyz', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({ status: 'READY', db: 'CONNECTED' });
  } catch (err) {
    res.status(503).json({ status: 'NOT_READY', db: 'DISCONNECTED' });
  }
});

app.get('/metrics', (req, res) => res.json(getMetrics()));

// 4. API ROUTES (With Rate Limiting)
app.use('/api/v1', generalLimiter, apiRouter);

// Test/Utility Routes
app.post('/test-register', (req, res) => {
  res.json({ message: 'Test works!', data: req.body });
});

app.get('/', (req, res) => {
  res.json({ service: 'Service Manager API', status: 'running' });
});

// 5. ERROR HANDLING (Must be last)
app.use(errorHandler);

module.exports = { app, sequelize };

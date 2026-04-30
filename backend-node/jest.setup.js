// Jest setup file for configuring test environment
require('dotenv').config({ path: '.env.test' });

// Set test database configuration
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'test';
process.env.DB_USER = 'postgres';
process.env.DB_PASS = 'postgres';

// Set other test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.INTERNAL_SERVICE_TOKEN = 'test-token';

// Mock logger middleware to prevent test output pollution
jest.mock('./src/middleware/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    }))
  },
  httpLogger: jest.fn((req, res, next) => next()),
  requestLogger: jest.fn((req, res, next) => {
    req.log = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    };
    next();
  }),
  recordMetrics: jest.fn((req, res, next) => next())
}));

// Mock metrics service
jest.mock('./src/services/metrics', () => ({
  recordRequest: jest.fn(),
  getMetrics: jest.fn(),
  resetMetrics: jest.fn()
}));

// Global test setup
beforeAll(async () => {
  // Wait for database connection and sync schema
  const { sequelize } = require('./src/models');

  try {
    await sequelize.authenticate();
    console.log('Database connection established for tests');

    // Sync database schema for tests
    await sequelize.sync({ force: true });
    console.log('Database schema synchronized for tests');
  } catch (error) {
    console.error('Database setup failed:', error);
    throw error;
  }
});

afterAll(async () => {
  // Close database connection
  const { sequelize } = require('./src/models');
  await sequelize.close();
  console.log('Database connection closed after tests');
});
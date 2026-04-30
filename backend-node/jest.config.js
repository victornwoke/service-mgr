module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/middleware/logger.js', // pino logger is hard to test
    '!src/middleware/errorHandler.js' // error handler is integrated
  ],
  testMatch: ['**/__tests__/**/*.js', '**/*.test.js'],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
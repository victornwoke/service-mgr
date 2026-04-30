// __tests__/health.test.js
const request = require('supertest');
const { app, sequelize } = require('../src/app');

// Ensure DB is connected before tests
beforeAll(async () => {
  await sequelize.authenticate();
});

describe('Health & Ready endpoints', () => {
  test('GET /healthz returns healthy', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
  });

  test('GET /readyz returns ready', async () => {
    const res = await request(app).get('/readyz');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('READY');
    expect(res.body.db).toBe('CONNECTED');
  });

  test('GET / returns service info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.service).toBe('Service Manager API');
    expect(res.body.status).toBe('running');
  });
});
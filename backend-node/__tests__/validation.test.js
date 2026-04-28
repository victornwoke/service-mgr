// __tests__/validation.test.js
const request = require('supertest');
const { app, sequelize } = require('../src/app');
const { Staff } = require('../src/models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
}, 30000);

async function getToken(role = 'Admin') {
  const staff = await Staff.create({
    name: 'Validator',
    email: `val${Date.now()}@test.com`,
    passwordHash: 'hashed',
    role
  });
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: staff.id, role }, process.env.JWT_SECRET || 'supersecretlocaljwtkey');
}

describe('Input Validation', () => {
  let token;

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true });
    token = await getToken();
  }, 15000);

  test('POST /customers rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bad', email: 'notanemail' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details.some(d => d.toLowerCase().includes('email'))).toBe(true);
  });

  test('POST /jobs requires customerId', async () => {
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({ service: 'Plumbing' }); // missing customerId

    expect(res.status).toBe(400);
    expect(res.body.details.some(d => d.includes('customerId'))).toBe(true);
  });

  test('POST /auth/register validates password length', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'X', email: 'x@y.z', password: '123' }); // too short

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});
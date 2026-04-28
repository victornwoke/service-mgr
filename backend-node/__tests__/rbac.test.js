// __tests__/rbac.test.js
const request = require('supertest');
const { app, sequelize } = require('../src/app');
const { Staff, Customer } = require('../src/models');

beforeAll(async () => {
  await sequelize.sync({ force: true });
}, 30000);

async function createUser(role) {
  const staff = await Staff.create({
    name: `${role} User`,
    email: `${role.toLowerCase()}${Date.now()}@test.com`,
    passwordHash: 'hashed',
    role
  });
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: staff.id, role }, process.env.JWT_SECRET || 'supersecretlocaljwtkey');
  return { staff, token };
}

describe('RBAC Permissions', () => {
  let adminToken;
  let managerToken;
  let staffToken;

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true });
    const admin = await createUser('Admin');
    adminToken = admin.token;
    const manager = await createUser('Manager');
    managerToken = manager.token;
    const staff = await createUser('Staff');
    staffToken = staff.token;
  }, 15000);

  test('Admin can create staff', async () => {
    const res = await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Staff', email: 'new@test.com', role: 'Staff', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('New Staff');
  });

  test('Manager cannot create staff (requires Admin)', async () => {
    const res = await request(app)
      .post('/api/v1/staff')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ name: 'Bad', email: 'bad@test.com', role: 'Staff', password: 'pw' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  test('Staff cannot access admin-only endpoints', async () => {
    const res = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ name: 'Test Service' });

    expect(res.status).toBe(403);
  });

  test('Authenticated user can create customer', async () => {
    const res = await request(app)
      .post('/api/v1/customers')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ name: 'Customer A', email: 'custa@test.com' });

    expect(res.status).toBe(201);
    const customers = await sequelize.models.Customer.findAll();
    expect(customers.length).toBe(1);
  });
});
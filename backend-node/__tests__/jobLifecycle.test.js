// __tests__/jobLifecycle.test.js
const request = require('supertest');
const { app, sequelize } = require('../src/app');
const { Job, Customer, Staff, Task } = require('../src/models');

let authToken;
let testCustomer;
let testStaff;

beforeAll(async () => {
  await sequelize.sync({ force: true });
}, 30000);

// Helper: create admin and get token
async function createAdmin() {
  const staff = await Staff.create({
    name: 'Admin Test',
    email: `admin${Date.now()}@test.com`,
    passwordHash: 'hashed',
    role: 'Admin'
  });
  // For testing, we'll manually create a token using the JWT secret
  const jwt = require('jsonwebtoken');
  const token = jwt.sign({ id: staff.id, role: staff.role }, process.env.JWT_SECRET || 'supersecretlocaljwtkey');
  return { staff, token };
}

describe('Job Lifecycle & Task Scheduling', () => {
  beforeEach(async () => {
    await sequelize.truncate({ cascade: true });
    const { staff, token } = await createAdmin();
    testStaff = staff;
    authToken = token;

    const customer = await Customer.create({
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '555-0000'
    });
    testCustomer = customer;
  }, 15000);

  test('POST /api/v1/jobs creates job and schedules reminder task when scheduledAt in future', async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customerId: testCustomer.id,
        service: 'Test Service',
        status: 'Pending',
        scheduledAt: futureDate
      });

    expect(res.status).toBe(201);
    expect(res.data.service).toBe('Test Service');

    // Verify a task was created
    const tasks = await Task.findAll();
    expect(tasks.length).toBe(1);
    expect(tasks[0].type).toBe('job_reminder');
    expect(tasks[0].payload.jobId).toBe(res.data.id);
  }, 20000);

  test('PATCH /api/v1/jobs/:id to Completed schedules follow-up task', async () => {
    // Create job first
    const job = await Job.create({
      customerId: testCustomer.id,
      service: 'Another Service',
      status: 'In Progress',
      staffId: testStaff.id
    });

    const res = await request(app)
      .patch(`/api/v1/jobs/${job.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'Completed' });

    expect(res.status).toBe(200);
    expect(res.data.status).toBe('Completed');

    // Verify follow-up task created
    const tasks = await Task.findAll();
    const followUpTasks = tasks.filter(t => t.type === 'follow_up' && t.payload.jobId === job.id);
    expect(followUpTasks.length).toBe(1);
  }, 20000);

  test('Job status transition does not duplicate tasks on repeated updates', async () => {
    const future = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString();
    const job = await Job.create({
      customerId: testCustomer.id,
      service: 'Repeated Service',
      scheduledAt: future
    });

    // First completion
    await request(app)
      .patch(`/api/v1/jobs/${job.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'Completed' });

    // Second completion (no-op, status already completed)
    await request(app)
      .patch(`/api/v1/jobs/${job.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ status: 'Completed' });

    const followUpTasks = await Task.findAll({ where: { type: 'follow_up' } });
    expect(followUpTasks.length).toBe(1);
  }, 20000);
});
const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

test('Auth API Suite', async (t) => {
  const timestamp = Date.now();
  const testUser = {
    name: 'SecOps Officer',
    email: `secops_${timestamp}@example.com`,
    password: 'securePassword123!',
    role: 'admin'
  };

  await t.test('POST /api/auth/register - Successfully register new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    assert.strictEqual(res.statusCode, 201);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.email, testUser.email);
    assert.strictEqual(res.body.user.role, 'admin');
  });

  await t.test('POST /api/auth/register - Rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    assert.strictEqual(res.statusCode, 409);
    assert.strictEqual(res.body.error, 'Conflict');
  });

  await t.test('POST /api/auth/login - Successfully authenticates user and returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.token);
    assert.strictEqual(res.body.user.email, testUser.email);
  });

  await t.test('POST /api/auth/login - Rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongPassword'
      });

    assert.strictEqual(res.statusCode, 401);
  });

  await t.test('GET /api/auth/profile - Rejects requests without bearer token', async () => {
    const res = await request(app).get('/api/auth/profile');
    assert.strictEqual(res.statusCode, 401);
  });
});

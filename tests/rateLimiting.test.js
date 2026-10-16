const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');

test('Rate Limiting & Health Check Suite', async (t) => {
  await t.test('GET /health - Returns 200 HEALTHY status with telemetry', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'HEALTHY');
    assert.ok(res.body.metrics);
  });

  await t.test('GET /api/services/public - Allows normal traffic within quota', async () => {
    const res = await request(app)
      .get('/api/services/public')
      .set('x-forwarded-for', '10.0.0.1');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'AVAILABLE');
  });
});

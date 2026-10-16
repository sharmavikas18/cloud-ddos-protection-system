const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const BlocklistModel = require('../src/models/blocklistModel');

test('DDoS Pattern Detection & Auto-Recovery Suite', async (t) => {
  const attackerIp = '198.51.100.99';

  await t.test('Pattern 1: Volumetric single IP flood triggers 429 quarantine', async () => {
    // Send bursts exceeding the threshold
    let blockedOccurred = false;
    for (let i = 0; i < 65; i++) {
      const res = await request(app)
        .get('/api/services/public')
        .set('x-forwarded-for', attackerIp);

      if (res.statusCode === 429) {
        blockedOccurred = true;
        assert.ok(res.headers['retry-after'] || res.body.retryAfterSeconds || res.body.error);
        break;
      }
    }
    assert.strictEqual(blockedOccurred, true, 'Attacker IP should be blocked with 429');
  });

  await t.test('Edge Filter rejects subsequent requests with Retry-After header', async () => {
    const res = await request(app)
      .get('/api/services/public')
      .set('x-forwarded-for', attackerIp);

    assert.strictEqual(res.statusCode, 429);
    assert.ok(res.headers['retry-after']);
    assert.strictEqual(res.body.error, 'Too Many Requests');
  });

  await t.test('Admin can view active blocked IPs and manually unblock', async () => {
    const listRes = await request(app).get('/api/admin/blocked-ips');
    assert.strictEqual(listRes.statusCode, 200);
    assert.ok(listRes.body.activeQuarantines >= 1);

    // Unblock attacker
    const unblockRes = await request(app).post(`/api/admin/unblock/${attackerIp}`);
    assert.strictEqual(unblockRes.statusCode, 200);
    assert.strictEqual(unblockRes.body.unblocked, true);

    // Verify unblocked
    const verifyBlocked = BlocklistModel.isIpBlocked(attackerIp);
    assert.strictEqual(verifyBlocked, null);
  });
});

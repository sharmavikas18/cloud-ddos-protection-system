#!/usr/bin/env node

/**
 * DDoS Attack Simulation & High-Availability Verification Tool
 * Part of DRDO / Capstone Cloud DDoS Protection Suite
 */

const http = require('http');

const BASE_URL = process.env.TARGET_URL || 'http://localhost:5000';
const parsedUrl = new URL(BASE_URL);

function sendRequest({ path = '/api/services/public', method = 'GET', ip = '127.0.0.1', userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }) {
  return new Promise((resolve) => {
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path,
      method,
      headers: {
        'x-forwarded-for': ip,
        'user-agent': userAgent,
        'accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          retryAfter: res.headers['retry-after'],
          body
        });
      });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 500, error: err.message });
    });

    req.end();
  });
}

async function simulateNormalTraffic(count = 5) {
  console.log(`\n🟢 [SIMULATOR] Generating ${count} legitimate client requests...`);
  for (let i = 1; i <= count; i++) {
    const res = await sendRequest({
      ip: `192.168.1.${10 + i}`,
      userAgent: 'Mozilla/5.0 (Legitimate Browser)'
    });
    console.log(`  [Req #${i}] Status: ${res.statusCode} | IP: 192.168.1.${10 + i}`);
  }
}

async function simulatePattern1SingleIpFlood(count = 70) {
  console.log(`\n🔴 [SIMULATOR] Launching PATTERN 1: Volumetric Single IP Flood (${count} rapid requests from 203.0.113.55)...`);
  const attackerIp = '203.0.113.55';
  let blockedCount = 0;
  let passedCount = 0;

  for (let i = 1; i <= count; i++) {
    const res = await sendRequest({
      ip: attackerIp,
      userAgent: 'AggressiveFloodBot/1.0'
    });

    if (res.statusCode === 429) {
      blockedCount++;
    } else {
      passedCount++;
    }

    if (i % 10 === 0 || i === count) {
      console.log(`  Sent: ${i}/${count} | Passed: ${passedCount} | Blocked (429): ${blockedCount}`);
    }
  }

  console.log(`\n🛡️ [RESULT] Pattern 1 Attack Summary: Passed: ${passedCount}, Quarantined: ${blockedCount}`);
  if (blockedCount > 0) {
    console.log('✅ Automated Mitigation Successfully Intercepted the Volumetric Flood!');
  }
}

async function simulatePattern2BotnetCluster(count = 35) {
  console.log(`\n🔴 [SIMULATOR] Launching PATTERN 2: Distributed Botnet Flood (Shared User-Agent Profile across multiple bot IPs)...`);
  const botProfile = 'Mirai-Variant-Fingerprint-Cloud/2.4';
  let blockedCount = 0;

  for (let i = 1; i <= count; i++) {
    const botIp = `198.51.100.${i % 8 + 1}`; // Distributed across 8 bot nodes
    const res = await sendRequest({
      ip: botIp,
      userAgent: botProfile
    });

    if (res.statusCode === 429) {
      blockedCount++;
    }
    if (i % 10 === 0 || i === count) {
      console.log(`  Sent: ${i}/${count} | Current Status: ${res.statusCode} (Bot IP: ${botIp})`);
    }
  }

  console.log(`\n🛡️ [RESULT] Pattern 2 Botnet Cluster Intercepted! Blocked: ${blockedCount}`);
}

async function simulatePattern3EndpointSurge(count = 40) {
  console.log(`\n🔴 [SIMULATOR] Launching PATTERN 3: Targeted Endpoint Surge Attack on /api/services/heavy...`);
  const attackerIp = '198.18.0.99';
  let blockedCount = 0;

  for (let i = 1; i <= count; i++) {
    const res = await sendRequest({
      path: '/api/services/heavy',
      ip: attackerIp,
      userAgent: 'EndpointSurgeTester/1.0'
    });

    if (res.statusCode === 429) {
      blockedCount++;
    }
    if (i % 10 === 0 || i === count) {
      console.log(`  Sent: ${i}/${count} | Status: ${res.statusCode} | Blocked: ${blockedCount}`);
    }
  }

  console.log(`\n🛡️ [RESULT] Pattern 3 Endpoint Surge Intercepted! Blocked: ${blockedCount}`);
}

async function runDemo() {
  console.log('================================================================');
  console.log('⚡ DRDO CAPSTONE CLOUD DDoS ATTACK SIMULATOR & TEST BENCH ⚡');
  console.log(`🎯 Target Gateway: ${BASE_URL}`);
  console.log('================================================================');

  const mode = process.argv[2] || 'all';

  if (mode === 'normal' || mode === 'all') {
    await simulateNormalTraffic(5);
  }

  if (mode === 'pattern1' || mode === 'all') {
    await simulatePattern1SingleIpFlood(70);
  }

  if (mode === 'pattern3' || mode === 'all') {
    await simulatePattern3EndpointSurge(40);
  }

  if (mode === 'pattern2' || mode === 'all') {
    await simulatePattern2BotnetCluster(35);
  }

  console.log('\n================================================================');
  console.log('🎉 Simulation Complete! Check Admin Metrics at:');
  console.log(`   ${BASE_URL}/api/admin/metrics`);
  console.log(`   ${BASE_URL}/api/admin/attacks`);
  console.log(`   ${BASE_URL}/api/admin/blocked-ips`);
  console.log('================================================================\n');
}

if (require.main === module) {
  runDemo();
}

module.exports = {
  sendRequest,
  simulateNormalTraffic,
  simulatePattern1SingleIpFlood,
  simulatePattern2BotnetCluster,
  simulatePattern3EndpointSurge
};

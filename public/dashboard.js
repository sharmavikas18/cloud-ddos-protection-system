// SecOps Command Center Dashboard Logic

let isSimulating = false;

async function fetchMetrics() {
  try {
    const res = await fetch('/api/admin/metrics');
    if (!res.ok) return;
    const data = await res.json();

    // Live Metrics
    const rps = data.system.currentRps || 0;
    const total = data.system.totalRequests || 0;
    const blocked = data.system.blockedRequests || 0;
    const activeBlocks = data.incidents.activeBlocks || 0;

    document.getElementById('currentRps').innerHTML = `${rps.toFixed(1)} <span class="unit">RPS</span>`;
    document.getElementById('totalRequests').innerText = total.toLocaleString();
    document.getElementById('blockedRequests').innerText = blocked.toLocaleString();
    document.getElementById('activeBlocksCount').innerText = activeBlocks;
    document.getElementById('uptimeBadge').innerText = `UPTIME: ${data.system.uptimeSeconds}s`;

    const efficiency = total > 0 ? ((blocked / total) * 100).toFixed(1) : 0;
    document.getElementById('mitigationEfficiency').innerText = `${efficiency}% traffic quarantined`;

    // High availability status check
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    if (activeBlocks > 0 || rps > 15) {
      statusText.innerText = 'DEFENSE ACTIVE';
      statusText.style.color = '#38bdf8';
    } else {
      statusText.innerText = 'GATEWAY ACTIVE';
      statusText.style.color = '#10b981';
    }
  } catch (err) {
    console.error('Failed to poll metrics:', err);
  }
}

async function fetchBlockedIps() {
  try {
    const res = await fetch('/api/admin/blocked-ips');
    if (!res.ok) return;
    const data = await res.json();

    const tbody = document.getElementById('blocklistTableBody');
    const badge = document.getElementById('blocklistBadge');
    badge.innerText = `${data.activeQuarantines} Quarantined`;

    if (!data.blockedIps || data.blockedIps.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty-message">No quarantined IPs. System is running cleanly.</td></tr>`;
      return;
    }

    tbody.innerHTML = data.blockedIps.map(item => {
      const remainingSec = Math.max(0, Math.ceil((new Date(item.expires_at).getTime() - Date.now()) / 1000));
      return `
        <tr>
          <td><span class="ip-tag">${item.ip_address}</span></td>
          <td><span class="badge badge-danger">${item.pattern_detected}</span></td>
          <td><span class="badge badge-warning">${remainingSec}s remaining</span></td>
          <td>
            <button class="btn-unblock" onclick="unblockIp('${item.ip_address}')">
              Unblock
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to fetch blocked IPs:', err);
  }
}

async function fetchAttacks() {
  try {
    const res = await fetch('/api/admin/attacks?limit=15');
    if (!res.ok) return;
    const data = await res.json();

    const feed = document.getElementById('incidentsFeed');
    const badge = document.getElementById('incidentCountBadge');
    badge.innerText = `${data.count} Incidents`;

    if (!data.attacks || data.attacks.length === 0) {
      feed.innerHTML = `<div class="empty-feed">No attack incidents detected in this session.</div>`;
      return;
    }

    feed.innerHTML = data.attacks.map(attack => {
      const time = new Date(attack.timestamp).toLocaleTimeString();
      let badgeClass = 'badge-danger';
      if (attack.severity === 'MEDIUM') badgeClass = 'badge-warning';

      return `
        <div class="incident-item">
          <div class="incident-badge ${badgeClass}">${attack.severity}</div>
          <div class="incident-content">
            <div class="incident-title">${attack.pattern_name}</div>
            <div class="incident-meta">
              Target: <code>${attack.target_endpoint}</code> | Source: <strong>${attack.source_ip}</strong> | ${time}
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to fetch attack events:', err);
  }
}

async function unblockIp(ip) {
  try {
    const res = await fetch(`/api/admin/unblock/${ip}`, { method: 'POST' });
    const data = await res.json();
    logConsole(`[ADMIN ACTION] ${data.message}`);
    fetchBlockedIps();
    fetchMetrics();
  } catch (err) {
    logConsole(`[ERROR] Failed to unblock ${ip}: ${err.message}`);
  }
}

async function triggerSimulation(pattern) {
  if (isSimulating) return;
  isSimulating = true;
  setSimButtonsDisabled(true);

  logConsole(`\n[LAUNCHING SIMULATION] Pattern: ${pattern.toUpperCase()}...`);

  try {
    const res = await fetch('/api/admin/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pattern })
    });
    const data = await res.json();
    logConsole(`[SIMULATOR RESULT] ${data.message || JSON.stringify(data)}`);
  } catch (err) {
    logConsole(`[SIMULATOR ERROR] ${err.message}`);
  } finally {
    isSimulating = false;
    setSimButtonsDisabled(false);
    fetchMetrics();
    fetchBlockedIps();
    fetchAttacks();
  }
}

async function probeService(url) {
  const resultDiv = document.getElementById('probeResult');
  resultDiv.innerText = `Probing ${url}...`;
  const start = performance.now();

  try {
    const res = await fetch(url);
    const latency = Math.round(performance.now() - start);
    const json = await res.json();

    const statusBadge = res.ok ? '🟢 HTTP ' + res.status : '🔴 HTTP ' + res.status;
    resultDiv.innerHTML = `<strong>${statusBadge}</strong> (${latency}ms) &mdash; <code>${JSON.stringify(json)}</code>`;
  } catch (err) {
    resultDiv.innerHTML = `🔴 <strong>Network Error:</strong> ${err.message}`;
  }
}

function logConsole(msg) {
  const output = document.getElementById('consoleOutput');
  output.textContent += '\n' + msg;
  output.scrollTop = output.scrollHeight;
}

function clearConsole() {
  document.getElementById('consoleOutput').textContent = 'Console cleared. Ready.';
}

function setSimButtonsDisabled(disabled) {
  ['btnNormal', 'btnP1', 'btnP2', 'btnP3'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = disabled;
  });
}

// Initial polling loops
fetchMetrics();
fetchBlockedIps();
fetchAttacks();

setInterval(fetchMetrics, 1500);
setInterval(fetchBlockedIps, 3000);
setInterval(fetchAttacks, 3000);

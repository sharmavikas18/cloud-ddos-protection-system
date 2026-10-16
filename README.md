# DDoS Protection System for Cloud: Architecture and Tool
> **Advanced Programming (AP) Capstone Project**  
> **Problem Statement Source**: Ministry of Defence (SAG, DRDO) — Smart India Hackathon / Capstone  
> **Domain / Bucket**: Blockchain & Cybersecurity / Cloud Infrastructure Security

---

## 📋 Executive Summary & Problem Context

Cloud-hosted enterprise and defense web applications are vulnerable to Distributed Denial-of-Service (DDoS) attacks designed to saturate network bandwidth, exhaust server sockets, and degrade compute resources. Legitimate traffic spikes must be dynamically distinguished from malicious volumetric or targeted Layer 7 surges to preserve **High Availability (HA)** while minimizing recovery time.

This project delivers a resilient **Cloud DDoS Protection Gateway & Detection Engine** engineered in Node.js/Express, pairing multi-pattern anomaly detection with automated IP quarantine, self-healing cooldowns, and a real-time attack simulation toolbench.

---

## 🎯 Coverage of Problem Statement Attack Patterns

| Problem Statement Pattern | Detection Implementation (`src/services/detectionEngine.js`) | Automated Mitigation (`src/services/mitigationService.js`) |
|---|---|---|
| **1. Suspicious traffic from single IP/range** | Sliding-window requests-per-second (RPS) tracking per client IP (`> 60 req/min`). | Immediate edge quarantine with HTTP `429 Too Many Requests` + `Retry-After` header. |
| **2. Shared behavioral profile (Botnet)** | Cross-IP fingerprint clustering: detects identical User-Agent profiles originating from $\ge 3$ distinct bot IPs. | Coordinated botnet cluster quarantine and forensics logging. |
| **3. Surge to single page/endpoint** | Target endpoint anomaly detection: flags request surges on resource-heavy routes (`/api/services/heavy`, `/api/auth/login`). | Endpoint-specific rate throttling, preserving upstream capacity. |
| **4. Odd traffic patterns & periodic spikes** | 5-minute rolling time-series delta engine detecting harmonic burst cycles (e.g. 10-minute rhythmic bursts). | Dynamic anomaly scoring and alerts to the SecOps center. |

---

## 🏗️ Architecture & Component Layout

```
apCapstone/
├── AP_Capstone_Evaluation_Rubric (1).docx  # Official Rubric
├── Dockerfile                              # Containerization specification
├── docker-compose.yml                      # Orchestrated deployment
├── package.json                            # Scripts, dependencies, and testing config
├── .env.example                            # Configuration template
├── data/                                   # SQLite persistence directory
├── src/
│   ├── app.js                              # Express pipeline & middleware chain
│   ├── server.js                           # Server bootstrap & port listener
│   ├── config/
│   │   ├── env.js                          # Validated environment configuration
│   │   └── database.js                     # SQLite persistence schema & migrations
│   ├── middleware/
│   │   ├── trafficCollector.js             # Telemetry & header parser
│   │   ├── ipBlocklist.js                  # Edge gatekeeper with auto-expiry
│   │   ├── rateLimiter.js                  # Sliding-window anomaly inspector
│   │   ├── authMiddleware.js               # JWT & Role-Based Access Control (RBAC)
│   │   └── errorHandler.js                 # Centralized 404 & error handlers
│   ├── models/
│   │   ├── userModel.js                    # User credentials & roles
│   │   ├── blocklistModel.js               # Quarantined IPs with auto-unban TTL
│   │   └── attackEventModel.js             # Security incident logs & metrics
│   ├── services/
│   │   ├── detectionEngine.js              # Real-time multi-pattern detector
│   │   ├── mitigationService.js            # Automated mitigation & recovery
│   │   └── metricsService.js               # Real-time RPS and uptime telemetry
│   ├── controllers/
│   │   ├── authController.js               # User registration, login & profile
│   │   ├── adminController.js              # SecOps metrics, attacks, & unblock actions
│   │   └── serviceController.js            # Simulated cloud-hosted web service
│   └── routes/
│       ├── authRoutes.js                   # /api/auth/*
│       ├── adminRoutes.js                  # /api/admin/*
│       └── serviceRoutes.js                # /api/services/*
├── tools/
│   └── attack-simulator.js                 # CLI attack generator & verification tool
└── tests/
    ├── auth.test.js                        # Auth & RBAC unit/integration tests
    ├── rateLimiting.test.js                # Quotas & health check tests
    └── detection.test.js                   # Pattern 1, 2, 3 mitigation tests
```

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v22+ recommended; v26 tested)
- **npm**: v9.0.0 or higher

### 2. Installation
```bash
git clone https://github.com/sharmavikas18/cloud-ddos-protection-system.git
cd cloud-ddos-protection-system
npm install
```

### 3. Environment Configuration
```bash
cp .env.example .env
```
Default `.env` settings:
```properties
PORT=5050
NODE_ENV=development
JWT_SECRET=super_secret_capstone_jwt_key_2024_drdo
RATE_LIMIT_WINDOW_MS=60000
MAX_REQUESTS_PER_WINDOW=60
ENDPOINT_SURGE_THRESHOLD=30
QUARANTINE_DURATION_MS=30000
```

### 4. Running the Server
```bash
# Start in production mode
npm start

# Or start with automatic file reloading
npm run dev
```
The server will bind to `http://localhost:5050`.

### 5. Running the Automated Test Suite
```bash
npm test
```
Executes all 13 unit and integration tests verifying Auth, Edge Filtering, Pattern Detection, and Self-Healing.

---

## ⚡ Attack Simulation Toolbench

To demonstrate live attack detection and automatic recovery during the evaluation viva, run the included simulator:

```bash
# Run full simulation suite (normal, volumetric, endpoint surge, botnet)
npm run simulate

# Run specific attack pattern simulations:
node tools/attack-simulator.js normal     # 5 legitimate requests
node tools/attack-simulator.js pattern1   # Single IP 70-request volumetric flood
node tools/attack-simulator.js pattern3   # Targeted heavy endpoint surge
node tools/attack-simulator.js pattern2   # Distributed multi-IP botnet cluster
```

---

## 📡 API Reference & Endpoints

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Cloud Load Balancer probe returning uptime, status & RPS. |
| `POST` | `/api/auth/register` | Public | Register user (`admin`, `analyst`, `user`). |
| `POST` | `/api/auth/login` | Public | Authenticate user and receive JWT. |
| `GET` | `/api/auth/profile` | Authenticated | Fetch current user credentials & role. |
| `GET` | `/api/services/public` | Public | Simulated cloud web portal (monitored). |
| `GET` | `/api/services/heavy` | Public | CPU-intensive endpoint (surge monitored). |
| `GET` | `/api/services/dashboard`| Authenticated | Protected customer portal. |
| `GET` | `/api/admin/metrics` | Public/Admin | Real-time telemetry, RPS, and incident stats. |
| `GET` | `/api/admin/attacks` | Public/Admin | Historical log of detected DDoS incidents. |
| `GET` | `/api/admin/blocked-ips`| Public/Admin | Currently quarantined IPs with remaining TTL. |
| `POST` | `/api/admin/unblock/:ip`| Admin | Manual override to unban an IP immediately. |

---

## 🛡️ Rubric & Viva Walkthrough Guide

### Tracing a Request
1. Request arrives at `src/app.js`.
2. `trafficCollector.js` extracts client IP, User-Agent, and starts latency timer.
3. `ipBlocklist.js` checks if the IP is active in `blocked_ips`. If yes, returns `429 Too Many Requests` with dynamic `Retry-After` header.
4. `rateLimiter.js` passes the request to `detectionEngine.js` for sliding-window evaluation against the 4 attack patterns.
5. If clean, the request routes to `src/controllers/serviceController.js` or `authController.js`.
6. Upon completion, telemetry counters and RPS are recorded in `metricsService.js`.

### Performing Live Code Modifications during Viva
- **Adjust Rate Limit Window**: In `src/config/env.js` (or `.env`), update `MAX_REQUESTS_PER_WINDOW` or `RATE_LIMIT_WINDOW_MS`.
- **Change Quarantine Cooldown**: In `.env`, modify `QUARANTINE_DURATION_MS=15000` (15s auto-recovery).
- **Whitelist an IP**: In `src/middleware/ipBlocklist.js`, add `if (req.clientIp === '127.0.0.1') return next();`.

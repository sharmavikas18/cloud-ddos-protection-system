# System Architecture Diagrams: ERD & Data Flow Diagrams (DFD)
## Cloud DDoS Protection System for Cloud Infrastructure
**Source/Sponsor**: SAG, DRDO / Ministry of Defence  
**Domain**: Cybersecurity & Cloud Infrastructure  

---

## 1. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS {
        int id PK "Auto Increment"
        string name "Full Name"
        string email UK "Unique Email Address"
        string password_hash "Salted bcrypt Hash"
        string role "admin | analyst | user"
        datetime created_at "Registration Timestamp"
    }

    BLOCKED_IPS {
        int id PK "Auto Increment"
        string ip_address "Quarantined IPv4/IPv6"
        string reason "Mitigation Reason"
        string pattern_detected "Pattern 1 | 2 | 3 | 4"
        datetime blocked_at "Timestamp of Quarantine"
        datetime expires_at "Self-Healing TTL Expiration"
        int is_active "1 = Active, 0 = Expired/Unblocked"
    }

    ATTACK_EVENTS {
        int id PK "Auto Increment"
        string pattern_name "Pattern Classification"
        string source_ip "Attacker Source IP"
        string target_endpoint "Attacked URI Endpoint"
        int request_count "Burst Request Volume"
        string severity "LOW | MEDIUM | HIGH | CRITICAL"
        text details "JSON Metadata & Headers"
        datetime timestamp "Detection Timestamp"
    }

    TRAFFIC_LOGS {
        int id PK "Auto Increment"
        string client_ip "Client Remote Address"
        string method "GET | POST | PUT | DELETE"
        string endpoint "Requested URL Path"
        int status_code "HTTP Status Response"
        float response_time_ms "Processing Latency"
        string user_agent "Client Device Fingerprint"
        datetime timestamp "Request Arrival Time"
    }

    USERS ||--o{ BLOCKED_IPS : "manually unblocks / overrides"
    ATTACK_EVENTS ||--|| BLOCKED_IPS : "triggers automatic quarantine"
    TRAFFIC_LOGS }o--o| ATTACK_EVENTS : "evaluated into incident"
```

---

## 2. Data Flow Diagram (DFD) Level 0: Context Diagram

```mermaid
graph TD
    Client["Legitimate Client"]
    Attacker["Malicious Attacker / Botnet"]
    Admin["SecOps Admin / Analyst"]
    System(("0.0<br/>Cloud DDoS Protection<br/>& Mitigation System"))
    CloudServices["Protected Cloud Backend Services"]

    Client -->|"HTTP Service Requests"| System
    System -->|"200 OK / Response Data"| Client

    Attacker -.->|"Volumetric Floods / Layer 7 Attacks"| System
    System -.->|"HTTP 429 Too Many Requests (Quarantine)"| Attacker

    Admin -->|"Auth Credentials & Manual Unblock Overrides"| System
    System -->|"Real-time Telemetry, RPS & Incident Reports"| Admin

    System -->|"Sanitized Inbound Traffic"| CloudServices
    CloudServices -->|"Service Response Payload"| System
```

---

## 3. Data Flow Diagram (DFD) Level 1: Subsystem Decomposition

```mermaid
graph TD
    Client["Client / Attacker Traffic"]
    Admin["SecOps Administrator"]

    D1[("D1: Blocklist Store (TTL Cache)")]
    D2[("D2: Real-time Telemetry Buffer")]
    D3[("D3: Attack Incidents DB")]
    D4[("D4: User Credentials DB")]

    P1(("1.0<br/>Traffic Ingestion &<br/>Telemetry Collector"))
    P2(("2.0<br/>Edge Quarantine<br/>Filter"))
    P3(("3.0<br/>Multi-Pattern DDoS<br/>Detection Engine"))
    P4(("4.0<br/>Automated Mitigation<br/>& Auto-Recovery"))
    P5(("5.0<br/>SecOps Monitoring &<br/>Analytics Service"))
    P6(("6.0<br/>Auth & Access Control<br/>(RBAC)"))

    CoreServices["Protected Web Services"]

    Client -->|"Inbound HTTP Request"| P1
    P1 -->|"Parsed Metadata (IP, UA, Route)"| P2
    P1 -->|"Log Stream"| D2

    P2 -->|"Query Active Quarantine"| D1
    D1 -->|"Quarantine Status"| P2
    P2 -->|"Blocked: HTTP 429 + Retry-After"| Client
    P2 -->|"Clean IP Traffic"| P3

    P3 -->|"Sliding Window Hit Counters"| D2
    P3 -->|"Threat Detected"| P4
    P3 -->|"Pass: Within Safe Limits"| CoreServices

    P4 -->|"Store Quarantined IP with TTL"| D1
    P4 -->|"Store Incident Forensics"| D3

    Admin -->|"Login / Register Credentials"| P6
    P6 -->|"Validate Credentials"| D4
    D4 -->|"Token & User Role"| P6

    Admin -->|"Query Metrics & Manual Overrides"| P5
    P5 -->|"Fetch Attack Incidents"| D3
    P5 -->|"Manage Active Blocks"| D1
```

---

## 4. Data Flow Diagram (DFD) Level 2: Detection & Mitigation Engine

```mermaid
graph TD
    CleanTraffic["Traffic Passed by Edge Filter"]

    subgraph DetectionEngine["3.0 Multi-Pattern Detection Engine"]
        P3_1(("3.1<br/>Pattern 1:<br/>Single IP Volumetric<br/>Sliding Window Counter"))
        P3_2(("3.2<br/>Pattern 2:<br/>Botnet Fingerprint<br/>Entropy Clustering"))
        P3_3(("3.3<br/>Pattern 3:<br/>Targeted Endpoint<br/>Surge Monitor"))
        P3_4(("3.4<br/>Pattern 4:<br/>Time-Series Periodic<br/>Harmonic Pulse Detector"))
    end

    subgraph MitigationCore["4.0 Auto-Mitigation & Recovery"]
        P4_1(("4.1<br/>Quarantine Enforcer<br/>(Issue HTTP 429)"))
        P4_2(("4.2<br/>Incident Forensics<br/>Logger"))
        P4_3(("4.3<br/>Self-Healing TTL<br/>Cooldown Timer"))
    end

    BlocklistDB[("D1: Blocklist Store")]
    IncidentsDB[("D3: Incident Logs")]

    CleanTraffic --> P3_1
    CleanTraffic --> P3_2
    CleanTraffic --> P3_3
    CleanTraffic --> P3_4

    P3_1 -->|"Rate > 60 req/min"| P4_1
    P3_2 -->|"Shared UA across >= 3 IPs"| P4_1
    P3_3 -->|"Endpoint surge > 30 req/min"| P4_1
    P3_4 -->|"Harmonic spike > 3.5x average"| P4_2

    P4_1 -->|"Quarantine Offender IP"| BlocklistDB
    P4_1 --> P4_2
    P4_2 -->|"Write Incident Log"| IncidentsDB
    P4_1 --> P4_3
    P4_3 -->|"Auto-Expire after 30s"| BlocklistDB
```

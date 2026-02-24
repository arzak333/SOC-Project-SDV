# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AudioSOC** - External SOC (Security Operations Center) dashboard for a network of 30 audioprothésiste (hearing aid) centers in France. This is an M2 Cybersecurity Master's project at PSB Paris School of Business.

### Business Context
- Client: Network of ~30 hearing aid centers across France
- Need: Centralized security monitoring (no internal security team)
- Goal: Functional demo platform, documented, industrializable

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Recharts, Socket.IO Client |
| Backend | Python 3.11, Flask, SQLAlchemy, Flask-SocketIO |
| Database | PostgreSQL 15 |
| Task Queue | Celery + Redis |
| Containers | Docker, Docker Compose |

## Commands

### Start all services
```bash
docker compose up -d
```

### Initialize database (first time)
```bash
docker compose exec backend python -c "from app import create_app, db, init_demo_users; app = create_app(); app.app_context().push(); db.create_all(); init_demo_users()"
```

### Demo credentials
| User | Password | Role |
|------|----------|------|
| admin | admin123 | Administrator |
| analyst | analyst123 | SOC Analyst |
| supervisor | supervisor123 | Supervisor |

### Generate test events
```bash
python scripts/log_generator.py --count 50        # Generate 50 events
python scripts/log_generator.py --attack          # Simulate attack scenario
python scripts/log_generator.py --burst           # Burst mode (simulates attack spikes)
python scripts/log_generator.py --backfill        # Backfill 1000 events over 7 days
python scripts/log_generator.py --backfill --days 30 --count 2000  # Custom backfill
```

### Check logs
```bash
docker compose logs backend --tail=50
docker compose logs frontend --tail=50
```

### Restart after code changes
```bash
docker compose restart backend                    # Backend only
docker compose down && docker compose up -d       # Full restart
```

## Architecture

```
                                              ┌──────────────────────────────┐
                                              │   INFRASTRUCTURE (infra/)     │
                                              │                              │
┌──────────────────────────────────────┐      │  endpoint-pc-01 ─┐           │
│         Frontend (React) :3000        │      │  endpoint-pc-02 ─┤→ Wazuh   │
│  Dashboard│Events│Alerts│Playbooks    │      │                  │  Agents   │
│  Incidents                            │      │                  ▼           │
└─────────────────┬────────────────────┘      │           Wazuh Manager      │
                  │ WebSocket + REST           │            │         │       │
┌─────────────────┴────────────────────┐      │            │         │       │
│         Backend (Flask) :5000         │◄─────│── webhook ─┘   Wazuh Dash.  │
│  /api/ingest│events│dashboard│alerts  │      │                 :4443       │
│  /api/endpoints│analysts│assets ──────│─────►│── GLPI :8080               │
└──┬──────────────┬──────────────┬─────┘      └──────────────────────────────┘
   │              │              │
PostgreSQL     Redis         Celery
(Events DB)  (Task Queue)  (Alert Engine)
```

## Project Structure

```
Claude SOC project/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy models (Event, Incident, AlertRule, User)
│   │   ├── routes/          # API endpoints (events, ingest, dashboard, alerts, incidents)
│   │   └── services/        # Business logic (alert_engine + correlation, websocket)
│   ├── config.py            # Flask configuration
│   ├── celery_app.py        # Celery configuration
│   ├── migrate_db.py        # Safe schema migration (run on startup)
│   └── run.py               # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI (StatCard, TopBar, CustomSelect, etc.)
│   │   ├── pages/           # Page components (Dashboard, Events, Incidents, Alerts, etc.)
│   │   ├── hooks/           # Custom hooks (useSocket)
│   │   ├── api.ts           # API client functions
│   │   └── types.ts         # TypeScript interfaces
│   └── tailwind.config.js
├── scripts/
│   ├── log_generator.py     # Generates events for real infra (endpoint-pc-01/02, firewall-gw)
│   └── init_db.py           # Database initialization
├── docs/
│   ├── architecture.md      # Detailed architecture
│   └── project_status.md    # Current progress
└── docker-compose.yml
```

## API Endpoints

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List events (supports `severity=critical,high`, `status=new,investigating`, `limit=N`) |
| GET | `/api/events/:id` | Get single event |
| POST | `/api/ingest` | Ingest new event |
| PATCH | `/api/events/:id/status` | Update event status |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Statistics (by_severity, by_source, by_status) |
| GET | `/api/dashboard/trends?timeframe=24h` | Event trends (supports: 5m, 15m, 30m, 1h, 6h, 24h, 7d, 30d) |
| GET | `/api/dashboard/sites` | Summary by site |

### Alert Rules
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts/rules` | List all rules |
| POST | `/api/alerts/rules` | Create rule |
| PATCH | `/api/alerts/rules/:id` | Update rule |
| DELETE | `/api/alerts/rules/:id` | Delete rule |

### Incidents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/incidents` | List incidents (filter: `severity`, `status`, `assigned_to`; paginated) |
| GET | `/api/incidents/:id` | Get incident + linked events |
| PATCH | `/api/incidents/:id` | Update status, severity, assigned_to |

## Data Models

### Event Sources (monitored systems)
- `firewall` - Network firewalls per center
- `ids` - Intrusion Detection Systems
- `endpoint` - Workstations (audioprothésiste PCs)
- `active_directory` - AD authentication
- `email` - Email gateway (phishing, spam)
- `application` - CRM, patient records
- `network` - Network traffic analysis

### Severity Levels
- `critical` - Active breach, ransomware (RED)
- `high` - Multiple failed logins, port scans (ORANGE)
- `medium` - Unusual traffic, config changes (YELLOW)
- `low` - Informational events (BLUE)

### Event Status Flow
```
new → investigating → resolved
         ↓
    false_positive
```

### Incident Status Flow
```
new → open → investigating → resolved
                  ↓
             false_positive
```

### Incident
- Created automatically by alert engine when a rule fires
- Links N events via `event.incident_id` FK
- `alert_rule_id` traces which rule triggered the incident
- Deduplication: open incident per rule is reused (no duplicates)

## Code Patterns

### Frontend
- Use functional components with hooks (no class components)
- Mock data fallback for demo mode (see `generateMockHourlyData()` in Dashboard.tsx)
- Glass card styling: use `glass-card` CSS class
- Severity badges: use `badge-critical`, `badge-high`, etc.

### Backend
- All routes return JSON with consistent structure
- Multi-value filters supported: `?severity=critical,high`
- WebSocket broadcasts on event ingestion
- Sanitize raw logs before storage (prevent injection)

## Known Issues / TODOs

### TypeScript Warnings (non-blocking)
- Unused imports in `Events.tsx`, `Playbooks.tsx`, `AlertsBySourceChart.tsx`
- These are warnings only; app runs fine

### Implemented Features (v1.2)
- [x] JWT Authentication (login, register, roles: admin/analyst/supervisor)
- [x] Dark/Light theme toggle
- [x] Export functionality (CSV, PDF, JSON)
- [x] Enhanced Playbooks with step execution
- [x] Event Volume timeframes (5m, 15m, 30m, 1h, 6h, 24h, 7d, 30d)
- [x] Historical data backfill (`--backfill` option)
- [x] Event Correlation Engine — alert engine creates Incidents from fired rules
- [x] Incidents page — list/grid, detail panel, status transitions, assignment
- [x] Safe schema migration (`migrate_db.py`) — runs on startup, idempotent
- [x] CustomSelect component — theme-aware dropdown replacing native `<select>`
- [x] Real infra only — log generator targets endpoint-pc-01/02, firewall-gw
- [x] pytest backend suite

### Not Yet Implemented
- [ ] Email/Webhook notifications (configured but not connected)

## Token Optimization Guidelines

When working on this project, minimize token consumption:

### Do
- **Deploy first, explain later**: Run commands, check results, then summarize briefly
- **Batch operations**: Combine multiple curl/docker commands when testing
- **Skip verbose output**: Use `--tail=10` instead of `--tail=50`, pipe to `head`
- **Trust the code**: If previous session wrote code, just deploy and test it
- **One-line status**: "Backend restarted, tables created, API working at /playbooks"

### Don't
- Don't re-read files already in context from previous session
- Don't show full API responses when a summary suffices
- Don't create test data manually when the feature can be tested via UI
- Don't over-document simple operations (restart, migrate, test)

### After Context Compaction
When resuming from a previous session:
1. Check what was already implemented (read summary)
2. Deploy immediately: `docker compose restart backend`
3. Run migration if needed
4. One test to verify: `curl -s localhost:5000/api/endpoint | head -5`
5. Report: "Feature X is live at http://localhost:3000/page"

## Working Guidelines

### Before Implementation
- **Surface assumptions** on non-trivial tasks - state what you're assuming, proceed unless corrected
- **Ask on ambiguity** - if requirements conflict or are unclear, ask rather than guess wrong

### During Implementation
- **Scope discipline** - touch only what's asked; no unsolicited refactoring or "cleanup"
- **Simplicity first** - if 1000 lines when 100 would suffice, you have failed. Prefer the boring, obvious solution. Cleverness is expensive.
- **Push back** when the approach has clear problems - explain the issue, propose alternative

### After Implementation
- **Verify it works** - quick test before reporting done
- **Note concerns** - flag risks or things to verify briefly

## Environment

### URLs (development)
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/health

### Docker Services
- `soc-db` - PostgreSQL
- `soc-redis` - Redis
- `soc-backend` - Flask API
- `soc-frontend` - React dev server
- `soc-celery-worker` - Celery worker
- `soc-celery-beat` - Celery scheduler

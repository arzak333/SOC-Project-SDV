# System Architecture

## Components

### 1. Ingestion Service (Python)
- Receives logs via `POST /api/ingest` (single) and `POST /api/ingest/batch` (multiple)
- Validates format, source, and severity
- Sanitizes raw logs to prevent injection
- Stores in PostgreSQL
- Broadcasts to WebSocket clients on ingestion

### 2. REST API (Flask)
- `GET /api/events` - List events with filters (status, severity, source, site_id, search)
- `GET /api/events/:id` - Get single event details
- `PATCH /api/events/:id/status` - Update event status and assignment
- `GET /api/dashboard/stats` - Dashboard statistics (counts by status/severity/source)
- `GET /api/dashboard/trends` - 7-day trends (hourly and daily)
- `GET /api/dashboard/sites` - Summary by site (for 30 audioprothésiste centers)
- `GET/POST/PATCH/DELETE /api/alerts/rules` - Alert rules CRUD

### 3. WebSocket Server (Flask-SocketIO)
- Broadcasts new events to connected clients (`new_event`)
- Pushes alert notifications in real-time (`alert`)
- Room-based subscriptions (by site, by severity)
- Connection status tracking

### 4. Alert Engine (Celery + Redis)
- Evaluates rules every 10 seconds
- Supports threshold-based rules (count + timeframe)
- Actions: log, email, webhook
- Tracks trigger count and last triggered time

## Data Flow
```
┌────────────────┐    POST /api/ingest    ┌─────────────┐
│  Log Sources   │ ─────────────────────► │   Flask     │
│  (30 sites)    │                        │   Backend   │
└────────────────┘                        └──────┬──────┘
                                                 │
                    ┌────────────────────────────┼───────────────────────────┐
                    │                            │                           │
                    ▼                            ▼                           ▼
            ┌──────────────┐            ┌──────────────┐            ┌──────────────┐
            │  PostgreSQL  │            │    Redis     │            │  WebSocket   │
            │   (Events)   │            │ (Task Queue) │            │  (Clients)   │
            └──────────────┘            └──────┬───────┘            └──────────────┘
                                               │
                                               ▼
                                       ┌──────────────┐
                                       │    Celery    │
                                       │ Alert Engine │
                                       └──────────────┘
```

## Database Schema

### Events Table
```
┌──────────────────────────────────────────────────┐
│                     events                        │
├──────────────────────────────────────────────────┤
│ id          │ UUID (PK)                          │
│ timestamp   │ TIMESTAMP                          │
│ source      │ ENUM (firewall/ids/endpoint/...)   │
│ event_type  │ VARCHAR(100)                       │
│ severity    │ ENUM (critical/high/medium/low)    │
│ description │ TEXT                               │
│ raw_log     │ TEXT                               │
│ metadata    │ JSONB                              │
│ status      │ ENUM (new/investigating/resolved)  │
│ assigned_to │ VARCHAR(100)                       │
│ site_id     │ VARCHAR(50) - for multi-site       │
│ created_at  │ TIMESTAMP                          │
│ updated_at  │ TIMESTAMP                          │
└──────────────────────────────────────────────────┘
```

### Alert Rules Table
```
┌──────────────────────────────────────────────────┐
│                   alert_rules                     │
├──────────────────────────────────────────────────┤
│ id            │ UUID (PK)                        │
│ name          │ VARCHAR(200)                     │
│ description   │ TEXT                             │
│ enabled       │ BOOLEAN                          │
│ condition     │ JSONB (event_type, count, etc)   │
│ action        │ ENUM (email/webhook/log)         │
│ action_config │ JSONB                            │
│ severity      │ VARCHAR(20)                      │
│ last_triggered│ TIMESTAMP                        │
│ trigger_count │ INTEGER                          │
│ created_at    │ TIMESTAMP                        │
└──────────────────────────────────────────────────┘
```

### Users Table
```
┌──────────────────────────────────────────────────┐
│                     users                         │
├──────────────────────────────────────────────────┤
│ id            │ UUID (PK)                        │
│ username      │ VARCHAR(80) UNIQUE               │
│ email         │ VARCHAR(120) UNIQUE              │
│ password_hash │ VARCHAR(128)                     │
│ role          │ ENUM (admin/analyst/supervisor)  │
│ is_active     │ BOOLEAN                          │
│ created_at    │ TIMESTAMP                        │
│ last_login    │ TIMESTAMP                        │
└──────────────────────────────────────────────────┘
```

## Directory Structure
```
Claude SOC project/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── models/
│   │   │   ├── event.py         # Event model
│   │   │   ├── alert_rule.py    # AlertRule model
│   │   │   └── user.py          # User model
│   │   ├── routes/
│   │   │   ├── events.py        # Events API
│   │   │   ├── ingest.py        # Ingestion API
│   │   │   ├── dashboard.py     # Dashboard API
│   │   │   └── alerts.py        # Alert rules API
│   │   ├── services/
│   │   │   ├── websocket.py     # WebSocket handlers
│   │   │   ├── alert_engine.py  # Rule evaluation
│   │   │   └── notifications.py # Email/webhook
│   │   └── tasks.py             # Celery tasks
│   ├── config.py
│   ├── celery_app.py
│   ├── run.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── EventCard.tsx
│   │   │   ├── SeverityBadge.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Events.tsx
│   │   │   ├── Alerts.tsx
│   │   │   └── Sites.tsx
│   │   ├── hooks/
│   │   │   └── useSocket.tsx
│   │   ├── api.ts
│   │   ├── types.ts
│   │   └── App.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── Dockerfile
├── scripts/
│   ├── log_generator.py         # Demo event generator
│   └── init_db.py               # Database initialization
├── docs/
│   ├── architecture.md
│   ├── reference.md
│   └── project_status.md
├── docker-compose.yml
├── README.md
├── claude.md
└── .env.example
```

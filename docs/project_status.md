# Project Status

## Current Milestone: Version 1.2 - COMPLETED

### Completed ✓

#### Core Features (V1)
- [x] Project structure and documentation
- [x] Database schema (SQLAlchemy models: Event, AlertRule, User, Playbook, PlaybookExecution)
- [x] Event ingestion API (POST /api/ingest, batch support)
- [x] REST API routes (events, dashboard, alerts, playbooks)
- [x] WebSocket server (real-time event streaming)
- [x] Celery alert engine (periodic rule evaluation)
- [x] Frontend React dashboard
- [x] Events list with filtering and search
- [x] Status updates and event triage
- [x] Alert rules management
- [x] Sites overview page
- [x] Docker configuration (docker-compose.yml)
- [x] Log generator for demo (30 sites simulation)

#### V1.1 Features
- [x] JWT Authentication (login, register, roles: admin/analyst/supervisor)
- [x] Dark/Light theme toggle
- [x] Export functionality (CSV, PDF, JSON) with html2pdf.js
- [x] Enhanced Playbooks with execution tracking
  - Playbook CRUD (create, duplicate, archive, toggle)
  - PlaybookExecution model for tracking runs
  - Active Executions widget
  - Execution history per playbook
  - Step-by-step progress with complete/skip
- [x] Event Volume timeframes (5m, 15m, 30m, 1h, 6h, 24h, 7d, 30d)
- [x] Historical data backfill (`--backfill` option in log_generator.py)

---

## Before / After — Incident Correlation Engine (v1.2)

### Before (v1.1)
The alert engine (`alert_engine.py`) was a **fire-and-forget rule evaluator**:
- Checked each `AlertRule` every 10 seconds against recent events
- If threshold met → incremented `trigger_count`, set `last_triggered` on the rule, logged a message
- Every matching event remained **isolated** — no grouping, no lifecycle, no ownership
- No way to track "this cluster of 12 failed-login events is one ongoing attack"
- Analysts had to manually search Events page to understand what triggered an alert

### After (v1.2)
The alert engine is now a **full correlation engine**:
- When a rule fires → creates (or reopens) an **Incident** record linked to that rule
- Matching unassigned events are **bulk-assigned** to the incident via `incident_id` FK
- Open incident per rule is **reused** — no duplicate incidents for the same ongoing attack
- Incidents have their own **status lifecycle**: `new → open → investigating → resolved / false_positive`
- Analysts get an **Incidents page**: grouped view, detail panel showing all N linked events, assign-to-me, status transitions
- Traceability: `incident.alert_rule_id` always shows which rule triggered it

### Net Impact
| Dimension | Before | After |
|-----------|--------|-------|
| Event grouping | None | Automatic via alert rule |
| Analyst workflow | Search events manually | Open Incidents page, see context immediately |
| Attack traceability | `trigger_count` number only | Full incident with linked events + rule |
| Deduplication | N/A | Open incident reused per rule (no noise) |
| Schema | Events table only | + `incidents` table + `event.incident_id` FK |
| API surface | No incident endpoints | `GET/PATCH /api/incidents` |

---

#### V1.2 Features
- [x] **Event Correlation Engine** — Celery alert engine now creates `Incident` records when alert rules fire
  - New `Incident` SQLAlchemy model (UUID PK, title, severity, status, alert_rule FK, assigned_to, resolved_at)
  - Events linked to incidents via `incident_id` FK on events table (SET NULL on delete)
  - Deduplication: unassigned events only; open incident per rule reused (no duplicates)
  - Bulk UPDATE for event assignment (performance)
  - Default 1h timeframe window when rule has no explicit timeframe
- [x] **Incidents page** (React) — full list/grid view with detail side panel
  - Filters: severity, status, full-text search (client-side on title/description)
  - Status transitions: new → open → investigating → resolved / false_positive
  - Assign to me / Unassign button
  - Associated events list in detail panel
  - Paginated API (`GET /api/incidents`, `GET /api/incidents/:id`, `PATCH /api/incidents/:id`)
- [x] **Safe schema migration** (`migrate_db.py`) — `db.create_all()` + idempotent `ALTER TABLE` on startup; no Alembic dependency
- [x] **Custom dropdown component** (`CustomSelect.tsx`) — replaces native `<select>` across Events and Incidents pages; fully theme-aware (CSS variables), works in both dark/light mode
- [x] **Real infrastructure only** — log generator constrained to `endpoint-pc-01`, `endpoint-pc-02`, `firewall-gw`; fake AUDIO_* site data removed from DB
- [x] **pytest suite** — backend test coverage for events, alert rules, dashboard, playbook runner

### In Progress 🚧
None

### Not Yet Implemented
- [ ] Email notification integration
- [ ] Webhook notifications

### Blocked ⛔
None

---

## Session Notes
- 2026-01-14: Project initialized with PSB methodology. Created documentation files.
- 2026-01-14: **V1 MVP COMPLETED** - Full stack implementation with backend (Flask), frontend (React), database (PostgreSQL), task queue (Celery/Redis), Docker deployment, and log generator for 30 audioprothésiste sites.
- 2026-02-04: **V1.1 COMPLETED** - Added JWT auth, theme toggle, export (CSV/PDF/JSON), playbooks backend with execution tracking, event volume timeframes, backfill option.
- 2026-02-05: PDF export improved with html2pdf.js for direct download + better styling.
- 2026-02-24: **V1.2 COMPLETED** — Event Correlation Engine (Incident model, migration, alert engine refactor), Incidents page (React), safe schema migration, CustomSelect component, log generator constrained to real infra (endpoint-pc-01/02, firewall-gw), pytest suite added.

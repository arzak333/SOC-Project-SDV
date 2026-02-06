# Project Status

## Current Milestone: Version 1.1 - COMPLETED

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

### In Progress 🚧
- [ ] PDF report centering refinements

### Not Yet Implemented
- [ ] Email notification integration
- [ ] Webhook notifications
- [ ] Real SIEM integration (Wazuh/ELK)

### Blocked ⛔
None

---

## Session Notes
- 2026-01-14: Project initialized with PSB methodology. Created documentation files.
- 2026-01-14: **V1 MVP COMPLETED** - Full stack implementation with backend (Flask), frontend (React), database (PostgreSQL), task queue (Celery/Redis), Docker deployment, and log generator for 30 audioprothésiste sites.
- 2026-02-04: **V1.1 COMPLETED** - Added JWT auth, theme toggle, export (CSV/PDF/JSON), playbooks backend with execution tracking, event volume timeframes, backfill option.
- 2026-02-05: PDF export improved with html2pdf.js for direct download + better styling.

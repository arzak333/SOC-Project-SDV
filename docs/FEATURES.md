# FEATURES.md

This file tracks all features implemented in the AudioSOC project.

---

## Core Platform Features

### Dashboard (v1.0)
- Real-time security event monitoring via WebSocket
- KPI cards showing event counts by severity
- Event Volume chart with configurable timeframes: 5m, 15m, 30m, 1h, 6h, 24h, 7d, 30d
- Critical events list with quick access
- Site summary overview (per monitored endpoint)
- Auto-refresh with live updates

### Events Management (v1.0)
- Event list with pagination
- Filter by severity, status, source, site
- Full-text search in descriptions
- Status workflow: `new` → `investigating` → `resolved` / `false_positive`
- Event assignment to analysts
- Comment system for event notes
- Export to CSV/PDF/JSON (v1.1)

### Alert Rules Engine (v1.0)
- CRUD operations for alert rules
- Threshold-based conditions (count + timeframe)
- Filter by event type, source, severity
- Actions: log, email, webhook
- Enable/disable toggle
- Rule templates for quick setup (v1.1)
- Rule duplication (v1.1)
- Expandable rule details (v1.1)

### Multi-Site Management (v1.0)
- Multi-center support (designed for ~30 audioprothésiste centers; demo uses endpoint-pc-01, endpoint-pc-02, firewall-gw)
- Per-site event filtering
- Site summary statistics
- Site-based WebSocket subscriptions

### Assets & Infrastructure Page (v1.2)
- Per-site event severity cards (critical / high / medium / low counts)
- **GLPI Asset Inventory table**: live data from GLPI API
  - Columns: Name, Comment, Serial, Entity, Created
  - Loading / empty / error states

### Event Ingestion (v1.0)
- REST API for event submission (`POST /api/ingest`)
- Batch ingestion (`POST /api/ingest/batch`)
- Input validation and sanitization
- Real-time WebSocket broadcast on ingestion
- Support for 3 event sources matching real infrastructure: firewall, endpoint, application (GLPI)

---

## Authentication & Authorization (v1.1)

### JWT Authentication
- Login/logout with JWT tokens
- Token refresh mechanism
- 24-hour token expiration
- Secure password hashing (bcrypt)

### User Roles
- **Admin**: Full system access
- **Analyst**: Event triage and investigation (read-only on rules/playbooks)
- **Supervisor**: Team oversight and reporting

### RBAC (RoleContext)
- `frontend/src/context/RoleContext.tsx` — permission source of truth
- Permission flags per role: `canAssign`, `canManageRules`, `canManagePlaybooks`, `canExport`
- Admin-only **VIEW AS** switcher in TopBar for live demos (switch displayed role without re-login)

### Demo Users
- Pre-configured demo accounts for testing
- Quick-fill credentials on login page

### Frontend Integration
- AuthContext + RoleContext for state management
- Protected routes
- Persistent sessions (localStorage)
- Auto-logout on token expiration

---

## Theme System (v1.1)

### Dark/Light Mode
- Toggle between dark and light themes
- System preference detection
- Persistent theme selection (localStorage)
- CSS variables for consistent theming

---

## Export & Reporting (v1.1)

### CSV Export
- Export filtered events to CSV
- Proper data escaping

### PDF Reports
- Direct PDF download via html2pdf.js (no print dialog)
- Styled report layout with AudioSOC branding
- Statistics summary + event table with severity badges

### JSON Export
- Full data export in JSON format
- Formatted output for readability

---

## Playbooks / Incident Response (v1.1)

### Playbook Management
- Create, edit, delete, archive playbooks
- Categories: incident, investigation, remediation, compliance
- Status: active, draft, archived

### Playbook Steps
- **Action**: Automated actions (isolate host, block IP, disable account)
- **Condition**: Branch based on conditions
- **Notification**: Send alerts (email, Slack, webhook)
- **Manual**: Require human approval

### Execution
- Step-by-step execution tracking
- Step status: pending, running, completed, failed, skipped
- Execution history and duration tracking

### Triggers
- Manual trigger
- Alert rule trigger
- Scheduled trigger (cron)

### Templates
- Pre-built playbook templates:
  - Ransomware Response
  - Phishing Investigation
  - Account Compromise
  - DDoS Response

---

## GLPI Integration (v1.2)

### Backend
- `GET /api/assets` — lists all computers from GLPI API
- `GET /api/assets/<name>` — single asset lookup by name
- Proxied through Flask backend (avoids CORS, centralizes auth)

### Frontend
- `GLPIAsset` TypeScript interface in `types.ts`
- `fetchAssets()` typed API call in `api.ts`
- Asset inventory table on Sites page (live data, loading/error states)

---

## Infrastructure Lab (v1.2)

Separate Docker Compose stack in `infrastructure/` simulating the client network.

### Wazuh SIEM Stack (4.14.2)
- **wazuh-manager**: log collection, agent management, alert rules
- **wazuh-indexer**: OpenSearch-based log storage
- **wazuh-dashboard**: web UI at `https://localhost:4443`
- SOC webhook integration: Wazuh alerts forwarded to `/api/ingest`

### Simulated Endpoints
- **endpoint-pc-01** / **endpoint-pc-02**: Ubuntu 22.04 + Wazuh agent
- Log generator producing realistic auth, sudo, cron, file integrity events
- Logs flow through Wazuh → SOC dashboard

### Firewall Container (v1.2)
- Ubuntu 22.04 + iptables, Wazuh agent registered as `firewall-gw`
- Dual-homed: `dmz-net` (172.25.0.0/24, external) + `infra-net` (internal)
- Real iptables rules: FORWARD DROP default, NAT masquerade, LOGGING chain
- Log generator writes realistic `IPTables-Dropped` / `HTTP-Access` syslog entries
- Logs collected by Wazuh → forwarded to SOC

### GLPI (IT Asset Management)
- `diouxx/glpi` + MariaDB backend
- Pre-populated with 2 computers (endpoint-pc-01, endpoint-pc-02)
- REST API consumed by SOC backend

### Network Topology
```
[dmz-net 172.25.0.0/24]
        │
  [firewall-gw]  ← iptables NAT + Wazuh agent
        │
[infra-net]
   ├── endpoint-pc-01 → Wazuh agent
   ├── endpoint-pc-02 → Wazuh agent
   ├── glpi-crm (+ glpi-db)
   └── wazuh-manager → wazuh-indexer → wazuh-dashboard
                    └──→ SOC /api/ingest (via soc-network)
```

---

## Backend Infrastructure (v1.0)

### Celery Task Queue
- Alert rule evaluation every 10 seconds
- Async event processing
- Periodic cleanup tasks

### WebSocket (Socket.IO)
- Real-time event broadcasting
- Room-based subscriptions
- Connection status tracking

### Database (PostgreSQL)
- Event persistence with JSONB metadata
- Alert rules with JSONB conditions
- User management with roles

---

## Development Tools (v1.0)

### Log Generator Script
- Realistic security event simulation
- Normal traffic mode
- Attack scenario simulation
- Burst mode for spike testing
- Multi-site event distribution
- **Backfill mode**: Generate historical events spread across configurable time range
  - `--backfill`: Enable backfill mode
  - `--days N`: Number of days to backfill (default: 7)
  - `--count N`: Number of events to generate (default: 1000)

### Docker Deployment
- SOC stack: 5-service Docker Compose (`backend`, `frontend`, `db`, `redis`, `celery`)
- Infrastructure lab: 8-service Docker Compose (`wazuh` ×3, `endpoints` ×2, `glpi` ×2, `firewall`)
- Environment variable configuration
- Production-ready with Gunicorn

---

## Dashboard Analytics & UX (v1.3)

### Trend Indicators on StatCards
- **% change vs previous 24h** on Security Events and Critical Alerts cards
- Green/red arrows with percentage (TrendingUp / TrendingDown icons)
- Backend: `/dashboard/stats` now returns `events_prev_24h` and `critical_prev_24h`

### Event Volume Chart Enhancements
- Time range selector: `5m`, `15m`, `30m`, `1h`, `6h`, `24h`, `7d`, `30d`
- Clickable data points → navigate to Events page filtered by time
- Loading state during range changes

### Severity Trend Chart (7d / 30d)
- Stacked area chart showing daily breakdown by severity (critical, high, medium, low)
- Only visible when time range is `7d` or `30d`
- Backend: `/dashboard/trends` returns `daily` array with per-severity counts

### Activity Heatmap
- Weekly heatmap (7 days × 24 hours) showing event density
- Color intensity based on event count per hour-slot
- Backend: `GET /api/dashboard/heatmap` — aggregates events by day-of-week and hour

### Top Source IPs Widget
- Horizontal bar chart of top 10 source IPs (last 24h)
- Color-coded bars: red (critical), orange (high), blue (normal)
- Critical/high severity badges per IP
- Backend: `GET /api/dashboard/top-ips` — JSONB query on `metadata.source_ip`

### Alerts by Source (Donut Chart)
- Interactive donut chart with source breakdown (Firewall, Endpoints, GLPI)
- Click a slice to filter RecentAlertsTable by source
- Filter badge shown on table when active

### Recent Alerts Table Enhancements
- **Quick Actions column**: Eye (view details) + UserCheck (assign to me) buttons
- **Quick assignment**: one-click self-assign via `updateEventStatus`
- **Assignee dropdown**: click to reassign (admin/supervisor only via RBAC)
- **Live feed animation**: new entries flash blue highlight (`animate-new-entry`) and fade
- **Source filter**: linked to donut chart selection

### Alert Detail Modal — Quick Actions
- **Toggleable action buttons**: Create Ticket, Block Source IP, Isolate Endpoint, Run Playbook
- Instant visual feedback (green checkmark on click, re-clickable to undo)
- Actions logged in modal's timeline tab

### Endpoint Status Card Enhancements
- **Degraded/offline sub-text**: shows reason under endpoint name
  - Offline: `"{N} critical alert(s) detected"` (red)
  - Degraded: `"{N} events, high severity alerts"` (yellow)
- Click to open detail modal with health score, IP, location, event stats
- Quick actions: View Logs, Restart Services, Investigate

### Live Mode
- Toggle button (LIVE / Paused) in dashboard header
- Auto-refresh every 10 seconds when live
- Green pulsing indicator on alerts table

---

## SOC Analyst UX Improvements (v1.5)

### Language Consistency
- All UI strings standardized to **English** (previously mixed French/English)
- French day names, chart titles, and labels converted to English
- Date locale formatting (`fr-FR`) kept for timestamps

### Event Trend Color Fix
- **Security-context aware** trend indicators: more events = bad (red/amber), fewer events = good (green)
- Amber threshold for >50% deviation, red for >100% regardless of direction
- Previously showed green for increases (misleading in security context)

### Alert Grouping (Reduce Alert Fatigue)
- Duplicate alerts grouped by `alertName + source` in the Recent Alerts table
- Shows count badge (`23x`) next to grouped alert names
- Reduces 1,000 brute-force lines to a single grouped entry

### False Positive Quick Action
- `Ban` icon button in Recent Alerts table Actions column
- One-click false positive marking directly from dashboard (no need to open modal)

### IP Quick Actions (OSINT)
- Hover over any IP in Top Source IPs widget to reveal action menu
- **Whois Lookup** — opens who.is in new tab
- **VirusTotal** — opens VirusTotal IP page in new tab
- **Block IP** — simulated block action with toast confirmation

### Playbook Integration on Alerts
- "Run Playbook" in Alert Detail Modal now shows **real playbook picker**
- Fetches active playbooks from backend and displays selectable list
- **Recommended** badge on playbooks matching the event type/severity
- Executes playbook via backend API with event context (eventId, startedBy)

---

## Internationalization / i18n (v1.6)

### EN/FR Language Toggle
- One-click language toggle button in the **top header bar** (🇬🇧 EN / 🇫🇷 FR)
- Instant language switch — no page reload required
- Language persisted to `localStorage` (survives refresh)
- Default language: English

### Implementation
- **Lightweight i18n system** — no external library, uses React Context + translations dictionary
- `LanguageContext` provider with `t(key)` translation function
- `locale()` helper for date/number formatting (`en-US` / `fr-FR`)
- ~150 translation keys per language covering all dashboard components

### Translated Components
All dashboard-facing components use `t()` for user-visible strings:
- Dashboard (header, stat cards, live mode toggle)
- Sidebar navigation (Layout)
- TopBar (system status, user menu, notifications)
- Event Volume Chart, Severity Trend Chart, Activity Heatmap
- Recent Alerts Table (headers, empty states, action labels)
- Alert Detail Modal (tabs, fields, status buttons, quick actions, playbook picker)
- Endpoint Status Card (status labels, detail modal fields)
- Top Source IPs (title, action menu, OSINT links)
- StatCard (trend label)

---

## Planned Features (Roadmap)

### v1.6 (Planned)
- [ ] Email notifications (SMTP integration)
- [ ] Webhook notifications
- [ ] Geolocation map for source IPs

### v2.0 (Planned)
- [ ] Machine learning anomaly detection
- [ ] Mobile responsive design
- [ ] API rate limiting

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| v1.0 | 2025-01 | Initial release: Dashboard, Events, Alerts, Sites, Multi-site support |
| v1.1 | 2026-01 | Authentication, Themes, Export, Enhanced Playbooks, Rule templates, RBAC |
| v1.2 | 2026-02 | GLPI integration, Infrastructure lab (Wazuh + endpoints + firewall), Event Correlation Engine, Incidents module |
| v1.3 | 2026-02 | Automated backend testing (pytest), Automated playbook execution runner |
| v1.4 | 2026-02 | Dashboard analytics: trend indicators, severity trend chart, activity heatmap, top source IPs, quick actions, live feed animation |
| v1.5 | 2026-02 | SOC analyst UX: language consistency, trend color fix, alert grouping, FP quick action, IP OSINT actions, playbook integration |
| v1.6 | 2026-02 | Internationalization: EN/FR language toggle with full translation coverage |

# Session Log

## Session — 2026-02-16

### Task 1: Verify SOC Webhook Pipeline
- Checked SOC containers: backend, frontend, DB, Redis all running
- Checked infrastructure containers: Wazuh stack + GLPI running, but **endpoints exited**
- Restarted endpoint-1 and endpoint-2 — hit **port 55000 conflict** (WSL2 reserved ports)
- **Fix**: Removed `55000:55000` port mapping from `infrastructure/docker-compose.yml` (Wazuh API only needed internally)
- Both agents (`endpoint-pc-01`, `endpoint-pc-02`) reconnected as **Active**
- Verified integration config in `ossec.conf`: webhook pointing to `http://soc-backend:5000/api/ingest`, level 3+, permissions 750 root:wazuh
- **Result**: 1809+ real events in SOC database from `active_directory` and `endpoint` sources

### Task 2: Create 5 Alert Rules
Created via `POST /api/alerts/rules`:

| Rule | event_type | source | count | timeframe | severity |
|------|-----------|--------|-------|-----------|----------|
| Brute Force Detection | auth_failure | active_directory | 5 | 10m | high |
| Privilege Escalation | privilege_escalation | any | 3 | 30m | high |
| File Integrity Violation | file_integrity | endpoint | 3 | 1h | medium |
| Intrusion / Suspicious Process | intrusion_attempt | any | 1 | 5m | critical |
| High Severity Event Burst | any (severity=high) | any | 10 | 15m | critical |

### Task 3: Clean Mock/Hardcoded Data

**Dashboard.tsx**
- Replaced `?? 14203` → `?? 0`, `?? 23` → `?? 0`
- Removed fake 0.88 trend multiplier and hardcoded 5.2 trend
- Replaced `generateMockHourlyData()` / `generateMockSourceData()` fallbacks with `[]`
- Deleted both `generateMock*` functions

**backend/app/routes/endpoints.py** — Full rewrite
- Removed 30 fake `FRENCH_CENTERS` + `generate_endpoints()` function
- `list_endpoints()`: queries distinct `site_id` from events table, computes real stats (events_24h, critical_alerts, last_seen, derives status from recency)
- `list_analysts()`: queries `User` model instead of hardcoded French names
- Added imports: `db`, `Event`, `EventSeverity`, `EventStatus`, `User`

**AlertDetailModal.tsx**
- Removed `mockAnalysts` array (4 fake French analysts)
- Added `fetchAnalysts()` API call in `loadEventData()`
- Changed `useState` from static mock to dynamic `setAnalysts`
- Kept `generateMockTimeline()` as placeholder with comment

**RecentAlertsTable.tsx**
- Removed hardcoded `quickAssignOptions` array
- Added `useEffect` to fetch analysts from `/api/analysts` on mount
- Added imports: `useEffect`, `Analyst` type, `fetchAnalysts`

**types.ts**
- Added `total_sites: number` to `DashboardStats` interface (was returned by API but missing from type)

### Task 4: GLPI Asset Integration

**New file: `backend/app/services/glpi_service.py`**
- GLPI REST API client with session management (`initSession` / `killSession`)
- `get_computers()`: list all computers from GLPI
- `get_computer_by_name()`: search by hostname
- `enrich_event_metadata()`: optional event enrichment with GLPI asset info
- Reads `GLPI_URL`, `GLPI_APP_TOKEN`, `GLPI_USER_TOKEN` from env vars

**New file: `backend/app/routes/assets.py`**
- `GET /api/assets` → list GLPI computers
- `GET /api/assets/<name>` → search by hostname

**backend/app/__init__.py**
- Registered `assets_bp` blueprint

**docker-compose.yml** (root SOC)
- Added `GLPI_URL`, `GLPI_APP_TOKEN`, `GLPI_USER_TOKEN` env vars to backend
- Connected backend to `infrastructure_infra-net` network
- Added `infrastructure_infra-net` as external network

**frontend/src/api.ts**
- Added `fetchAssets()` and `fetchAssetByName()` functions

**backend/requirements.txt**
- Added `requests==2.31.0`
- Rebuilt backend Docker image to include new dependency

### README Update
- Updated architecture diagram (infrastructure on the right side)
- Added Wazuh, Endpoints, GLPI to stack table
- Added "Étape 2: Déployer l'infrastructure" — full tutorial with commands and verification
- Added "Étape 3: Configurer GLPI" — step-by-step API token setup
- Added "Accès aux Interfaces" table with all URLs and credentials
- Added "Endpoints, Analysts & Assets" API endpoints section
- Pushed to `real-integration` branch

### Wazuh Dashboard Fix
- Dashboard showed "No API available to connect" / `wazuh-modulesd->failed`
- **Root cause**: `filebeat.yml` mounted as `:ro` in docker-compose → init script `1-config-filebeat` failed because `sed` can't rename temp file on read-only mount → `indexer-connector` failed to initialize → `wazuh-modulesd` reported as failed → Wazuh API refused all auth requests (error 1017)
- **Fix**: Removed `:ro` from filebeat.yml mount in `infrastructure/docker-compose.yml`
- Recreated manager container → all daemons started, API auth works, dashboard loads

### Files Modified
- `infrastructure/docker-compose.yml` (port 55000 removed, filebeat.yml :ro removed)
- `docker-compose.yml` (GLPI env vars, infra network)
- `backend/app/routes/endpoints.py` (full rewrite)
- `backend/app/__init__.py` (assets blueprint)
- `backend/app/services/glpi_service.py` (new)
- `backend/app/routes/assets.py` (new)
- `backend/requirements.txt` (requests added)
- `frontend/src/pages/Dashboard.tsx` (mock data removed)
- `frontend/src/components/AlertDetailModal.tsx` (mock analysts removed)
- `frontend/src/components/RecentAlertsTable.tsx` (mock analysts removed)
- `frontend/src/api.ts` (fetchAssets added)
- `frontend/src/types.ts` (total_sites added)
- `README.md` (infra setup guide, architecture, API endpoints)

## Session — 2026-02-17

### Task 5: Fix GLPI Integration (Credentials & API)

**GLPI Login Issue**
- Could not log in with `root`/`glpi_root_pass` — those are MariaDB credentials, not GLPI app credentials
- Correct GLPI web login: `glpi` / `glpi` (default Super-Admin)

**GLPI API Setup**
- Enabled **Legacy REST API** in Setup > General > API (required for `apirest.php` endpoint)
- Enabled **"Enable login with external token"**
- Opened IP restriction on "full access from localhost" API client to allow Docker network IPs (backend was connecting from `172.20.0.x`)
- Obtained App-Token from API client config

**docker-compose.yml Fixes**
- Fixed `GLPI_USER_TOKEN` syntax: was `${iqtYcWdxtcO330aHP1pimDehAInS38k26RzhNLMY}` (treated as env var name) → `iqtYcWdxtcO330aHP1pimDehAInS38k26RzhNLMY` (bare value)
- Added `GLPI_APP_TOKEN=b6W2NSYLqy3UF1spssoeQguYZcrVwNglT8QO0NoD`
- Note: `docker compose restart` doesn't pick up env changes — must use `docker compose up -d` to recreate

**glpi_service.py Fixes**
- Fixed `os.getenv('iqtYcWdxtcO330aHP1pimDehAInS38k26RzhNLMY')` → `os.getenv('GLPI_USER_TOKEN')` (token was used as env var name)
- Made `App-Token` header optional in `_init_session()` and `_headers()` (only sent if configured)

**Result**: GLPI session init succeeds, session token obtained, 0 computers (expected — fresh instance)

### Files Modified
- `docker-compose.yml` (GLPI_USER_TOKEN syntax fix, GLPI_APP_TOKEN added)
- `backend/app/services/glpi_service.py` (env var name fix, optional App-Token)

## Session — 2026-02-18

### Task 6: Populate GLPI Assets

**GLPI assets created via API (7 total):**
- `endpoint-pc-01` → Audioprothésiste Center 1 (existing, comment updated)
- `endpoint-pc-02` → Audioprothésiste Center 2 (existing, comment updated)
- `endpoint-pc-03` through `endpoint-pc-07` → Audioprothésiste Center 3–7 (new)

**Cleanup performed:**
- Deleted duplicate `endpoint-pc-01` (id:3) and `endpoint-pc-02` (id:4) created by mistake
- Updated comments on original ids 1 & 2 from `"Poste audioprothesiste - Centre AUDIO_001"` to `"Audioprothésiste Center 1/2"` to match consistent format

**Result**: `GET /api/assets` returns 7 assets with correct names and comments

### Task 7: Wire Up Navigation — Endpoints → Events

**Problem**: "View Logs" and "Investigate" buttons in EndpointDetailModal were UI stubs (no onClick).
Additionally, `search` param was used to pass `site_id`, but backend `search` filters on `description`, not `site_id`.

**EndpointStatusCard.tsx**
- Added `useNavigate` import
- Added `handleViewLogs()`: closes modal, navigates to `/events` with `{ site_id }` in router state
- Added `handleInvestigate()`: closes modal, navigates to `/events` with `{ site_id, severity: 'critical,high' }`
- Wired both handlers to their respective buttons via `onClick`

**Events.tsx**
- Added `useLocation` import to read incoming router state
- Added `siteIdFilter` state initialized from `locationState?.site_id`
- Added `severityFilter` initialized from `locationState?.severity`
- Passed `site_id: siteIdFilter` to `fetchEvents()` (correct backend param, not `search`)
- Added `siteIdFilter` to `useEffect` dependency array so it triggers on first render

**Result**: Clicking "View Logs" on `endpoint-pc-01` navigates to Events and shows its ~1900 events filtered by `site_id`

### Task 8: Wire Up Navigation — Sites Page → Events

**Problem**: `SiteCard` components and GLPI asset table rows had no click handler — nothing happened on click.

**Sites.tsx**
- Added `useNavigate` import
- Added `useNavigate()` call in both `Sites()` and `SiteCard()` components
- `SiteCard` div: added `onClick` → `navigate('/events', { state: { site_id: site.site_id } })` + `cursor-pointer hover:border-blue-500/50` styles
- Asset table rows: added `onClick` → `navigate('/events', { state: { site_id: asset.name } })` + `cursor-pointer`

**Result**: Clicking any site card or GLPI asset row navigates to Events pre-filtered by that site's events

### Files Modified
- `frontend/src/components/EndpointStatusCard.tsx` (View Logs + Investigate wired up)
- `frontend/src/pages/Events.tsx` (site_id filter via router state, useLocation)
- `frontend/src/pages/Sites.tsx` (SiteCard clickable, asset rows clickable)

### Task 9: Notification Bell Dropdown

**Problem**: Bell icon in TopBar was static — no dropdown, no badge, no content.

**TopBar.tsx**
- Added imports: `AlertTriangle`, `AlertCircle`, `Info`, `useEffect`, `useNavigate`, `fetchEvents`, `SecurityEvent`
- Added state: `showNotifications` (boolean), `notifications` (SecurityEvent[])
- `useEffect` on mount: calls `fetchEvents({ severity: 'critical,high', status: 'new', limit: 8 })` to load real unread critical/high events
- Added `severityIcon()` helper: returns colored icon per severity level
- Bell button: shows red badge with count (capped at `9+`) when `notifications.length > 0`
- Dropdown panel (w-80, bg-slate-800, z-20):
  - Overlay div closes panel on outside click
  - Header: "Recent Alerts" + "View all" link → `/events` with `{ severity: 'critical,high' }`
  - List of up to 8 events with severity icon, title (truncated), site_id/source
  - Each row navigates to Events filtered by severity on click
  - "No new alerts" empty state

**Result**: Bell shows live badge count, dropdown lists recent critical/high unread events

### Task 10: Fix Light/Dark Theme

**Problem**: Switching to light mode made text grey-on-white or kept UI elements dark. ~85% of components used hardcoded Tailwind `slate-*`/`gray-*` classes that don't respond to `data-theme`.

**Root cause**: `ThemeContext` correctly sets `data-theme` on `<html>`, and CSS variables are defined for both themes — but components like Events.tsx, Sites.tsx, TopBar.tsx, Layout.tsx, etc. use hardcoded classes (`bg-gray-800`, `text-slate-400`, etc.) that have no theme awareness.

**Fix: `frontend/src/index.css`**
Added a comprehensive `[data-theme="light"]` override block (no `!important` needed — parent attribute selector `[data-theme="light"] .class` has specificity 0,2,0 vs Tailwind's 0,1,0):
- **Scrollbar**: light track + slate-400 thumb
- **Form inputs**: `input, select, textarea { color: #0f172a }` fixes `text-white` on light-bg inputs
- **Solid backgrounds**: `bg-slate-{900,800,700,600}` → white/light-gray ladder; same for `bg-gray-*`
- **Alpha backgrounds**: `bg-slate-700/30`, `bg-slate-700/50`, `bg-gray-700/*` → light equivalents
- **Hover backgrounds**: `hover:bg-slate-{900,800,700}`, `hover:bg-gray-{700,600}` + alpha variants
- **Text colors**: `text-slate-{100→400}` → dark-to-medium ladder; same for `text-gray-*`
- **Hover/group-hover text**: `hover:text-slate-200` → dark; `group-hover:text-white` → near-black
- **Borders**: `border-slate-{800,700,600}` + alpha → slate-200/300; same for `border-gray-*`
- **Divide**: `divide-slate-700`, `divide-gray-700` → slate-200

**Result**: Instant theme switch via CSS (hot-reloaded by Vite with no page refresh needed). All pages coherent in light mode.

### Files Modified
- `frontend/src/components/TopBar.tsx` (notification bell dropdown)
- `frontend/src/index.css` (comprehensive light theme overrides)

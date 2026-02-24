# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added (Event Correlation & Incident Management)
- **Backend Model**: Created `Incident` model and linked to `Event` model (One-to-Many).
- **Backend DB**: Created and ran manual schema migration (`migrate_db.py`) to add the `incident_id` foreign key.
- **Backend Logic**: Refactored the `AlertEngine` to group triggering events and deduplicate incidents based on unassigned events for active rules.
- **Backend API**: Added REST endpoints for incident CRUD (`GET /api/incidents`, `GET /api/incidents/:id`, `PATCH /api/incidents/:id`) in `incidents.py` with full `try/except` db commit handling.
- **Backend Bugfix**: Fixed issue where `incident.resolved_at` was not populated upon status change to `RESOLVED`.
- **Frontend Types**: Added `Incident` and `IncidentStatus` interfaces to `frontend/src/types.ts`.
- **Frontend UI**: Built the `Incidents.tsx` Dashboard with grid/list views, filtering (status, severity), and detailed interactive panels to manage incidents.
- **Frontend State**: Wired assignment capabilities utilizing the authenticated user's context (`useAuth`).
- **Frontend Navigation**: Updated `App.tsx` and Sidebar (`Layout.tsx`) to integrate the new Incidents view.

### Added (Initial Setup)
- Project initialized with PSB methodology
- Documentation: claude.md, architecture.md, reference.md, project_status.md
- .gitignore and .env.example templates

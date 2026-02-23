# AGENTS.md - Developer Guide for AI Agents

> **Context:** This project is an AI-generated prototype (AudioSOC). It follows specific patterns established by Claude Code.
> **Primary Reference:** Always consult `CLAUDE.md` for architecture, business logic, and core commands.

## 1. Environment & Build Commands

### 📦 Backend (`/backend`)
*   **Stack:** Python 3.11, Flask, SQLAlchemy, Celery, Redis
*   **Install:** `pip install -r requirements.txt`
*   **Run (Dev):** `python run.py` (Requires local Redis/Postgres or Docker services)
*   **Run (Docker):** `docker compose up -d` (Recommended)
*   **Linting:** Follow **PEP 8**. Use `ruff check .` or `flake8` if installed, otherwise format manually. Check syntax with `python -m py_compile <file>`.

### 🎨 Frontend (`/frontend`)
*   **Stack:** React 18, TypeScript, Tailwind CSS, Vite
*   **Install:** `npm install`
*   **Run (Dev):** `npm run dev` (Runs on port 3000, proxies `/api` to port 5000)
*   **Build:** `npm run build` (Runs `tsc` type check + `vite build`)
*   **Linting:** `npm run lint` (ESLint: `eslint src --ext ts,tsx`)
*   **Type Check:** `npx tsc --noEmit`

## 2. Testing Guidelines

Automated testing is currently sparse, but as agents add functionality, testing is expected to follow standard conventions.

### Running a Single Test
*   **Frontend Tests:** If testing is set up (e.g., via Vitest or Jest), run a single test using:
    *   Vitest: `npx vitest run src/path/to/component.test.tsx -t "Test Name"`
    *   Jest: `npm run test -- -t "Test Name"`
*   **Backend Tests:** If using `pytest` (must install `pytest` manually if needed), run a single test file or function:
    *   Single file: `pytest tests/test_file.py -v`
    *   Single test: `pytest tests/test_file.py::test_function_name -v`

### Manual Verification
*   **Backend:** Use the log generator to simulate traffic and populate the DB:
    ```bash
    python scripts/log_generator.py --count 10
    ```
*   **Frontend:** Always run `npm run lint` and `npx tsc --noEmit` on modified components. Ensure no compilation errors exist.

## 3. Code Style Guidelines

### General Philosophy
*   **"Demo First":** This is a prototype. Ensure features work visually. Maintain "mock data" fallbacks (e.g., in Dashboard) so the app works even without a full backend connection.
*   **Clean & Modular:** Keep files small. Separation of concerns is strict (Routes vs Services vs Models). Avoid god-objects and massive files.

### Frontend (React/TypeScript)
*   **Structure:** Use Functional Components only. Utilize standard React Hooks (`useState`, `useEffect`, `useCallback`) and extract complex logic into custom hooks.
*   **Styling:** **Tailwind CSS** exclusively. Do NOT write custom CSS files unless absolutely necessary.
    *   Use `clsx` for conditional classes (Pattern: `SeverityBadge.tsx`).
    *   Use established classes from the existing ecosystem: `glass-card`, `badge-critical`, `badge-high`.
*   **Types:** Strict TypeScript is required. 
    *   Avoid `any` at all costs. Define specific types or use `unknown` if truly dynamic.
    *   Define shared interfaces in `src/types.ts` (e.g., `Event`, `Alert`, `Playbook`).
    *   Component Props interfaces should be defined directly within the component file just above the component declaration.
*   **Naming Conventions:**
    *   **Files:** PascalCase for components (`StatCard.tsx`), camelCase for utilities/hooks (`useAuth.ts`).
    *   **Components & Interfaces:** PascalCase (e.g., `StatCard`, `UserProfile`).
    *   **Functions, Variables, Hooks:** camelCase (e.g., `fetchData`, `useAuth`).
    *   **Constants:** UPPER_SNAKE_CASE.
*   **Imports:**
    *   Use absolute imports with `@/` where possible (configured in `vite.config.ts`).
    *   Import Order Grouping: 
        1. React and external libraries (e.g., `react`, `lucide-react`)
        2. Internal UI Components (`@/components/...`)
        3. Custom Hooks and Contexts (`@/hooks/...`)
        4. Types and Utilities (`@/types`, `@/utils/...`)

### Backend (Python/Flask)
*   **Architecture:** Flask Blueprints strictly separate concerns.
    *   **Routes:** `app/routes/` (Handle requests, call services, return `jsonify` responses).
    *   **Models:** `app/models/` (SQLAlchemy classes).
    *   **Services:** `app/services/` (Core business logic, DB queries, external integrations).
*   **Models:**
    *   Inherit from `db.Model`.
    *   Implement `to_dict(self)` and `from_dict(cls, data)` methods for standardized serialization.
    *   Use Python `Enum` for fixed sets (e.g., `Severity`, `Status`, `PlaybookTrigger`).
*   **Naming Conventions:**
    *   **Files:** snake_case (e.g., `auth_routes.py`, `user_service.py`).
    *   **Classes & Models:** PascalCase (e.g., `EventLog`, `Alert`).
    *   **Variables, Functions, Methods:** snake_case (e.g., `get_user_by_id`, `is_active`).
    *   **Constants:** UPPER_SNAKE_CASE.
*   **Error Handling:**
    *   Always return standard JSON error structures: `{'error': 'Descriptive error message'}`.
    *   Use appropriate HTTP status codes: `400` (Bad Request), `401` (Unauthorized), `403` (Forbidden), `404` (Not Found), `500` (Internal Error).
    *   Do not crash on missing optional fields; use `data.get('field', default_value)`.
    *   Wrap database commits in `try/except` blocks. Always call `db.session.rollback()` on failure before returning an error.
    *   Log errors on the backend using standard Python `logging`.

## 4. Agent Operational Rules

1.  **Read and Understand (`CLAUDE.md`):** Before starting any task, verify if the feature is listed in "Architecture" or "API Endpoints". 
2.  **Mimic Existing Patterns:**
    *   If creating a new Frontend Component, use `frontend/src/components/StatCard.tsx` as a structural reference.
    *   If creating a new Backend Route, use `backend/app/routes/events.py` as a pattern.
3.  **Strict File Modification Rules:**
    *   Do not rewrite entire files if you only need to change a few lines. Use precise edit or sed commands.
    *   Never remove existing valid code unless explicitly instructed or if it's dead code confirmed by tests/analysis.
4.  **Verification Steps:**
    *   Since there are minimal tests, **you must verify functionality** using linters and type checkers.
    *   Run `npm run lint` and `npx tsc --noEmit` on frontend changes.
    *   Run `python -m py_compile <file>` to check for Python syntax errors.
5.  **Handling Missing Dependencies:** Do NOT assume standard libraries like `pytest` or `vitest` are present. Check `package.json` and `requirements.txt`. If you must add tests, use standard frameworks and instruct the user to install them if needed.

## 5. Current State & Missing Features

The project is a highly advanced, feature-rich prototype (tracking as v1.1). However, several key features and integrations remain:

### What is Still to be Implemented?
*   **Advanced Incident Response:**
    *   **Automated Playbook Execution:** Playbooks currently have CRUD interfaces and basic execution tracking, but true automated execution (e.g., automatically isolating a host via a script) is missing. This is a **high priority**.
    *   **Event Correlation:** The backend processes events individually; it lacks a correlation engine to group disparate events into a single "Incident."
*   **Integrations:**
    *   **Real SIEM Integration:** The system currently acts as its own datastore. Integration with actual SIEM tools (Wazuh, ELK stack) is planned but not implemented.
    *   **Notification Wiring:** `notifications.py` contains logic for SMTP and Webhooks, but it needs to be fully wired up, configured, and tested against real external endpoints.
*   **Security & Scalability:**
    *   **API Rate Limiting:** Missing on public-facing endpoints (like `/api/ingest`).
    *   **Machine Learning:** Planned ML anomaly detection does not exist yet.
    *   **Mobile Responsiveness:** The UI is primarily desktop-focused and lacks full mobile optimizations.

### What is Still to be Tested?
**Zero Automated Tests exist.** The following critical flows need testing once a framework is added:
1.  **Alert Engine Logic (Celery):** Does the engine correctly aggregate events in 10-second windows and fire alerts without duplicating them?
2.  **WebSocket Stability:** How does the frontend handle dropped connections or massive event bursts from the log generator?
3.  **Authentication Security:** Token expiry handling, role-based access control.
4.  **Database Concurrency:** Behavior when the `log_generator` blasts the `/api/ingest/batch` endpoint while the `alert_engine` is querying simultaneously.
5.  **Data Export Limits:** Testing PDF/CSV generation limits on the frontend when exporting thousands of events.

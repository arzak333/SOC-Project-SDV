# AGENTS.md - Developer Guide for Agents

> **Context:** This project is an AI-generated prototype (AudioSOC). It follows specific patterns established by Claude Code. 
> **Primary Reference:** Always consult `CLAUDE.md` for architecture, business logic, and core commands.

## 1. Environment & Build Commands

### 📦 Backend (`/backend`)
*   **Stack:** Python 3.11, Flask, SQLAlchemy, Celery, Redis
*   **Install:** `pip install -r requirements.txt`
*   **Run (Dev):** `python run.py` (Requires local Redis/Postgres or Docker services)
*   **Run (Docker):** `docker compose up -d` (Recommended)
*   **Linting:** No explicit linter configured. Follow **PEP 8**.
*   **Testing:** 
    *   ❌ **No automated test suite exists.** `pytest` is not in `requirements.txt`.
    *   **Verification:** Use the log generator to simulate traffic:
        ```bash
        python scripts/log_generator.py --count 10
        ```
    *   If you *must* add a test, install `pytest` manually and create a `tests/` directory.

### 🎨 Frontend (`/frontend`)
*   **Stack:** React 18, TypeScript, Tailwind CSS, Vite
*   **Install:** `npm install`
*   **Run (Dev):** `npm run dev` (Runs on port 3000, proxies `/api` to port 5000)
*   **Build:** `npm run build` (Runs `tsc` type check + `vite build`)
*   **Linting:** `npm run lint` (ESLint)
*   **Type Check:** `npx tsc --noEmit`

---

## 2. Code Style Guidelines

### General Philosophy
*   **"Demo First":** This is a prototype. Ensure features work visually. Maintain "mock data" fallbacks (e.g., in Dashboard) so the app works even without a full backend connection if possible.
*   **Clean & Modular:** Keep files small. Separation of concerns is strict (Routes vs Services vs Models).

### Frontend (React/TypeScript)
*   **Structure:** Functional Components only. Use Hooks (`useState`, `useEffect`, custom hooks).
*   **Styling:** **Tailwind CSS** exclusively.
    *   Use `clsx` for conditional classes (Pattern: `SeverityBadge.tsx`).
    *   Use established classes: `glass-card`, `badge-critical`, `badge-high`.
*   **Types:** Strict TypeScript.
    *   Define interfaces in `src/types.ts` for shared models (Event, Alert, Playbook).
    *   Props interfaces should be defined in the component file.
*   **Imports:**
    *   Use absolute imports with `@/` where possible (configured in `vite.config.ts`).
    *   Group: External Libs -> Internal Components -> Hooks/Contexts -> Types.

### Backend (Python/Flask)
*   **Architecture:** Flask Blueprints.
    *   Routes: `app/routes/` (Return `jsonify`).
    *   Models: `app/models/` (SQLAlchemy).
    *   Services: `app/services/` (Business logic).
*   **Models:**
    *   Use `db.Model`.
    *   Implement `to_dict(self)` and `from_dict(cls, data)` methods for serialization.
    *   Use Enums for fixed sets (Severity, Status, PlaybookTrigger).
*   **Error Handling:**
    *   Return JSON: `{'error': 'message'}` with appropriate HTTP status codes (400, 404, 500).
    *   Do not crash on missing optional fields; use defaults.

---

## 3. Workflow for Agents

1.  **Check `CLAUDE.md`**: Before starting, verify if the feature is listed in "Architecture" or "API Endpoints".
2.  **Mimic Patterns**:
    *   If creating a new Component, look at `frontend/src/components/StatCard.tsx`.
    *   If creating a new Route, look at `backend/app/routes/events.py`.
3.  **Verify without Tests**:
    *   Since there are no tests, **you must verify functionality manually** or by writing a temporary script.
    *   Run `npm run lint` on frontend changes.
    *   Run `python -m py_compile <file>` to check for syntax errors in Python.

## 4. Known Constraints
*   **Auth:** JWT based, but simplified for demo (see `init_demo_users` in `run.py`).
*   **Database:** PostgreSQL 15. Schema updates handled by `flask-migrate` (if configured) or `db.create_all()` in `init_db.py`.
*   **Real-time:** Uses `socket.io`. Ensure `SocketProvider` is wrapped correctly in `App.tsx`.

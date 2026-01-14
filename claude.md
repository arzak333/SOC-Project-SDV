# External SoC Dashboard

## Project Overview
Production-grade security operations dashboard for monitoring and responding to security events in real-time.

## Goals
- Monitor security events from multiple sources (firewall, IDS, endpoints, network)
- Real-time alerting on suspicious patterns
- Analyst workflow (triage, investigate, resolve)

## Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Python Flask + PostgreSQL
- **Real-time**: WebSockets (Socket.IO)
- **Task Queue**: Celery + Redis

## Architecture
```
Log Sources → Ingestion API → PostgreSQL
                                  ↓
Frontend ← WebSocket ← Event Stream
                ↓
         Alert Engine → Notifications
```

## Code Style
- TypeScript: strict mode, explicit types
- Python: type hints, PEP 8
- Functions: single responsibility, max 50 lines
- API: RESTful, consistent error responses
- Security: validate all inputs, sanitize logs

## Patterns to Follow
✓ Use React hooks (no class components)
✓ Separate business logic from UI
✓ Use SQLAlchemy ORM (no raw SQL)
✓ Async/await for all API calls
✓ Error boundaries in React

## Patterns to Avoid
✗ Don't store passwords in plain text
✗ Don't trust user input (always validate)
✗ Don't use eval() or exec()
✗ Don't expose internal error details to frontend

## Security Rules
- Never commit .env files
- Never log sensitive data (passwords, tokens)
- Always sanitize log inputs (prevent injection)
- Validate event severity levels
- Rate limit API endpoints

## Known Edge Cases
- Handle malformed log entries gracefully
- Large log files (>100MB) need streaming
- WebSocket reconnection on network failure
- Alert fatigue (don't spam on repeated events)

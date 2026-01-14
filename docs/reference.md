# API & Data Reference

## Event Data Structure

```json
{
  "id": "uuid",
  "timestamp": "2025-01-15T10:30:00Z",
  "source": "firewall|ids|endpoint|network",
  "event_type": "auth_failure|port_scan|malware_detected|data_exfiltration",
  "severity": "critical|high|medium|low",
  "description": "Human readable summary",
  "raw_log": "Original log entry",
  "metadata": {
    "source_ip": "192.168.1.100",
    "dest_ip": "10.0.0.50",
    "user": "jdoe"
  },
  "status": "new|investigating|resolved",
  "assigned_to": "analyst_id",
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

## Severity Levels

| Level | Color | Description |
|-------|-------|-------------|
| **Critical** | Red | Immediate threat (active breach, ransomware) |
| **High** | Orange | Serious risk (multiple failed logins, port scanning) |
| **Medium** | Yellow | Potential issue (unusual traffic pattern) |
| **Low** | Blue | Informational (normal security event) |

## Alert Rule Format

```json
{
  "name": "Multiple Failed Logins",
  "condition": {
    "event_type": "auth_failure",
    "count": 5,
    "timeframe": "10m",
    "source": "any"
  },
  "action": "email",
  "severity": "high"
}
```

## API Endpoints

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List events (with filters) |
| GET | `/api/events/:id` | Get single event |
| POST | `/api/ingest` | Ingest new event |
| PATCH | `/api/events/:id/status` | Update event status |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get dashboard statistics |
| GET | `/api/dashboard/trends` | Get event trends |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts/rules` | List alert rules |
| POST | `/api/alerts/rules` | Create alert rule |
| DELETE | `/api/alerts/rules/:id` | Delete alert rule |

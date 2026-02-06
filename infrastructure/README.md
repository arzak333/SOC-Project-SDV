# Simulated Infrastructure

Simulated audioprothésiste site infrastructure for the SOC dashboard.

## Architecture

```
endpoint-1 ──┐
endpoint-2 ──┤── Wazuh Agents ──→ Wazuh Manager ──→ SOC Dashboard
GLPI ────────┘                         │
                                  Wazuh Dashboard
                                  (https://localhost:4443)
```

## Quick Start

### Prerequisites
- SOC dashboard running (`docker compose up -d` in root directory)
- `vm.max_map_count` set (required by Wazuh Indexer):
  ```bash
  sudo sysctl -w vm.max_map_count=262144
  ```

### 1. Generate SSL certificates
```bash
cd infrastructure/
docker compose -f generate-certs.yml run --rm generator
```

### 2. Start infrastructure
```bash
docker compose up -d
```

### 3. Verify
- Wazuh Dashboard: https://localhost:4443 (admin / SecretPassword)
- GLPI: http://localhost:8080
- SOC Dashboard: http://localhost:3000 (events should start appearing)

## Components

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| wazuh-manager | wazuh/wazuh-manager:4.14.2 | 1514, 55000 | SIEM manager |
| wazuh-indexer | wazuh/wazuh-indexer:4.14.2 | 9200 | Log indexing |
| wazuh-dashboard | wazuh/wazuh-dashboard:4.14.2 | 4443 | Wazuh web UI |
| endpoint-1 | custom (Ubuntu + Wazuh agent) | - | Simulated PC |
| endpoint-2 | custom (Ubuntu + Wazuh agent) | - | Simulated PC |
| glpi | diouxx/glpi | 8080 | CRM system |
| glpi-db | mariadb:10.11 | - | GLPI database |

## How It Works

1. **Endpoints** generate realistic security logs (failed logins, sudo, file changes, suspicious processes)
2. **Wazuh agents** on endpoints detect and forward events to **Wazuh Manager**
3. **Wazuh Manager** processes alerts and triggers the **custom-soc integration**
4. **Integration script** transforms Wazuh alerts to SOC format and POSTs to `/api/ingest`
5. **SOC Dashboard** displays events in real-time via WebSocket

## Credentials

| Service | Username | Password |
|---------|----------|----------|
| Wazuh Dashboard | admin | SecretPassword |
| Wazuh API | wazuh-wui | MyS3cr37P450r.*- |
| GLPI | glpi | glpi |
| GLPI DB | glpi | glpi_pass |

# SOC Externalisé - Réseau Audioprothésistes

Plateforme de démonstration d'un SOC (Security Operations Center) externalisé pour un réseau de 30 centres d'audioprothésistes en France.

## Projet M2 Mastère Cybersécurité - PSB

### Contexte

Ce projet répond au cahier des charges d'un client souhaitant centraliser la supervision de sécurité de son réseau de points de vente. La solution propose :

- Collecte multi-source (firewall, IDS, endpoints, AD, email, applications)
- Dashboard temps réel avec WebSocket
- Alertes personnalisables avec seuils
- Vue par site pour supervision multi-sites
- Génération de logs réalistes pour démonstration

## Architecture

```
                                              ┌──────────────────────────────┐
                                              │   INFRASTRUCTURE (infra/)     │
                                              │                              │
┌──────────────────────────────────────┐      │  endpoint-pc-01 ─┐           │
│         Frontend (React) :3000        │      │  endpoint-pc-02 ─┤→ Wazuh   │
│  Dashboard│Events│Alerts│Playbooks    │      │                  │  Agents   │
└─────────────────┬────────────────────┘      │                  ▼           │
                  │ WebSocket + REST           │           Wazuh Manager      │
┌─────────────────┴────────────────────┐      │            │         │       │
│         Backend (Flask) :5000         │◄─────│── webhook ─┘   Wazuh Dash.  │
│  /api/ingest│events│dashboard│alerts  │      │                 :4443       │
│  /api/endpoints│analysts│assets ──────│─────►│── GLPI :8080               │
└──┬──────────────┬──────────────┬─────┘      └──────────────────────────────┘
   │              │              │
PostgreSQL     Redis         Celery
(Events DB)  (Task Queue)  (Alert Engine)
```

## Stack Technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 18, TypeScript, Tailwind CSS, Recharts |
| Backend | Python 3.11, Flask, SQLAlchemy, Flask-SocketIO |
| Database | PostgreSQL 15 |
| Task Queue | Celery + Redis |
| SIEM | Wazuh 4.14.2 (Manager, Indexer, Dashboard) |
| Endpoints | Ubuntu 22.04 + Wazuh Agent (conteneurs simulés) |
| CRM / Assets | GLPI + MariaDB 10.11 |
| Conteneurisation | Docker, Docker Compose |

## Démarrage Rapide

### Prérequis

- Docker et Docker Compose
- Git

### Installation

```bash
# Cloner le projet
git clone <https://github.com/arzak333/SOC-Project-SDV.git>
cd: "SOC-Project-SDV"

# Démarrer tous les services
docker compose up -d

# Initialiser la base de données et créer les utilisateurs de démo
docker compose exec backend python -c "from app import create_app, db, init_demo_users; app = create_app(); app.app_context().push(); db.create_all(); init_demo_users()"
```

### Accès

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health**: http://localhost:5000/health

### Étape 2 : Déployer l'infrastructure (métriques réelles)

L'infrastructure Wazuh est nécessaire pour alimenter le dashboard avec de vrais événements de sécurité.

```bash
# Configurer le kernel pour Wazuh Indexer (OpenSearch)
sudo sysctl -w vm.max_map_count=262144

# Générer les certificats SSL (une seule fois)
cd infrastructure/
docker compose -f generate-certs.yml run --rm generator

# Démarrer toute l'infrastructure
docker compose up -d

# Revenir à la racine
cd ..
```

**Vérification :**

```bash
# Vérifier que les agents sont connectés
docker exec infrastructure-wazuh-manager-1 /var/ossec/bin/agent_control -l
# Attendu : endpoint-pc-01 et endpoint-pc-02 en status "Active"

# Vérifier que les événements arrivent dans le SOC
curl -s http://localhost:5000/api/dashboard/stats | python3 -m json.tool
# Attendu : total_events > 0, total_sites >= 2
```

Les événements commencent à apparaître dans le dashboard sous 1-2 minutes.

### Étape 3 (optionnel) : Configurer GLPI pour la gestion d'actifs

GLPI permet d'enrichir les événements avec les informations d'inventaire IT.

1. Accéder à GLPI : http://localhost:8080
2. Se connecter avec `glpi` / `glpi`
3. **Setup > General > API** :
   - Activer "Enable REST API" → **Yes**
   - Activer "Enable login with external token" → **Yes**
   - Cliquer sur **API clients** → ouvrir le client par défaut
   - Mettre **Active** → Yes, noter le **App-Token**
4. **Administration > Users > glpi > Remote access keys** :
   - Régénérer le token API, noter le **User Token**
5. Configurer les tokens dans le SOC :
   ```bash
   # Ajouter dans un fichier .env ou directement dans docker-compose.yml
   GLPI_APP_TOKEN=<votre_app_token>
   GLPI_USER_TOKEN=<votre_user_token>

   # Redémarrer le backend
   docker compose restart backend
   ```
6. Vérifier : `curl -s http://localhost:5000/api/assets`

---

## Accès aux Interfaces

| Interface | URL | Identifiants |
|-----------|-----|-------------|
| SOC Dashboard | http://localhost:3000 | admin / admin123 |
| Backend API | http://localhost:5000 | - |
| Wazuh Dashboard | https://localhost:4443 | admin / SecretPassword |
| GLPI | http://localhost:8080 | glpi / glpi |

### Identifiants SOC

| Utilisateur | Mot de passe | Rôle |
|-------------|--------------|------|
| admin | admin123 | Administrateur |
| analyst | analyst123 | Analyste SOC |
| supervisor | supervisor123 | Superviseur |

### Générer des logs de test

```bash
# Installation des dépendances du script
pip install -r scripts/requirements.txt

# Générer des événements en continu (1 toutes les 2 secondes)
python3 scripts/log_generator.py

# Générer un scénario d'attaque complet
python3 scripts/log_generator.py --attack

# Mode burst (simulation d'attaque avec pics)
python3 scripts/log_generator.py --burst --interval 1

# Backfill: générer des données historiques (1000 événements sur 7 jours)
python3 scripts/log_generator.py --backfill

# Backfill personnalisé (2000 événements sur 30 jours)
python3 scripts/log_generator.py --backfill --days 30 --count 2000
```

## Développement Local (sans Docker)

### Backend

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou: venv\Scripts\activate  # Windows

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
cp ../.env.example .env

# Démarrer le serveur
python run.py
```

### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

## API Endpoints

### Events

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/events` | Liste des événements (avec filtres) |
| GET | `/api/events/:id` | Détail d'un événement |
| POST | `/api/ingest` | Ingérer un nouvel événement |
| PATCH | `/api/events/:id/status` | Modifier le statut |

### Dashboard

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/dashboard/stats` | Statistiques globales |
| GET | `/api/dashboard/trends?timeframe=24h` | Tendances (5m, 15m, 30m, 1h, 6h, 24h, 7d, 30d) |
| GET | `/api/dashboard/sites` | Résumé par site |

### Alert Rules

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/alerts/rules` | Liste des règles |
| POST | `/api/alerts/rules` | Créer une règle |
| PATCH | `/api/alerts/rules/:id` | Modifier une règle |
| DELETE | `/api/alerts/rules/:id` | Supprimer une règle |

### Endpoints, Analysts & Assets

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/endpoints` | Endpoints monitorés (données réelles depuis la DB) |
| GET | `/api/analysts` | Liste des analystes (depuis le modèle User) |
| GET | `/api/assets` | Ordinateurs GLPI |
| GET | `/api/assets/:name` | Recherche asset par nom d'hôte |

## Structure des Événements

```json
{
  "source": "firewall|ids|endpoint|network|email|active_directory|application",
  "event_type": "auth_failure|port_scan|malware_detected|...",
  "severity": "critical|high|medium|low",
  "description": "Description de l'événement",
  "raw_log": "Log brut original",
  "metadata": {"source_ip": "...", "user": "..."},
  "site_id": "AUDIO_001"
}
```

## Niveaux de Sévérité

| Niveau | Couleur | Description |
|--------|---------|-------------|
| Critical | Rouge | Menace immédiate (breach active, ransomware) |
| High | Orange | Risque sérieux (multiples échecs auth, scan) |
| Medium | Jaune | Problème potentiel (trafic anormal) |
| Low | Bleu | Informationnel (événement normal) |

## Livrables du Projet

- [x] Analyse initiale
- [x] Document Architecture Technique
- [x] Démonstrateur opérationnel
- [x] Dashboards & alertes configurés
- [x] Playbooks / procédures
- [x] Rapport technique complet
- [ ] Guide de déploiement & d'utilisation
- [ ] Vidéo de démonstration

## Équipe

- **Étudiant 1** : Ingénieur SIEM (déploiement, collecte, intégration)
- **Étudiant 2** : Analyste SOC (détection, dashboards, playbooks)
- **Étudiant 3** : Coordinateur (supervision, démo, documentation)

## Licence

Projet académique - PSB Paris School of Business - M2 Cybersécurité 2025

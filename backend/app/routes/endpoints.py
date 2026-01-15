from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import random

endpoints_bp = Blueprint('endpoints', __name__)

# French audioprothesiste centers
FRENCH_CENTERS = [
    {'name': 'AudioPro Paris Opera', 'location': 'Paris', 'region': 'Ile-de-France'},
    {'name': 'AudioPro Lyon Part-Dieu', 'location': 'Lyon', 'region': 'Auvergne-Rhone-Alpes'},
    {'name': 'AudioPro Marseille Vieux-Port', 'location': 'Marseille', 'region': 'Provence-Alpes-Cote d\'Azur'},
    {'name': 'AudioPro Toulouse Capitole', 'location': 'Toulouse', 'region': 'Occitanie'},
    {'name': 'AudioPro Nice Promenade', 'location': 'Nice', 'region': 'Provence-Alpes-Cote d\'Azur'},
    {'name': 'AudioPro Nantes Graslin', 'location': 'Nantes', 'region': 'Pays de la Loire'},
    {'name': 'AudioPro Strasbourg Centre', 'location': 'Strasbourg', 'region': 'Grand Est'},
    {'name': 'AudioPro Montpellier Comedie', 'location': 'Montpellier', 'region': 'Occitanie'},
    {'name': 'AudioPro Bordeaux Saint-Jean', 'location': 'Bordeaux', 'region': 'Nouvelle-Aquitaine'},
    {'name': 'AudioPro Lille Flandres', 'location': 'Lille', 'region': 'Hauts-de-France'},
    {'name': 'AudioPro Rennes Republique', 'location': 'Rennes', 'region': 'Bretagne'},
    {'name': 'AudioPro Reims Cathedrale', 'location': 'Reims', 'region': 'Grand Est'},
    {'name': 'AudioPro Le Havre Plage', 'location': 'Le Havre', 'region': 'Normandie'},
    {'name': 'AudioPro Saint-Etienne Centre', 'location': 'Saint-Etienne', 'region': 'Auvergne-Rhone-Alpes'},
    {'name': 'AudioPro Toulon Port', 'location': 'Toulon', 'region': 'Provence-Alpes-Cote d\'Azur'},
    {'name': 'AudioPro Grenoble Bastille', 'location': 'Grenoble', 'region': 'Auvergne-Rhone-Alpes'},
    {'name': 'AudioPro Dijon Centre', 'location': 'Dijon', 'region': 'Bourgogne-Franche-Comte'},
    {'name': 'AudioPro Angers Centre', 'location': 'Angers', 'region': 'Pays de la Loire'},
    {'name': 'AudioPro Nimes Arenes', 'location': 'Nimes', 'region': 'Occitanie'},
    {'name': 'AudioPro Clermont-Ferrand Place de Jaude', 'location': 'Clermont-Ferrand', 'region': 'Auvergne-Rhone-Alpes'},
    {'name': 'AudioPro Le Mans Jacobins', 'location': 'Le Mans', 'region': 'Pays de la Loire'},
    {'name': 'AudioPro Aix-en-Provence Rotonde', 'location': 'Aix-en-Provence', 'region': 'Provence-Alpes-Cote d\'Azur'},
    {'name': 'AudioPro Brest Siam', 'location': 'Brest', 'region': 'Bretagne'},
    {'name': 'AudioPro Tours Centre', 'location': 'Tours', 'region': 'Centre-Val de Loire'},
    {'name': 'AudioPro Amiens Centre', 'location': 'Amiens', 'region': 'Hauts-de-France'},
    {'name': 'AudioPro Limoges Centre', 'location': 'Limoges', 'region': 'Nouvelle-Aquitaine'},
    {'name': 'AudioPro Perpignan Centre', 'location': 'Perpignan', 'region': 'Occitanie'},
    {'name': 'AudioPro Metz Centre', 'location': 'Metz', 'region': 'Grand Est'},
    {'name': 'AudioPro Besancon Centre', 'location': 'Besancon', 'region': 'Bourgogne-Franche-Comte'},
    {'name': 'AudioPro Orleans Centre', 'location': 'Orleans', 'region': 'Centre-Val de Loire'},
]


def generate_endpoints():
    """Generate mock endpoint data for demo."""
    endpoints = []
    statuses = ['online', 'online', 'online', 'online', 'online', 'degraded', 'offline']

    for i, center in enumerate(FRENCH_CENTERS):
        status = random.choice(statuses)

        if status == 'online':
            health = random.randint(85, 100)
            critical_alerts = 0
        elif status == 'degraded':
            health = random.randint(40, 70)
            critical_alerts = random.randint(1, 3)
        else:  # offline
            health = 0
            critical_alerts = random.randint(1, 5)

        endpoint = {
            'id': f'endpoint-{i + 1}',
            'site_id': f'AUDIO_{str(i + 1).zfill(3)}',
            'name': center['name'],
            'location': center['location'],
            'region': center['region'],
            'ip_address': f'192.168.{i + 1}.1',
            'status': status,
            'health': health,
            'last_seen': (datetime.utcnow() - timedelta(minutes=random.randint(0, 60))).isoformat(),
            'event_count_24h': random.randint(50, 500),
            'critical_alerts': critical_alerts,
            'type': 'center',
        }
        endpoints.append(endpoint)

    return endpoints


@endpoints_bp.route('/endpoints', methods=['GET'])
def list_endpoints():
    """List all monitored endpoints with optional filtering."""
    status = request.args.get('status')
    limit = request.args.get('limit', type=int)

    endpoints = generate_endpoints()

    # Filter by status if specified
    if status:
        statuses = [s.strip() for s in status.split(',')]
        endpoints = [e for e in endpoints if e['status'] in statuses]

    # Apply limit
    if limit:
        endpoints = endpoints[:limit]

    return jsonify({
        'endpoints': endpoints,
        'total': len(endpoints),
    })


@endpoints_bp.route('/endpoints/<endpoint_id>', methods=['GET'])
def get_endpoint(endpoint_id):
    """Get a single endpoint by ID."""
    endpoints = generate_endpoints()

    for endpoint in endpoints:
        if endpoint['id'] == endpoint_id:
            return jsonify(endpoint)

    return jsonify({'error': 'Endpoint not found'}), 404


@endpoints_bp.route('/analysts', methods=['GET'])
def list_analysts():
    """List available analysts for assignment."""
    analysts = [
        {'id': '1', 'name': 'Jean Dupont', 'email': 'j.dupont@audiopro.fr', 'role': 'analyst'},
        {'id': '2', 'name': 'Marie Martin', 'email': 'm.martin@audiopro.fr', 'role': 'analyst'},
        {'id': '3', 'name': 'Pierre Bernard', 'email': 'p.bernard@audiopro.fr', 'role': 'supervisor'},
        {'id': '4', 'name': 'Sophie Durand', 'email': 's.durand@audiopro.fr', 'role': 'admin'},
        {'id': '5', 'name': 'Lucas Thomas', 'email': 'l.thomas@audiopro.fr', 'role': 'analyst'},
    ]
    return jsonify({'analysts': analysts})

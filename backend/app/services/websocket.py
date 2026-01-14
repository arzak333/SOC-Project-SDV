from flask_socketio import emit, join_room, leave_room
from app import socketio

# Track connected clients
connected_clients = set()


def register_socket_handlers():
    """Register WebSocket event handlers."""
    pass  # Handlers are registered via decorators below


@socketio.on('connect')
def handle_connect():
    """Handle client connection."""
    from flask import request
    client_id = request.sid
    connected_clients.add(client_id)
    emit('connected', {'client_id': client_id, 'total_clients': len(connected_clients)})
    print(f"Client connected: {client_id}. Total: {len(connected_clients)}")


@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection."""
    from flask import request
    client_id = request.sid
    connected_clients.discard(client_id)
    print(f"Client disconnected: {client_id}. Total: {len(connected_clients)}")


@socketio.on('subscribe_site')
def handle_subscribe_site(data):
    """Subscribe to events from a specific site."""
    site_id = data.get('site_id')
    if site_id:
        join_room(f'site_{site_id}')
        emit('subscribed', {'site_id': site_id})


@socketio.on('unsubscribe_site')
def handle_unsubscribe_site(data):
    """Unsubscribe from a specific site."""
    site_id = data.get('site_id')
    if site_id:
        leave_room(f'site_{site_id}')
        emit('unsubscribed', {'site_id': site_id})


@socketio.on('subscribe_severity')
def handle_subscribe_severity(data):
    """Subscribe to events of a specific severity or higher."""
    severity = data.get('severity')
    if severity in ('critical', 'high', 'medium', 'low'):
        join_room(f'severity_{severity}')
        emit('subscribed', {'severity': severity})


def broadcast_event(event_dict: dict):
    """Broadcast a new event to all relevant clients."""
    # Broadcast to all clients
    socketio.emit('new_event', event_dict)

    # Broadcast to site-specific room
    if site_id := event_dict.get('site_id'):
        socketio.emit('new_event', event_dict, room=f'site_{site_id}')

    # Broadcast to severity-specific rooms
    severity = event_dict.get('severity')
    if severity in ('critical', 'high'):
        socketio.emit('alert', event_dict, room='severity_critical')
        socketio.emit('alert', event_dict, room='severity_high')


def broadcast_alert(alert_data: dict):
    """Broadcast an alert to all clients."""
    socketio.emit('alert', alert_data)

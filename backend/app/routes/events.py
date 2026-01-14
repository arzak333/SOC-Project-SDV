from flask import Blueprint, request, jsonify
from sqlalchemy import desc
from app import db
from app.models import Event, EventStatus, EventSeverity, EventSource

events_bp = Blueprint('events', __name__)


@events_bp.route('/events', methods=['GET'])
def list_events():
    """List events with filtering and pagination."""
    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    per_page = min(per_page, 100)  # Max 100 per page

    # Build query
    query = Event.query

    # Filters
    if status := request.args.get('status'):
        try:
            query = query.filter(Event.status == EventStatus(status))
        except ValueError:
            pass

    if severity := request.args.get('severity'):
        try:
            query = query.filter(Event.severity == EventSeverity(severity))
        except ValueError:
            pass

    if source := request.args.get('source'):
        try:
            query = query.filter(Event.source == EventSource(source))
        except ValueError:
            pass

    if event_type := request.args.get('event_type'):
        query = query.filter(Event.event_type == event_type)

    if site_id := request.args.get('site_id'):
        query = query.filter(Event.site_id == site_id)

    if search := request.args.get('search'):
        query = query.filter(Event.description.ilike(f'%{search}%'))

    # Sort by timestamp descending (most recent first)
    query = query.order_by(desc(Event.timestamp))

    # Paginate
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'events': [e.to_dict() for e in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    })


@events_bp.route('/events/<uuid:event_id>', methods=['GET'])
def get_event(event_id):
    """Get a single event by ID."""
    event = Event.query.get_or_404(event_id)
    return jsonify(event.to_dict())


@events_bp.route('/events/<uuid:event_id>/status', methods=['PATCH'])
def update_event_status(event_id):
    """Update event status and assignment."""
    event = Event.query.get_or_404(event_id)
    data = request.get_json()

    if 'status' in data:
        try:
            event.status = EventStatus(data['status'])
        except ValueError:
            return jsonify({'error': f"Invalid status: {data['status']}"}), 400

    if 'assigned_to' in data:
        event.assigned_to = data['assigned_to']

    db.session.commit()

    # Emit WebSocket event for real-time update
    from app import socketio
    socketio.emit('event_updated', event.to_dict())

    return jsonify(event.to_dict())


@events_bp.route('/events/<uuid:event_id>', methods=['DELETE'])
def delete_event(event_id):
    """Delete an event (admin only in production)."""
    event = Event.query.get_or_404(event_id)
    db.session.delete(event)
    db.session.commit()
    return '', 204

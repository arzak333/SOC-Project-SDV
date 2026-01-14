from flask import Blueprint, request, jsonify
from app import db
from app.models import AlertRule, AlertAction

alerts_bp = Blueprint('alerts', __name__)


@alerts_bp.route('/alerts/rules', methods=['GET'])
def list_rules():
    """List all alert rules."""
    rules = AlertRule.query.order_by(AlertRule.created_at.desc()).all()
    return jsonify({
        'rules': [r.to_dict() for r in rules],
        'total': len(rules)
    })


@alerts_bp.route('/alerts/rules', methods=['POST'])
def create_rule():
    """
    Create a new alert rule.

    Expected payload:
    {
        "name": "Multiple Failed Logins",
        "description": "Alert when 5+ auth failures in 10 minutes",
        "condition": {
            "event_type": "auth_failure",
            "count": 5,
            "timeframe": "10m",
            "source": "any"
        },
        "action": "email",
        "action_config": {"recipients": ["admin@example.com"]},
        "severity": "high"
    }
    """
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No JSON payload provided'}), 400

    # Validate required fields
    required = ['name', 'condition']
    missing = [f for f in required if f not in data]
    if missing:
        return jsonify({'error': f'Missing required fields: {missing}'}), 400

    # Validate action
    action = data.get('action', 'log')
    try:
        action_enum = AlertAction(action)
    except ValueError:
        return jsonify({
            'error': f"Invalid action: {action}. Must be one of: {[a.value for a in AlertAction]}"
        }), 400

    rule = AlertRule(
        name=data['name'],
        description=data.get('description'),
        condition=data['condition'],
        action=action_enum,
        action_config=data.get('action_config', {}),
        severity=data.get('severity', 'high'),
        enabled=data.get('enabled', True)
    )

    db.session.add(rule)
    db.session.commit()

    return jsonify(rule.to_dict()), 201


@alerts_bp.route('/alerts/rules/<uuid:rule_id>', methods=['GET'])
def get_rule(rule_id):
    """Get a single alert rule."""
    rule = AlertRule.query.get_or_404(rule_id)
    return jsonify(rule.to_dict())


@alerts_bp.route('/alerts/rules/<uuid:rule_id>', methods=['PATCH'])
def update_rule(rule_id):
    """Update an alert rule."""
    rule = AlertRule.query.get_or_404(rule_id)
    data = request.get_json()

    if 'name' in data:
        rule.name = data['name']
    if 'description' in data:
        rule.description = data['description']
    if 'condition' in data:
        rule.condition = data['condition']
    if 'action' in data:
        try:
            rule.action = AlertAction(data['action'])
        except ValueError:
            return jsonify({'error': f"Invalid action: {data['action']}"}), 400
    if 'action_config' in data:
        rule.action_config = data['action_config']
    if 'severity' in data:
        rule.severity = data['severity']
    if 'enabled' in data:
        rule.enabled = data['enabled']

    db.session.commit()
    return jsonify(rule.to_dict())


@alerts_bp.route('/alerts/rules/<uuid:rule_id>', methods=['DELETE'])
def delete_rule(rule_id):
    """Delete an alert rule."""
    rule = AlertRule.query.get_or_404(rule_id)
    db.session.delete(rule)
    db.session.commit()
    return '', 204


@alerts_bp.route('/alerts/rules/<uuid:rule_id>/toggle', methods=['POST'])
def toggle_rule(rule_id):
    """Enable or disable an alert rule."""
    rule = AlertRule.query.get_or_404(rule_id)
    rule.enabled = not rule.enabled
    db.session.commit()
    return jsonify(rule.to_dict())

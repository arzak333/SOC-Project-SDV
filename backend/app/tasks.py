from celery_app import celery
from app import create_app, db, socketio
from app.models import AlertRule, AlertAction
from app.services.alert_engine import AlertEngine
from app.services.notifications import send_email_alert, send_webhook_alert, format_alert_message

# Create app context for tasks
app = create_app()


@celery.task
def evaluate_alerts():
    """
    Periodic task to evaluate all alert rules.
    Runs every ALERT_CHECK_INTERVAL seconds.
    """
    with app.app_context():
        engine = AlertEngine()
        triggered = engine.evaluate_all_rules()

        for alert in triggered:
            rule = alert['rule']
            process_alert.delay(rule)

        return {'triggered_count': len(triggered)}


@celery.task
def process_alert(rule_dict: dict):
    """Process a triggered alert - send notifications."""
    with app.app_context():
        rule_id = rule_dict['id']
        rule = AlertRule.query.get(rule_id)

        if not rule:
            return {'error': 'Rule not found'}

        message = format_alert_message(rule_dict)

        # Emit WebSocket alert
        socketio.emit('alert', {
            'type': 'rule_triggered',
            'rule': rule_dict,
            'message': message
        })

        # Send notification based on action type
        if rule.action == AlertAction.EMAIL:
            recipients = rule.action_config.get('recipients', [])
            if recipients:
                send_email_alert(
                    recipients=recipients,
                    subject=rule.name,
                    body=message
                )

        elif rule.action == AlertAction.WEBHOOK:
            url = rule.action_config.get('url')
            if url:
                send_webhook_alert(url, {
                    'alert': rule_dict,
                    'message': message
                })

        return {'status': 'processed', 'rule': rule.name}


@celery.task
def cleanup_old_events(days: int = 90):
    """
    Cleanup task to remove old resolved events.
    Keeps events for specified number of days.
    """
    from datetime import datetime, timedelta
    from app.models import Event, EventStatus

    with app.app_context():
        cutoff = datetime.utcnow() - timedelta(days=days)

        deleted = Event.query.filter(
            Event.status == EventStatus.RESOLVED,
            Event.updated_at < cutoff
        ).delete()

        db.session.commit()

        return {'deleted_count': deleted}

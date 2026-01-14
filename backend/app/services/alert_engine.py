import re
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy import func
from app import db
from app.models import Event, AlertRule, EventSeverity


class AlertEngine:
    """
    Engine for evaluating alert rules against incoming events.
    Supports threshold-based and pattern-based rules.
    """

    def __init__(self):
        self.timeframe_pattern = re.compile(r'^(\d+)([smhd])$')

    def parse_timeframe(self, timeframe: str) -> Optional[timedelta]:
        """Parse timeframe string (e.g., '10m', '1h', '24h') to timedelta."""
        match = self.timeframe_pattern.match(timeframe)
        if not match:
            return None

        value = int(match.group(1))
        unit = match.group(2)

        if unit == 's':
            return timedelta(seconds=value)
        elif unit == 'm':
            return timedelta(minutes=value)
        elif unit == 'h':
            return timedelta(hours=value)
        elif unit == 'd':
            return timedelta(days=value)
        return None

    def evaluate_rule(self, rule: AlertRule) -> bool:
        """
        Evaluate a single alert rule.
        Returns True if the rule condition is met.
        """
        condition = rule.condition
        if not condition:
            return False

        # Build query based on condition
        query = Event.query

        # Filter by event type
        if event_type := condition.get('event_type'):
            if event_type != 'any':
                query = query.filter(Event.event_type == event_type)

        # Filter by source
        if source := condition.get('source'):
            if source != 'any':
                from app.models import EventSource
                try:
                    query = query.filter(Event.source == EventSource(source))
                except ValueError:
                    pass

        # Filter by severity
        if severity := condition.get('severity'):
            if severity != 'any':
                try:
                    query = query.filter(Event.severity == EventSeverity(severity))
                except ValueError:
                    pass

        # Filter by timeframe
        if timeframe := condition.get('timeframe'):
            delta = self.parse_timeframe(timeframe)
            if delta:
                since = datetime.utcnow() - delta
                query = query.filter(Event.timestamp >= since)

        # Filter by site
        if site_id := condition.get('site_id'):
            if site_id != 'any':
                query = query.filter(Event.site_id == site_id)

        # Check threshold
        threshold = condition.get('count', 1)
        count = query.count()

        return count >= threshold

    def evaluate_all_rules(self) -> list:
        """
        Evaluate all enabled alert rules.
        Returns list of triggered rules with event details.
        """
        triggered = []
        rules = AlertRule.query.filter_by(enabled=True).all()

        for rule in rules:
            if self.evaluate_rule(rule):
                triggered.append({
                    'rule': rule.to_dict(),
                    'triggered_at': datetime.utcnow().isoformat()
                })

                # Update rule trigger stats
                rule.last_triggered = datetime.utcnow()
                rule.trigger_count = (rule.trigger_count or 0) + 1

        if triggered:
            db.session.commit()

        return triggered

    def check_event_against_rules(self, event: Event) -> list:
        """
        Check a single new event against all rules.
        Useful for immediate alerting on ingestion.
        """
        triggered = []
        rules = AlertRule.query.filter_by(enabled=True).all()

        for rule in rules:
            condition = rule.condition

            # Check if event matches rule criteria
            if event_type := condition.get('event_type'):
                if event_type != 'any' and event.event_type != event_type:
                    continue

            if source := condition.get('source'):
                if source != 'any' and event.source.value != source:
                    continue

            if severity := condition.get('severity'):
                if severity != 'any' and event.severity.value != severity:
                    continue

            if site_id := condition.get('site_id'):
                if site_id != 'any' and event.site_id != site_id:
                    continue

            # If we get here, event matches rule criteria
            # Now check if threshold is met
            if self.evaluate_rule(rule):
                triggered.append(rule)

        return triggered

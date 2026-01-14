import smtplib
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List
from flask import current_app


def send_email_alert(recipients: List[str], subject: str, body: str) -> bool:
    """Send email alert notification."""
    try:
        smtp_host = current_app.config['SMTP_HOST']
        smtp_port = current_app.config['SMTP_PORT']
        smtp_user = current_app.config['SMTP_USER']
        smtp_password = current_app.config['SMTP_PASSWORD']

        if not smtp_user or not smtp_password:
            current_app.logger.warning("SMTP not configured, skipping email alert")
            return False

        msg = MIMEMultipart()
        msg['From'] = smtp_user
        msg['To'] = ', '.join(recipients)
        msg['Subject'] = f"[SOC Alert] {subject}"

        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)

        return True

    except Exception as e:
        current_app.logger.error(f"Failed to send email alert: {e}")
        return False


def send_webhook_alert(url: str, payload: dict) -> bool:
    """Send webhook alert notification."""
    try:
        response = requests.post(
            url,
            json=payload,
            timeout=10,
            headers={'Content-Type': 'application/json'}
        )
        response.raise_for_status()
        return True

    except Exception as e:
        current_app.logger.error(f"Failed to send webhook alert: {e}")
        return False


def format_alert_message(rule: dict, events: list = None) -> str:
    """Format alert message for notifications."""
    lines = [
        f"Alert Rule Triggered: {rule['name']}",
        f"Severity: {rule['severity'].upper()}",
        f"Description: {rule.get('description', 'N/A')}",
        f"Condition: {rule['condition']}",
        "",
        "---",
        "SOC Dashboard - Audioprothésistes Network"
    ]
    return "\n".join(lines)

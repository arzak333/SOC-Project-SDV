from app import create_app, db
from app.models import Event
from sqlalchemy import func, case
from datetime import datetime, timedelta

app = create_app()
with app.app_context():
    days = 30
    since = datetime.utcnow() - timedelta(days=days)
    since = since.replace(hour=0, minute=0, second=0, microsecond=0)
    
    results = (
        db.session.query(
            func.date_trunc('day', Event.timestamp).label('date'),
            func.extract('hour', Event.timestamp).label('hour'),
            func.count(Event.id).label('count'),
            func.sum(case((Event.severity == 'critical', 1), else_=0)).label('critical'),
            func.sum(case((Event.severity == 'high', 1), else_=0)).label('high'),
            func.sum(case((Event.severity == 'medium', 1), else_=0)).label('medium'),
            func.sum(case((Event.severity == 'low', 1), else_=0)).label('low')
        )
        .filter(Event.timestamp >= since)
        .group_by('date', 'hour')
        .all()
    )
    
    print(f"Results: {len(results)}")
    if results:
        print(results[0])

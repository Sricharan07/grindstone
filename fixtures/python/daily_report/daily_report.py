from datetime import datetime, timedelta


def event_ids_for_utc_day(events: list[dict], day: datetime) -> list[int]:
    """Return IDs whose UTC timestamps fall within the requested UTC day."""
    start = datetime(day.year, day.month, day.day)
    end = start + timedelta(days=1)
    return [event["id"] for event in events if start <= event["created_at"] < end]

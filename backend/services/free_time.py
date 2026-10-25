from datetime import datetime
from database import get_db_connection

DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
WAKE = '07:00'
SLEEP = '22:00'
MIN_GAP_MINUTES = 30


def _to_min(t):
    h, m = t.split(':')
    return int(h) * 60 + int(m)


def _to_str(minutes):
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def today_name():
    return DAY_ORDER[datetime.now().weekday()]


def get_slots_for_day(user_id, day):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT start_time, end_time, subject FROM schedule_slots "
            "WHERE user_id = ? AND day = ? ORDER BY start_time",
            (user_id, day)
        )
        return [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()


def find_free_gaps(slots, wake=WAKE, sleep=SLEEP, min_minutes=MIN_GAP_MINUTES):
    """Return the free gaps between classes, from wake time to sleep time."""
    busy = sorted(
        (_to_min(s['start_time']), _to_min(s['end_time'])) for s in slots
    )

    merged = []
    for start, end in busy:
        if end <= start:
            continue
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])

    day_end = _to_min(sleep)
    cursor = _to_min(wake)
    gaps = []

    for start, end in merged:
        gap_end = min(start, day_end)
        if gap_end - cursor >= min_minutes:
            gaps.append({'start': _to_str(cursor), 'end': _to_str(gap_end),
                         'minutes': gap_end - cursor})
        cursor = max(cursor, end)

    if day_end - cursor >= min_minutes:
        gaps.append({'start': _to_str(cursor), 'end': _to_str(day_end),
                     'minutes': day_end - cursor})
    return gaps


def get_day_overview(user_id, day=None):
    day = day or today_name()
    slots = get_slots_for_day(user_id, day)
    gaps = find_free_gaps(slots)
    return {
        'day': day,
        'classes': slots,
        'free': gaps,
        'total_free_minutes': sum(g['minutes'] for g in gaps),
    }
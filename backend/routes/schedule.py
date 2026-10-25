from flask import Blueprint, request, jsonify, session
from auth import login_required
from database import get_db_connection
import os
import re
import uuid
from werkzeug.utils import secure_filename
from pathlib import Path

bp = Blueprint('schedule', __name__, url_prefix='/api/schedule')
BASE_DIR = Path(__file__).resolve().parent.parent.parent
UPLOAD_FOLDER = BASE_DIR / 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

IMAGE_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tif', 'tiff'}
ALLOWED_EXTENSIONS = IMAGE_EXTENSIONS | {'pdf', 'txt'}

DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
TIME_RE = re.compile(r'^([01]\d|2[0-3]):[0-5]\d$')
MAX_SLOTS = 200


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def detect_file_type(head):
    """Identify the real file type from its first bytes, not from its name."""
    if head.startswith(b'%PDF'):
        return 'pdf'
    if head.startswith(b'\x89PNG\r\n\x1a\n'):
        return 'png'
    if head.startswith(b'\xff\xd8\xff'):
        return 'jpg'
    if head.startswith((b'GIF87a', b'GIF89a')):
        return 'gif'
    if head[:4] == b'RIFF' and head[8:12] == b'WEBP':
        return 'webp'
    if head.startswith(b'BM'):
        return 'bmp'
    if head.startswith((b'II*\x00', b'MM\x00*')):
        return 'tiff'
    return None


def clean_slots(items):
    """Validate slots coming from the browser."""
    slots = []
    if not isinstance(items, list):
        return slots
    for item in items[:MAX_SLOTS]:
        if not isinstance(item, dict):
            continue
        day = str(item.get('day', '')).strip().title()
        start = str(item.get('start', '')).strip()
        end = str(item.get('end', '')).strip()
        subject = str(item.get('subject', '')).strip()[:80]
        if day in DAY_ORDER and TIME_RE.match(start) and TIME_RE.match(end) and subject:
            slots.append((day, start, end, subject))
    return slots


@bp.route('/upload', methods=['POST'])
@login_required
def upload():
    user_id = session['user_id']
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    if not allowed_file(file.filename):
        return jsonify({
            'error': 'Invalid file type. Use PDF, PNG, JPG, JPEG, WEBP, GIF, BMP, TIFF or TXT.'
        }), 400

    ext = file.filename.rsplit('.', 1)[1].lower()

    head = file.stream.read(16)
    file.stream.seek(0)
    real_ext = detect_file_type(head)
    if real_ext is None:
        if ext == 'txt' and b'\x00' not in head:
            real_ext = 'txt'
        else:
            return jsonify({
                'error': "This doesn't look like a valid PDF, image or text file."
            }), 400

    stem = file.filename.rsplit('.', 1)[0]
    safe_stem = secure_filename(stem) or 'file'
    stored_name = f"{user_id}_{uuid.uuid4().hex[:8]}_{safe_stem}.{real_ext}"
    filepath = UPLOAD_FOLDER / stored_name

    try:
        file.save(str(filepath))
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO schedules (user_id, filename, parsed_content) VALUES (?, ?, ?)",
                (user_id, stored_name, '')
            )
            schedule_id = cur.lastrowid
            conn.commit()
        finally:
            conn.close()
    except Exception as e:
        if filepath.exists():
            filepath.unlink()
        print(f"Schedule upload error: {e}")
        return jsonify({'error': 'Could not save the file. Please try again.'}), 500

    # Read the file, then ask the AI to turn the text into schedule slots
    slots = []
    warning = None
    try:
        from services.schedule_parser import extract_text
        from services.schedule_structurer import structure_schedule

        text = extract_text(str(filepath), real_ext)
        if not text.strip():
            warning = "I couldn't read any text from this file. You can add the classes manually below."
        else:
            conn = get_db_connection()
            try:
                conn.execute("UPDATE schedules SET parsed_content = ? WHERE id = ?",
                             (text[:5000], schedule_id))
                conn.commit()
            finally:
                conn.close()
                slots = structure_schedule(text)
            if slots:
                conn = get_db_connection()
                try:
                    conn.executemany(
                        "INSERT INTO schedule_slots (user_id, schedule_id, day, start_time, end_time, subject) "
                        "VALUES (?, ?, ?, ?, ?, ?)",
                        [(user_id, schedule_id, s['day'], s['start'], s['end'], s['subject']) for s in slots]
                    )
                    conn.commit()
                finally:
                    conn.close()
            else:
                warning = "I read the file but couldn't find any classes. You can add them manually below."
    except Exception as e:
        print(f"Schedule parsing error: {type(e).__name__}: {e}")
        warning = "The file was saved, but I couldn't read it automatically. You can add the classes manually below."

    return jsonify({
        'success': True,
        'schedule_id': schedule_id,
        'filename': f"{safe_stem}.{real_ext}",
        'slots': slots,
        'warning': warning
    })


@bp.route('/slots/save', methods=['POST'])
@login_required
def save_slots():
    user_id = session['user_id']
    data = request.get_json(silent=True) or {}
    schedule_id = data.get('schedule_id')
    slots = clean_slots(data.get('slots'))

    if not slots:
        return jsonify({'error': 'No valid classes to save.'}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        if schedule_id is not None:
            cur.execute("SELECT id FROM schedules WHERE id = ? AND user_id = ?",
                        (schedule_id, user_id))
            if not cur.fetchone():
                return jsonify({'error': 'Schedule not found.'}), 404
            cur.execute("DELETE FROM schedule_slots WHERE schedule_id = ? AND user_id = ?",
                        (schedule_id, user_id))
        cur.executemany(
            "INSERT INTO schedule_slots (user_id, schedule_id, day, start_time, end_time, subject) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            [(user_id, schedule_id, d, s, e, subj) for d, s, e, subj in slots]
        )
        conn.commit()
    finally:
        conn.close()
    return jsonify({'success': True, 'saved': len(slots)})


@bp.route('/slots', methods=['GET'])
@login_required
def list_slots():
    user_id = session['user_id']
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, schedule_id, day, start_time, end_time, subject "
            "FROM schedule_slots WHERE user_id = ?", (user_id,)
        )
        rows = [dict(r) for r in cur.fetchall()]
    finally:
        conn.close()
    rows.sort(key=lambda r: (DAY_ORDER.index(r['day']) if r['day'] in DAY_ORDER else 9,
                             r['start_time']))
    return jsonify(rows)


@bp.route('/manual', methods=['POST'])
@login_required
def manual():
    user_id = session['user_id']
    data = request.get_json(silent=True) or {}
    content = str(data.get('content', '')).strip()
    if not content:
        return jsonify({'error': 'Schedule text is empty'}), 400
    if len(content) > 5000:
        return jsonify({'error': 'Schedule text is too long (max 5000 characters)'}), 400
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("INSERT INTO schedules (user_id, filename, parsed_content) VALUES (?, ?, ?)",
                    (user_id, 'manual.txt', content))
        conn.commit()
    finally:
        conn.close()
    return jsonify({'success': True})


@bp.route('/<int:schedule_id>', methods=['DELETE'])
@login_required
def delete_schedule(schedule_id):
    user_id = session['user_id']
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT filename FROM schedules WHERE id = ? AND user_id = ?",
                    (schedule_id, user_id))
        row = cur.fetchone()
        if row and row['filename'].startswith(f"{user_id}_"):
            path = (UPLOAD_FOLDER / row['filename']).resolve()
            if path.parent == UPLOAD_FOLDER.resolve() and path.exists():
                path.unlink()
        cur.execute("DELETE FROM schedule_slots WHERE schedule_id = ? AND user_id = ?",
                    (schedule_id, user_id))
        cur.execute("DELETE FROM schedules WHERE id = ? AND user_id = ?", (schedule_id, user_id))
        conn.commit()
    finally:
        conn.close()
    return jsonify({'success': True})


@bp.route('/', methods=['GET'])
@login_required
def list_schedules():
    user_id = session['user_id']
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM schedules WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        schedules = [dict(row) for row in cur.fetchall()]
    finally:
        conn.close()
    return jsonify(schedules)

@bp.route('/up-next', methods=['GET'])
@login_required
def up_next():
    from datetime import datetime
    from services.free_time import get_day_overview, _to_min

    user_id = session['user_id']
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) AS n FROM schedule_slots WHERE user_id = ?", (user_id,))
        has_schedule = cur.fetchone()['n'] > 0
    finally:
        conn.close()

    if not has_schedule:
        return jsonify({'has_schedule': False})

    now = datetime.now().strftime('%H:%M')
    overview = get_day_overview(user_id)
    classes = overview['classes']

    current = next((c for c in classes if c['start_time'] <= now < c['end_time']), None)
    upcoming = next((c for c in classes if c['start_time'] > now), None)

    free = None
    for gap in overview['free']:
        if gap['end'] > now:
            start = max(gap['start'], now)
            minutes = _to_min(gap['end']) - _to_min(start)
            if minutes >= 30:
                free = {'start': start, 'end': gap['end'], 'minutes': minutes}
                break

    return jsonify({
        'has_schedule': True,
        'day': overview['day'],
        'classes_today': len(classes),
        'current': current,
        'next': upcoming,
        'free': free
    })
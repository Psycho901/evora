from flask import Blueprint, request, jsonify, session
from auth import login_required
from database import get_db_connection
from datetime import date

bp = Blueprint('mood', __name__, url_prefix='/api/mood')

@bp.route('/checkin', methods=['POST'])
@login_required
def checkin():
    data = request.json
    mood_score = data.get('mood_score')
    mood_label = data.get('mood_label')
    notes = data.get('notes', '')
    user_id = session['user_id']
    
    conn = get_db_connection()
    cur = conn.cursor()
    # Check if already checked in today
    cur.execute("SELECT id FROM mood_logs WHERE user_id = ? AND date = date('now')", (user_id,))
    existing = cur.fetchone()
    if existing:
        cur.execute("UPDATE mood_logs SET mood_score=?, mood_label=?, notes=? WHERE id=?", 
                    (mood_score, mood_label, notes, existing['id']))
    else:
        cur.execute("INSERT INTO mood_logs (user_id, mood_score, mood_label, notes) VALUES (?, ?, ?, ?)",
                    (user_id, mood_score, mood_label, notes))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@bp.route('/today', methods=['GET'])
@login_required
def today():
    user_id = session['user_id']
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM mood_logs WHERE user_id = ? AND date = date('now')", (user_id,))
    mood = cur.fetchone()
    conn.close()
    if mood:
        return jsonify(dict(mood))
    return jsonify({'checked': False})

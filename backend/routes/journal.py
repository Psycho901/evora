from flask import Blueprint, request, jsonify, session
from auth import login_required
from database import get_db_connection

bp = Blueprint('journal', __name__, url_prefix='/api/journal')

@bp.route('/', methods=['GET', 'POST'])
@login_required
def journal():
    user_id = session['user_id']
    conn = get_db_connection()
    cur = conn.cursor()
    if request.method == 'POST':
        data = request.json
        cur.execute("INSERT INTO journal_entries (user_id, content, emotions) VALUES (?, ?, ?)",
                    (user_id, data['content'], data.get('emotions', '')))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    cur.execute("SELECT * FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
    entries = [dict(row) for row in cur.fetchall()]
    conn.close()
    return jsonify(entries)

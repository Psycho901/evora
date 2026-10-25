from flask import Blueprint, request, jsonify, session
from auth import login_required
from database import get_db_connection

bp = Blueprint('goals', __name__, url_prefix='/api/goals')


@bp.route('/', methods=['GET', 'POST'])
@login_required
def goals():
    user_id = session['user_id']
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        if request.method == 'POST':
            data = request.get_json(silent=True) or {}
            title = str(data.get('title', '')).strip()
            goal_type = data.get('type')
            if not title:
                return jsonify({'error': 'Goal title is required'}), 400
            if len(title) > 200:
                return jsonify({'error': 'Goal title is too long (max 200 characters)'}), 400
            if goal_type not in ('short', 'long'):
                return jsonify({'error': 'Invalid goal type'}), 400
            cur.execute(
                "INSERT INTO goals (user_id, title, type, exam, deadline) VALUES (?, ?, ?, ?, ?)",
                (user_id, title, goal_type, data.get('exam') or '', data.get('deadline') or None)
            )
            goal_id = cur.lastrowid
            conn.commit()
            return jsonify({'success': True, 'goal_id': goal_id})

        cur.execute("SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
        return jsonify([dict(row) for row in cur.fetchall()])
    finally:
        conn.close()


@bp.route('/<int:goal_id>', methods=['DELETE'])
@login_required
def delete_goal(goal_id):
    user_id = session['user_id']
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM goal_topics_done WHERE goal_id = ? AND user_id = ?",
                    (goal_id, user_id))
        cur.execute("DELETE FROM goals WHERE id = ? AND user_id = ?", (goal_id, user_id))
        conn.commit()
    finally:
        conn.close()
    return jsonify({'success': True})


@bp.route('/progress', methods=['GET'])
@login_required
def get_progress():
    """Completed topics per goal, e.g. {"3": ["Linear Algebra", "BST"]}."""
    user_id = session['user_id']
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT goal_id, topic FROM goal_topics_done WHERE user_id = ?", (user_id,))
        progress = {}
        for row in cur.fetchall():
            progress.setdefault(str(row['goal_id']), []).append(row['topic'])
    finally:
        conn.close()
    return jsonify(progress)


@bp.route('/<int:goal_id>/topics', methods=['POST'])
@login_required
def set_topic_done(goal_id):
    user_id = session['user_id']
    data = request.get_json(silent=True) or {}
    topic = str(data.get('topic', '')).strip()
    done = bool(data.get('done', True))

    if not topic or len(topic) > 200:
        return jsonify({'error': 'Invalid topic'}), 400

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id FROM goals WHERE id = ? AND user_id = ?", (goal_id, user_id))
        if not cur.fetchone():
            return jsonify({'error': 'Goal not found'}), 404
        if done:
            cur.execute(
                "INSERT OR IGNORE INTO goal_topics_done (user_id, goal_id, topic) VALUES (?, ?, ?)",
                (user_id, goal_id, topic)
            )
        else:
            cur.execute(
                "DELETE FROM goal_topics_done WHERE goal_id = ? AND user_id = ? AND topic = ?",
                (goal_id, user_id, topic)
            )
        conn.commit()
    finally:
        conn.close()
    return jsonify({'success': True})



@bp.route('/todos', methods=['GET'])
@login_required
def list_todos():
    user_id = session['user_id']
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, text, due_date, done FROM goal_todos "
            "WHERE user_id = ? ORDER BY done ASC, due_date IS NULL, due_date ASC, created_at DESC",
            (user_id,)
        )
        return jsonify([dict(r) for r in cur.fetchall()])
    finally:
        conn.close()


@bp.route('/todos', methods=['POST'])
@login_required
def add_todo():
    user_id = session['user_id']
    data = request.get_json(silent=True) or {}
    text = str(data.get('text', '')).strip()
    due_date = data.get('due_date') or None
    if not text:
        return jsonify({'error': 'To-do text is required'}), 400
    if len(text) > 200:
        return jsonify({'error': 'To-do is too long (max 200 characters)'}), 400
    if due_date:
        try:
            from datetime import datetime
            datetime.strptime(due_date, '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid due date'}), 400
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO goal_todos (user_id, text, due_date) VALUES (?, ?, ?)",
            (user_id, text, due_date)
        )
        conn.commit()
        return jsonify({'success': True, 'id': cur.lastrowid})
    finally:
        conn.close()


@bp.route('/todos/<int:todo_id>', methods=['PUT'])
@login_required
def toggle_todo(todo_id):
    user_id = session['user_id']
    data = request.get_json(silent=True) or {}
    done = 1 if data.get('done') else 0
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("UPDATE goal_todos SET done = ? WHERE id = ? AND user_id = ?",
                    (done, todo_id, user_id))
        conn.commit()
        return jsonify({'success': True})
    finally:
        conn.close()


@bp.route('/todos/<int:todo_id>', methods=['DELETE'])
@login_required
def delete_todo(todo_id):
    user_id = session['user_id']
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM goal_todos WHERE id = ? AND user_id = ?", (todo_id, user_id))
        conn.commit()
        return jsonify({'success': True})
    finally:
        conn.close()
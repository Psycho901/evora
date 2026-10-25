from flask import Blueprint, request, jsonify, session
from auth import login_required
from database import get_db_connection
from services.youtube_service import YouTubeService
from services.quote_service import QuoteService
from services.resource_service import ResourceService

bp = Blueprint('planner', __name__, url_prefix='/api/planner')
yt = YouTubeService()

@bp.route('/recommend', methods=['POST'])
@login_required
def recommend():
    data = request.json
    topic = data.get('topic', '')
    subject = data.get('subject', '')
    exam = data.get('exam', '')
    query = f"{subject} {topic} lecture explanation"
    videos = yt.search_videos(query)
    resources = ResourceService.get_resources(topic, subject, exam)
    return jsonify({'videos': videos, 'resources': resources})

@bp.route('/quote', methods=['GET'])
@login_required
def quote():
    user_id = session['user_id']
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT mood_label FROM mood_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1", (user_id,))
    mood = cur.fetchone()
    conn.close()
    mood_label = mood['mood_label'] if mood else 'okay'
    return jsonify({'quote': QuoteService.get_quote(mood_label)})

import os
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from pathlib import Path

from database import get_db_connection, init_db
from models import User
from auth import login_required

# Load env
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / '.env')

app = Flask(__name__, template_folder='../frontend', static_folder='../frontend', static_url_path='')
secret_key = os.getenv('SECRET_KEY')
if not secret_key or secret_key == 'evora_secret_key':
    raise RuntimeError('SECRET_KEY is missing in .env. Add a long random value.')
app.secret_key = secret_key
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024  # 5 MB upload limit

# Initialize DB
init_db()

# Import routes
from routes import chat, mood, goals, planner, schedule, journal

app.register_blueprint(chat.bp)
app.register_blueprint(mood.bp)
app.register_blueprint(goals.bp)
app.register_blueprint(planner.bp)
app.register_blueprint(schedule.bp)
app.register_blueprint(journal.bp)

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        conn = get_db_connection()
        user = User.get_by_email(conn, email)
        conn.close()
        if user and check_password_hash(user['password_hash'], password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            return redirect(url_for('dashboard'))
        error = 'Invalid login credentials. Please check your email and password.'
    return render_template('login.html', error=error)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        hashed = generate_password_hash(password)
        conn = get_db_connection()
        try:
            User.create(conn, username, email, hashed)
            conn.close()
            flash('Registration successful! Please login.')
            return redirect(url_for('login'))
        except Exception as e:
            conn.close()
            flash('User already exists')
    return render_template('register.html')

@app.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@app.route('/chat')
@login_required
def chat_page():
    return render_template('chat.html')

@app.route('/mood_checkin')
@login_required
def mood_checkin():
    return render_template('mood_checkin.html')

@app.route('/goals')
@login_required
def goals_page():
    return render_template('goals.html')

@app.route('/study_planner')
@login_required
def study_planner():
    return render_template('study_planner.html')

@app.route('/schedule')
@login_required
def schedule_page():
    return render_template('schedule.html')

@app.route('/analytics')
@login_required
def analytics():
    return render_template('analytics.html')

@app.route('/journal')
@login_required
def journal_page():
    return render_template('journal.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.errorhandler(413)
def file_too_large(error):
    return jsonify({'error': 'File is too large. Maximum size is 10 MB.'}), 413

if __name__ == '__main__':
    app.run(debug=True, port=5000)

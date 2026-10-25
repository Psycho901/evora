from functools import wraps
from flask import session, redirect, url_for, flash, request, jsonify

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            # API calls (fetch) get JSON; normal page visits get redirected
            if request.path.startswith('/api/'):
                return jsonify({
                    'error': 'Please log in to continue.',
                    'login_required': True
                }), 401
            flash('Please login to access this page.')
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function
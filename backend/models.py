from datetime import datetime
import sqlite3

class User:
    @staticmethod
    def create(conn, username, email, password_hash):
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            (username, email, password_hash)
        )
        conn.commit()
        return cur.lastrowid
    
    @staticmethod
    def get_by_email(conn, email):
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE email = ?", (email,))
        return cur.fetchone()
    
    @staticmethod
    def get_by_id(conn, user_id):
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        return cur.fetchone()

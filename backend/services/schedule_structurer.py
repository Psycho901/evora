import os
import re
import json
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent.parent / '.env')
GROQ_KEY = os.getenv('GROQ_API_KEY', '')
GROQ_MODEL = os.getenv('GROQ_MODEL', 'openai/gpt-oss-120b')

DAYS = {'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'}
TIME_RE = re.compile(r'^([01]\d|2[0-3]):[0-5]\d$')

PROMPT = """You convert messy OCR text of a class timetable into JSON.
Return ONLY a JSON array, no other text. Each item must be:
{"day": "Monday", "start": "HH:MM", "end": "HH:MM", "subject": "text"}
Rules:
- Use 24-hour times. For a college day, hours 01:00-06:00 are afternoon (13:00-18:00).
- Header rows of start times and end times tell you each column's time range.
- Join a subject with its room code, e.g. "CSE 401 (C 411)".
- Use only what is in the text. If you cannot tell the day or time of an item, skip it. Never invent classes."""


def structure_schedule(raw_text):
    """Turn raw OCR text into a clean list of schedule slots."""
    if not GROQ_KEY:
        raise RuntimeError('GROQ_API_KEY is missing in .env')

    res = requests.post(
        'https://api.groq.com/openai/v1/chat/completions',
        headers={'Authorization': f'Bearer {GROQ_KEY}', 'Content-Type': 'application/json'},
        json={
            'model': GROQ_MODEL,
            'messages': [
                {'role': 'system', 'content': PROMPT},
                {'role': 'user', 'content': raw_text[:6000]},
            ],
            'temperature': 0,
            'max_tokens': 3000,
        },
        timeout=60,
    )
    res.raise_for_status()
    content = res.json()['choices'][0]['message']['content']

    match = re.search(r'\[.*\]', content, re.DOTALL)
    if not match:
        return []
    try:
        items = json.loads(match.group(0))
    except json.JSONDecodeError:
        return []

    slots = []
    for item in items:
        if not isinstance(item, dict):
            continue
        day = str(item.get('day', '')).strip().title()
        start = str(item.get('start', '')).strip()
        end = str(item.get('end', '')).strip()
        subject = str(item.get('subject', '')).strip()[:80]
        if day in DAYS and TIME_RE.match(start) and TIME_RE.match(end) and subject:
            slots.append({'day': day, 'start': start, 'end': end, 'subject': subject})
    return slots
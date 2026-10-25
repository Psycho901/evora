from flask import Blueprint, request, jsonify, session
from auth import login_required
from database import get_db_connection
import os
import random
import requests
from datetime import datetime
from services.free_time import get_day_overview
from services.safety import needs_support, SUPPORT_MESSAGE

bp = Blueprint('chat', __name__, url_prefix='/api/chat')

from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path(__file__).resolve().parent.parent.parent / '.env')
GROQ_KEY = os.getenv('GROQ_API_KEY', '')
GROQ_MODEL = os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')
GROQ_FALLBACK_MODELS = [
    m.strip() for m in os.getenv(
        'GROQ_FALLBACK_MODELS', 'openai/gpt-oss-20b,qwen/qwen3.8-27b'
    ).split(',') if m.strip()
]
print(f"=== CHAT ROUTE: Groq key loaded: {'YES' if GROQ_KEY else 'NO'}, model: {GROQ_MODEL} ===")

SYSTEM_PROMPTS = {
    'talk': """You are EVORA, a warm, emotionally intelligent companion for students.
Talk like a caring friend, not a therapist or a script.
- Respond to the specific things the user just said and refer back to earlier details.
- Never repeat a question or phrase you already used in this conversation.
- Keep replies to 2-4 sentences, with at most one question.
- Vary your style: sometimes reflect, sometimes gently reframe, sometimes offer one tiny practical step (for example, "try just 5 minutes").
- If they say "idk" or give short answers, make it easier to answer by offering two options instead of an open question.
- No diagnoses or clinical advice.
- If someone mentions harming themselves, respond with care, encourage them to reach out to a trusted person or a local helpline, and stay supportive.""",

    'analyze': """You are EVORA's emotion-analysis mode.
Read what the user wrote and name the emotions and thinking patterns you notice (for example all-or-nothing thinking, self-criticism, avoidance), quoting a few of their own words.
Say "this may suggest" rather than stating guesses as facts. Never diagnose.
End with one gentle reflective question. Keep it to 4-6 sentences and do not repeat earlier points.""",

    'study': """You are EVORA's study tutor for students preparing for exams like GATE and JEE.
Explain concepts simply with an analogy and a tiny example, then check understanding with one short question.
Keep it concise and correct. If the question is vague, ask which exact topic. Suggest what to study next.""",

    'plan': """You are EVORA's planning assistant.
Ask for what's missing (tasks, hours available, energy level, deadlines), then build a realistic hour-by-hour plan with breaks.
If the user's mood is low, put lighter tasks first. Adjust the plan when they push back. Keep replies short and actionable."""
}

QUICK_REPLIES = {
    'talk': [
        'Tell me more 💙',
        'I understand',
        'Can we talk about something else?'
    ],
    'analyze': [
        'What does this mean?',
        'What might be causing this?',
        'How can I improve?'
    ],
    'study': [
        'Explain differently',
        'Give me an example',
        'What should I study next?'
    ],
    'plan': [
        'Break it down further',
        'Add breaks',
        'What is most important?'
    ]
}

EMOTION_KEYWORDS = {
    'joy': [
        'happy', 'excited', 'great', 'love', 'amazing',
        'wonderful', 'fantastic', 'glad', 'elated', 'joyful'
    ],
    'sadness': [
        'sad', 'unhappy', 'depressed', 'cry', 'miss',
        'lonely', 'hurt', 'lost', 'hopeless', 'grief'
    ],
    'anger': [
        'angry', 'mad', 'furious', 'hate', 'frustrated',
        'annoyed', 'rage', 'irritated', 'upset'
    ],
    'fear': [
        'scared', 'afraid', 'anxious', 'worried', 'nervous',
        'terrified', 'panic', 'dread', 'stress', 'overwhelmed'
    ],
    'surprise': [
        'shocked', 'surprised', 'amazed', 'unexpected',
        'wow', 'unbelievable', 'astonished'
    ],
    'disgust': [
        'disgusted', 'gross', 'awful', 'terrible',
        'horrible', 'nasty', 'revolting'
    ]
}


def detect_emotions(text):
    text_lower = text.lower()
    scores = {emotion: 0.0 for emotion in EMOTION_KEYWORDS}
    total = 0

    for emotion, keywords in EMOTION_KEYWORDS.items():
        count = sum(
            1 for keyword in keywords
            if keyword in text_lower
        )
        scores[emotion] = float(count)
        total += count

    scores['neutral'] = max(0.5 - total * 0.1, 0.05)
    total += scores['neutral']
    total = total or 1

    return {
        emotion: round(score / total, 3)
        for emotion, score in scores.items()
    }


def extract_highlights(text, emotions):
    dominant = max(emotions, key=emotions.get)
    words = text.split()
    chunks = []
    chunk = []

    for word in words:
        chunk.append(word)

        if len(chunk) >= 4 and word.endswith(('.', ',', '!', '?')):
            chunks.append({
                'text': ' '.join(chunk).strip('.,!?'),
                'emotion': dominant
            })
            chunk = []

    if chunk:
        chunks.append({
            'text': ' '.join(chunk),
            'emotion': dominant
        })

    return chunks[:4]


def build_insights(emotions, mode):
    insights = []
    top = max(emotions, key=emotions.get)
    score = emotions[top]

    if top == 'joy' and score > 0.3:
        insights.append({
            'type': 'positive',
            'label': 'Positive Energy',
            'text': (
                "Your message contains positive emotional signals. "
                "Notice what is contributing to this feeling and "
                "consider how you can make space for more of it."
            )
        })

    elif top == 'sadness' and score > 0.2:
        insights.append({
            'type': 'neutral',
            'label': 'Emotional Reflection',
            'text': (
                "Your words may reflect some sadness. "
                "Give yourself room to understand what you are feeling "
                "without judging yourself."
            )
        })

    elif top == 'anger' and score > 0.2:
        insights.append({
            'type': 'growth',
            'label': 'Understand Your Frustration',
            'text': (
                "Your message may contain signs of frustration. "
                "It could help to explore what happened and what "
                "matters most to you in this situation."
            )
        })

    elif top == 'fear' and score > 0.2:
        insights.append({
            'type': 'growth',
            'label': 'Explore Your Concerns',
            'text': (
                "Your words may reflect worry or uncertainty. "
                "Identifying the specific concern may help you "
                "decide what, if anything, you want to do next."
            )
        })

    if mode == 'study':
        insights.append({
            'type': 'neutral',
            'label': 'Study Tip',
            'text': (
                "Try a manageable focused study session, followed by "
                "a short break. Adjust the duration to your needs."
            )
        })

    elif mode == 'plan':
        insights.append({
            'type': 'positive',
            'label': 'Planning Power',
            'text': (
                "A realistic plan can make your priorities clearer. "
                "Leave room for breaks and unexpected changes."
            )
        })

    return insights[:3]


def fallback_reply(message, mode, history=None):
    msg = message.lower().strip()
    history = history or []

    last_user_msgs = [
        str(item.get('content', '')).lower()
        for item in history
        if isinstance(item, dict) and item.get('role') == 'user'
    ]

    turns = len(last_user_msgs)

    if mode == 'talk':
        if turns <= 1:
            if any(word in msg for word in [
                'stress', 'overwhelm', 'pressure'
            ]):
                return (
                    "That feeling of being overwhelmed is so real. 💙 "
                    "Your mind may be juggling too much at once. "
                    "Can you tell me — is it one big thing that's "
                    "stressing you, or lots of small things piling up?"
                )

            elif any(word in msg for word in [
                'sad', 'depress', 'cry', 'unhappy', 'down'
            ]):
                return (
                    "I hear you. 💙 You don't have to pretend to be "
                    "okay here. I'm glad you're putting your feelings "
                    "into words. What's been going on that's brought "
                    "you to this place?"
                )

            elif any(word in msg for word in [
                'anxious', 'worried', 'nervous', 'scared', 'fear'
            ]):
                return (
                    "Feeling anxious can be exhausting. 🌱 "
                    "You don't have to solve everything at once. "
                    "What's the thing your mind keeps coming back "
                    "to right now?"
                )

            elif any(word in msg for word in [
                'angry', 'frustrated', 'mad', 'annoyed'
            ]):
                return (
                    "It sounds like something has really frustrated "
                    "you. You can talk about it without being judged. "
                    "What happened that triggered this feeling?"
                )

            elif any(word in msg for word in [
                'lonely', 'alone', 'no one', 'nobody'
            ]):
                return (
                    "I'm glad you reached out. 💙 Loneliness can feel "
                    "heavy, even when it's difficult to explain. "
                    "Would you like to tell me what has been making "
                    "you feel alone?"
                )

            elif any(word in msg for word in [
                'study', 'not studying', "can't study",
                'cant study', 'procrastinat'
            ]):
                return (
                    "The gap between wanting to study and actually "
                    "getting started can be frustrating. 📚 "
                    "Does it feel more like you can't focus, you don't "
                    "feel motivated, or something else is getting "
                    "in the way?"
                )

            else:
                excerpt = message[:40].strip()

                if len(message) > 40:
                    excerpt += '...'

                return (
                    f"Thank you for trusting me with that. 🌱 "
                    f"When you said '{excerpt}', I want to understand "
                    "you better. What do you think you're feeling "
                    "underneath those words?"
                )

        elif turns == 2:
            if any(word in msg for word in [
                'study', 'exam', 'college', 'school', 'class'
            ]):
                return (
                    "Study pressure can feel heavy, especially when "
                    "you care about doing well. When did studying "
                    "start feeling difficult or overwhelming for you?"
                )

            elif any(word in msg for word in [
                'long', 'months', 'weeks', 'years', 'always'
            ]):
                return (
                    "Carrying something difficult for a long time "
                    "can take a toll. You don't have to figure "
                    "everything out today. What would feel like even "
                    "a little relief right now?"
                )

            else:
                return (
                    "I'm following what you're sharing. 💙 "
                    "What do you think is the part of this situation "
                    "that's affecting you the most?"
                )

        else:
            follow_ups = [
                "What would you tell a close friend if they were "
                "feeling exactly what you're feeling right now?",

                "Has this feeling changed since we started talking, "
                "or does it feel about the same?",

                "Is there one small thing that might make today "
                "a little easier for you?",

                "What do you think you need most right now: "
                "understanding, rest, support, or a practical next step?",

                "Would you like to keep talking about this, "
                "or would a change of topic feel better?"
            ]

            return follow_ups[turns % len(follow_ups)]

    elif mode == 'study':
        if any(word in msg for word in ['gate', 'cse', 'cs']):
            return (
                "GATE CSE preparation becomes more manageable with "
                "a clear subject-wise plan! 💪 Key subjects include "
                "DSA, Operating Systems, DBMS, Computer Networks, "
                "COA, TOC, and Algorithms. Which subject would you "
                "like to work on first?"
            )

        elif any(word in msg for word in [
            'jee', 'physics', 'chemistry', 'maths', 'math'
        ]):
            return (
                "JEE preparation benefits from a balance of concepts, "
                "practice, and revision. 📚 Which subject are you "
                "working on, and which topic do you want to understand?"
            )

        elif any(word in msg for word in [
            'os', 'operating system', 'operating systems'
        ]):
            return (
                "Operating Systems is a great topic to work on! 🖥️ "
                "Important areas include processes, CPU scheduling, "
                "synchronization, deadlocks, memory management, and "
                "file systems. Which topic should we tackle first?"
            )

        elif any(word in msg for word in [
            'data structure', 'dsa', 'algorithm'
        ]):
            return (
                "DSA gets easier when you practise one concept at a "
                "time. 🌳 We can work on arrays, linked lists, trees, "
                "graphs, or dynamic programming. Which topic is "
                "giving you the most trouble?"
            )

        elif any(word in msg for word in [
            'confused', "don't understand", 'dont understand',
            'stuck', 'unclear'
        ]):
            return (
                "Let's work through it step by step. 🧠 "
                "Paste the question, code, or concept that's confusing "
                "you, and I'll explain it with a simpler example."
            )

        elif turns > 2:
            return (
                "Let's narrow this down so I can help more effectively. "
                "Tell me the exact topic or question, and we'll break "
                "it into smaller steps."
            )

        else:
            return (
                "Let's study smart, not just hard! 📚 "
                "Tell me the subject and specific topic you're "
                "working on, and I'll help you understand it with "
                "simple explanations and examples."
            )

    elif mode == 'plan':
        if turns == 0:
            return (
                "Let's build a realistic plan! 📅 Tell me three things: "
                "(1) What subjects or tasks do you need to cover? "
                "(2) How much time do you have? "
                "(3) What is your energy level like right now? "
                "You can also share your timetable."
            )

        elif turns == 1:
            return (
                "Got it! Let's make the plan fit your available time "
                "and priorities. Start with a manageable task, then "
                "move to other tasks according to their deadlines "
                "and difficulty. Would you like an hour-by-hour schedule?"
            )

        else:
            return (
                "Let's make sure your plan is realistic and flexible. 🌱 "
                "We can include breaks, meals, and buffer time. "
                "Which task or time slot would you like to adjust?"
            )

    else:
        emotions = detect_emotions(message)
        top = max(emotions, key=emotions.get)

        emotion_insights = {
            'joy': (
                "Your writing contains positive emotional signals. 🌟 "
                "It may be helpful to notice what is contributing "
                "to this feeling and what you want to carry forward."
            ),
            'sadness': (
                "There may be some sadness in your words. 💙 "
                "Take a moment to consider what matters to you "
                "and what kind of support would help."
            ),
            'anger': (
                "Your message may contain signs of frustration. 🔥 "
                "Exploring what happened and what matters to you "
                "could help clarify the feeling."
            ),
            'fear': (
                "Your words may reflect worry or uncertainty. 🌊 "
                "Identifying the concern behind that feeling "
                "can be a useful first step."
            ),
            'surprise': (
                "Your writing may reflect surprise or an unexpected "
                "experience. What part of the situation stood out "
                "to you most?"
            ),
            'disgust': (
                "Your words may reflect a strong negative reaction. "
                "What about the situation felt particularly "
                "uncomfortable or upsetting?"
            ),
            'neutral': (
                "Your message sounds relatively measured. 🌿 "
                "If you'd like, we can explore what is on your mind "
                "and what you want to understand better."
            )
        }

        return emotion_insights.get(
            top,
            emotion_insights['neutral']
        )


def build_schedule_context(user_id):
    """Short text about today's and tomorrow's classes and free time, for the AI."""
    try:
        from services.free_time import DAY_ORDER

        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) AS n FROM schedule_slots WHERE user_id = ?", (user_id,))
            has_schedule = cur.fetchone()['n'] > 0
        finally:
            conn.close()

        if not has_schedule:
            return ''

        now = datetime.now()
        today = get_day_overview(user_id, DAY_ORDER[now.weekday()])
        tomorrow = get_day_overview(user_id, DAY_ORDER[(now.weekday() + 1) % 7])

        def describe(overview):
            classes = '; '.join(
                f"{c['start_time']}-{c['end_time']} {c['subject']}"
                for c in overview['classes']
            ) or 'no classes'
            free = '; '.join(
                f"{g['start']}-{g['end']} ({g['minutes']} min)"
                for g in overview['free']
            ) or 'none'
            return f"{overview['day']}: classes: {classes}. Free time: {free}."

        context = (
            f"\n\nThe time now is {now.strftime('%H:%M')} on {today['day']}. "
            f"The user's timetable is known. Today, {describe(today)} "
            f"Tomorrow, {describe(tomorrow)} "
            "Use these exact times when planning. Only place study sessions in free time, "
            "never over a class, and ignore free time that has already passed. "
            "If little time is left today, suggest a short wind-down and plan tomorrow instead. "
            "Do not ask the user for their timetable."
        )
        print(f"=== Schedule context added ({len(context)} chars) ===")
        return context
    except Exception as error:
        print(f"Schedule context error: {error}")
        return ''

def build_user_context(user_id):
    """Short text about today's mood and active goals, for the AI."""
    try:
        conn = get_db_connection()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT mood_label FROM mood_logs "
                "WHERE user_id = ? AND created_at >= datetime('now', '-24 hours') "
                "ORDER BY created_at DESC LIMIT 1",
                (user_id,)
            )
            mood = cur.fetchone()
            cur.execute(
                "SELECT title, type, exam, deadline FROM goals "
                "WHERE user_id = ? AND status = 'active' "
                "ORDER BY deadline IS NULL, deadline LIMIT 5",
                (user_id,)
            )
            goals = [dict(r) for r in cur.fetchall()]
        finally:
            conn.close()
    except Exception as error:
        print(f"User context error: {error}")
        return ''

    if not mood and not goals:
        return ''

    text = "\n\n"
    if mood:
        text += f"The user's mood today: {mood['mood_label']}. "
    if goals:
        goal_text = '; '.join(
            f"{g['title'][:80]} ({g['type']} term"
            + (f", {g['exam']}" if g['exam'] else '')
            + (f", deadline {g['deadline']}" if g['deadline'] else '')
            + ")"
            for g in goals
        )
        text += f"Their active goals: {goal_text}. "

    text += (
        "Use this to plan. If the mood is low or terrible, choose lighter topics, "
        "shorter sessions and more breaks. If it is good or focused, put the hardest "
        "topic in the longest free gap. Do not ask for tasks, deadlines or energy "
        "that are already known above."
    )
    print(f"=== User context added ({len(text)} chars) ===")
    return text

def get_ai_reply(message, mode, history=None, user_id=None):
    history = history or []

    if not GROQ_KEY:
        print("=== NO GROQ KEY - using fallback ===")
        return fallback_reply(message, mode, history)

    system_prompt = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS['talk'])
    if mode == 'plan' and user_id:
        system_prompt += build_schedule_context(user_id)
        system_prompt += build_user_context(user_id)

    messages = [{
        'role': 'system',
        'content': system_prompt
    }]

    for item in history[-10:]:
        if not isinstance(item, dict):
            continue

        role = item.get('role')
        content = item.get('content')

        if role in ('user', 'assistant') and isinstance(content, str):
            if content.strip():
                messages.append({
                    'role': role,
                    'content': content
                })

    if (
        messages[-1]['role'] != 'user'
        or messages[-1]['content'] != message
    ):
        messages.append({
            'role': 'user',
            'content': message
        })

    rate_limited = False

    for model in [GROQ_MODEL] + GROQ_FALLBACK_MODELS:
        try:
            res = requests.post(
                'https://api.groq.com/openai/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {GROQ_KEY}',
                    'Content-Type': 'application/json'
                },
                json={
                    'model': model,
                    'messages': messages,
                    'max_tokens': 1000,
                    'temperature': 0.8
                },
                timeout=30
            )
        except Exception as error:
            print(f"=== Groq request failed ({model}): {type(error).__name__}: {error} ===")
            continue

        if res.status_code == 200:
            try:
                reply = res.json()['choices'][0]['message']['content'].strip()
            except (KeyError, IndexError, ValueError):
                reply = ''
            if reply:
                print(f"=== Groq responded successfully ({model}) ===")
                return reply
            print(f"=== Groq empty reply ({model}) ===")
            continue

        print(f"=== Groq error {res.status_code} ({model}): {res.text[:200]} ===")
        if res.status_code == 429:
            rate_limited = True

    if rate_limited:
        return "I need a short breather. 🌱 I've hit my usage limit for now, so please try again in a minute or two."

    return fallback_reply(message, mode, history)

@bp.route('/', methods=['POST'])
@login_required
def chat():
    user_id = session['user_id']
    data = request.get_json(silent=True) or {}

    message = data.get('message', '')
    mode = data.get('mode', 'talk')
    history = data.get('history', [])

    if not isinstance(message, str):
        return jsonify({'error': 'Message must be text'}), 400

    message = message.strip()

    if not message:
        return jsonify({'error': 'Empty message'}), 400

    allowed_modes = {'talk', 'analyze', 'study', 'plan'}

    if mode not in allowed_modes:
        return jsonify({'error': 'Invalid chat mode'}), 400

    if not isinstance(history, list):
        history = []

    history = [
        item for item in history[-10:]
        if isinstance(item, dict)
        and item.get('role') in ('user', 'assistant')
        and isinstance(item.get('content'), str)
    ]

    response_text = get_ai_reply(message, mode, history, user_id)
    if needs_support(message):
        response_text += SUPPORT_MESSAGE

    emotions = detect_emotions(message)
    highlights = extract_highlights(message, emotions)
    insights = build_insights(emotions, mode)
    quick_replies = QUICK_REPLIES.get(mode, [])

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute(
            """
            INSERT INTO chat_history
                (user_id, message, response, mode)
            VALUES (?, ?, ?, ?)
            """,
            (user_id, message, response_text, mode)
        )

        conn.commit()
        cur.close()
        conn.close()

    except Exception as error:
        print(f"DB error: {error}")

    return jsonify({
        'response': response_text,
        'emotions': emotions,
        'highlights': highlights,
        'insights': insights,
        'quick_replies': quick_replies
    })
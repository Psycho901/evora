import random

QUOTES = {
    'low': [
        "Progress is not always visible, but it's happening.",
        "Rest is also productive. Be kind to yourself today.",
        "Small steps still move you forward."
    ],
    'okay': [
        "Consistency beats perfection every single time.",
        "Focus on progress, not perfection.",
        "You're closer than you think."
    ],
    'good': [
        "Your effort today is building your future.",
        "Keep the momentum going!",
        "Success is the sum of small efforts repeated daily."
    ],
    'focused': [
        "This is your power hour. Make it count!",
        "Discipline will take you where motivation can't.",
        "Stay locked in. Your goals are worth it."
    ]
}

class QuoteService:
    @staticmethod
    def get_quote(mood_label='okay'):
        mood = mood_label.lower()
        if mood in QUOTES:
            return random.choice(QUOTES[mood])
        return random.choice(QUOTES['okay'])

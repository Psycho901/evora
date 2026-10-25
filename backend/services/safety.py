import re

# Phrases only, so "this exam is killing me" doesn't trigger it
DISTRESS_PHRASES = [
    "kill myself", "killing myself", "end my life", "take my own life",
    "want to die", "wanna die", "wish i was dead", "wish i were dead",
    "better off dead", "suicide", "suicidal", "end it all",
    "don't want to live", "dont want to live", "no reason to live",
    "hurt myself", "harm myself", "self harm", "self-harm", "cut myself",
]

SUPPORT_MESSAGE = (
    "\n\n💙 If you're having thoughts of hurting yourself, please reach out to someone "
    "right now: a friend, a family member, or a teacher you trust.\n"
    "• **Tele-MANAS (India):** call **14416** or **1-800-891-4416**. It's free, open 24/7, "
    "and available in many languages.\n"
    "• If you're in immediate danger, call **112**.\n"
    "You don't have to handle this alone, and I'm still here with you."
)


def needs_support(text):
    """True if the message contains clear signs of self-harm or suicidal thoughts."""
    t = str(text).lower().replace('’', "'")
    t = re.sub(r'\s+', ' ', t)
    return any(phrase in t for phrase in DISTRESS_PHRASES)
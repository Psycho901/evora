# EVORA - Evolve at your own pace

A mental wellness + study companion app built for hackathons. Combines mood tracking, goal setting, AI-powered study planning with YouTube integration, journaling, and empathetic AI chat.

## Features

- 🧠 **Mood Check-in** - Daily mood tracking with personalized recommendations
- 💬 **Just Talk** - Heartful AI conversation in a safe space
- 🎯 **Goals** - Set short/long-term goals with GATE/JEE presets
- 📚 **Study Planner** - Mood-based topics with YouTube video recommendations
- 📅 **Schedule** - Upload timetables (PDF/Image) or enter manually
- 📝 **Journal** - Private journaling space
- 📊 **Analytics** - Track mood trends and progress
- 🤖 **AI Chat** - Study assistance and emotional support

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Flask (Python)
- **Database**: SQLite
- **AI**: Anthropic Claude API
- **Videos**: YouTube Data API v3

## Setup

1. **Install dependencies**
```bash
cd E:/EVORA/backend
pip install -r requirements.txt
```

2. **Configure environment variables**
Edit `.env` file and add your API keys:
```env
ANTHROPIC_API_KEY=your_key_here
YOUTUBE_API_KEY=your_key_here
SECRET_KEY=your_secret_key
```

3. **Run the app**
```bash
cd E:/EVORA/backend
python app.py
```

4. **Open in browser**
Navigate to `http://localhost:5000`

## Notes

- If API keys are not provided, the app runs in mock/demo mode
- Tesseract OCR is not required for MVP (manual entry fallback available)
- All data is stored locally in SQLite

## Built for Hackathon
Fast, simple, and demo-ready with Flask + SQLite + Sessions.

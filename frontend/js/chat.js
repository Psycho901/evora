// EVORA Chat — interactive, AI-powered

const API = '';  // Flask serves on same origin, so no prefix needed
let currentMode = 'talk';
let sessionHistory = [];

const MODE_CONFIG = {
    talk: {
        desc: '💙 <strong>Just Talk</strong> — A safe space to share anything. I\'m here, no judgment.',
        welcome: 'Hey, I\'m EVORA 🌱 I\'m here to listen — no judgment, no rush. What\'s on your heart today?',
        placeholder: 'Share what\'s on your mind…',
        suggestions: ['I\'m feeling stressed 😔', 'I need to vent', 'I\'m overwhelmed', 'Something happened today'],
        quickReplies: ['Tell me more 💙', 'I understand', 'That makes sense', 'What happened next?']
    },
    analyze: {
        desc: '🧠 <strong>Analyze My Feelings</strong> — I\'ll detect emotions and patterns in what you share.',
        welcome: 'I\'m in analysis mode 🧠 Share what you\'re feeling and I\'ll help you understand your emotions and thinking patterns.',
        placeholder: 'Describe how you\'re feeling…',
        suggestions: ['I feel confused about my emotions', 'I\'m not sure why I feel this way', 'Analyze my mood today'],
        quickReplies: ['What does this mean?', 'Is this normal?', 'How do I improve?']
    },
    study: {
        desc: '📚 <strong>Study with Me</strong> — Stuck on a topic? I\'ll explain it simply and find resources.',
        welcome: 'Study mode on! 📚 What subject are we tackling today? Tell me the topic and I\'ll help you understand it or find the best videos.',
        placeholder: 'Ask me anything about your topic…',
        suggestions: ['Explain Operating Systems', 'I\'m stuck on Data Structures', 'Help me with GATE prep', 'Explain in simple terms'],
        quickReplies: ['Explain differently', 'Give me an example', 'Find videos for this', 'What\'s next to study?']
    },
    plan: {
        desc: '📅 <strong>Plan My Day</strong> — Tell me your goals and I\'ll help you build a study plan.',
        welcome: 'Let\'s plan your day! 📅 Tell me what you need to get done today, your current mood, and how much time you have.',
        placeholder: 'Tell me your goals for today…',
        suggestions: ['Help me plan today\'s study', 'I have 3 hours, what should I do?', 'Prioritize my tasks', 'I have an exam tomorrow'],
        quickReplies: ['Break it into hours', 'Add a break', 'What\'s most important?', 'Make it easier']
    }
};

const EMOTION_COLORS = {
    joy: { bar: '#10b981', text: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    sadness: { bar: '#6366f1', text: '#818cf8', bg: 'rgba(99,102,241,0.12)' },
    anger: { bar: '#ef4444', text: '#f87171', bg: 'rgba(239,68,68,0.12)' },
    fear: { bar: '#f59e0b', text: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
    surprise: { bar: '#ec4899', text: '#f472b6', bg: 'rgba(236,72,153,0.12)' },
    disgust: { bar: '#8b5cf6', text: '#a78bfa', bg: 'rgba(139,92,246,0.12)' },
    neutral: { bar: '#64748b', text: '#94a3b8', bg: 'rgba(100,116,139,0.12)' },
};

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    switchMode('talk', document.getElementById('btnTalk'));
});

function switchMode(mode, btn) {
    currentMode = mode;
    sessionHistory = [];

    // Update tabs
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Update desc
    document.getElementById('modeDesc').innerHTML = MODE_CONFIG[mode].desc;

    // Update placeholder
    document.getElementById('chatInput').placeholder = MODE_CONFIG[mode].placeholder;

    // Clear messages + add welcome
    const container = document.getElementById('chatMessages');
    container.innerHTML = '';
    addMessage('ai', MODE_CONFIG[mode].welcome);

    // Update suggestions
    renderSuggestions(MODE_CONFIG[mode].suggestions);

    // Reset side panels
    document.getElementById('emotionRadar').innerHTML =
        '<p style="font-size:12px;color:var(--text-secondary);">Send a message to see emotion analysis.</p>';
    document.getElementById('insightPanel').innerHTML =
        '<p style="font-size:12px;color:var(--text-secondary);">Insights will appear as you chat more.</p>';
    document.getElementById('highlightsPanel').innerHTML =
        'Emotionally significant phrases will be highlighted here.';
}

function renderSuggestions(list) {
    const container = document.getElementById('suggestions');
    container.innerHTML = list.map(s =>
        `<button class="sug-btn" onclick="useSuggestion('${s.replace(/'/g, "\\'")}')">${s}</button>`
    ).join('');
}

function useSuggestion(text) {
    document.getElementById('chatInput').value = text;
    sendMessage();
}

// ── Send message ─────────────────────────────────────────
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    addMessage('user', text);
    input.value = '';
    input.style.height = 'auto';
    renderSuggestions([]);

    sessionHistory.push({ role: 'user', content: text });
    showTyping();

    try {
        const res = await fetch('/api/chat/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, mode: currentMode, history: sessionHistory })
        });

        removeTyping();
            if (res.status === 401) { window.location.href = '/login'; return; }

        if (!res.ok) {
            addMessage('ai', '⚠️ Something went wrong. Please try again.');
            return;
        }

        const data = await res.json();
        addMessage('ai', data.response, data.emotions, data.insights, data.quick_replies);
        sessionHistory.push({ role: 'assistant', content: data.response });

        if (data.emotions) updateEmotionRadar(data.emotions);
        if (data.insights) updateInsights(data.insights);
        if (data.highlights) updateHighlights(data.highlights);

    } catch (err) {
        removeTyping();
        addMessage('ai', 'I\'m having trouble connecting right now. Make sure the backend is running! 🔌');
    }
}

// ── Message rendering ────────────────────────────────────
function addMessage(role, text, emotions = null, insights = null, quickReplies = null) {
    const container = document.getElementById('chatMessages');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const div = document.createElement('div');
    div.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar';
    avatar.textContent = role === 'ai' ? '🌱' : '🙂';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';

    // Text
    const msgText = document.createElement('div');
    msgText.className = 'msg-text';
    msgText.innerHTML = formatText(text);
    bubble.appendChild(msgText);

    // Emotion tags (on AI messages in analyze mode)
    if (emotions && role === 'ai' && currentMode === 'analyze') {
        const tags = document.createElement('div');
        tags.className = 'emotion-tags';
        Object.entries(emotions)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .forEach(([e, s]) => {
                if (s < 0.04) return;
                const c = EMOTION_COLORS[e] || EMOTION_COLORS.neutral;
                const tag = document.createElement('span');
                tag.className = 'etag';
                tag.style.background = c.bg;
                tag.style.color = c.text;
                tag.textContent = `${e} ${Math.round(s * 100)}%`;
                tags.appendChild(tag);
            });
        bubble.appendChild(tags);
    }

    // Quick reply buttons
    if (quickReplies && quickReplies.length && role === 'ai') {
        const qrWrap = document.createElement('div');
        qrWrap.className = 'quick-replies';
        quickReplies.forEach(qr => {
            const btn = document.createElement('button');
            btn.className = 'qr-btn';
            btn.textContent = qr;
            btn.onclick = () => useSuggestion(qr);
            qrWrap.appendChild(btn);
        });
        bubble.appendChild(qrWrap);
    }

    // Time
    const time = document.createElement('div');
    time.className = 'msg-time';
    time.textContent = now;
    bubble.appendChild(time);

    div.appendChild(avatar);
    div.appendChild(bubble);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatText(text) {
    return escapeHtml(text)
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function showTyping() {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'message ai';
    div.id = 'typingMsg';
    div.innerHTML = `
    <div class="msg-avatar">🌱</div>
    <div class="msg-bubble">
      <div class="typing-bubble">
        <div class="dot"></div><div class="dot"></div><div class="dot"></div>
      </div>
    </div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function removeTyping() {
    const el = document.getElementById('typingMsg');
    if (el) el.remove();
}

// ── Side panels ───────────────────────────────────────────
function updateEmotionRadar(emotions) {
    const container = document.getElementById('emotionRadar');
    const sorted = Object.entries(emotions).sort((a, b) => b[1] - a[1]);
    container.innerHTML = sorted.map(([e, s]) => {
        if (s < 0.02) return '';
        const pct = Math.round(s * 100);
        const c = EMOTION_COLORS[e] || EMOTION_COLORS.neutral;
        return `<div class="emotion-bar-row">
      <span class="emotion-bar-label">${e}</span>
      <div class="emotion-bar-bg">
        <div class="emotion-bar-fill" style="width:${pct}%;background:${c.bar};"></div>
      </div>
      <span class="emotion-bar-pct" style="color:${c.text};">${pct}%</span>
    </div>`;
    }).join('');
}

function updateInsights(insights) {
    const container = document.getElementById('insightPanel');
    const icons = { positive: '🌿', growth: '🌱', neutral: '💡', warning: '⚠️' };
    container.innerHTML = insights.map(i => `
    <div class="insight-card ${i.type || 'neutral'}">
      ${icons[i.type] || '💡'} <strong>${i.label || ''}</strong><br>
      <span style="color:var(--text-secondary);">${i.text}</span>
    </div>`).join('');
}

function updateHighlights(highlights) {
    const el = document.getElementById('highlightsPanel');
    if (!highlights || !highlights.length) return;
    const colorMap = {
        joy: '#10b981', sadness: '#818cf8', anger: '#f87171',
        fear: '#fbbf24', neutral: '#94a3b8'
    };
    el.innerHTML = highlights.map(h => {
        const color = colorMap[h.emotion] || colorMap.neutral;
        return `<span style="background:rgba(255,255,255,0.06);color:${color};
      padding:2px 7px;border-radius:6px;margin:2px;display:inline-block;font-size:12px;">
      ${escapeHtml(h.text)}
    </span>`;
    }).join(' ');
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}
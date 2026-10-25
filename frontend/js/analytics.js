document.addEventListener('DOMContentLoaded', async () => {
    try {
        const [goalsRes, journalRes, moodRes] = await Promise.all([
            fetch('/api/goals/'),
            fetch('/api/journal/'),
            fetch('/api/mood/today')
        ]);
        
        const goals = await goalsRes.json();
        const journal = await journalRes.json();
        const mood = await moodRes.json();
        
        document.getElementById('goalsCount').textContent = goals.length;
        document.getElementById('journalCount').textContent = journal.length;
        document.getElementById('sessionsCount').textContent = '-';
        
        if (mood.checked !== false && mood.mood_label) {
            document.getElementById('moodStatus').textContent = 'Today: ' + mood.mood_label + ' ' + getEmoji(mood.mood_label);
        }
    } catch(e) {
        console.log(e);
    }
});

function getEmoji(mood) {
    if (mood === 'Low') return '😔';
    if (mood === 'Okay') return '😐';
    if (mood === 'Good') return '😊';
    if (mood === 'Focused') return '🔥';
    return '';
}

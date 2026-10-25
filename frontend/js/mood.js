let selectedMood = null;

document.querySelectorAll('.mood-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.mood-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        selectedMood = {
            score: parseInt(option.dataset.score),
            label: option.dataset.label
        };
    });
});

document.getElementById('submitBtn').addEventListener('click', async () => {
    if (!selectedMood) {
        alert('Please select your mood');
        return;
    }
    const notes = document.getElementById('notes').value;
    const res = await fetch('/api/mood/checkin', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            mood_score: selectedMood.score,
            mood_label: selectedMood.label,
            notes: notes
        })
    });
    if (res.ok) {
        document.querySelector('.card').style.display = 'none';
        document.getElementById('result').style.display = 'block';
    }
});

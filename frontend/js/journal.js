document.getElementById('saveJournal').addEventListener('click', async () => {
    const content = document.getElementById('journalContent').value;
    if (!content.trim()) {
        alert('Please write something');
        return;
    }
    const res = await fetch('/api/journal/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({content})
    });
    if (res.ok) {
        document.getElementById('journalContent').value = '';
        loadEntries();
        alert('Entry saved!');
    }
});

async function loadEntries() {
    const res = await fetch('/api/journal/');
    const entries = await res.json();
    const div = document.getElementById('journalEntries');
    div.innerHTML = '';
    entries.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="journal-date">${new Date(entry.created_at).toLocaleString()}</div>
            <p style="white-space: pre-wrap;">${entry.content}</p>
        `;
        div.appendChild(card);
    });
}

loadEntries();

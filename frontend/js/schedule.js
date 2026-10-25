document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('scheduleFile');
    const file = fileInput.files[0];
    if (!file) {
        alert('Please select a file');
        return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
        const res = await fetch('/api/schedule/upload', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (res.ok && data.success) {
            alert('Schedule uploaded successfully!');
            fileInput.value = '';
            loadSchedules();
        } else {
            alert('Upload failed: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Upload failed: ' + err.message);
    }
});

document.getElementById('saveManual').addEventListener('click', async () => {
    const content = document.getElementById('manualSchedule').value;
    if (!content.trim()) {
        alert('Please enter schedule content');
        return;
    }
    try {
        const res = await fetch('/api/schedule/manual', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({content})
        });
        if (res.ok) {
            alert('Manual schedule saved!');
            document.getElementById('manualSchedule').value = '';
            loadSchedules();
        }
    } catch (err) {
        alert('Failed to save');
    }
});

async function loadSchedules() {
    const res = await fetch('/api/schedule/');
    const schedules = await res.json();
    const list = document.getElementById('schedulesList');
    list.innerHTML = '';
    if (schedules.length === 0) {
        list.innerHTML = '<p style="color: var(--text-secondary);">No schedules uploaded yet.</p>';
        return;
    }
    schedules.forEach(s => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <h3 style="margin-bottom: 0.5rem;">${s.filename || 'Manual Entry'}</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem;">${s.created_at ? new Date(s.created_at).toLocaleString() : ''}</p>
        `;
        list.appendChild(card);
    });
}

loadSchedules();

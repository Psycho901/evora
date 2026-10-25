document.getElementById('generateSchedule').addEventListener('click', () => {
    const wake = document.getElementById('wakeTime').value;
    const sleep = document.getElementById('sleepTime').value;
    const wakeH = parseInt(wake.split(':')[0]);
    const sleepH = parseInt(sleep.split(':')[0]);

    const body = document.getElementById('scheduleBody');
    body.innerHTML = '';

    const pendingTask = localStorage.getItem('scheduleTask');
    let taskInfo = null;
    if (pendingTask) {
        taskInfo = JSON.parse(pendingTask);
        const banner = document.createElement('div');
        banner.style.cssText = 'background: rgba(99, 102, 241, 0.1); border: 1px solid var(--primary); padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem;';
        banner.innerHTML = `<strong style="color: var(--primary);">📌 Task from Goals:</strong> ${taskInfo.topic} <span style="color: var(--text-secondary);">(${taskInfo.goalTitle})</span> - Click on any free slot to assign it!`;
        document.getElementById('scheduleGrid').before(banner);
    }

    for (let h = wakeH; h < sleepH; h++) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 0.5rem; border: 1px solid var(--border); background: var(--bg);">${h}:00 - ${h + 1}:00</td>
            <td style="padding: 0.25rem; border: 1px solid var(--border);"><input type="text" class="form-input" style="padding: 0.4rem;" placeholder="Free/Study/Class" data-day="sun" data-hour="${h}" ondblclick="if(this.value=='' && localStorage.getItem('scheduleTask')){this.value='Study: '+JSON.parse(localStorage.getItem('scheduleTask')).topic;}"></td>
            <td style="padding: 0.25rem; border: 1px solid var(--border);"><input type="text" class="form-input" style="padding: 0.4rem;" placeholder="Free/Study/Class" data-day="mon" data-hour="${h}" ondblclick="if(this.value=='' && localStorage.getItem('scheduleTask')){this.value='Study: '+JSON.parse(localStorage.getItem('scheduleTask')).topic;}"></td>
            <td style="padding: 0.25rem; border: 1px solid var(--border);"><input type="text" class="form-input" style="padding: 0.4rem;" placeholder="Free/Study/Class" data-day="tue" data-hour="${h}" ondblclick="if(this.value=='' && localStorage.getItem('scheduleTask')){this.value='Study: '+JSON.parse(localStorage.getItem('scheduleTask')).topic;}"></td>
            <td style="padding: 0.25rem; border: 1px solid var(--border);"><input type="text" class="form-input" style="padding: 0.4rem;" placeholder="Free/Study/Class" data-day="wed" data-hour="${h}" ondblclick="if(this.value=='' && localStorage.getItem('scheduleTask')){this.value='Study: '+JSON.parse(localStorage.getItem('scheduleTask')).topic;}"></td>
            <td style="padding: 0.25rem; border: 1px solid var(--border);"><input type="text" class="form-input" style="padding: 0.4rem;" placeholder="Free/Study/Class" data-day="thu" data-hour="${h}" ondblclick="if(this.value=='' && localStorage.getItem('scheduleTask')){this.value='Study: '+JSON.parse(localStorage.getItem('scheduleTask')).topic;}"></td>
            <td style="padding: 0.25rem; border: 1px solid var(--border);"><input type="text" class="form-input" style="padding: 0.4rem;" placeholder="Free/Study/Class" data-day="fri" data-hour="${h}" ondblclick="if(this.value=='' && localStorage.getItem('scheduleTask')){this.value='Study: '+JSON.parse(localStorage.getItem('scheduleTask')).topic;}"></td>
            <td style="padding: 0.25rem; border: 1px solid var(--border);"><input type="text" class="form-input" style="padding: 0.4rem;" placeholder="Free/Study/Class" data-day="sat" data-hour="${h}" ondblclick="if(this.value=='' && localStorage.getItem('scheduleTask')){this.value='Study: '+JSON.parse(localStorage.getItem('scheduleTask')).topic;}"></td>
        `;
        body.appendChild(tr);
    }
    document.getElementById('scheduleGrid').style.display = 'block';
    if (pendingTask) {
        alert('Double-click on any empty slot to assign this goal task to that time!');
    }
});

document.getElementById('saveManual').addEventListener('click', async () => {
    const inputs = document.querySelectorAll('#scheduleBody input');
    let schedule = "Schedule (Wake: " + document.getElementById('wakeTime').value + ", Sleep: " + document.getElementById('sleepTime').value + ")\n\n";
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    days.forEach(day => {
        schedule += day.toUpperCase() + ":\n";
        inputs.forEach(inp => {
            if (inp.dataset.day === day && inp.value) {
                schedule += "  " + inp.dataset.hour + ":00 - " + inp.value + "\n";
            }
        });
        schedule += "\n";
    });

    try {
        const res = await fetch('/api/schedule/manual', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: schedule })
        });
        if (res.ok) {
            localStorage.removeItem('scheduleTask');
            alert('Schedule saved! Goal tasks have been allocated to your time slots and linked to your study plan.');
            loadSchedules();
        }
    } catch (err) {
        alert('Failed to save');
    }
});

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
            fileInput.value = '';
            loadSchedules();
            loadSlots();
            showReview(data.schedule_id, data.slots || [], data.warning);
        } else {
            alert('Upload failed: ' + (data.error || 'Unknown error'));
        }
    } catch (err) {
        alert('Upload failed: ' + err.message);
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
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3 style="margin-bottom: 0.5rem;">${s.filename || 'Manual Entry'}</h3>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.5rem;">${s.created_at ? new Date(s.created_at).toLocaleString() : ''}</p>
                    <p style="color: var(--success); font-size: 0.9rem;">✓ Linked to goals & study planner</p>
                </div>
                <button onclick="deleteSchedule(${s.id})" style="background: var(--danger); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer;">Delete</button>
            </div>
        `;
        list.appendChild(card);
    });
}

function deleteSchedule(id) {
    if (confirm('Delete this schedule? You can create a new one after deleting.')) {
        fetch('/api/schedule/' + id, { method: 'DELETE' }).then(() => {
            alert('Schedule deleted. Create a new schedule now.');
            loadSchedules();
        }).catch(() => alert('Failed to delete'));
    }
}

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
let currentScheduleId = null;

function addReviewRow(slot = { day: 'Monday', start: '09:00', end: '10:00', subject: '' }) {
    const tr = document.createElement('tr');
    const cell = 'padding: 0.25rem; border: 1px solid var(--border);';
    const dayOptions = DAYS.map(d =>
        `<option value="${d}" ${d === slot.day ? 'selected' : ''}>${d}</option>`).join('');
    tr.innerHTML = `
        <td style="${cell}"><select class="form-input r-day" style="padding: 0.4rem;">${dayOptions}</select></td>
        <td style="${cell}"><input type="time" class="form-input r-start" style="padding: 0.4rem;"></td>
        <td style="${cell}"><input type="time" class="form-input r-end" style="padding: 0.4rem;"></td>
        <td style="${cell}"><input type="text" class="form-input r-subject" maxlength="80" style="padding: 0.4rem;"></td>
        <td style="${cell} text-align: center;"><button type="button" class="btn btn-secondary r-del">✕</button></td>
    `;
    tr.querySelector('.r-start').value = slot.start;
    tr.querySelector('.r-end').value = slot.end;
    tr.querySelector('.r-subject').value = slot.subject;
    tr.querySelector('.r-del').onclick = () => tr.remove();
    document.getElementById('reviewBody').appendChild(tr);
}

function showReview(scheduleId, slots, warning) {
    currentScheduleId = scheduleId;
    document.getElementById('reviewBody').innerHTML = '';
    if (slots.length) {
        slots.forEach(s => addReviewRow(s));
    } else {
        addReviewRow();
    }
    document.getElementById('reviewNote').textContent =
        warning || 'Check each row against your timetable, fix anything wrong, then save.';
    const card = document.getElementById('reviewCard');
    card.style.display = 'block';
    card.scrollIntoView({ behavior: 'smooth' });
}

document.getElementById('addRowBtn').addEventListener('click', () => addReviewRow());

document.getElementById('cancelReviewBtn').addEventListener('click', () => {
    document.getElementById('reviewCard').style.display = 'none';
});

document.getElementById('saveSlotsBtn').addEventListener('click', async () => {
    const rows = [...document.querySelectorAll('#reviewBody tr')];
    const slots = rows.map(tr => ({
        day: tr.querySelector('.r-day').value,
        start: tr.querySelector('.r-start').value,
        end: tr.querySelector('.r-end').value,
        subject: tr.querySelector('.r-subject').value.trim()
    })).filter(s => s.subject && s.start && s.end);

    if (!slots.length) {
        alert('Add at least one class with a subject and times.');
        return;
    }
    const res = await fetch('/api/schedule/slots/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule_id: currentScheduleId, slots })
    });
    if (res.status === 401) { window.location.href = '/login'; return; }
    const data = await res.json();
    if (res.ok && data.success) {
        alert('Saved ' + data.saved + ' classes!');
        document.getElementById('reviewCard').style.display = 'none';
        loadSlots();
    } else {
        alert(data.error || 'Could not save the classes.');
    }
});

async function loadSlots() {
    const res = await fetch('/api/schedule/slots');
    if (res.status === 401) { window.location.href = '/login'; return; }
    const slots = await res.json();
    const box = document.getElementById('slotsView');
    if (!slots.length) {
        box.innerHTML = '<p style="color: var(--text-secondary);">No classes saved yet.</p>';
        return;
    }

    const days = DAYS.filter(d => slots.some(s => s.day === d));
    const times = [...new Set(slots.map(s => s.start_time + '|' + s.end_time))].sort();
    const cell = 'padding: 0.4rem 0.5rem; border: 1px solid var(--border); font-size: 0.85rem; vertical-align: top;';

    const header = days.map(d =>
        `<th style="${cell} background: var(--bg);">${d.slice(0, 3)}</th>`).join('');

    const rows = times.map(t => {
        const [start, end] = t.split('|');
        const cells = days.map(d => {
            const found = slots.filter(s => s.day === d && s.start_time === start && s.end_time === end);
            return `<td style="${cell}">${found.map(s => escapeHtml(s.subject)).join('<br>')}</td>`;
        }).join('');
        return `<tr>
            <td style="${cell} background: var(--bg); white-space: nowrap;">${escapeHtml(start)}–${escapeHtml(end)}</td>
            ${cells}
        </tr>`;
    }).join('');

    box.innerHTML = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; min-width: 500px;">
                <thead><tr><th style="${cell} background: var(--bg);">Time</th>${header}</tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
}

loadSchedules();
loadSlots();
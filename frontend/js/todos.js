(function () {
    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    async function api(url, options) {
        const res = await fetch(url, options);
        if (res.status === 401) { window.location.href = '/login'; return null; }
        return res;
    }

    // days from today (local time) until the due date: 0 = today, 1 = tomorrow, <0 = overdue
    function daysUntil(dateStr) {
        const p = dateStr.split('-').map(Number);
        const due = new Date(p[0], p[1] - 1, p[2]);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return Math.round((due - today) / 86400000);
    }

    function dueLabel(t) {
        if (!t.due_date) return '';
        const d = daysUntil(t.due_date);
        let text = 'Due ' + t.due_date;
        let color = 'var(--text-secondary)';
        if (!t.done) {
            if (d < 0) { text = 'Overdue (' + t.due_date + ')'; color = 'var(--danger)'; }
            else if (d === 0) { text = 'Due today'; color = 'var(--danger)'; }
            else if (d === 1) { text = 'Due tomorrow'; color = '#d97706'; }
        }
        return `<span style="color:${color}; font-size:0.8rem;"> · ${esc(text)}</span>`;
    }

    function showReminders(todos) {
        const box = document.getElementById('todoReminders');
        const pending = todos.filter(t => !t.done && t.due_date);
        const overdue = pending.filter(t => daysUntil(t.due_date) < 0);
        const today = pending.filter(t => daysUntil(t.due_date) === 0);
        const tomorrow = pending.filter(t => daysUntil(t.due_date) === 1);
        const row = (label, items, color) => items.length
            ? `<div style="border-left:4px solid ${color}; background:rgba(0,0,0,0.04); padding:0.5rem 0.75rem; border-radius:6px; margin-bottom:0.5rem;">
                 <strong>${label}:</strong> ${items.map(t => esc(t.text)).join(', ')}</div>` : '';
        box.innerHTML =
            row('⏰ Due tomorrow', tomorrow, '#d97706') +
            row('🔔 Due today', today, 'var(--danger)') +
            row('⚠️ Overdue', overdue, 'var(--danger)');
    }

    async function loadTodos() {
        const res = await api('/api/goals/todos');
        if (!res || !res.ok) return;
        const todos = await res.json();
        showReminders(todos);
        const list = document.getElementById('todoList');
        if (!todos.length) {
            list.innerHTML = '<p style="color: var(--text-secondary);">No to-dos yet. Add one above.</p>';
            return;
        }
        list.innerHTML = todos.map(t => `
            <div style="display:flex; align-items:center; gap:0.6rem; padding:0.5rem 0; border-bottom:1px solid var(--border);">
                <input type="checkbox" data-todo-id="${t.id}" ${t.done ? 'checked' : ''}>
                <div style="flex:1; ${t.done ? 'text-decoration:line-through; opacity:0.6;' : ''}">
                    ${esc(t.text)}${dueLabel(t)}
                </div>
                <button data-del-id="${t.id}" style="background:none; border:none; color:var(--danger); cursor:pointer;" title="Delete">✕</button>
            </div>
        `).join('');
    }

    async function addTodo() {
        const input = document.getElementById('todoText');
        const text = input.value.trim();
        if (!text) return;
        const due = document.getElementById('todoDue').value;
        const res = await api('/api/goals/todos', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text: text, due_date: due || null})
        });
        if (res && res.ok) {
            input.value = '';
            document.getElementById('todoDue').value = '';
            loadTodos();
        }
    }

    document.getElementById('todoAdd').addEventListener('click', addTodo);
    document.getElementById('todoText').addEventListener('keydown', e => {
        if (e.key === 'Enter') addTodo();
    });

    document.getElementById('todoList').addEventListener('change', async e => {
        const id = e.target.dataset.todoId;
        if (!id) return;
        await api('/api/goals/todos/' + id, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({done: e.target.checked})
        });
        loadTodos();
    });

    document.getElementById('todoList').addEventListener('click', async e => {
        const id = e.target.dataset.delId;
        if (!id) return;
        await api('/api/goals/todos/' + id, {method: 'DELETE'});
        loadTodos();
    });

    loadTodos();
})();
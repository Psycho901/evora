function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

document.getElementById('addGoalBtn').addEventListener('click', async () => {
    const title = document.getElementById('goalTitle').value;
    const type = document.getElementById('goalType').value;
    const exam = document.getElementById('goalExam').value;
    const deadline = document.getElementById('goalDeadline').value;

    if (!title) {
        alert('Please enter a goal title');
        return;
    }

    const res = await fetch('/api/goals/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, type, exam, deadline })
    });

    if (res.ok) {
        document.getElementById('goalTitle').value = '';
        document.getElementById('goalDeadline').value = '';
        loadGoals();
        alert('Goal added! Subtopics generated below.');
    }
});

async function loadGoals() {
    const res = await fetch('/api/goals/');
    if (res.status === 401) { window.location.href = '/login'; return; }
    const goals = await res.json();
    const list = document.getElementById('goalsList');
    list.innerHTML = '';

    // Check for upcoming deadlines
    const today = new Date();
    goals.forEach(goal => {
        if (goal.deadline) {
            const due = new Date(goal.deadline);
            const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= 3) {
                alert(`Reminder: "${goal.title}" is due in ${diffDays === 0 ? 'today' : diffDays + ' day(s)'}!`);
            }
        }
    });

    goals.forEach((goal, gIdx) => {
        const card = document.createElement('div');
        card.className = 'card';
        const subtopics = generateSubtopics(goal.title, goal.exam);
        const isTodo = goal.exam === 'To-Do' || goal.exam === 'Assignment' || goal.title.toLowerCase().includes('todo') || goal.title.toLowerCase().includes('assignment') || goal.title.toLowerCase().includes('task list');
        card.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${escapeHtml(goal.title)}</h3>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <span style="padding: 0.25rem 0.75rem; background: rgba(99, 102, 241, 0.2); color: var(--primary); border-radius: 20px; font-size: 0.85rem;">
                        ${goal.type === 'long' ? 'Long Term' : 'Short Term'} ${goal.exam && goal.exam !== '' && goal.exam !== 'To-Do' && goal.exam !== 'Assignment' ? '| ' + escapeHtml(goal.exam) : ''}
                    </span>
                    <button onclick="deleteGoal(${goal.id})" style="background: var(--danger); color: white; border: none; padding: 0.3rem 0.7rem; border-radius: 6px; cursor: pointer;">Delete</button>
                </div>
            </div>
            ${goal.deadline ? `<p style="color: ${new Date(goal.deadline) <= new Date(Date.now() + 3 * 86400000) ? 'var(--danger)' : 'var(--text-secondary)'};">Due Date: ${escapeHtml(goal.deadline)} ${new Date(goal.deadline) <= new Date(Date.now() + 3 * 86400000) ? '⚠️ Due Soon!' : ''}</p>` : ''}
            <p style="color: var(--text-secondary); margin: 0.5rem 0;">Status: ${escapeHtml(goal.status)}</p>
            <div style="margin: 1rem 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span style="color: var(--text-secondary);">Progress</span>
                    <span style="color: var(--primary); font-weight: 600;" id="progress-${gIdx}">0%</span>
                </div>
                <div style="width: 100%; height: 8px; background: var(--bg); border-radius: 4px; overflow: hidden;">
                    <div id="bar-${gIdx}" style="width: 0%; height: 100%; background: linear-gradient(90deg, var(--primary), var(--secondary)); transition: width 0.3s;"></div>
                </div>
            </div>
            ${isTodo ? `
                <h4 style="margin: 1rem 0 0.75rem; color: var(--primary);">To-Do List</h4>
                <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
                    <input type="text" id="todo-${gIdx}" class="form-input" placeholder="Add a task..." style="flex: 1;">
                    <button class="btn btn-primary" onclick="addTodo(${gIdx})">Add Task</button>
                </div>
                <div id="todo-list-${gIdx}" style="display: flex; flex-direction: column; gap: 0.5rem;"></div>
            ` : `
                <h4 style="margin: 1rem 0 0.75rem; color: var(--primary);">Action Plan & Subtopics</h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${subtopics.map((st, mainIdx) => `
                        <div style="padding: 1rem; background: var(--bg); border-radius: 8px; border-left: 3px solid var(--secondary);">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 700; color: var(--primary); font-size: 1rem;">${escapeHtml(st.split('\n')[0])}</div>
                                    <div style="margin-top: 0.25rem; font-size: 0.85rem; color: var(--text-secondary);">
                                        Section Progress: <span id="sec-prog-${gIdx}-${mainIdx}" style="color: var(--success); font-weight: 600;">0%</span>
                                    </div>
                                </div>
                                <button class="btn btn-secondary" data-sec-btn="sec-prog-${gIdx}-${mainIdx}" onclick="markSectionDone(this, ${gIdx}, ${mainIdx}, ${subtopics.length})" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">Mark Section Done</button>
                            </div>
                            <div style="margin-left: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
                                ${st.split('\n').slice(1).map((line, subIdx) => {
                                    if (line.trim() && (line.includes('├──') || line.includes('└──') || line.includes('│'))) {
                                        const topic = line.replace(/[├└│──]/g, '').trim();
                                        return `<div style="padding: 0.6rem; background: var(--bg-card); border-radius: 6px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                                            <span style="font-size: 0.9rem;">${escapeHtml(topic)}</span>
                                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                                                <span style="font-size: 0.8rem; color: var(--text-secondary);">Topic: <span id="top-${gIdx}-${mainIdx}-${subIdx}" style="color: var(--warning);">0%</span></span>
                                                <button class="btn btn-secondary" data-goal-id="${goal.id}" data-key="${escapeHtml(st.split('\n')[0] + ' > ' + topic)}" data-top-id="top-${gIdx}-${mainIdx}-${subIdx}" data-sec-id="sec-prog-${gIdx}-${mainIdx}" onclick="markTopicDone(this, ${gIdx}, ${mainIdx}, ${subIdx}, ${subtopics.length})" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Mark Done</button>
                                                <button class="btn btn-secondary" data-topic="${escapeHtml(topic)}" data-goal="${escapeHtml(goal.title)}" onclick="addToScheduleFromButton(this)" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Add to Schedule</button>
                                                <a href="/study_planner?topic=${encodeURIComponent(topic)}&subject=${encodeURIComponent(goal.exam || goal.title)}&exam=${encodeURIComponent(goal.exam || '')}" class="btn btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Study</a>
                                            </div>
                                        </div>`;
                                    }
                                    return '';
                                }).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
            ${goal.exam ? `
                <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(99, 102, 241, 0.1); border-radius: 8px;">
                    <strong style="color: var(--primary);">📋 Syllabus & Weightage Links:</strong>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.5rem;">
                        ${goal.exam === 'GATE' ? `
                            <a href="https://gate.iitk.ac.in/" target="_blank" style="color: var(--secondary);">GATE Official Syllabus</a> |
                            <a href="https://gateoverflow.in/" target="_blank" style="color: var(--secondary);">GateOverflow (Weightage & PYQs)</a>
                        ` : goal.exam === 'JEE' ? `
                            <a href="https://jeemain.nta.nic.in/" target="_blank" style="color: var(--secondary);">JEE Main (NTA)</a> |
                            <a href="https://jeeadv.ac.in/" target="_blank" style="color: var(--secondary);">JEE Advanced</a>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
        `;
        list.appendChild(card);
    });
    await restoreProgress(goals);
}

/* ---------- Topic and section progress ---------- */

function cardIndex(card) {
    return [...document.querySelectorAll('#goalsList .card')].indexOf(card);
}

function saveTopicDone(goalId, key, done = true) {
    if (!goalId || !key) return;
    fetch('/api/goals/' + goalId + '/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: key, done: done })
    }).then(res => {
        if (res.status === 401) window.location.href = '/login';
    }).catch(() => {});
}

function applyTopicDoneStyle(btn) {
    btn.textContent = '✓ Done';
    btn.style.background = 'var(--success)';
    btn.style.color = 'white';
    btn.dataset.done = 'true';
    btn.dataset.doneAt = String(Date.now());
    btn.title = 'Double-click to undo';
    const top = document.getElementById(btn.dataset.topId);
    if (top) {
        top.textContent = '100%';
        top.style.color = 'var(--success)';
    }
}

function resetTopicButton(btn) {
    btn.dataset.done = 'false';
    btn.textContent = 'Mark Done';
    btn.style.background = '';
    btn.style.color = '';
    btn.title = '';
    const top = document.getElementById(btn.dataset.topId);
    if (top) {
        top.textContent = '0%';
        top.style.color = 'var(--warning)';
    }
}

function setSectionButton(btn, isDone) {
    const wasDone = btn.dataset.done === 'true';
    if (isDone && !wasDone) {
        btn.textContent = '✓ Section Done';
        btn.style.background = 'var(--success)';
        btn.style.color = 'white';
        btn.dataset.done = 'true';
        btn.dataset.doneAt = String(Date.now());
        btn.title = 'Double-click to undo';
    } else if (!isDone && wasDone) {
        btn.textContent = 'Mark Section Done';
        btn.style.background = '';
        btn.style.color = '';
        btn.dataset.done = 'false';
        btn.title = '';
    }
}

function recalcProgress(card, gIdx) {
    const sections = {};
    let done = 0, total = 0;
    card.querySelectorAll('button[data-key]').forEach(b => {
        const s = sections[b.dataset.secId] = sections[b.dataset.secId] || { done: 0, total: 0 };
        s.total++;
        total++;
        if (b.dataset.done === 'true') { s.done++; done++; }
    });
    Object.entries(sections).forEach(([secId, s]) => {
        const el = document.getElementById(secId);
        if (el) el.textContent = Math.round((s.done / s.total) * 100) + '%';
        const secBtn = card.querySelector('button[data-sec-btn="' + secId + '"]');
        if (secBtn) setSectionButton(secBtn, s.done === s.total);
    });
    const overall = total ? Math.round((done / total) * 100) : 0;
    document.getElementById(`progress-${gIdx}`).textContent = overall + '%';
    document.getElementById(`bar-${gIdx}`).style.width = overall + '%';
}

function updateOverallProgress(gIdx, totalSections) {
    const card = document.querySelectorAll('#goalsList .card')[gIdx];
    if (card) recalcProgress(card, gIdx);
}

function markTopicDone(btn, gIdx, mainIdx, subIdx, totalSections) {
    if (btn.dataset.done === 'true') return;
    applyTopicDoneStyle(btn);
    saveTopicDone(btn.dataset.goalId, btn.dataset.key, true);
    updateOverallProgress(gIdx, totalSections);
}

function markSectionDone(btn, gIdx, mainIdx, totalSections) {
    if (btn.dataset.done === 'true') return;
    const card = btn.closest('.card');
    card.querySelectorAll('button[data-key][data-sec-id="' + btn.dataset.secBtn + '"]').forEach(b => {
        if (b.dataset.done !== 'true') {
            applyTopicDoneStyle(b);
            saveTopicDone(b.dataset.goalId, b.dataset.key, true);
        }
    });
    recalcProgress(card, gIdx);
}

function undoTopicDone(btn) {
    if (btn.dataset.done !== 'true') return;
    resetTopicButton(btn);
    saveTopicDone(btn.dataset.goalId, btn.dataset.key, false);
    const card = btn.closest('.card');
    recalcProgress(card, cardIndex(card));
}

function undoSectionDone(secBtn) {
    const card = secBtn.closest('.card');
    card.querySelectorAll('button[data-key][data-sec-id="' + secBtn.dataset.secBtn + '"]').forEach(b => {
        if (b.dataset.done === 'true') {
            resetTopicButton(b);
            saveTopicDone(b.dataset.goalId, b.dataset.key, false);
        }
    });
    recalcProgress(card, cardIndex(card));
}

async function restoreProgress(goals) {
    try {
        const res = await fetch('/api/goals/progress');
        if (!res.ok) return;
        const progress = await res.json();
        const cards = document.querySelectorAll('#goalsList .card');
        goals.forEach((goal, gIdx) => {
            const card = cards[gIdx];
            if (!card) return;
            const done = new Set(progress[String(goal.id)] || []);
            card.querySelectorAll('button[data-key]').forEach(btn => {
                if (done.has(btn.dataset.key)) applyTopicDoneStyle(btn);
            });
            recalcProgress(card, gIdx);
        });
    } catch (err) { /* progress just won't be restored */ }
}

// Double-click a finished "✓ Done" button to undo it
document.addEventListener('dblclick', function (e) {
    const topicBtn = e.target.closest('button[data-key]');
    if (topicBtn && topicBtn.dataset.done === 'true') {
        // ignore the second click of a quick double-click on "Mark Done"
        if (Date.now() - Number(topicBtn.dataset.doneAt || 0) < 700) return;
        undoTopicDone(topicBtn);
        return;
    }

    const secBtn = e.target.closest('button[data-sec-btn]');
    if (secBtn && secBtn.dataset.done === 'true') {
        if (Date.now() - Number(secBtn.dataset.doneAt || 0) < 700) return;
        undoSectionDone(secBtn);
        return;
    }

    const todoBtn = e.target.closest('button[data-todo]');
    if (todoBtn && todoBtn.dataset.done === 'true') {
        if (Date.now() - Number(todoBtn.dataset.doneAt || 0) < 700) return;
        undoTodo(todoBtn);
    }
});

/* ---------- To-do items ---------- */

function addTodo(gIdx) {
    const input = document.getElementById(`todo-${gIdx}`);
    const val = input.value.trim();
    if (!val) return;
    const list = document.getElementById(`todo-list-${gIdx}`);
    const div = document.createElement('div');
    div.style.cssText = 'padding: 0.6rem; background: var(--bg-card); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;';
    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = val;
    const doneBtn = document.createElement('button');
    doneBtn.className = 'btn btn-secondary';
    doneBtn.dataset.todo = '1';
    doneBtn.style.cssText = 'padding: 0.3rem 0.6rem; font-size: 0.8rem;';
    doneBtn.textContent = 'Mark Done';
    doneBtn.onclick = function () { toggleTodo(this); };
    div.appendChild(span);
    div.appendChild(doneBtn);
    list.appendChild(div);
    input.value = '';
}

function toggleTodo(btn) {
    if (btn.dataset.done === 'true') return;
    const span = btn.parentElement.querySelector('.todo-text');
    span.style.textDecoration = 'line-through';
    span.style.color = 'var(--text-secondary)';
    btn.textContent = '✓ Done';
    btn.style.background = 'var(--success)';
    btn.style.color = 'white';
    btn.dataset.done = 'true';
    btn.dataset.doneAt = String(Date.now());
    btn.title = 'Double-click to undo';
}

function undoTodo(btn) {
    const span = btn.parentElement.querySelector('.todo-text');
    span.style.textDecoration = '';
    span.style.color = '';
    btn.textContent = 'Mark Done';
    btn.style.background = '';
    btn.style.color = '';
    btn.dataset.done = 'false';
    btn.title = '';
}

/* ---------- Schedule and delete ---------- */

function addToSchedule(topic, goalTitle) {
    localStorage.setItem('scheduleTask', JSON.stringify({ topic, goalTitle, addedAt: new Date().toISOString() }));
    alert('Task "' + topic + '" added to scheduler!\nGo to Schedule page to allocate time.');
    window.location.href = '/schedule';
}

function addToScheduleFromButton(btn) {
    addToSchedule(btn.dataset.topic, btn.dataset.goal);
}

function deleteGoal(id) {
    if (confirm('Delete this goal?')) {
        fetch('/api/goals/' + id, { method: 'DELETE' }).then(() => location.reload());
    }
}

/* ---------- Subtopic data ---------- */

function generateSubtopics(title, exam) {
    const detailed = getSyllabus(title, exam);
    if (detailed) return detailed;
    const t = title.toLowerCase();
    if (t.includes('python')) {
        return [
            "Python Fundamentals\n  ├── Introduction\n  ├── Input & Output\n  ├── Variables\n  ├── Operators\n  ├── Keywords\n  └── Data Types",
            "Conditional Statements & Loops\n  ├── if-elif-else\n  ├── for loop\n  ├── while loop\n  └── break, continue, pass",
            "Functions\n  ├── Defining Functions\n  ├── Arguments & Return Values\n  ├── Lambda Functions\n  └── Scope & Recursion",
            "Python Data Structures\n  ├── String\n  ├── List\n  ├── Tuples\n  ├── Dictionary\n  ├── Set\n  └── Arrays",
            "Advanced Python\n  ├── OOP Concepts (Classes & Objects, Inheritance, Polymorphism)\n  ├── Exception Handling\n  ├── File Handling\n  └── Packages & Modules",
            "Python Database\n  ├── MySQL\n  └── MongoDB",
            "Data Science with Python\n  ├── NumPy\n  ├── Pandas\n  ├── Matplotlib\n  ├── Seaborn\n  ├── StatsModel\n  ├── Model Building\n  ├── TensorFlow\n  └── PyTorch",
            "Web Development with Python\n  ├── Flask\n  ├── Django\n  ├── Django ORM\n  ├── Jinja2 Templating\n  ├── Django Templates\n  └── REST API"
        ];
    } else if (t.includes('c++') || t.includes('cpp')) {
        return [
            "Basics of C++\n  ├── Syntax & Structure\n  ├── Data Types\n  └── I/O Operations",
            "Control Structures\n  ├── Conditional Statements\n  └── Loops",
            "Functions\n  ├── Function Overloading\n  └── Recursion",
            "OOPs Concepts\n  ├── Classes & Objects\n  ├── Inheritance (Hierarchical, Multiple)\n  ├── Polymorphism (Compile-time & Runtime)\n  └── Encapsulation & Abstraction",
            "Pointers & Memory\n  ├── Pointers Basics\n  ├── Dynamic Allocation\n  └── References"
        ];
    } else if (exam === 'GATE') {
        return [
            "General Aptitude (15 Marks)\n  ├── Verbal Ability\n  │   ├── English Grammar\n  │   ├── Sentence Completion\n  │   └── Verbal Analogies\n  └── Quantitative Aptitude\n      ├── Data Interpretation\n      ├── Numerical Computation\n      └── Numerical Reasoning",
            "Engineering Mathematics (10–13 Marks)\n  ├── Linear Algebra\n  │   ├── Matrix Algebra\n  │   ├── Systems of Linear Equations\n  │   ├── Eigenvalues & Eigenvectors\n  │   └── Rank of Matrix\n  ├── Calculus\n  │   ├── Functions of Single Variable\n  │   ├── Limit, Continuity & Differentiability\n  │   ├── Mean Value Theorems\n  │   ├── Functions of Two or More Variables\n  │   └── Maxima & Minima\n  ├── Probability & Statistics\n  │   ├── Probability Distributions\n  │   ├── Mean, Median, Mode & Standard Deviation\n  │   ├── Conditional Probability\n  │   └── Bayes Theorem\n  └── Discrete Mathematics\n      ├── Propositional & First Order Logic\n      ├── Sets, Relations & Functions\n      ├── Combinatorics\n      └── Graph Theory Basics",
            "Data Structures & Algorithms (10–13 Marks)\n  ├── Arrays & Linked Lists\n  │   ├── Arrays\n  │   ├── Singly Linked List\n  │   ├── Doubly Linked List\n  │   └── Circular Linked List\n  ├── Stacks & Queues\n  │   ├── Stack Operations\n  │   ├── Queue Operations\n  │   └── Applications\n  ├── Trees & Graphs\n  │   ├── Binary Trees\n  │   ├── BST\n  │   ├── AVL Trees\n  │   ├── Graph Traversals (BFS/DFS)\n  │   └── Shortest Path\n  └── Sorting & Searching\n      ├── Sorting Algorithms\n      ├── Searching Techniques\n      └── Time & Space Complexity",
            "Operating Systems (8–10 Marks)\n  ├── Process Management\n  │   ├── Process States\n  │   ├── CPU Scheduling\n  │   ├── IPC\n  │   └── Synchronization\n  ├── Memory Management\n  │   ├── Paging & Segmentation\n  │   ├── Virtual Memory\n  │   └── Page Replacement\n  └── File Systems\n      ├── File Concepts\n      ├── Directory Structure\n      └── Disk Management",
            "Computer Organization & Architecture (7–10 Marks)\n  ├── CPU Organization\n  │   ├── Instruction Formats\n  │   ├── Addressing Modes\n  │   └── Instruction Pipeline\n  ├── Pipelining\n  │   ├── Hazards\n  │   └── Branch Prediction\n  └── Memory Hierarchy\n      ├── Cache Memory\n      ├── Main Memory\n      └── Secondary Storage",
            "Theory of Computation (7–9 Marks)\n  ├── Finite Automata\n  │   ├── DFA & NFA\n  │   ├── Equivalence\n  │   └── Minimization\n  ├── Regular Languages\n  │   ├── Regular Expressions\n  │   └── Pumping Lemma\n  ├── Context Free Grammar\n  │   ├── CFG & PDA\n  │   └── Parsing\n  └── Turing Machines\n      ├── TM Concepts\n      ├── Undecidability\n      └── Recursively Enumerable Languages",
            "Database Management Systems (7–9 Marks)\n  ├── ER Model & Relational Model\n  │   ├── ER Diagrams\n  │   └── Relational Algebra\n  ├── SQL\n  │   ├── Queries\n  │   ├── Joins\n  │   └── Views\n  ├── Normalization\n  │   ├── 1NF to BCNF\n  │   └── Dependencies\n  └── Transactions\n      ├── ACID Properties\n      ├── Concurrency Control\n      └── Recovery",
            "Computer Networks (7–9 Marks)\n  ├── OSI & TCP/IP Model\n  │   ├── Layer Functions\n  │   └── Protocols\n  ├── Routing\n  │   ├── Distance Vector\n  │   ├── Link State\n  │   └── RIP/OSPF\n  ├── Congestion Control\n  │   ├── TCP Congestion\n  │   └── Algorithms\n  └── Network Security Basics\n      ├── Cryptography\n      ├── Firewalls\n      └── DNS/HTTP/HTTPS",
            "Compiler Design (5–7 Marks)\n  ├── Lexical Analysis\n  │   ├── Tokens & Lexemes\n  │   └── Regular Expressions\n  ├── Parsing\n  │   ├── LL Parsing\n  │   ├── LR Parsing\n  │   └── Syntax Trees\n  └── Code Generation\n      ├── Intermediate Code\n      ├── Optimization\n      └── Target Code",
            "Programming & C (5–6 Marks)\n  ├── C Programming Basics\n  │   ├── Data Types\n  │   ├── Operators\n  │   └── Control Statements\n  └── Pointers & Structures\n      ├── Pointers\n      ├── Arrays of Pointers\n      ├── Structures & Unions\n      └── Dynamic Memory Allocation",
            "Digital Logic (4–6 Marks)\n  ├── Boolean Algebra\n  │   ├── K-Maps\n  │   └── Minimization\n  ├── Combinational Circuits\n  │   ├── Adders/Subtractors\n  │   ├── Multiplexers\n  │   └── Decoders\n  └── Sequential Circuits\n      ├── Flip-Flops\n      ├── Counters\n      └── Registers",
            "Software Engineering & Web Technology (1–2 Marks)\n  ├── Software Engineering\n  │   ├── SDLC Models\n  │   ├── Testing\n  │   └── Agile\n  └── Web Technology Basics\n      ├── HTML/CSS/JS\n      ├── HTTP\n      └── Client-Server Model"
        ];
    } else if (exam === 'JEE') {
        return [
            "Chapter-wise Syllabus\n  ├── High Weightage Chapters\n  └── Low Weightage Chapters",
            "Concept Building\n  ├── Theory\n  └── Derivations",
            "Problem Solving\n  ├── NCERT Questions\n  ├── Previous Questions\n  └── Advanced Problems",
            "Revision\n  ├── Formula Sheet\n  └── Quick Revision Notes"
        ];
    } else {
        return [
            "Foundation\n  ├── Basics\n  └── Prerequisites",
            "Core Topics\n  ├── Main Concepts\n  └── Applications",
            "Practice\n  ├── Exercises\n  └── Projects",
            "Revision\n  └── Review & Test"
        ];
    }
}

loadGoals();
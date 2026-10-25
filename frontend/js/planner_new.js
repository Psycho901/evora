let selectedMood = null;
let selectedDuration = null;
let prefillTopic = '';
let prefillSubject = '';
let prefillExam = '';

window.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    prefillTopic = params.get('topic') || '';
    prefillSubject = params.get('subject') || '';
    prefillExam = params.get('exam') || '';
    
    // Load user goals
    try {
        const res = await fetch('/api/goals/');
        const goals = await res.json();
        const goalsSection = document.createElement('div');
        goalsSection.className = 'card';
        goalsSection.innerHTML = `
            <h2 class="card-title" style="margin-bottom: 1rem;">Your Goals (Linked)</h2>
            ${goals.length === 0 ? '<p style="color: var(--text-secondary);">No goals yet. <a href="/goals" style="color: var(--primary);">Create one</a></p>' : 
                goals.map(g => `<div style="padding: 0.75rem; background: var(--bg); margin-bottom: 0.5rem; border-radius: 8px; border-left: 3px solid var(--primary);">
                    <strong>${g.title}</strong> ${g.exam ? '(' + g.exam + ')' : ''} - <span style="color: var(--text-secondary);">${g.type}</span>
                    <a href="/goals" style="float: right; color: var(--secondary);">View Details</a>
                </div>`).join('')}
        `;
        document.querySelector('.container').insertBefore(goalsSection, document.getElementById('step1'));
    } catch(e) {}
    
    if (prefillTopic) {
        selectedMood = 'okay';
        selectedDuration = 'short';
        generatePlanWithPrefill();
    }
});

document.querySelectorAll('#step1 .mood-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('#step1 .mood-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        selectedMood = option.dataset.mood;
        document.getElementById('next1').disabled = false;
    });
});

document.getElementById('next1').addEventListener('click', () => {
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
});

document.querySelectorAll('#step2 .mood-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('#step2 .mood-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        selectedDuration = option.dataset.duration;
        document.getElementById('next2').disabled = false;
    });
});

document.getElementById('next2').addEventListener('click', async () => {
    generatePlan();
});

function generatePlanWithPrefill() {
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('planResult').style.display = 'block';
    
    document.getElementById('planSummary').textContent = 
        `Studying: ${prefillTopic} ${prefillSubject && prefillSubject !== prefillTopic ? '| ' + prefillSubject : ''} ${prefillExam ? '| ' + prefillExam : ''}`;
    
    generateTopicsForPrefill();
    generateResourcesForPrefill();
}

function generateTopicsForPrefill() {
    const topicsDiv = document.getElementById('topicsList');
    topicsDiv.innerHTML = '';
    
    const topics = [
        {name: `Learn: ${prefillTopic}`, time: "20-30 min", priority: "High"},
        {name: "Practice Questions", time: "15-20 min", priority: "High"},
        {name: "Revise & Make Notes", time: "10-15 min", priority: "Medium"}
    ];
    
    topics.forEach((topic, idx) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h3 style="margin-bottom: 0.5rem;">${idx + 1}. ${topic.name}</h3>
                    <p style="color: var(--text-secondary);">⏱️ ${topic.time} | Priority: <span style="color: ${topic.priority === 'High' ? 'var(--danger)' : 'var(--warning)'}">${topic.priority}</span></p>
                </div>
                <button class="btn btn-secondary" onclick="alert('Task marked in progress!')">Start</button>
            </div>
        `;
        topicsDiv.appendChild(card);
    });
}

async function generateResourcesForPrefill() {
    const resourcesDiv = document.getElementById('resourcesList');
    resourcesDiv.innerHTML = '<p style="color: var(--text-secondary);">Loading resources...</p>';
    
    try {
        const res = await fetch('/api/planner/recommend', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({subject: prefillSubject, topic: prefillTopic, exam: prefillExam})
        });
        const data = await res.json();
        resourcesDiv.innerHTML = '';
        
        // Add website/resources first
        if (data.resources && data.resources.length > 0) {
            const resHeader = document.createElement('h3');
            resHeader.style.gridColumn = '1/-1';
            resHeader.style.marginTop = '0.5rem';
            resHeader.textContent = '📚 Study Resources & Syllabus';
            resourcesDiv.appendChild(resHeader);
            
            data.resources.forEach(resItem => {
                const card = document.createElement('a');
                card.href = resItem.url;
                card.target = '_blank';
                card.style.textDecoration = 'none';
                card.className = 'card';
                card.style.padding = '1rem';
                card.innerHTML = `
                    <div style="font-weight: 600; color: var(--primary); margin-bottom: 0.25rem;">${resItem.title}</div>
                    <div style="color: var(--text-secondary); font-size: 0.85rem;">Source: ${resItem.source}</div>
                    <div style="color: var(--secondary); font-size: 0.8rem; margin-top: 0.25rem;">Click to visit →</div>
                `;
                resourcesDiv.appendChild(card);
            });
        }
        
        // Add YouTube videos
        if (data.videos && data.videos.length > 0) {
            const ytHeader = document.createElement('h3');
            ytHeader.style.gridColumn = '1/-1';
            ytHeader.style.marginTop = '1rem';
            ytHeader.textContent = '🎥 YouTube Videos';
            resourcesDiv.appendChild(ytHeader);
            
            data.videos.forEach(video => {
                const card = document.createElement('a');
                card.href = video.url;
                card.target = '_blank';
                card.style.textDecoration = 'none';
                card.className = 'video-card';
                card.innerHTML = `
                    <img src="${video.thumbnail}" alt="${video.title}" class="video-thumb" onerror="this.src='https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg'">
                    <div class="video-info">
                        <div class="video-title">${video.title}</div>
                        <div class="video-channel">${video.channel}</div>
                    </div>
                `;
                resourcesDiv.appendChild(card);
            });
        }
        
        if ((!data.resources || data.resources.length === 0) && (!data.videos || data.videos.length === 0)) {
            resourcesDiv.innerHTML = '<p style="color: var(--text-secondary);">No resources found.</p>';
        }
    } catch (err) {
        resourcesDiv.innerHTML = '<p style="color: var(--text-secondary);">Error loading resources.</p>';
    }
}

async function generatePlan() {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('planResult').style.display = 'block';
    
    const moodText = {
        low: "low energy - take it easy with light revision",
        okay: "okay mood - steady progress is perfect",
        good: "good mood - great time to learn something new",
        focused: "focused state - tackle challenging topics"
    };
    
    const durationText = {
        short: "30-45 minute session",
        long: "1-3 hour session"
    };
    
    document.getElementById('planSummary').textContent = 
        `Based on your ${moodText[selectedMood]} and ${durationText[selectedDuration]}, here's your plan tailored to your goals.`;
    
    await generateTopicsFromGoals();
    generateResources();
}

async function generateTopicsFromGoals() {
    const topicsDiv = document.getElementById('topicsList');
    topicsDiv.innerHTML = '<p style="color: var(--text-secondary);">Loading topics from your goals...</p>';
    
    try {
        const res = await fetch('/api/goals/');
        const goals = await res.json();
        topicsDiv.innerHTML = '';
        
        if (goals.length === 0) {
            topicsDiv.innerHTML = '<div class="card"><p style="color: var(--text-secondary);">No goals found. <a href="/goals" style="color: var(--primary);">Add goals first</a> to get personalized recommendations.</p></div>';
            return;
        }
        
        let allTopics = [];
        goals.forEach(goal => {
            const subtopics = getSubtopicsForGoal(goal.title, goal.exam);
            subtopics.slice(0, selectedDuration === 'short' ? 2 : 4).forEach(st => {
                allTopics.push({
                    goal: goal.title,
                    topic: st.split('\n')[0],
                    full: st,
                    exam: goal.exam
                });
            });
        });
        
        if (selectedMood === 'low') {
            allTopics = allTopics.slice(0, 3);
        }
        
        allTopics.slice(0, selectedDuration === 'short' ? 4 : 6).forEach((item, idx) => {
            const card = document.createElement('div');
            card.className = 'card';
            const time = selectedDuration === 'short' ? '15-20 min' : '30-40 min';
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 0.5rem;">
                    <div style="flex: 1; min-width: 250px;">
                        <h3 style="margin-bottom: 0.25rem;">${idx + 1}. ${item.topic}</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">From Goal: ${item.goal} ${item.exam ? '| ' + item.exam : ''}</p>
                        <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 0.25rem;">⏱️ ${time} | Priority: High</p>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <a href="/study_planner?topic=${encodeURIComponent(item.topic)}&subject=${encodeURIComponent(item.exam || item.goal)}&exam=${encodeURIComponent(item.exam || '')}" class="btn btn-primary">Study Now</a>
                        <button class="btn btn-secondary" onclick="alert('Added to today\\'s plan!')">Add to Plan</button>
                    </div>
                </div>
            `;
            topicsDiv.appendChild(card);
        });
    } catch(e) {
        topicsDiv.innerHTML = '<p style="color: var(--text-secondary);">Error loading goals.</p>';
    }
}

function getSubtopicsForGoal(title, exam) {
    const t = title.toLowerCase();
    if (t.includes('python')) {
        return ["Python Fundamentals", "Conditional Statements & Loops", "Functions", "Python Data Structures", "Advanced Python"];
    } else if (t.includes('c++')) {
        return ["Basics of C++", "Control Structures", "OOPs Concepts", "Pointers & Memory"];
    } else if (exam === 'GATE') {
        return ["Engineering Mathematics", "Data Structures & Algorithms", "Operating Systems", "Computer Networks", "DBMS"];
    } else if (exam === 'JEE') {
        return ["Concept Building", "Problem Solving", "Revision"];
    }
    return ["Core Concepts", "Practice", "Revision"];
}

function generateTopics() {
    const topicsDiv = document.getElementById('topicsList');
    topicsDiv.innerHTML = '';
    
    let topics = [];
    if (selectedDuration === 'short') {
        if (selectedMood === 'low') {
            topics = [
                {name: "Quick Revision - Previous Day's Notes", time: "15-20 min", priority: "High"},
                {name: "Flashcards Practice", time: "10-15 min", priority: "High"},
                {name: "MCQ Practice (Easy)", time: "10 min", priority: "Medium"}
            ];
        } else {
            topics = [
                {name: "Formula Revision", time: "10-15 min", priority: "High"},
                {name: "Concept Recap", time: "15-20 min", priority: "High"},
                {name: "Practice Questions", time: "10-15 min", priority: "Medium"}
            ];
        }
    } else {
        if (selectedMood === 'focused') {
            topics = [
                {name: "New Topic - Core Concepts", time: "40-60 min", priority: "High"},
                {name: "Problem Solving Practice", time: "30-40 min", priority: "High"},
                {name: "Advanced Examples", time: "20-30 min", priority: "High"},
                {name: "Revision & Notes", time: "15-20 min", priority: "Medium"}
            ];
        } else {
            topics = [
                {name: "New Concept Learning", time: "30-45 min", priority: "High"},
                {name: "Examples & Applications", time: "25-35 min", priority: "High"},
                {name: "Practice Exercises", time: "20-30 min", priority: "Medium"},
                {name: "Quick Revision", time: "10-15 min", priority: "Medium"}
            ];
        }
    }
    
    topics.forEach((topic, idx) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h3 style="margin-bottom: 0.5rem;">${idx + 1}. ${topic.name}</h3>
                    <p style="color: var(--text-secondary);">⏱️ ${topic.time} | Priority: <span style="color: ${topic.priority === 'High' ? 'var(--danger)' : 'var(--warning)'}">${topic.priority}</span></p>
                </div>
                <button class="btn btn-secondary" onclick="alert('Task added to your plan!')">Mark as Started</button>
            </div>
        `;
        topicsDiv.appendChild(card);
    });
}

async function generateResources() {
    const resourcesDiv = document.getElementById('resourcesList');
    resourcesDiv.innerHTML = '<p style="color: var(--text-secondary);">Loading recommendations...</p>';
    
    try {
        const res = await fetch('/api/planner/recommend', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({subject: 'General', topic: selectedDuration === 'short' ? 'quick revision' : 'concept explained'})
        });
        const data = await res.json();
        resourcesDiv.innerHTML = '';
        
        if (data.videos && data.videos.length > 0) {
            data.videos.forEach(video => {
                const card = document.createElement('a');
                card.href = video.url;
                card.target = '_blank';
                card.style.textDecoration = 'none';
                card.className = 'video-card';
                card.innerHTML = `
                    <img src="${video.thumbnail}" alt="${video.title}" class="video-thumb" onerror="this.src='https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg'">
                    <div class="video-info">
                        <div class="video-title">${video.title}</div>
                        <div class="video-channel">${video.channel}</div>
                    </div>
                `;
                resourcesDiv.appendChild(card);
            });
        } else {
            resourcesDiv.innerHTML = '<p style="color: var(--text-secondary);">No videos available.</p>';
        }
    } catch (err) {
        resourcesDiv.innerHTML = '<p style="color: var(--text-secondary);">Check back for recommendations.</p>';
    }
}

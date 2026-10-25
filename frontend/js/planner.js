document.getElementById('searchBtn').addEventListener('click', async () => {
    const subject = document.getElementById('subject').value;
    const topic = document.getElementById('topic').value;
    
    if (!subject || !topic) {
        alert('Please enter both subject and topic');
        return;
    }
    
    const res = await fetch('/api/planner/recommend', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({subject, topic})
    });
    
    const data = await res.json();
    const videosDiv = document.getElementById('videos');
    videosDiv.innerHTML = '';
    
    if (data.videos.length === 0) {
        videosDiv.innerHTML = '<p style="color: var(--text-secondary);">No videos found. Try different keywords.</p>';
        return;
    }
    
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
        videosDiv.appendChild(card);
    });
});

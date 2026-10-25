(function () {
    const nav = document.querySelector('.navbar');
    const links = document.querySelector('.nav-links');
    if (!nav || !links) return;

    const btn = document.createElement('button');
    btn.className = 'nav-toggle';
    btn.setAttribute('aria-label', 'Menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span></span><span></span><span></span>';

    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';

    nav.appendChild(btn);
    document.body.appendChild(overlay);

    function setOpen(open) {
        links.classList.toggle('open', open);
        overlay.classList.toggle('show', open);
        btn.setAttribute('aria-expanded', open);
    }

    btn.addEventListener('click', () => setOpen(!links.classList.contains('open')));
    overlay.addEventListener('click', () => setOpen(false));
    links.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
})();
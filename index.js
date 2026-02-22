/* ========================================
   PARTHA BHUYAN PORTFOLIO - index.js
   Dynamic Google Sheets Integration
   ======================================== */
'use strict';

const BASE_URL = "https://script.google.com/macros/s/AKfycbxIlimI20jAJK7sH8x-2fCYaepJrTgaLIsIqdn8qOXoUI7H1fQRmUZ2hZSNnhKeIkf-5g/exec";

/* ─── UTILS ─── */
function driveUrl(raw) {
    if (!raw) return '';
    const s = String(raw).trim();
    // Extract file ID from any Drive share URL
    const m = s.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w800`;
    // If already a direct URL, return as-is
    if (s.startsWith('http')) return s;
    return '';
}

async function apiGet(endpoint) {
    const res = await fetch(`${BASE_URL}?endpoint=${endpoint}`);
    return res.json();
}

async function apiPost(endpoint, data) {
    // No Content-Type header: prevents CORS preflight that GAS Web Apps cannot handle
    const res = await fetch(`${BASE_URL}?endpoint=${endpoint}`, {
        method: 'POST',
        body:   JSON.stringify(data)
    });
    return res.json();
}

/* ═══════════════════════════════════════
   PAGE LOADER
   ═══════════════════════════════════════ */
const pageLoader = document.getElementById('pageLoader');
const loaderBar  = document.getElementById('loaderBar');
const loaderText = document.getElementById('loaderText');

const loaderMessages = ['Initializing...', 'Loading Assets...', 'Building Interface...', 'Securing Connection...', 'Ready!'];
let loaderProgress = 0, msgIdx = 0;

const loaderInterval = setInterval(() => {
    loaderProgress += Math.random() * 14 + 4;
    if (loaderProgress >= 90) { clearInterval(loaderInterval); return; }
    loaderBar.style.width = Math.min(loaderProgress, 90) + '%';
    if (msgIdx < loaderMessages.length - 1 && loaderProgress > (msgIdx + 1) * 20) {
        loaderText.textContent = loaderMessages[msgIdx++];
    }
}, 110);

function hideLoader() {
    clearInterval(loaderInterval);
    loaderBar.style.width = '100%';
    loaderText.textContent = 'Ready!';
    setTimeout(() => {
        pageLoader.classList.add('hidden');
        setTimeout(() => {
            document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
                if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('revealed');
            });
        }, 200);
    }, 500);
}

window.addEventListener('load', () => setTimeout(hideLoader, 700));
setTimeout(hideLoader, 4000);

/* ═══════════════════════════════════════
   THEME TOGGLE
   ═══════════════════════════════════════ */
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');
const html        = document.documentElement;

const savedTheme = localStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', savedTheme);
themeIcon.className = savedTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';

themeToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    themeToggle.classList.add('spinning');
    setTimeout(() => { themeIcon.className = next === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun'; }, 250);
    setTimeout(() => themeToggle.classList.remove('spinning'), 520);
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
});

/* ═══════════════════════════════════════
   HAMBURGER + MOBILE NAV
   ═══════════════════════════════════════ */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

/* ── Inject drawer header (close btn + logo) if not already present ── */
if (!document.getElementById('drawer-header')) {
    const drawerHeader = document.createElement('div');
    drawerHeader.id = 'drawer-header';
    drawerHeader.innerHTML = `
        <span class="drawer-logo"><span class="logo-bracket">&lt;</span>PB<span class="logo-bracket">/&gt;</span></span>
        <button class="drawer-close" id="drawerClose" aria-label="Close menu">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>`;
    navLinks.prepend(drawerHeader);
}

/* ── Overlay ── */
const navOverlay = document.createElement('div');
navOverlay.className = 'nav-overlay';
document.body.appendChild(navOverlay);

function openNav() {
    navLinks.classList.add('open');
    navOverlay.classList.add('visible');
    document.body.classList.add('nav-open');
    hamburger.setAttribute('aria-expanded', 'true');
}
function closeNav() {
    navLinks.classList.remove('open');
    navOverlay.classList.remove('visible');
    document.body.classList.remove('nav-open');
    hamburger.setAttribute('aria-expanded', 'false');
}

hamburger.addEventListener('click', () => navLinks.classList.contains('open') ? closeNav() : openNav());
navOverlay.addEventListener('click', closeNav);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
navLinks.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', closeNav));
document.addEventListener('click', e => { if (e.target.closest('#drawerClose')) closeNav(); });

/* ═══════════════════════════════════════
   NAVBAR SCROLL + ACTIVE LINK
   ═══════════════════════════════════════ */
const navbar       = document.getElementById('navbar');
const scrollTopBtn = document.getElementById('scrollTop');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
    updateActiveNav();
});

function updateActiveNav() {
    const scrollY = window.scrollY + 130;
    document.querySelectorAll('section[id]').forEach(section => {
        const link = document.querySelector('.nav-link[href="#' + section.id + '"]');
        if (!link) return;
        if (scrollY >= section.offsetTop && scrollY < section.offsetTop + section.offsetHeight) {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    });
}

scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ═══════════════════════════════════════
   SMOOTH SCROLL
   ═══════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const href = a.getAttribute('href');
        if (href === '#') return;
        const target = document.querySelector(href);
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
});

/* ═══════════════════════════════════════
   REVEAL ON SCROLL
   ═══════════════════════════════════════ */
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

function observeReveal() {
    document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => revealObserver.observe(el));
}
observeReveal();

/* ═══════════════════════════════════════
   SKILL BARS
   ═══════════════════════════════════════ */
let skillsAnimated = false;
const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !skillsAnimated) {
            skillsAnimated = true;
            animateAllSkills();
            skillObserver.disconnect();
        }
    });
}, { threshold: 0.25 });
const skillsSection = document.querySelector('.skills');
if (skillsSection) skillObserver.observe(skillsSection);

function animateAllSkills() {
    document.querySelectorAll('.skill-item').forEach((item, idx) => {
        const bar = item.querySelector('.skill-fill');
        const nameRow = item.querySelector('.skill-name');
        if (!bar || !nameRow) return;
        const targetW = parseInt(bar.getAttribute('data-width')) || 0;
        const pctSpan = nameRow.querySelectorAll('span')[1];
        if (!pctSpan) return;
        bar.style.width = '0%';
        pctSpan.textContent = '0%';
        setTimeout(() => {
            bar.style.width = targetW + '%';
            const duration = 1500, startTime = performance.now();
            function countUp(now) {
                const p = Math.min((now - startTime) / duration, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                pctSpan.textContent = Math.round(eased * targetW) + '%';
                if (p < 1) requestAnimationFrame(countUp);
                else pctSpan.textContent = targetW + '%';
            }
            requestAnimationFrame(countUp);
        }, idx * 90);
    });
}

/* ═══════════════════════════════════════
   TABS
   ═══════════════════════════════════════ */
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const panel = document.getElementById('tab-' + tabId);
        if (panel) panel.classList.add('active');
    });
});

/* ═══════════════════════════════════════
   HERO ROLES TICKER
   ═══════════════════════════════════════ */
const roleItems = Array.from(document.querySelectorAll('.role-item'));
if (roleItems.length) {
    let rIdx = 0;
    roleItems.forEach((r, i) => r.style.display = i === 0 ? 'block' : 'none');
    setInterval(() => {
        roleItems[rIdx].style.display = 'none';
        rIdx = (rIdx + 1) % roleItems.length;
        const nxt = roleItems[rIdx];
        nxt.style.display = 'block';
        nxt.style.animation = 'none';
        void nxt.offsetWidth;
        nxt.style.animation = 'fadeInUp 0.4s ease forwards';
    }, 2200);
}

/* ═══════════════════════════════════════
   PORTFOLIO — DYNAMIC RENDER
   Exact CSS structure: .project-card > .project-img > .project-info
   ═══════════════════════════════════════ */
async function loadPortfolio() {
    const grid = document.getElementById('portfolioGrid');
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)"><i class="fa-solid fa-spinner fa-spin"></i> Loading projects...</div>';

    try {
        const projects = await apiGet('portfolio');
        if (!Array.isArray(projects) || !projects.length) {
            grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">No projects found.</div>';
            return;
        }

        grid.innerHTML = projects.map((p, i) => {
            const imgUrl = driveUrl(p['project-img']);

            // Image area: use background-image style on .project-img if URL exists
            // or show placeholder icon. CSS expects .project-img with aspect-ratio:16/9
            const imgInner = imgUrl
                ? `<img src="${imgUrl}" alt="${escHtml(p['project-title'])}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0"
                     onerror="this.remove(); this.parentElement.querySelector('.project-img-placeholder').style.display='flex'">
                   <div class="project-img-placeholder" style="display:none"><i class="fa-solid fa-code"></i></div>`
                : `<div class="project-img-placeholder"><i class="fa-solid fa-code"></i></div>`;

            // Tool badges — split comma-separated tools
            const tools = p['tools'] ? String(p['tools']).split(',').map(t => t.trim()).filter(Boolean) : [];
            const toolBadgesHtml = tools.length
                ? `<div class="tool-badges reveal-up" style="--delay:${i * 0.1 + 0.1}s;margin-top:12px;display:flex;flex-wrap:wrap;gap:6px">${tools.map(t => `<span class="tool-badge" style="display:inline-block;padding:3px 12px;border-radius:30px;font-size:11px;font-family:var(--font-mono);background:var(--accent-glow);color:var(--accent);border:1px solid var(--border-bright);letter-spacing:.5px">${escHtml(t)}</span>`).join('')}</div>`
                : '';

            const projectLink = p['project-link'] || '#';

            return `
            <div class="project-card reveal-up" style="--delay:${i * 0.1}s">
                <div class="project-img" style="position:relative">
                    ${imgInner}
                    <div class="project-overlay">
                        <a href="${projectLink}" target="_blank" rel="noopener" class="project-link">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                    </div>
                </div>
                <div class="project-info">
                    <span class="project-tag">${escHtml(p['project-tag'] || '')}</span>
                    <h3>${escHtml(p['project-title'] || '')}</h3>
                    <p>${escHtml(p['p-description'] || '')}</p>
                    ${toolBadgesHtml}
                </div>
            </div>`;
        }).join('');

        observeReveal();
    } catch (err) {
        console.error('Portfolio error:', err);
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">Failed to load projects.</div>';
    }
}

/* ═══════════════════════════════════════
   TESTIMONIALS — DYNAMIC
   ═══════════════════════════════════════ */
async function loadTestimonials() {
    const track = document.getElementById('testimonialTrack');
    if (!track) { initCarousel(); return; }

    try {
        const feedbacks = await apiGet('feedback');
        const latest = Array.isArray(feedbacks) ? feedbacks.slice(-5).reverse() : [];

        if (latest.length) {
            track.innerHTML = latest.map(f => {
                const rating = parseInt(f['star-rating']) || 5;
                const stars = Array.from({length:5}, (_,i) =>
                    `<i class="${i < rating ? 'fa-solid' : 'fa-regular'} fa-star"></i>`).join('');
                const avatarUrl = driveUrl(f['profileimage']);
                const avatarHtml = avatarUrl
                    ? `<img src="${avatarUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover" onerror="this.outerHTML='<i class=\\'fa-solid fa-user\\'></i>'">`
                    : `<i class="fa-solid fa-user"></i>`;
                return `
                <div class="testimonial-card">
                    <div class="testimonial-stars">${stars}</div>
                    <p>"${escHtml(f['feedbacktext'] || '')}"</p>
                    <div class="testimonial-author">
                        <div class="author-avatar" style="overflow:hidden">${avatarHtml}</div>
                        <div>
                            <h4>${escHtml(f['clientname'] || f['feedbackemail'] || 'Anonymous')}</h4>
                            <span>${escHtml(f['profession'] || '')}</span>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }
    } catch (err) {
        console.error('Testimonials error:', err);
    }
    initCarousel();
}

/* ═══════════════════════════════════════
   CAROUSEL ENGINE
   ═══════════════════════════════════════ */
function initCarousel() {
    if (window.__carouselInited) return;
    window.__carouselInited = true;

    const carouselEl = document.querySelector('.testimonial-carousel');
    const track      = document.getElementById('testimonialTrack');
    const prevBtn    = document.getElementById('prevBtn');
    const nextBtn    = document.getElementById('nextBtn');
    const dotsWrap   = document.getElementById('carouselDots');
    if (!track || !carouselEl || !prevBtn || !nextBtn || !dotsWrap) return;

    const origCards = Array.from(track.querySelectorAll('.testimonial-card'));
    const total = origCards.length;
    if (!total) return;

    const CLONES = total;
    origCards.slice(-CLONES).map(c => { const cl = c.cloneNode(true); cl.setAttribute('aria-hidden','true'); return cl; })
        .forEach(cl => track.insertBefore(cl, track.firstChild));
    origCards.slice(0, CLONES).map(c => { const cl = c.cloneNode(true); cl.setAttribute('aria-hidden','true'); return cl; })
        .forEach(cl => track.appendChild(cl));

    const allCards = Array.from(track.querySelectorAll('.testimonial-card'));
    let current = CLONES, autoTimer = null, isPaused = false, isTransitioning = false;

    dotsWrap.innerHTML = '';
    origCards.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => { if (isTransitioning) return; stopAuto(); goTo(CLONES + i); startAuto(); });
        dotsWrap.appendChild(dot);
    });

    function getCardW() { return allCards[0].offsetWidth + 24; }
    function jumpTo(idx) { track.style.transition = 'none'; track.style.transform = `translateX(-${idx * getCardW()}px)`; void track.offsetHeight; }
    function slideTo(idx) { track.style.transition = 'transform 0.52s cubic-bezier(0.4,0,0.2,1)'; track.style.transform = `translateX(-${idx * getCardW()}px)`; }
    function updateDots() { const r = ((current - CLONES) % total + total) % total; dotsWrap.querySelectorAll('.dot').forEach((d,i) => d.classList.toggle('active', i === r)); }
    function goTo(idx) { if (isTransitioning) return; isTransitioning = true; current = idx; slideTo(current); updateDots(); }

    track.addEventListener('transitionend', () => {
        isTransitioning = false;
        if (current >= CLONES + total) { current -= total; jumpTo(current); }
        else if (current < CLONES) { current += total; jumpTo(current); }
        updateDots();
    });

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }
    function startAuto() { stopAuto(); if (!isPaused) autoTimer = setInterval(() => { if (!isTransitioning) next(); }, 3600); }
    function stopAuto()  { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }

    nextBtn.addEventListener('click', () => { stopAuto(); next(); startAuto(); });
    prevBtn.addEventListener('click', () => { stopAuto(); prev(); startAuto(); });
    carouselEl.addEventListener('mouseenter', () => { isPaused = true;  stopAuto(); });
    carouselEl.addEventListener('mouseleave', () => { isPaused = false; startAuto(); });

    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; stopAuto(); }, { passive: true });
    track.addEventListener('touchend', e => { const d = touchStartX - e.changedTouches[0].screenX; if (Math.abs(d) > 45) d > 0 ? next() : prev(); startAuto(); }, { passive: true });

    function setCardWidths() {
        const w = window.innerWidth, gap = 24, cont = carouselEl.offsetWidth || window.innerWidth;
        let cardW;
        if (w < 640) cardW = cont - 32;
        else if (w < 1024) cardW = Math.floor((cont - gap) / 2);
        else cardW = Math.floor((cont - gap * 2) / 3);
        allCards.forEach(c => { c.style.minWidth = cardW + 'px'; c.style.width = cardW + 'px'; });
    }

    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { setCardWidths(); jumpTo(current); }, 150); });

    function boot() { setCardWidths(); jumpTo(current); updateDots(); startAuto(); }
    if (document.readyState === 'complete') setTimeout(boot, 900);
    else window.addEventListener('load', () => setTimeout(boot, 900));
}

/* ═══════════════════════════════════════
   CONTACT FORM
   ═══════════════════════════════════════ */
const contactForm = document.getElementById('contactForm');
const formStatus  = document.getElementById('formStatus');

if (contactForm) {
    let _isSubmitting = false;  // guard against double-submit

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (_isSubmitting) return;
        _isSubmitting = true;
        const btn = document.getElementById('submitBtn');
        btn.disabled  = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
        const fd = new FormData(contactForm);
        const data = { name: fd.get('name')||'', email: fd.get('email')||'', subject: fd.get('subject')||'', message: fd.get('message')||'' };
        try {
            const result = await apiPost('contact', data);
            if (result.success) {
                formStatus.className = 'form-status success';
                formStatus.textContent = "✅ Message sent! I'll respond within 24 hours.";
                contactForm.reset();
            } else throw new Error(result.error || 'Failed');
        } catch (err) {
            formStatus.className = 'form-status error';
            formStatus.textContent = '❌ Failed to send. Email me: parthabhuyan@myyahoo.com';
        } finally {
            btn.disabled  = false;
            btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Message';
            _isSubmitting = false;
            setTimeout(() => { formStatus.className = 'form-status'; formStatus.textContent = ''; }, 6000);
        }
    });
}

/* ─── HELPER ─── */
function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/*---Auto Year---*/ 

document.getElementById("year").textContent = new Date().getFullYear();


/* ═══════════════════════════════════════
   INIT
   ═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    loadPortfolio();
    loadTestimonials();
});

console.log('%c⚡ Partha Bhuyan Portfolio', 'background:#060b14;color:#3b82f6;padding:8px 16px;border-radius:4px;font-size:14px;font-weight:bold;border-left:3px solid #8b5cf6;');

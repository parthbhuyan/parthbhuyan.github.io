/* ========================================
   AWARDS PAGE — awards.js (FIXED)
   ======================================== */
'use strict';

const BASE_URL = "https://script.google.com/macros/s/AKfycbxIlimI20jAJK7sH8x-2fCYaepJrTgaLIsIqdn8qOXoUI7H1fQRmUZ2hZSNnhKeIkf-5g/exec";

/* ─── API ─── */
async function apiGet(endpoint) {
    const res = await fetch(`${BASE_URL}?endpoint=${endpoint}`);
    return res.json();
}

/* ─── UTILS ─── */
function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function sanitizeIconHtml(raw) {
    if (!raw) return '<i class="fa-solid fa-trophy"></i>';
    let s = String(raw).trim();
    const opens  = (s.match(/<i\b/gi) || []).length;
    const closes = (s.match(/<\/i>/gi) || []).length;
    if (opens > closes) s += '</i>';
    return s;
}

/*
 * normalizeUrl() — FIXED
 * Strips ALL invisible/control characters and whitespace
 */
function normalizeUrl(val) {
    if (!val) return '';
    
    // Convert to string and strip ALL whitespace and control characters
    return String(val)
        .replace(/\s+/g, '') // All whitespace
        .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '') // Zero-width, BOM, nbsp
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Control characters
        .trim();
}

/*
 * isValidUrl() — ROBUST
 * Only accepts proper http(s):// URLs
 */
function isValidUrl(val) {
    const s = normalizeUrl(val);
    if (!s || s.length < 10) return false;
    return s.startsWith('http://') || s.startsWith('https://');
}

/* ─── THEME ─── */
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');
const html        = document.documentElement;
const savedTheme  = localStorage.getItem('theme') || 'dark';
html.setAttribute('data-theme', savedTheme);
themeIcon.className = savedTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
themeToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    themeIcon.className = next === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
});

/* ─── MOBILE NAV ─── */
(function () {
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);

    const ham = document.getElementById('hamburger');
    const nav = document.getElementById('nav-links');

    function openNav() {
        nav.classList.add('open');
        ham.setAttribute('aria-expanded','true');
        overlay.classList.add('visible');
        document.body.classList.add('nav-open');
    }
    function closeNav() {
        nav.classList.remove('open');
        ham.setAttribute('aria-expanded','false');
        overlay.classList.remove('visible');
        document.body.classList.remove('nav-open');
    }


    /* ── Inject drawer close button (same as index.js) ── */
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
        nav.prepend(drawerHeader);
    }
    document.addEventListener('click', e => { if (e.target.closest('#drawerClose')) closeNav(); });

    ham.addEventListener('click', () => nav.classList.contains('open') ? closeNav() : openNav());
    overlay.addEventListener('click', closeNav);
    nav.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', closeNav));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNav(); });
})();

/* ─── NAVBAR SCROLL ─── */
const navbar       = document.getElementById('navbar');
const scrollTopBtn = document.getElementById('scrollTop');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
});
scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ─── REVEAL ON SCROLL ─── */
const revealObserver = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); }),
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);
function observeReveal() {
    document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right')
        .forEach(el => revealObserver.observe(el));
}
observeReveal();

/* ═══════════════════════════════════════════════════════
   AWARDS — DYNAMIC RENDER (FIXED)
   ═══════════════════════════════════════════════════════ */
async function loadAwards() {
    const grid = document.getElementById('awardsGrid');
    if (!grid) return;

    grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">
            <i class="fa-solid fa-spinner fa-spin"></i>&nbsp; Loading awards...
        </div>`;

    try {
        const awards = await apiGet('awards');

        if (!Array.isArray(awards) || !awards.length) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">No awards found.</div>`;
            return;
        }

        grid.innerHTML = awards.map((a, i) => buildAwardCard(a, i)).join('');
        observeReveal();
        initFilter();

    } catch (err) {
        console.error('Awards load error:', err);
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">
            Failed to load awards. Please refresh.
        </div>`;
    }
}

function buildAwardCard(a, i) {
    const catRaw   = String(a['award-cat-badge'] || '').trim();
    const catClass = catRaw.toLowerCase()
        .replace(/hackathons?/, 'hackathon')
        .replace(/certifications?/, 'certification')
        .replace(/academics?/, 'academic')
        .replace(/\s+/g, '');
    const catLabel = catRaw.toUpperCase();

    const iconHtml = sanitizeIconHtml(a['award-icon']);

    /* ── View Certificate button (FIXED) ────────────────────
       Extract and normalize the award-link value.
       Debug: Console will show what backend returns.      */
    
    const rawLink = a['award-link'];
    const linkVal = normalizeUrl(rawLink);
    const valid = isValidUrl(linkVal);
    
    // Debug logging
    console.log('[Award]', 
                escHtml(a['award-title'] || '(no title)').substring(0, 40),
                '→ Raw:', typeof rawLink, 
                '→ Normalized:', linkVal ? linkVal.substring(0, 50) : '(empty)',
                '→ Valid?', valid);
    
    const viewBtn = valid
        ? `<a href="${linkVal}" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="award-view-btn" 
              title="View Certificate">
               <i class="fa-solid fa-arrow-up-right-from-square"></i>
           </a>`
        : '';

    return `
    <div class="award-card reveal-up" data-category="${catClass}" style="--delay:${i * 0.08}s">
        <div class="award-card-top">
            <div class="award-icon">${iconHtml}</div>
            <span class="award-cat-badge ${catClass}">${catLabel}</span>
        </div>
        <h3>${escHtml(a['award-title'])}</h3>
        <p class="award-event">${escHtml(a['award-event'])}</p>
        <p class="award-org">${escHtml(a['award-org'])}</p>
        <div class="award-footer">
            <span class="award-year">
                <i class="fa-solid fa-calendar-days"></i>
                ${escHtml(String(a['award-year'] || ''))}
            </span>
            ${viewBtn}
        </div>
    </div>`;
}

/* ─── FILTER ─── */
function initFilter() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const clone = btn.cloneNode(true);
        btn.parentNode.replaceChild(clone, btn);
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
            document.querySelectorAll('.award-card').forEach(card => {
                const match = filter === 'all' || card.getAttribute('data-category') === filter;
                card.classList.toggle('hidden', !match);
            });
        });
    });
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', loadAwards);

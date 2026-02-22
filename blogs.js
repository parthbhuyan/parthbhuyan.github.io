/* ========================================
   BLOGS PAGE - blogs.js
   Dynamic Google Sheets Integration
   + Comment Popup System
   ======================================== */
'use strict';

const BASE_URL = "https://script.google.com/macros/s/AKfycbxIlimI20jAJK7sH8x-2fCYaepJrTgaLIsIqdn8qOXoUI7H1fQRmUZ2hZSNnhKeIkf-5g/exec";

/* ─── UTILS ─── */
function driveUrl(raw) {
    if (!raw) return '';
    const s = String(raw).trim();
    const m = s.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w800`;
    if (s.startsWith('http')) return s;
    return '';
}
function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
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

/* ─── THEME ─── */
const html = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const themeIcon   = document.getElementById('themeIcon');
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
    function openNav()  { nav.classList.add('open'); overlay.classList.add('visible'); document.body.classList.add('nav-open'); ham.setAttribute('aria-expanded','true'); }
    function closeNav() { nav.classList.remove('open'); overlay.classList.remove('visible'); document.body.classList.remove('nav-open'); ham.setAttribute('aria-expanded','false'); }

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

/* ─── NAVBAR ─── */
const navbar = document.getElementById('navbar');
const scrollTopBtn = document.getElementById('scrollTop');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    scrollTopBtn.classList.toggle('visible', window.scrollY > 300);
});
scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ─── REVEAL ─── */
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); });
}, { threshold: 0.1 });
function observeReveal() {
    document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => revealObserver.observe(el));
}
observeReveal();

/* ═══════════════════════════════════════
   COMMENT POPUP SYSTEM
   ═══════════════════════════════════════ */
let activeCommentBid = null;

// Build popup DOM
const commentModal = document.createElement('div');
commentModal.id = 'commentModal';
commentModal.innerHTML = `
<div class="cm-overlay"></div>
<div class="cm-box">
    <button class="cm-close" id="cmClose" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
    <h3><i class="fa-regular fa-comment-dots"></i> Leave a Comment</h3>
    <textarea id="cmTextarea" placeholder="Add a comment..." rows="4"></textarea>
    <button class="cm-send" id="cmSend">
        <i class="fa-solid fa-paper-plane" id="cmIcon"></i>
        <span id="cmText">Send Comment</span>
    </button>
</div>`;
document.body.appendChild(commentModal);

// Inject popup styles once
const cmStyle = document.createElement('style');
cmStyle.textContent = `
#commentModal { display:none; position:fixed; inset:0; z-index:99999; align-items:center; justify-content:center; padding:1rem; }
#commentModal.cm-active { display:flex; }
.cm-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.7); backdrop-filter:blur(6px); animation:cmFadeIn .25s ease; }
@keyframes cmFadeIn { from{opacity:0} to{opacity:1} }
.cm-box { position:relative; background:var(--surface,#1a2235); border:1px solid var(--border,rgba(255,255,255,.08)); border-radius:18px; padding:2rem; width:100%; max-width:500px; animation:cmScale .25s cubic-bezier(.4,0,.2,1); z-index:1; }
@keyframes cmScale { from{transform:scale(.85);opacity:0} to{transform:scale(1);opacity:1} }
.cm-close { position:absolute; top:1rem; right:1rem; background:transparent; border:none; color:var(--text-muted,#7a94b0); font-size:1.2rem; cursor:pointer; width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:8px; transition:.2s; }
.cm-close:hover { background:var(--accent,#3b82f6); color:#fff; }
.cm-box h3 { margin:0 0 1.25rem; font-size:1.1rem; color:var(--text,#e2eaf4); display:flex; align-items:center; gap:.5rem; font-family:var(--font-display,sans-serif); }
#cmTextarea { width:100%; background:var(--bg,#060b14); border:1.5px solid var(--border,rgba(255,255,255,.1)); border-radius:10px; color:var(--text,#e2eaf4); padding:.85rem 1rem; font-size:.95rem; resize:vertical; outline:none; font-family:inherit; box-sizing:border-box; transition:.2s; }
#cmTextarea:focus { border-color:var(--accent,#3b82f6); }
.cm-send { margin-top:1rem; width:100%; padding:.8rem 1.5rem; background:linear-gradient(135deg,var(--accent,#3b82f6),var(--accent-2,#8b5cf6)); color:#fff; border:none; border-radius:10px; font-size:1rem; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:.6rem; transition:.2s; font-family:var(--font-display,sans-serif); }
.cm-send:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); }
.cm-send:disabled { opacity:.6; cursor:not-allowed; transform:none; }
`;
document.head.appendChild(cmStyle);

function openCommentPopup(bid) {
    activeCommentBid = bid;
    document.getElementById('cmTextarea').value = '';
    resetCmBtn();
    commentModal.classList.add('cm-active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('cmTextarea').focus(), 120);
}
function closeCommentPopup() {
    commentModal.classList.remove('cm-active');
    document.body.style.overflow = '';
    activeCommentBid = null;
}
function resetCmBtn() {
    const btn = document.getElementById('cmSend');
    btn.disabled = false;
    document.getElementById('cmIcon').className = 'fa-solid fa-paper-plane';
    document.getElementById('cmText').textContent = 'Send Comment';
}

document.getElementById('cmClose').addEventListener('click', closeCommentPopup);
commentModal.querySelector('.cm-overlay').addEventListener('click', closeCommentPopup);

document.getElementById('cmSend').addEventListener('click', async () => {
    const text = document.getElementById('cmTextarea').value.trim();
    const btn  = document.getElementById('cmSend');
    const icon = document.getElementById('cmIcon');
    const txt  = document.getElementById('cmText');
    const textarea = document.getElementById('cmTextarea');

    if (!text) {
        textarea.style.borderColor = '#ef4444';
        setTimeout(() => textarea.style.borderColor = '', 1500);
        return;
    }
    if (!activeCommentBid) return;

    btn.disabled = true;
    icon.className = 'fa-solid fa-spinner fa-spin';
    txt.textContent = 'Sending...';

    try {
        const result = await apiPost('blog-comment', { bid: activeCommentBid, 'comment-text': text });
        if (result.success) {
            icon.className = 'fa-solid fa-check';
            txt.textContent = 'Comment Added!';
            setTimeout(() => { closeCommentPopup(); loadBlogs(); }, 800);
        } else throw new Error(result.error || 'Failed');
    } catch (err) {
        console.error('Comment error:', err);
        icon.className = 'fa-solid fa-triangle-exclamation';
        txt.textContent = 'Failed. Try again.';
        btn.disabled = false;
        setTimeout(resetCmBtn, 2500);
    }
});

/* ═══════════════════════════════════════
   BLOGS — DYNAMIC RENDER
   
   CSS structure (.blog-card = grid 340px+1fr):
   .blog-card[data-category][data-bid]
     .blog-img
       img OR .blog-img-placeholder
       .blog-cat-badge.{category}
     .blog-content
       .blog-meta > span×3
       h2
       p
       .blog-footer
         .blog-interactions
           button.interact-btn[data-type="like"]
           button.interact-btn[data-type="comment"]
           button.interact-btn[data-type="share"]
         a.blog-read-more
   ═══════════════════════════════════════ */
async function loadBlogs() {
    const blogList = document.getElementById('blogList');
    if (!blogList) return;

    blogList.innerHTML = '<div style="text-align:center;padding:4rem;color:var(--text-muted)"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>';

    try {
        const blogs = await apiGet('blogs');
        if (!Array.isArray(blogs) || !blogs.length) {
            blogList.innerHTML = '<div style="text-align:center;padding:4rem;color:var(--text-muted)">No blog posts found.</div>';
            return;
        }

        blogList.innerHTML = blogs.map((b, i) => {
            const imgUrl  = driveUrl(b['blog-img']);
            const cat     = String(b['data-category'] || '').toLowerCase().trim();
            const bid     = String(b['bid'] || '');
            const likes   = parseInt(b['like']) || 0;
            const comments = parseInt(b['comment']) || 0;

            const imgHtml = imgUrl
                ? `<img src="${imgUrl}" alt="${escHtml(b['blog-title'])}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0"
                     onerror="this.remove(); this.parentElement.querySelector('.blog-img-placeholder').style.display='flex'">
                   <div class="blog-img-placeholder" style="display:none"><i class="fa-solid fa-image"></i></div>`
                : `<div class="blog-img-placeholder"><i class="fa-solid fa-blog"></i></div>`;

            return `
            <article class="blog-card reveal-up" data-category="${cat}" data-bid="${bid}" style="--delay:${i * 0.08}s">
                <div class="blog-img" style="position:relative">
                    ${imgHtml}
                    <span class="blog-cat-badge ${cat}">${escHtml(b['data-category'] || '')}</span>
                </div>
                <div class="blog-content">
                    <div class="blog-meta">
                        <span><i class="fa-solid fa-user"></i> ${escHtml(b['written-by'] || 'Author')}</span>
                        <span><i class="fa-solid fa-calendar"></i> ${escHtml(b['written-date'] || '')}</span>
                        <span><i class="fa-solid fa-clock"></i> ${escHtml(b['read-time'] || '')}</span>
                    </div>
                    <h2>${escHtml(b['blog-title'] || '')}</h2>
                    <p>${escHtml(b['b-description'] || '')}</p>
                    <div class="blog-footer">
                        <div class="blog-interactions">
                            <button class="interact-btn" data-type="like" data-bid="${bid}" data-liked="false">
                                <i class="fa-regular fa-heart"></i> <span class="like-count">${likes}</span>
                            </button>
                            <button class="interact-btn" data-type="comment" data-bid="${bid}">
                                <i class="fa-regular fa-comment"></i> <span>${comments}</span>
                            </button>
                            <button class="interact-btn" data-type="share">
                                <i class="fa-solid fa-share-nodes"></i> <span>Share</span>
                            </button>
                        </div>
                        <a href="#" class="blog-read-more" aria-expanded="false">Read More <i class="fa-solid fa-arrow-right"></i></a>
                    </div>
                </div>
            </article>`;
        }).join('');

        observeReveal();
        attachBlogEvents();
        setupFilter();
        setupSearch();

    } catch (err) {
        console.error('Blogs error:', err);
        blogList.innerHTML = '<div style="text-align:center;padding:4rem;color:var(--text-muted)">Failed to load blogs. Please refresh.</div>';
    }
}

function attachBlogEvents() {
    // ── Like buttons ──
    document.querySelectorAll('.interact-btn[data-type="like"]').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (btn.getAttribute('data-liked') === 'true') return;
            const bid     = btn.getAttribute('data-bid');
            const countEl = btn.querySelector('.like-count');
            const icon    = btn.querySelector('i');

            // Optimistic UI
            btn.setAttribute('data-liked', 'true');
            btn.classList.add('liked');
            icon.className = 'fa-solid fa-heart';
            countEl.textContent = parseInt(countEl.textContent) + 1;

            try {
                await apiPost('blog-like', { bid });
            } catch (err) {
                // Revert on failure
                btn.setAttribute('data-liked', 'false');
                btn.classList.remove('liked');
                icon.className = 'fa-regular fa-heart';
                countEl.textContent = parseInt(countEl.textContent) - 1;
            }
        });
    });

    // ── Comment buttons ──
    document.querySelectorAll('.interact-btn[data-type="comment"]').forEach(btn => {
        btn.addEventListener('click', () => openCommentPopup(btn.getAttribute('data-bid')));
    });

    // ── Share buttons ──
    document.querySelectorAll('.interact-btn[data-type="share"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const span = btn.querySelector('span');
            if (navigator.share) {
                navigator.share({ title: document.title, url: window.location.href });
            } else {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    const orig = span.textContent;
                    span.textContent = 'Copied!';
                    setTimeout(() => span.textContent = orig, 2000);
                });
            }
        });
    });

    // ── Read More / Show Less toggle ──
    document.querySelectorAll('.blog-read-more').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const card    = btn.closest('.blog-card');
            const icon    = btn.querySelector('i');
            const isOpen  = card.classList.contains('expanded');

            if (isOpen) {
                // Collapse
                card.classList.remove('expanded');
                btn.setAttribute('aria-expanded', 'false');
                btn.innerHTML = 'Read More <i class="fa-solid fa-arrow-right"></i>';
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                // Expand
                card.classList.add('expanded');
                btn.setAttribute('aria-expanded', 'true');
                btn.innerHTML = 'Show Less <i class="fa-solid fa-arrow-right"></i>';
            }
        });
    });
}

function setupFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.getAttribute('data-filter');
            document.querySelectorAll('.blog-card').forEach(card => {
                const show = filter === 'all' || card.getAttribute('data-category') === filter;
                card.classList.toggle('hidden', !show);
            });
        });
    });
}

function setupSearch() {
    const searchInput = document.getElementById('blogSearch');
    if (!searchInput) return;
    searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase();
        document.querySelectorAll('.blog-card').forEach(card => {
            card.classList.toggle('hidden', q !== '' && !card.textContent.toLowerCase().includes(q));
        });
        if (q !== '') {
            document.querySelectorAll('.filter-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
        }
    });
}

/* ═══════════════════════════════════════
   INIT
   ═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', loadBlogs);

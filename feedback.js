/* ========================================
   FEEDBACK PAGE — feedback.js
   ======================================== */
'use strict';

const BASE_URL = "https://script.google.com/macros/s/AKfycbxIlimI20jAJK7sH8x-2fCYaepJrTgaLIsIqdn8qOXoUI7H1fQRmUZ2hZSNnhKeIkf-5g/exec";

/* ─── API ─── */
async function apiGet(endpoint) {
    const res = await fetch(`${BASE_URL}?endpoint=${endpoint}`);
    return res.json();
}
async function apiPost(endpoint, data) {
    // No Content-Type header → keeps this a "simple" CORS request.
    // GAS Web Apps cannot handle OPTIONS preflight (triggered by Content-Type: application/json).
    const res  = await fetch(`${BASE_URL}?endpoint=${endpoint}`, {
        method: 'POST',
        body:   JSON.stringify(data)
    });
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch (_) {
        // GAS returned HTML (unhandled exception / auth error) — surface it clearly
        console.error('GAS non-JSON response for endpoint=' + endpoint + ':', text.slice(0, 300));
        throw new Error('Server error: unexpected response. Check GAS deployment & permissions.');
    }
}

/* ─── UTILS ─── */
function driveUrl(raw) {
    if (!raw) return '';
    const s = String(raw).trim();
    const m = s.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w200`;
    if (s.startsWith('http')) return s;
    return '';
}
function escHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/*
 * imageToBase64()
 * Reads a File object and resolves with a base64-encoded string (no data-URI prefix).
 * Used to send the image to Google Apps Script for Drive upload.
 */
function imageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload  = () => resolve(reader.result.split(',')[1]); // strip "data:image/...;base64,"
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/* ─── THEME ─── */
const html        = document.documentElement;
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

    function openNav()  {
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

/* ─── REVEAL ─── */
const revealObserver = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); }),
    { threshold: 0.1 }
);
function observeReveal() {
    document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right')
        .forEach(el => revealObserver.observe(el));
}
observeReveal();

/* ─── STAR RATING UI ─── */
const starRating  = document.getElementById('starRating');
const ratingValue = document.getElementById('ratingValue');
let selectedRating = 0;

if (starRating) {
    const stars = starRating.querySelectorAll('i');

    // Render hover preview — no .active (pure hover state, not committed)
    function previewStars(upTo) {
        stars.forEach((s, i) => {
            s.className = i < upTo ? 'fa-solid fa-star' : 'fa-regular fa-star';
        });
    }

    // Restore the committed selection — keeps .active so CSS scale persists
    function restoreSelected() {
        stars.forEach((s, i) => {
            if (i < selectedRating) {
                s.className = 'fa-solid fa-star active';   // selected: solid + scale
            } else {
                s.className = 'fa-regular fa-star';        // unselected: outline
            }
        });
    }

    // Reset all stars to empty (used after successful submit only)
    function clearStars() {
        selectedRating    = 0;
        ratingValue.value = 0;
        stars.forEach(s => { s.className = 'fa-regular fa-star'; });
    }

    stars.forEach(star => {
        const val = parseInt(star.getAttribute('data-val'));
        star.addEventListener('mouseover',  () => previewStars(val));
        star.addEventListener('mouseleave', () => restoreSelected());   // restore, not wipe
        star.addEventListener('click', () => {
            selectedRating    = val;
            ratingValue.value = val;
            restoreSelected();   // commit selection with .active class
        });
    });

    // Expose clearStars so the submit handler can call it on success
    starRating._clearStars = clearStars;
}

/* ─── FILE UPLOAD — UI LABEL ─── */
const fileInput  = document.getElementById('profileImage');
const fileUpload = document.getElementById('fileUpload');

// GAS Web App payload limit in practice: keep base64 JSON under ~2MB
// 1MB image → ~1.37MB base64 → safe. 5MB risks GAS execution timeout.
const MAX_IMAGE_SIZE_MB = 1;

if (fileInput) {
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;

        // Size guard — reject files over 5 MB
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
            showFeedbackStatus('error', `⚠️ Image must be under ${MAX_IMAGE_SIZE_MB} MB.`);
            fileInput.value = '';
            return;
        }

        fileUpload.querySelector('span').textContent = file.name;
        fileUpload.style.borderColor = 'var(--success, #22c55e)';
        fileUpload.style.color       = 'var(--success, #22c55e)';
    });
}

/* ─── FEEDBACK STATUS HELPER ─── */
const feedbackStatus = document.getElementById('feedbackStatus');
function showFeedbackStatus(type, msg, autoClear = 6000) {
    feedbackStatus.className    = `form-status ${type}`;
    feedbackStatus.textContent  = msg;
    if (autoClear) setTimeout(() => {
        feedbackStatus.className   = 'form-status';
        feedbackStatus.textContent = '';
    }, autoClear);
}

/* ═══════════════════════════════════════════════════════
   FEEDBACK GRID — DYNAMIC RENDER
   CSS structure (feedback.css):
   .feedback-card
     i.fa-solid.fa-quote-left.feedback-quote
     p                     ← feedbacktext
     .feedback-stars
     .feedback-author
       .feedback-avatar > img | i
       div > h4 + span
   ═══════════════════════════════════════════════════════ */
async function loadFeedbackGrid() {
    const grid = document.getElementById('feedbackGrid');
    if (!grid) return;

    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">
        <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
    </div>`;

    try {
        const feedbacks = await apiGet('feedback');

        if (!Array.isArray(feedbacks) || !feedbacks.length) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">
                No feedback yet. Be the first!
            </div>`;
            return;
        }

        grid.innerHTML = feedbacks.map((f, i) => {
            const rating    = parseInt(f['star-rating']) || 5;
            const starsHtml = Array.from({ length: 5 }, (_, idx) =>
                `<i class="${idx < rating ? 'fa-solid' : 'fa-regular'} fa-star"></i>`
            ).join('');

            const avatarUrl   = driveUrl(f['profileimage']);
            const avatarInner = avatarUrl
                ? `<img src="${avatarUrl}" alt="Avatar"
                        onerror="this.outerHTML='<i class=\\'fa-solid fa-user\\'></i>'">`
                : `<i class="fa-solid fa-user"></i>`;

            return `
            <div class="feedback-card reveal-up" style="--delay:${i * 0.08}s">
                <i class="fa-solid fa-quote-left feedback-quote"></i>
                <p>${escHtml(f['feedbacktext'] || '')}</p>
                <div class="feedback-stars">${starsHtml}</div>
                <div class="feedback-author">
                    <div class="feedback-avatar">${avatarInner}</div>
                    <div>
                        <h4>${escHtml(f['clientname'] || f['feedbackemail'] || 'Anonymous')}</h4>
                        <span>${escHtml(f['profession'] || '')}</span>
                    </div>
                </div>
            </div>`;
        }).join('');

        observeReveal();

    } catch (err) {
        console.error('Feedback grid error:', err);
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">
            Failed to load feedback. Please refresh.
        </div>`;
    }
}

/* ═══════════════════════════════════════════════════════
   DRIVE IMAGE UPLOAD
   ──────────────────────────────────────────────────────
   Flow:
   1. Read image file as base64
   2. POST to backend endpoint 'upload-image' with:
      { base64, mimeType, fileName }
   3. Backend saves to Drive folder, sets public permission,
      returns { success: true, url: "https://..." }
   4. Return the public URL to use as profileimage
   ═══════════════════════════════════════════════════════ */
async function uploadImageToDrive(file) {
    const base64   = await imageToBase64(file);
    const fileName = `feedback_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const result = await apiPost('upload-image', {
        base64,
        mimeType: file.type,
        fileName
    });

    if (!result.success) throw new Error(result.error || 'Image upload failed');
    return result.url; // public Drive view URL
}

/* ═══════════════════════════════════════════════════════
   FEEDBACK FORM SUBMIT
   ═══════════════════════════════════════════════════════ */
const feedbackForm = document.getElementById('feedbackForm');

if (feedbackForm) {
    let _isSubmitting = false;  // guard against double-submit on rapid clicks

    feedbackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (_isSubmitting) return;
        _isSubmitting = true;

        /* ── Validation ── */
        if (selectedRating === 0) {
            showFeedbackStatus('error', '⚠️ Please select a star rating.', 4000);
            return;
        }

        const btn = document.getElementById('feedbackSubmitBtn');
        btn.disabled  = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

        const fd = new FormData(feedbackForm);
        let profileImageUrl = '';

        try {
            /* ── Step 1: Upload image to Drive (if selected) ── */
            const imageFile = fileInput && fileInput.files[0];
            if (imageFile) {
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading image...';
                try {
                    profileImageUrl = await uploadImageToDrive(imageFile);
                } catch (uploadErr) {
                    // Upload failed — show real error message so user/dev can diagnose
                    console.error('Image upload error:', uploadErr);
                    const errMsg = uploadErr.message || 'Unknown error';
                    showFeedbackStatus('error', '❌ Image upload failed: ' + errMsg, 0);
                    btn.disabled  = false;
                    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Feedback';
                    return; // abort — do not submit form with broken image
                }
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving feedback...';
            }

            /* ── Step 2: Submit feedback row to Sheets ── */
            const data = {
                clientname:    fd.get('clientName')   || '',
                profession:    fd.get('profession')   || '',
                phone:         fd.get('phone')         || '',
                feedbackemail: fd.get('email')         || '',
                'star-rating': selectedRating,
                profileimage:  profileImageUrl,        // real Drive URL or ''
                feedbacktext:  fd.get('feedback')      || ''
            };

            const result = await apiPost('feedback', data);

            if (!result.success) throw new Error(result.error || 'Submission failed');

            /* ── Success ── */
            showFeedbackStatus('success', '✅ Thank you! Your feedback has been submitted.');
            feedbackForm.reset();

            // Use the encapsulated clearStars() — resets selectedRating + removes .active
            if (starRating && starRating._clearStars) starRating._clearStars();

            if (fileUpload) {
                fileUpload.querySelector('span').textContent = 'Click to upload photo';
                fileUpload.style.borderColor = '';
                fileUpload.style.color       = '';
            }

            setTimeout(loadFeedbackGrid, 700);

        } catch (err) {
            console.error('Feedback submit error:', err);
            showFeedbackStatus('error', '❌ Submission failed. Please try again.');
        } finally {
            btn.disabled  = false;
            btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Feedback';
            _isSubmitting = false;
        }
    });
}

/* ─── INIT ─── */
document.addEventListener('DOMContentLoaded', loadFeedbackGrid);

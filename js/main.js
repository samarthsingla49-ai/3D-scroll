/* ══════════════════════════════════════════════
   ALEGLA — main.js  (GSAP Enhanced)
   ──────────────────────────────────────────────
   GSAP Upgrades:
   1. Lenis smooth scroll wired into ScrollTrigger
   2. Hero title split-character entrance timeline
   3. Products horizontal scroll (ScrollTrigger pin)
   4. Section h2 word-clip reveal
   5. Dramatic two-panel loader exit
   ══════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.config({ fastScrollEnd: true, preventOverlaps: true });

/* ─────────────────────────────────────────────
   UPGRADE 1 — LENIS SMOOTH SCROLL
   Feeds Lenis ticks into GSAP's RAF so
   ScrollTrigger positions stay accurate.
   ───────────────────────────────────────────── */
function initSmoothScroll() {
  if (typeof Lenis === 'undefined') return;
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.on('scroll', ScrollTrigger.update);
}

/* ─────────────────────────────────────────────
   UPGRADE 5 — LOADER (two-panel split exit)
   ───────────────────────────────────────────── */
function initLoader() {
  const loader = document.getElementById('loader');
  const fill   = document.getElementById('loaderFill');

  const tl = gsap.timeline({
    onComplete() {
      loader.remove();
      document.body.classList.remove('is-loading');
      initHeroEntrance();
      initAleglaTag();
    }
  });

  tl.to(fill, { scaleX: 1, duration: 1.2, ease: 'power2.inOut' })
    .to('.loader-panel-l', { xPercent: -100, duration: 0.7, ease: 'power3.in' }, '+=0.05')
    .to('.loader-panel-r', { xPercent:  100, duration: 0.7, ease: 'power3.in' }, '<');
}

/* ─────────────────────────────────────────────
   UPGRADE 2 — HERO SPLIT-CHARACTER ENTRANCE
   Each word span is split into .ch character
   spans, then animated with a staggered timeline.
   ───────────────────────────────────────────── */
function initHeroEntrance() {
  // Split each .hero-word span into individual character spans
  document.querySelectorAll('.hero-word').forEach(el => {
    const text = el.textContent;
    el.innerHTML = [...text].map(c =>
      `<span class="ch">${c === ' ' ? '&nbsp;' : c}</span>`
    ).join('');
  });

  // Set explicit initial states (GSAP owns the state — no CSS opacity:0 conflict)
  gsap.set('.hero-eyebrow',    { opacity: 0, y: 24 });
  gsap.set('.ch',              { opacity: 0, y: 90 });
  gsap.set('.hero-sub',        { opacity: 0, y: 24 });
  gsap.set('.hero-actions',    { opacity: 0, y: 24 });
  gsap.set('.hero-bottle-wrap',{ opacity: 0, scale: 0.82 });

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.to('.hero-eyebrow',    { y: 0, opacity: 1, duration: 0.55 })
    .to('.ch',              { y: 0, opacity: 1, stagger: 0.022, duration: 0.65 }, '-=0.25')
    .to('.hero-sub',        { y: 0, opacity: 1, duration: 0.55 }, '-=0.35')
    .to('.hero-actions',    { y: 0, opacity: 1, duration: 0.5  }, '-=0.3')
    .to('.hero-bottle-wrap',{ scale: 1, opacity: 1, duration: 1.1, ease: 'power2.out' }, '-=0.9');
}

/* ─────────────────────────────────────────────
   3. NAVBAR: transparent → white on scroll
   ───────────────────────────────────────────── */
function initNavbar() {
  const nav = document.getElementById('navbar');
  ScrollTrigger.create({
    start: 'top -60px',
    onUpdate(self) { nav.classList.toggle('scrolled', self.progress > 0); }
  });
}

/* ─────────────────────────────────────────────
   4. ALEGLA LETTERS SCROLL SECTION
   ───────────────────────────────────────────── */
function initAleglaSection() {
  const wrapper  = document.querySelector('.alegla-scroll');
  const pin      = document.getElementById('aleglaPin');
  const cols     = document.querySelectorAll('.l-col');
  const progress = document.getElementById('aleglaProgress');
  if (!wrapper || !pin) return;

  const STEP = 0.14;
  const DUR  = 0.25;
  let lastP = -1;

  ScrollTrigger.create({
    trigger : wrapper,
    start   : 'top top',
    end     : 'bottom bottom',
    pin     : pin,
    scrub   : 1,
    onUpdate(self) {
      const p = self.progress;
      if (Math.abs(p - lastP) < 0.0005) return;
      lastP = p;

      progress.style.transform = `scaleX(${p.toFixed(4)})`;

      cols.forEach((col, i) => {
        const start  = i * STEP;
        const end    = start + DUR;
        const lp     = Math.max(0, Math.min(1, (p - start) / (end - start)));

        const fill   = col.querySelector('.l-fill');
        const bottle = col.querySelector('.l-bottle');
        const info   = col.querySelector('.l-info');
        const ghost  = col.querySelector('.l-ghost');

        fill.style.clipPath = `inset(0 0 ${((1 - lp) * 100).toFixed(2)}% 0)`;

        const by = (1 - lp) * 130 + lp * 8;
        bottle.style.transform = `translateX(-50%) translateY(${by.toFixed(2)}%)`;
        bottle.style.opacity   = Math.min(1, lp * 1.8).toFixed(3);

        info.style.opacity   = lp.toFixed(3);
        info.style.transform = `translateY(${((1 - lp) * 14).toFixed(2)}px)`;

        ghost.style.transform = `scale(${(1 + lp * 0.04).toFixed(4)})`;
      });
    }
  });
}

function initAleglaTag() {
  const tag = document.querySelector('.alegla-tag');
  if (!tag) return;
  ScrollTrigger.create({
    trigger     : '.alegla-scroll',
    start       : 'top 75%',
    onEnter     : () => tag.classList.add('visible'),
    onLeaveBack : () => tag.classList.remove('visible'),
  });
}

/* ─────────────────────────────────────────────
   5. PRODUCT CARD 3D TILT
   ───────────────────────────────────────────── */
function initCardTilt() {
  document.querySelectorAll('.product-card').forEach(card => {
    let rect;
    // Cache rect on enter — avoids forced layout on every mousemove
    card.addEventListener('mouseenter', () => { rect = card.getBoundingClientRect(); });

    card.addEventListener('mousemove', (e) => {
      if (!rect) return;
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      gsap.to(card, {
        rotateX             : -y * 14,
        rotateY             :  x * 14,
        transformPerspective: 700,
        duration            : 0.35,
        ease                : 'power2.out',
        overwrite           : 'auto',
      });
    });

    card.addEventListener('mouseleave', () => {
      rect = null;
      gsap.to(card, {
        rotateX: 0, rotateY: 0,
        duration: 0.55, ease: 'power3.out', overwrite: 'auto',
      });
    });
  });
}

/* ─────────────────────────────────────────────
   6. SCROLL REVEALS
   ───────────────────────────────────────────── */
function initReveal() {
  // ScrollTrigger.batch shares one IntersectionObserver for all .reveal elements
  // instead of one ScrollTrigger per element — far more efficient
  ScrollTrigger.batch('.reveal', {
    start   : 'top 88%',
    onEnter : batch => gsap.to(batch, {
      y: 0, opacity: 1, duration: 0.75, ease: 'power3.out', stagger: 0.06, overwrite: true
    }),
    onLeaveBack: batch => gsap.to(batch, {
      y: 48, opacity: 0, duration: 0.4, ease: 'power2.in', stagger: 0.04, overwrite: true
    }),
  });
}

/* ─────────────────────────────────────────────
   7. STAT COUNTERS
   ───────────────────────────────────────────── */
function initCounters() {
  document.querySelectorAll('.count').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    ScrollTrigger.create({
      trigger: el, start: 'top 85%', once: true,
      onEnter() {
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target, duration: 1.8, ease: 'power2.out',
          onUpdate() { el.textContent = Math.round(obj.v); }
        });
      }
    });
  });
}

/* ─────────────────────────────────────────────
   8. MARQUEE (infinite)
   ───────────────────────────────────────────── */
function initMarquee() {
  const track = document.getElementById('marqueeTrack');
  if (!track) return;
  gsap.to(track, { x: '-50%', duration: 24, ease: 'none', repeat: -1 });
}

/* ─────────────────────────────────────────────
   9. PARALLAX
   ───────────────────────────────────────────── */
function initParallax() {
  // Parallax on WRAPPER — keeps CSS float animation on the img itself
  // separate from GSAP scroll-driven y, preventing transform conflict
  gsap.to('.b-bottle-wrap', {
    y: -50, ease: 'none',
    scrollTrigger: {
      trigger: '.benefits',
      start: 'top bottom', end: 'bottom top', scrub: true
    }
  });

  gsap.to('.about-bottle-img', {
    rotateZ: 4, y: -30, ease: 'none',
    scrollTrigger: {
      trigger: '.about-strip',
      start: 'top bottom', end: 'bottom top', scrub: true
    }
  });
}

/* ─────────────────────────────────────────────
   10. HERO BOTTLE SCROLL EFFECT
   ───────────────────────────────────────────── */
function initHeroScroll() {
  // Scroll parallax on wrapper so CSS float on .hero-bottle-img is not overridden
  gsap.to('.hero-bottle-wrap', {
    y: -60, ease: 'none',
    scrollTrigger: {
      trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true
    }
  });
}

function initBottleFloat() {
  // GSAP-driven float replaces CSS @keyframes heroFloat to avoid
  // transform conflicts when GSAP also controls y on the same element
  gsap.to('.hero-bottle-img', {
    y: -18, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true
  });
  gsap.to('.benefits-bottle-img', {
    y: -14, duration: 3.5, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 0.4
  });
}

/* ─────────────────────────────────────────────
   11. CTA BOTTLES — staggered scale-in
   ───────────────────────────────────────────── */
function initCtaBottles() {
  const bottles = document.querySelectorAll('.cta-bottle-small');
  bottles.forEach((b, i) => {
    gsap.fromTo(b,
      { scale: 0.7, opacity: 0, y: 30 },
      {
        scale: 1, opacity: 1, y: 0, duration: 0.7, ease: 'back.out(1.5)',
        delay: i * 0.1,
        scrollTrigger: {
          trigger: '.cta-section', start: 'top 70%', toggleActions: 'play none none reverse'
        }
      }
    );
  });
}

/* ─────────────────────────────────────────────
   UPGRADE 3 — PRODUCTS HORIZONTAL SCROLL
   Pin the section; scrub translates cards left.
   ───────────────────────────────────────────── */
function initHorizontalScroll() {
  const track  = document.querySelector('.cards-track');
  const pinSec = document.querySelector('.products');
  if (!track || !pinSec) return;

  gsap.to(track, {
    x    : () => -(track.scrollWidth - window.innerWidth + 96),
    ease : 'none',
    scrollTrigger: {
      trigger      : pinSec,
      start        : 'top top',
      end          : () => '+=' + (track.scrollWidth - window.innerWidth + 96),
      pin          : true,
      scrub        : 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    }
  });
}

/* ─────────────────────────────────────────────
   UPGRADE 4 — SECTION HEADING WORD REVEAL
   Splits .word-split h2s into word spans,
   each slides up through overflow:hidden clip.
   ───────────────────────────────────────────── */
function initHeadingReveal() {
  document.querySelectorAll('.word-split').forEach(h2 => {
    const words = h2.textContent.trim().split(/\s+/);
    h2.innerHTML = words.map(w =>
      `<span class="word-wrap"><span class="word">${w}</span></span>`
    ).join(' ');

    gsap.from(h2.querySelectorAll('.word'), {
      y        : '105%',
      opacity  : 0,
      stagger  : 0.07,
      duration : 0.72,
      ease     : 'power3.out',
      scrollTrigger: {
        trigger      : h2,
        start        : 'top 88%',
        toggleActions: 'play none none reverse',
      }
    });
  });
}

/* ─────────────────────────────────────────────
   SMOOTH ANCHOR SCROLL
   ───────────────────────────────────────────── */
function initAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    const href = a.getAttribute('href');
    if (href === '#') return;
    a.addEventListener('click', e => {
      const el = document.querySelector(href);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
}

/* ─────────────────────────────────────────────
   INIT
   ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();   // UPGRADE 1 — must be first
  initLoader();         // UPGRADE 5 — fires hero entrance on complete
  initNavbar();
  initAleglaSection();
  initCardTilt();
  initReveal();
  initCounters();
  initMarquee();
  initParallax();
  initHeroScroll();
  initCtaBottles();
  initBottleFloat();      // GSAP float (no CSS animation conflict)
  initHorizontalScroll(); // UPGRADE 3
  initHeadingReveal();    // UPGRADE 4
  initAnchors();

  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });
});

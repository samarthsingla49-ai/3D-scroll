/* ══════════════════════════════════════════════
   ALEGLA — main.js  (Performance-optimised)
   ══════════════════════════════════════════════
   Performance fixes vs. previous version:
   ✓ Removed per-card infinite RAF loops (was 3 loops at 60fps)
   ✓ Removed SVG noise filter (was expensive repaint every frame)
   ✓ Card tilt uses GSAP.to with overwrite:'auto' (handles lerp internally)
   ✓ GSAP scrub: 1 (was 1.5 — less interpolation work)
   ✓ ScrollTrigger.config fastScrollEnd for smoother scrub release
   ✓ will-change only on elements actively animating
   ✓ Reduced onUpdate calculations with early-out when progress unchanged
   ══════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.config({ fastScrollEnd: true, preventOverlaps: true });

/* ─────────────────────────────────────────────
   1. LOADER
   ───────────────────────────────────────────── */
function initLoader() {
  const loader = document.getElementById('loader');
  const fill   = document.getElementById('loaderFill');

  gsap.to(fill, {
    scaleX: 1, duration: 1.3, ease: 'power2.inOut',
    onComplete() {
      gsap.to(loader, {
        yPercent: -100, duration: 0.65, ease: 'power3.in',
        onComplete() {
          loader.remove();
          document.body.classList.remove('is-loading');
          initHeroEntrance();
          initAleglaTag();
        }
      });
    }
  });
}

/* ─────────────────────────────────────────────
   2. HERO ENTRANCE
   KMBCH pattern: translate3d(40px,0,0) opacity:0
   → translate3d(0,0,0) opacity:1, staggered per word
   ───────────────────────────────────────────── */
function initHeroEntrance() {
  const els = [...document.querySelectorAll('.hero-in')].sort((a, b) =>
    (parseInt(a.style.getPropertyValue('--i')) || 0) -
    (parseInt(b.style.getPropertyValue('--i')) || 0)
  );

  gsap.to(els, {
    x: 0, opacity: 1,
    transform: 'translate3d(0,0,0)',
    stagger: 0.1, duration: 0.9, ease: 'power3.out',
  });
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
   ────────────────────────────────────────────
   Sticky 550vh section. On scroll:
   • Each letter color fills from bottom (clip-path)
   • Bottle rises up inside the letter column
   • Flavor label fades in
   Stagger: each letter starts at a different scroll %
   ───────────────────────────────────────────── */
function initAleglaSection() {
  const wrapper  = document.querySelector('.alegla-scroll');
  const pin      = document.getElementById('aleglaPin');
  const cols     = document.querySelectorAll('.l-col');
  const progress = document.getElementById('aleglaProgress');
  if (!wrapper || !pin) return;

  const STEP = 0.14;      // spacing between each letter's activation
  const DUR  = 0.25;      // scroll % each letter uses to fully reveal

  let lastP = -1;

  ScrollTrigger.create({
    trigger : wrapper,
    start   : 'top top',
    end     : 'bottom bottom',
    pin     : pin,
    scrub   : 1,           // smooth but not over-interpolated
    onUpdate(self) {
      const p = self.progress;
      // Skip redundant updates — saves CPU on tiny scroll deltas
      if (Math.abs(p - lastP) < 0.0005) return;
      lastP = p;

      // Progress bar
      progress.style.transform = `scaleX(${p.toFixed(4)})`;

      cols.forEach((col, i) => {
        const start  = i * STEP;
        const end    = start + DUR;
        const lp     = Math.max(0, Math.min(1, (p - start) / (end - start)));

        const fill   = col.querySelector('.l-fill');
        const bottle = col.querySelector('.l-bottle');
        const info   = col.querySelector('.l-info');
        const ghost  = col.querySelector('.l-ghost');

        // Liquid fill: clip from bottom → top
        // inset(0 0 X% 0): X=100 = hidden, X=0 = fully shown
        fill.style.clipPath = `inset(0 0 ${((1 - lp) * 100).toFixed(2)}% 0)`;

        // Glow on fill text when active
        if (lp > 0.05) {
          fill.style.filter = `drop-shadow(0 0 ${(lp * 20).toFixed(1)}px currentColor)`;
        } else {
          fill.style.filter = 'none';
        }

        // Bottle rises — starts at 130% below, ends at 8% from bottom
        const by = (1 - lp) * 130 + lp * 8;
        bottle.style.transform = `translateX(-50%) translateY(${by.toFixed(2)}%)`;
        bottle.style.opacity   = Math.min(1, lp * 1.8).toFixed(3);

        // Label
        info.style.opacity   = lp.toFixed(3);
        info.style.transform = `translateY(${((1 - lp) * 14).toFixed(2)}px)`;

        // Subtle letter scale
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
   Uses GSAP (not a RAF loop) for proper lerp.
   GSAP handles its own RAF internally — much
   more efficient than manual loops per card.
   ───────────────────────────────────────────── */
function initCardTilt() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'border-color .3s ease, box-shadow .3s ease';
    });

    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      gsap.to(card, {
        rotateX          : -y * 14,
        rotateY          :  x * 14,
        transformPerspective: 700,
        duration         : 0.35,
        ease             : 'power2.out',
        overwrite        : 'auto',
      });
    });

    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        rotateX: 0, rotateY: 0,
        duration: 0.55, ease: 'power3.out', overwrite: 'auto',
      });
    });
  });
}

/* ─────────────────────────────────────────────
   6. SCROLL REVEALS
   All .reveal elements slide up + fade in
   ───────────────────────────────────────────── */
function initReveal() {
  document.querySelectorAll('.reveal').forEach(el => {
    const delay = parseFloat(el.dataset.delay || 0) / 1000;
    gsap.to(el, {
      y: 0, opacity: 1, duration: 0.8, delay, ease: 'power3.out',
      scrollTrigger: {
        trigger     : el,
        start       : 'top 87%',
        toggleActions: 'play none none reverse',
      }
    });
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
  // Track has 12 items (6 + 6 duplicate), animate -50% for seamless loop
  gsap.to(track, { x: '-50%', duration: 24, ease: 'none', repeat: -1 });
}

/* ─────────────────────────────────────────────
   9. PARALLAX (light — scrub only on scroll)
   Only 2 elements parallax to keep it fast
   ───────────────────────────────────────────── */
function initParallax() {
  // Benefits bottle drifts slightly upward
  gsap.to('.benefits-bottle-img', {
    y: -50, ease: 'none',
    scrollTrigger: {
      trigger: '.benefits',
      start: 'top bottom', end: 'bottom top', scrub: true
    }
  });

  // About section bottle slight rotation on scroll
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
   Bottle lifts as hero scrolls out of view
   ───────────────────────────────────────────── */
function initHeroScroll() {
  gsap.to('.hero-bottle-img', {
    y: -60, ease: 'none',
    scrollTrigger: {
      trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true
    }
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
  initLoader();     // fires hero entrance on complete
  initNavbar();
  initAleglaSection();
  initCardTilt();
  initReveal();
  initCounters();
  initMarquee();
  initParallax();
  initHeroScroll();
  initCtaBottles();
  initAnchors();

  // Recalculate positions after all images load
  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });
});

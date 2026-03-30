/* ══════════════════════════════════════════════
   ALEGLA — main.js
   3D Scroll Animations (GSAP + ScrollTrigger)
   Inspired by KMBCH Webflow site analysis
   ══════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────
   1. PAGE LOADER
   ───────────────────────────────────────────── */
function initLoader() {
  const loader   = document.getElementById('loader');
  const loaderFill = document.getElementById('loaderFill');

  // Animate progress bar to full
  gsap.to(loaderFill, {
    scaleX: 1,
    duration: 1.4,
    ease: 'power2.inOut',
    onComplete: () => {
      // Slide loader up and out
      gsap.to(loader, {
        yPercent: -100,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.in',
        onComplete: () => {
          loader.remove();
          document.body.classList.remove('is-loading');
          // Fire hero entrance after loader exits
          initHeroEntrance();
          initAleglaTag();
        }
      });
    }
  });
}

/* ─────────────────────────────────────────────
   2. HERO ENTRANCE ANIMATION
   Key technique from KMBCH:
   Elements start at translate3d(40px,0,0) opacity:0
   and animate to translate3d(0,0,0) opacity:1 with stagger
   ───────────────────────────────────────────── */
function initHeroEntrance() {
  // Collect hero-in elements and sort by their --i CSS variable
  const heroEls = [...document.querySelectorAll('.hero-in')].sort((a, b) => {
    const ai = parseInt(a.style.getPropertyValue('--i')) || 0;
    const bi = parseInt(b.style.getPropertyValue('--i')) || 0;
    return ai - bi;
  });

  gsap.to(heroEls, {
    x: 0,
    opacity: 1,
    // Full transform reset — same pattern as KMBCH ix2
    transform: 'translate3d(0,0,0) scale3d(1,1,1) rotateX(0deg) rotateY(0deg) rotateZ(0deg)',
    stagger: 0.11,
    duration: 0.95,
    ease: 'power3.out',
  });
}

/* ─────────────────────────────────────────────
   3. NAVBAR SCROLL BEHAVIOR
   Background-color transition on scroll
   (same pattern as KMBCH navbar data-w-id animation)
   ───────────────────────────────────────────── */
function initNavbar() {
  const navbar = document.getElementById('navbar');

  ScrollTrigger.create({
    start: 'top -80px',
    onUpdate: (self) => {
      navbar.classList.toggle('scrolled', self.progress > 0);
    }
  });
}

/* ─────────────────────────────────────────────
   4. ALEGLA LETTERS SCROLL SECTION
   ────────────────────────────────────────────
   The star animation — mirrors KMBCH's sticky
   kmbch-section with scroll-linked Lottie.

   How it works:
   • Section is 600vh tall
   • Inner .alegla-pin is position:sticky (pins for full scroll)
   • ScrollTrigger scrub maps scroll progress 0→1
   • For each of 6 letters (A,L,E,G,L,A):
       - localProgress = how far this letter is through its activation window
       - .l-fill  → clip-path: inset(0 0 X% 0) reveals color from bottom up
       - .l-bottle → translateY from +120% to 0% (rises into letter)
       - .l-info  → fades + slides in
       - .l-ghost → subtle scale
   ───────────────────────────────────────────── */
function initAleglaSection() {
  const wrapper  = document.querySelector('.alegla-scroll');
  const pin      = document.getElementById('aleglaPin');
  const cols     = document.querySelectorAll('.l-col');
  const progress = document.getElementById('aleglaProgress');

  if (!wrapper || !pin) return;

  // Each letter activates in a staggered window across the scroll
  // Overlap windows slightly so multiple letters animate simultaneously
  const STEP     = 0.13;   // spacing between each letter's start
  const DURATION = 0.26;   // how much scroll each letter uses to complete

  ScrollTrigger.create({
    trigger : wrapper,
    start   : 'top top',
    end     : 'bottom bottom',
    pin     : pin,
    scrub   : 1.5,    // lag for buttery-smooth feel
    onUpdate: (self) => {
      const p = self.progress;

      // Update the bottom progress bar
      progress.style.transform = `scaleX(${p})`;

      cols.forEach((col, i) => {
        const start  = i * STEP;
        const end    = start + DURATION;
        // localP: 0 = not started, 1 = fully revealed
        const localP = Math.max(0, Math.min(1, (p - start) / (end - start)));

        const fill   = col.querySelector('.l-fill');
        const bottle = col.querySelector('.l-bottle');
        const info   = col.querySelector('.l-info');
        const ghost  = col.querySelector('.l-ghost');

        // ── Letter color fill: clip-path reveals from bottom up ──
        // inset(0 0 X% 0) → X% = distance from bottom that stays clipped
        // Start: X=100% (nothing shown), End: X=0% (all shown)
        const clip = (1 - localP) * 100;
        fill.style.clipPath = `inset(0 0 ${clip.toFixed(2)}% 0)`;

        // Add a glow to filled text as it reveals
        const color = fill.style.color;
        fill.style.textShadow = localP > 0.1
          ? `0 0 ${localP * 40}px ${color}40`
          : 'none';

        // ── Bottle rises from below into the letter ──
        // start: translateY(120%) — well below letter container
        // end: translateY(5%) — sitting nicely inside the letter
        const bottleY = (1 - localP) * 120 + (localP * 5);
        bottle.style.transform = `translateX(-50%) translateY(${bottleY.toFixed(2)}%)`;
        bottle.style.opacity   = Math.min(1, localP * 2).toFixed(3); // fast fade-in

        // ── Flavor info label ──
        const infoY = (1 - localP) * 16;
        info.style.opacity   = localP.toFixed(3);
        info.style.transform = `translateY(${infoY.toFixed(2)}px)`;

        // ── Ghost letter subtle scale when active ──
        const scale = 1 + localP * 0.04;
        ghost.style.transform = `scale(${scale.toFixed(4)})`;
      });
    }
  });
}

function initAleglaTag() {
  // Reveal the "Six unique flavors" tag when section enters viewport
  const tag = document.querySelector('.alegla-tag');
  if (!tag) return;

  ScrollTrigger.create({
    trigger : '.alegla-scroll',
    start   : 'top 70%',
    onEnter : () => tag.classList.add('visible'),
    onLeaveBack: () => tag.classList.remove('visible'),
  });
}

/* ─────────────────────────────────────────────
   5. PRODUCT CARD 3D MOUSE TILT
   True CSS 3D perspective transform on hover
   (rotateX + rotateY based on mouse position)
   ───────────────────────────────────────────── */
function initCardTilt() {
  document.querySelectorAll('.product-card').forEach(card => {
    let rafId = null;
    let targetRX = 0, targetRY = 0, currentRX = 0, currentRY = 0;
    let isHovered = false;

    card.addEventListener('mouseenter', () => {
      isHovered = true;
      card.style.transition = 'transform 0.1s ease, border-color 0.3s ease';
    });

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5; // -0.5 to 0.5
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      targetRX = -y * 16;  // tilt up/down
      targetRY =  x * 16;  // tilt left/right
    });

    card.addEventListener('mouseleave', () => {
      isHovered = false;
      targetRX = 0; targetRY = 0;
      card.style.transition = 'transform 0.6s var(--ease-out), border-color 0.3s ease';
    });

    // Smooth lerp loop
    (function loop() {
      rafId = requestAnimationFrame(loop);
      currentRX += (targetRX - currentRX) * 0.12;
      currentRY += (targetRY - currentRY) * 0.12;

      if (!isHovered && Math.abs(currentRX) < 0.01 && Math.abs(currentRY) < 0.01) {
        currentRX = 0; currentRY = 0;
      }

      card.style.transform = `
        perspective(700px)
        rotateX(${currentRX.toFixed(3)}deg)
        rotateY(${currentRY.toFixed(3)}deg)
        translateZ(${isHovered ? 12 : 0}px)
      `;
    })();
  });
}

/* ─────────────────────────────────────────────
   6. SCROLL REVEAL (all .reveal elements)
   translate3d(0, 52px, 0) + opacity:0 → natural position
   ───────────────────────────────────────────── */
function initReveal() {
  document.querySelectorAll('.reveal').forEach(el => {
    const delay = parseFloat(el.dataset.delay || 0) / 1000;

    gsap.to(el, {
      y: 0,
      opacity: 1,
      duration: 0.85,
      delay,
      ease: 'power3.out',
      scrollTrigger: {
        trigger          : el,
        start            : 'top 86%',
        toggleActions    : 'play none none reverse',
      }
    });
  });
}

/* ─────────────────────────────────────────────
   7. ANIMATED STAT COUNTERS
   ───────────────────────────────────────────── */
function initCounters() {
  document.querySelectorAll('.count').forEach(el => {
    const target = parseInt(el.dataset.target, 10);

    ScrollTrigger.create({
      trigger : el,
      start   : 'top 85%',
      once    : true,
      onEnter : () => {
        const obj = { val: 0 };
        gsap.to(obj, {
          val     : target,
          duration: 1.8,
          ease    : 'power2.out',
          onUpdate: () => { el.textContent = Math.round(obj.val); }
        });
      }
    });
  });
}

/* ─────────────────────────────────────────────
   8. MARQUEE (infinite scroll strip)
   ───────────────────────────────────────────── */
function initMarquee() {
  const track = document.getElementById('marqueeTrack');
  if (!track) return;

  // The track has 12 items (6 original + 6 duplicates)
  // Animate -50% so it loops seamlessly
  gsap.to(track, {
    x       : '-50%',
    duration: 22,
    ease    : 'none',
    repeat  : -1,
  });
}

/* ─────────────────────────────────────────────
   9. PARALLAX EFFECTS
   Benefits bottle + hero background orbs
   ───────────────────────────────────────────── */
function initParallax() {
  // Benefits bottle parallax
  gsap.to('.benefits-bottle-3d', {
    y: -70,
    ease: 'none',
    scrollTrigger: {
      trigger : '.benefits',
      start   : 'top bottom',
      end     : 'bottom top',
      scrub   : true,
    }
  });

  // Hero orbs slow drift on scroll
  gsap.to('.orb-1', {
    y: -120,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.orb-2', {
    y: -70,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
  gsap.to('.orb-3', {
    y: -50,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
  });
}

/* ─────────────────────────────────────────────
   10. HERO BOTTLE SCROLL PARALLAX
   Bottle drifts upward as hero scrolls out
   Adds extra 3D depth to the entrance section
   ───────────────────────────────────────────── */
function initHeroBottleParallax() {
  gsap.to('.bottle-float', {
    y      : -80,
    rotateZ: 8,
    ease   : 'none',
    scrollTrigger: {
      trigger : '.hero',
      start   : 'top top',
      end     : 'bottom top',
      scrub   : true,
    }
  });
}

/* ─────────────────────────────────────────────
   11. CTA SECTION REVEAL (scale + fade)
   Extra dramatic entrance for final CTA
   ───────────────────────────────────────────── */
function initCtaReveal() {
  gsap.fromTo('.cta-heading', {
    scale  : 0.9,
    opacity: 0,
    y      : 40,
  }, {
    scale : 1,
    opacity: 1,
    y     : 0,
    duration: 1,
    ease : 'power3.out',
    scrollTrigger: {
      trigger      : '.cta-section',
      start        : 'top 70%',
      toggleActions: 'play none none reverse',
    }
  });
}

/* ─────────────────────────────────────────────
   INIT ALL
   ───────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  // Initialize everything except hero (waits for loader)
  initLoader();
  initNavbar();
  initAleglaSection();
  initReveal();
  initCardTilt();
  initCounters();
  initMarquee();
  initParallax();
  initHeroBottleParallax();
  initCtaReveal();

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Refresh ScrollTrigger after all layout is settled
  window.addEventListener('load', () => ScrollTrigger.refresh());
});

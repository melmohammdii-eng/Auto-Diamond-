/* ================================================================
   AUTO DIAMOND — MAIN.JS
   ================================================================
   MODULES:
   1. Header — scroll shadow
   2. Mobile nav — hamburger toggle
   3. Hero Carousel — prev/next, dot nav, auto-advance, swipe
   4. Hero slides — background image loader
   5. Price Range slider — live output display
   6. Filter bar — search button (hook into your own data)
   7. Wishlist — card save toggle
   ================================================================ */

'use strict';

/* ----------------------------------------------------------------
   1. HEADER — add .scrolled class on scroll for backdrop blur
---------------------------------------------------------------- */
(function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();


/* ----------------------------------------------------------------
   2. MOBILE NAV — hamburger toggle
---------------------------------------------------------------- */
(function initMobileNav() {
  const hamburger = document.getElementById('navHamburger');
  const navLinks  = document.getElementById('navLinks');
  const navCta    = document.querySelector('.nav-cta');
  if (!hamburger || !navLinks) return;

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!isOpen));
    navLinks.classList.toggle('open', !isOpen);
    if (navCta) navCta.classList.toggle('open', !isOpen);
    document.body.style.overflow = isOpen ? '' : 'hidden';
  });

  // Close nav when any link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
      if (navCta) navCta.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hamburger.getAttribute('aria-expanded') === 'true') {
      hamburger.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
      if (navCta) navCta.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
})();


/* ----------------------------------------------------------------
   3 & 4. HERO CAROUSEL
   - Reads `data-bg` attribute from each .slide for lazy BG load
   - Supports: prev/next buttons, dot nav, auto-advance, touch swipe
   - Config: change INTERVAL_MS to adjust auto-advance timing
---------------------------------------------------------------- */
(function initCarousel() {
  const track    = document.getElementById('heroTrack');
  const prevBtn  = document.getElementById('heroPrev');
  const nextBtn  = document.getElementById('heroNext');
  const dotsWrap = document.getElementById('heroDots');
  if (!track || !prevBtn || !nextBtn || !dotsWrap) return;

  const slides = Array.from(track.querySelectorAll('.slide'));
  if (slides.length === 0) return;

  const INTERVAL_MS = 6000; // ← change auto-advance speed here
  let current    = 0;
  let timer      = null;
  let touchStartX = null;

  // --- Load background images ---
  slides.forEach(slide => {
    const bg = slide.dataset.bg;
    if (bg) slide.style.backgroundImage = `url('${bg}')`;
  });

  // --- Build dot indicators ---
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  const dots = Array.from(dotsWrap.querySelectorAll('.hero-dot'));

  // --- Core navigation ---
  function goTo(index) {
    current = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    // Announce to screen readers
    const slide = slides[current];
    const heading = slide.querySelector('.slide-heading');
    if (heading) heading.focus({ preventScroll: true });
  }

  function advance() { goTo(current + 1); }
  function retreat() { goTo(current - 1); }

  // --- Auto-advance ---
  function startTimer() { timer = setInterval(advance, INTERVAL_MS); }
  function resetTimer()  { clearInterval(timer); startTimer(); }

  prevBtn.addEventListener('click', () => { retreat(); resetTimer(); });
  nextBtn.addEventListener('click', () => { advance(); resetTimer(); });

  // --- Touch / swipe support ---
  track.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 50) {
      delta < 0 ? advance() : retreat();
      resetTimer();
    }
    touchStartX = null;
  }, { passive: true });

  // --- Keyboard navigation ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { retreat(); resetTimer(); }
    if (e.key === 'ArrowRight') { advance(); resetTimer(); }
  });

  // --- Pause on hover ---
  track.addEventListener('mouseenter', () => clearInterval(timer));
  track.addEventListener('mouseleave', startTimer);

  // --- Reduce motion: skip auto-advance ---
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) startTimer();
})();


/* ----------------------------------------------------------------
   5. PRICE RANGE SLIDER — live display
---------------------------------------------------------------- */
(function initPriceSlider() {
  const slider = document.getElementById('filterPrice');
  const output = document.getElementById('priceOutput');
  if (!slider || !output) return;

  const format = (val) =>
    val >= 500000
      ? 'Any Price'
      : '$' + Number(val).toLocaleString('en-US');

  slider.addEventListener('input', () => {
    output.textContent = format(slider.value);
  });

  output.textContent = format(slider.value); // init display
})();


/* ----------------------------------------------------------------
   6. FILTER BAR — search button handler
   Hook this into your own inventory data / backend.
   Reads the current values from all filter fields.
---------------------------------------------------------------- */
(function initFilterSearch() {
  const searchBtn = document.getElementById('filterSearchBtn');
  if (!searchBtn) return;

  searchBtn.addEventListener('click', () => {
    const make  = document.getElementById('filterMake')?.value  || '';
    const model = document.getElementById('filterModel')?.value || '';
    const year  = document.getElementById('filterYear')?.value  || '';
    const price = document.getElementById('filterPrice')?.value || '500000';

    const filters = { make, model, year, maxPrice: price };

    // Log the filter object (replace this with your own search logic):
    console.log('Filter search triggered:', filters);

    // Example: scroll to cards section
    const inventory = document.getElementById('featured');
    if (inventory) {
      inventory.scrollIntoView({ behavior: 'smooth' });
    }

    // TODO: replace the above with a fetch() to your API,
    // then re-render the .cards-grid with the returned results.
    // e.g.: filterInventory(filters).then(renderCards);
  });
})();


/* ----------------------------------------------------------------
   7. WISHLIST TOGGLE — heart icon on car cards
   Persists selection to sessionStorage so it survives page nav.
---------------------------------------------------------------- */
(function initWishlist() {
  const STORAGE_KEY = 'ad_wishlist';

  // Load existing wishlist from session
  let wishlist = new Set(
    JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]')
  );

  function save() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...wishlist]));
  }

  document.querySelectorAll('.card-wishlist').forEach((btn, index) => {
    const id = `card-${index}`;
    btn.dataset.id = id;

    // Restore state
    if (wishlist.has(id)) {
      btn.classList.add('active');
      btn.textContent = '♥';
      btn.setAttribute('aria-label', 'Remove from wishlist');
    }

    btn.addEventListener('click', () => {
      const inList = wishlist.has(id);
      if (inList) {
        wishlist.delete(id);
        btn.classList.remove('active');
        btn.textContent = '♡';
        btn.setAttribute('aria-label', 'Save to wishlist');
      } else {
        wishlist.add(id);
        btn.classList.add('active');
        btn.textContent = '♥';
        btn.setAttribute('aria-label', 'Remove from wishlist');
      }
      save();
    });
  });
})();


/* ----------------------------------------------------------------
   UTILITY: Scroll-triggered fade-in for cards
   Cards animate in as they enter the viewport.
---------------------------------------------------------------- */
(function initScrollReveal() {
  const items = document.querySelectorAll('.car-card');
  if (!items.length || !('IntersectionObserver' in window)) return;

  // Set initial state
  items.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.55s ease ${i * 0.07}s, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 0.07}s`;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  items.forEach(el => observer.observe(el));
})();

/* DotMov v2 — main.js
   Cinematic Authority Motion System
   Handles: hero word reveal · celebrity strip · why pinned scroll ·
            case study curtains · stat counters · methodology reveals ·
            testimonial reveals · scroll reveal · sticky nav · mobile nav ·
            FAQ accordion · work lightbox · contact form · reduced motion
*/

(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Reduced Motion: disable hero video autoplay ────────────────
  if (reducedMotion) {
    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo) {
      heroVideo.removeAttribute('autoplay');
      heroVideo.pause();
    }
  }

  // ── Sticky Navbar ──────────────────────────────────────────────
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Mobile Nav ─────────────────────────────────────────────────
  const hamburger   = document.getElementById('hamburger');
  const mobileNav   = document.getElementById('mobileNav');
  const mobileClose = document.getElementById('mobileNavClose');

  function openMobileNav() {
    if (!mobileNav || !hamburger) return;
    mobileNav.classList.add('open');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileNav() {
    if (!mobileNav || !hamburger) return;
    mobileNav.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', openMobileNav);
    if (mobileClose) mobileClose.addEventListener('click', closeMobileNav);
    mobileNav.addEventListener('click', (e) => {
      if (e.target === mobileNav || e.target.tagName === 'A') closeMobileNav();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileNav();
    });
  }

  // ── Active Nav Link Highlight ──────────────────────────────────
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-nav a, .mobile-nav-links a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // ── Hero Word-by-Word Reveal ───────────────────────────────────
  const heroHeadline = document.getElementById('heroHeadline');
  if (heroHeadline && !reducedMotion) {
    // Process each text node, wrap words in .hero-word spans
    function wrapWords(el) {
      const baseDelay = 0.15; // seconds before first word
      const gap       = 0.06; // seconds between words
      let wordIndex   = 0;

      function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text  = node.textContent;
          const words = text.split(/(\s+)/);
          const frag  = document.createDocumentFragment();

          words.forEach((chunk) => {
            if (/^\s+$/.test(chunk) || chunk === '') {
              // Preserve whitespace
              frag.appendChild(document.createTextNode(chunk));
            } else {
              const outer = document.createElement('span');
              outer.className = 'hero-word';
              const inner = document.createElement('span');
              inner.className = 'hero-word-inner';
              inner.textContent = chunk;
              inner.style.animationDelay = `${baseDelay + wordIndex * gap}s`;
              wordIndex++;
              outer.appendChild(inner);
              frag.appendChild(outer);
            }
          });

          node.parentNode.replaceChild(frag, node);
        } else if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.tagName !== 'SCRIPT' &&
          node.tagName !== 'STYLE'
        ) {
          // Process child nodes (handles <em>, <br>, etc.)
          Array.from(node.childNodes).forEach(processNode);
        }
      }

      Array.from(el.childNodes).forEach(processNode);
    }

    wrapWords(heroHeadline);
  } else if (heroHeadline && reducedMotion) {
    // Immediately visible — CSS handles this via the media query, but ensure visibility
    heroHeadline.querySelectorAll('.hero-word-inner').forEach((el) => {
      el.style.transform = 'translateY(0)';
      el.style.opacity   = '1';
    });
  }

  // ── Celebrity Horizontal Strip ─────────────────────────────────
  const celebStrip    = document.getElementById('celebStrip');
  const progressFill  = document.getElementById('celebProgressFill');
  const celebCounter  = document.getElementById('celebCounter');

  if (celebStrip) {
    const strip = celebStrip.querySelector('.celeb-strip');
    const total = strip ? strip.querySelectorAll('.celeb-figure').length : 0;

    function updateCelebUI() {
      const scrollLeft = celebStrip.scrollLeft;
      const maxScroll  = celebStrip.scrollWidth - celebStrip.clientWidth;
      const progress   = maxScroll > 0 ? scrollLeft / maxScroll : 0;

      if (progressFill) progressFill.style.width = `${progress * 100}%`;

      if (celebCounter && total > 0) {
        // Estimate current card index based on scroll position
        const figureWidth = strip.querySelector('.celeb-figure')?.offsetWidth || 400;
        const gap = 24;
        const cardIndex = Math.min(
          Math.round(scrollLeft / (figureWidth + gap)) + 1,
          total
        );
        celebCounter.textContent = `${String(cardIndex).padStart(3, '0')} / ${String(total).padStart(3, '0')}`;
      }
    }

    // Wheel event: translate vertical scroll to horizontal
    celebStrip.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // already horizontal
      e.preventDefault();
      celebStrip.scrollLeft += e.deltaY * 1.2;
    }, { passive: false });

    // Drag support
    let isDragging  = false;
    let dragStartX  = 0;
    let scrollStart = 0;

    celebStrip.addEventListener('mousedown', (e) => {
      isDragging  = true;
      dragStartX  = e.pageX;
      scrollStart = celebStrip.scrollLeft;
      celebStrip.style.cursor = 'grabbing';
      celebStrip.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.pageX - dragStartX;
      celebStrip.scrollLeft = scrollStart - dx;
    });

    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      celebStrip.style.cursor = '';
      celebStrip.style.userSelect = '';
    });

    // Touch drag support
    let touchStartX  = 0;
    let touchScrollStart = 0;

    celebStrip.addEventListener('touchstart', (e) => {
      touchStartX      = e.touches[0].pageX;
      touchScrollStart = celebStrip.scrollLeft;
    }, { passive: true });

    celebStrip.addEventListener('touchmove', (e) => {
      const dx = e.touches[0].pageX - touchStartX;
      celebStrip.scrollLeft = touchScrollStart - dx;
    }, { passive: true });

    celebStrip.addEventListener('scroll', updateCelebUI, { passive: true });
    updateCelebUI(); // initialise
  }

  // ── Why DotMov — Pinned Scroll State Machine ───────────────────
  const whyOuter  = document.getElementById('whyOuter');
  const whySpacer = document.getElementById('whySpacer');
  const whyPanel  = document.getElementById('whyPanel');
  const whyState1 = document.getElementById('whyState1');
  const whyState2 = document.getElementById('whyState2');
  const whyState3 = document.getElementById('whyState3');
  const whyProgressStateEl = document.getElementById('whyProgressState');
  const whyFractionEl      = document.getElementById('whyFraction');
  const wpl = [
    document.getElementById('wpl0'),
    document.getElementById('wpl1'),
    document.getElementById('wpl2'),
  ];

  const stateLabels = ['WHY CLIENTS CHOOSE US', 'WHAT WE DELIVER', 'HOW WE WORK'];
  const bgColors    = ['var(--ink)', 'var(--ink-2)', 'var(--ink-3)'];

  // Only run on desktop (the sticky is hidden on mobile via CSS)
  if (whyOuter && whySpacer && whyPanel && !reducedMotion) {
    let currentState = 0;

    function setWhyState(newState) {
      if (newState === currentState) return;
      currentState = newState;

      // Update panel background
      if (whyPanel) whyPanel.style.background = bgColors[newState] || bgColors[0];

      // Toggle active state panels
      [whyState1, whyState2, whyState3].forEach((el, i) => {
        if (!el) return;
        el.classList.toggle('active', i === newState);
      });

      // Update progress label
      if (whyProgressStateEl) whyProgressStateEl.textContent = stateLabels[newState] || '';

      // Update progress lines
      wpl.forEach((line, i) => {
        if (!line) return;
        line.classList.toggle('active', i <= newState);
      });
    }

    function onScrollWhy() {
      const outerRect  = whyOuter.getBoundingClientRect();
      const outerTop   = outerRect.top;
      const outerH     = whyOuter.offsetHeight;
      // Progress: 0 when section top hits viewport, 1 when section bottom leaves
      const scrolled   = -outerTop;
      const maxScroll  = outerH - window.innerHeight;
      const progress   = Math.max(0, Math.min(1, maxScroll > 0 ? scrolled / maxScroll : 0));

      // Three equal bands: 0-0.33 → state 0, 0.33-0.67 → state 1, 0.67-1 → state 2
      const newState = progress < 0.34 ? 0 : progress < 0.67 ? 1 : 2;
      setWhyState(newState);

      // Fraction display (e.g. "2 / 3")
      if (whyFractionEl) whyFractionEl.textContent = `${newState + 1} / 3`;
    }

    window.addEventListener('scroll', onScrollWhy, { passive: true });
    onScrollWhy();
  } else if (whyPanel && reducedMotion) {
    // Immediately show all states for reduced motion
    [whyState1, whyState2, whyState3].forEach((el) => {
      if (el) el.classList.add('active');
    });
  }

  // ── Phone 3D tilt ─────────────────────────────────────────────
  const phoneTiltZone    = document.getElementById('phoneTiltZone');
  const phoneFrameEl     = document.getElementById('phoneFrame');
  const phoneGlareEl     = document.getElementById('phoneGlare');
  const phoneGroundEl    = document.getElementById('phoneGroundShadow');

  if (phoneTiltZone && phoneFrameEl && !reducedMotion) {
    let curX = 0, curY = 0, tgtX = 0, tgtY = 0;
    let rafRunning = false;
    const MAX = 14; // max tilt degrees

    function lerp(a, b, t) { return a + (b - a) * t; }

    function animateTilt() {
      curX = lerp(curX, tgtX, 0.1);
      curY = lerp(curY, tgtY, 0.1);

      phoneFrameEl.style.transform =
        `rotateX(${curX}deg) rotateY(${curY}deg)`;

      // Glare follows opposite side from cursor (light source illusion)
      if (phoneGlareEl) {
        const gx = 50 - curY * 2.5;
        const gy = 50 + curX * 2.5;
        phoneGlareEl.style.background =
          `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.13) 0%, transparent 55%)`;
      }

      // Shadow shifts in opposite direction to give floating depth
      if (phoneGroundEl) {
        phoneGroundEl.style.transform =
          `translateX(calc(-50% + ${curY * 1.8}px)) scaleX(${1 - Math.abs(curX) * 0.012})`;
        phoneGroundEl.style.opacity = `${0.5 + Math.abs(curX) * 0.01 + Math.abs(curY) * 0.01}`;
      }

      if (Math.abs(curX - tgtX) > 0.02 || Math.abs(curY - tgtY) > 0.02) {
        requestAnimationFrame(animateTilt);
      } else {
        rafRunning = false;
      }
    }

    phoneTiltZone.addEventListener('mousemove', (e) => {
      const r = phoneTiltZone.getBoundingClientRect();
      const nx = (e.clientX - r.left)  / r.width  - 0.5; // -0.5 → 0.5
      const ny = (e.clientY - r.top)   / r.height - 0.5;
      tgtY =  nx * MAX * 2;
      tgtX = -ny * MAX * 2;
      if (!rafRunning) { rafRunning = true; animateTilt(); }
    });

    phoneTiltZone.addEventListener('mouseleave', () => {
      tgtX = 0; tgtY = 0;
      if (!rafRunning) { rafRunning = true; animateTilt(); }
    });

    // Touch support for mobile
    phoneTiltZone.addEventListener('touchmove', (e) => {
      const t = e.touches[0];
      const r = phoneTiltZone.getBoundingClientRect();
      const nx = (t.clientX - r.left)  / r.width  - 0.5;
      const ny = (t.clientY - r.top)   / r.height - 0.5;
      tgtY =  nx * MAX;
      tgtX = -ny * MAX;
      if (!rafRunning) { rafRunning = true; animateTilt(); }
    }, { passive: true });

    phoneTiltZone.addEventListener('touchend', () => {
      tgtX = 0; tgtY = 0;
      if (!rafRunning) { rafRunning = true; animateTilt(); }
    });
  }

  // ── Phone play / pause button ──────────────────────────────────
  const phonePlayBtn  = document.getElementById('phonePlayBtn');
  const reelPlayIcon  = document.getElementById('reelPlayIcon');

  if (phonePlayBtn) {
    const PLAY_PATH  = '<polygon points="6,3 20,12 6,21"/>';
    const PAUSE_PATH = '<rect x="6" y="3" width="4" height="18"/><rect x="14" y="3" width="4" height="18"/>';
    let isPlaying = true;

    phonePlayBtn.addEventListener('click', () => {
      const vid = document.getElementById('casesVideo');
      if (!vid) return;
      if (isPlaying) {
        vid.pause();
        reelPlayIcon.innerHTML = PLAY_PATH;
      } else {
        vid.play();
        reelPlayIcon.innerHTML = PAUSE_PATH;
      }
      isPlaying = !isPlaying;
    });

    // Once playing, switch icon to pause
    const vid = document.getElementById('casesVideo');
    if (vid) {
      vid.addEventListener('play',  () => { reelPlayIcon.innerHTML = PAUSE_PATH; isPlaying = true; });
      vid.addEventListener('pause', () => { reelPlayIcon.innerHTML = PLAY_PATH;  isPlaying = false; });
    }
  }

  // ── Cases Showcase — phone video + client switcher ────────────
  const caseSwitchBtns = document.querySelectorAll('.case-switch-btn:not([disabled])');
  const caseInfoPanels = document.querySelectorAll('.case-info');
  const casesVideo     = document.getElementById('casesVideo');

  // Map case ID → video src (add more when uploading future clients)
  const caseVideoMap = {
    '1': 'assets/clients/parampara-dhothis.mp4',
    '2': '',
    '3': '',
  };

  if (caseSwitchBtns.length) {
    caseSwitchBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.case;

        // Update tab state
        document.querySelectorAll('.case-switch-btn').forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        // Swap content panel
        caseInfoPanels.forEach((p) => p.classList.remove('active'));
        const panel = document.getElementById(`ci-${id}`);
        if (panel) panel.classList.add('active');

        // Swap video src
        if (casesVideo && caseVideoMap[id]) {
          casesVideo.src = caseVideoMap[id];
          casesVideo.load();
          if (!reducedMotion) casesVideo.play();
        }
      });
    });
  }

  // ── Why Cards — staggered reveal ─────────────────────────────
  const whyCards = document.querySelectorAll('.why-card');
  if (whyCards.length && 'IntersectionObserver' in window) {
    const whyObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('wc-visible');
          whyObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

    whyCards.forEach((card) => {
      if (reducedMotion) {
        card.classList.add('wc-visible');
      } else {
        whyObserver.observe(card);
      }
    });
  }

  // ── Methodology Tab Switcher ───────────────────────────────────
  const methodTabBtns  = document.querySelectorAll('.method-tab-btn');
  const methodPanels   = document.querySelectorAll('.method-panel');
  if (methodTabBtns.length && methodPanels.length) {
    methodTabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const step = btn.dataset.step;
        // Update buttons
        methodTabBtns.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        // Update panels
        methodPanels.forEach((panel) => panel.classList.remove('active'));
        const target = document.getElementById(`mp-${step}`);
        if (target) target.classList.add('active');
      });
    });
  }

  // ── Testimonial Block Reveals ──────────────────────────────────
  const testimonialBlocks = document.querySelectorAll('.testimonial-block');
  if (testimonialBlocks.length && 'IntersectionObserver' in window) {
    const testimonialObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          testimonialObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    testimonialBlocks.forEach((block) => {
      if (reducedMotion) {
        block.classList.add('revealed');
      } else {
        testimonialObserver.observe(block);
      }
    });
  }

  // ── Stat Count-up Animation ────────────────────────────────────
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function animateCount(el) {
    const target   = parseFloat(el.dataset.count);
    const suffix   = el.dataset.suffix || '';
    const prefix   = el.dataset.prefix || '';
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : 0;
    const duration = 1800; // ms
    const start    = performance.now();

    function tick(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = easeOutExpo(progress);
      const current  = target * eased;

      if (decimals > 0) {
        el.textContent = prefix + current.toFixed(decimals) + suffix;
      } else {
        el.textContent = prefix + Math.floor(current).toLocaleString('en-IN') + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        if (decimals > 0) {
          el.textContent = prefix + target.toFixed(decimals) + suffix;
        } else {
          el.textContent = prefix + target.toLocaleString('en-IN') + suffix;
        }
      }
    }

    requestAnimationFrame(tick);
  }

  const countEls = document.querySelectorAll('[data-count]');
  if (countEls.length) {
    if (reducedMotion) {
      countEls.forEach((el) => {
        const target   = parseFloat(el.dataset.count);
        const suffix   = el.dataset.suffix || '';
        const prefix   = el.dataset.prefix || '';
        const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals, 10) : 0;
        el.textContent = prefix + (decimals > 0 ? target.toFixed(decimals) : target.toLocaleString('en-IN')) + suffix;
      });
    } else if ('IntersectionObserver' in window) {
      const countObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      countEls.forEach((el) => countObserver.observe(el));
    }
  }

  // ── Global Scroll Reveal (.reveal → .visible) ──────────────────
  const revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    if (reducedMotion) {
      revealEls.forEach((el) => el.classList.add('visible'));
    } else if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach((el) => revealObserver.observe(el));
    }
  }

  // ── KPI Frame Reveals ──────────────────────────────────────────
  const kpiCards = document.querySelectorAll('.kpi-frame');
  if (kpiCards.length) {
    if (reducedMotion) {
      kpiCards.forEach((el) => el.classList.add('kpi-visible'));
    } else if ('IntersectionObserver' in window) {
      const kpiObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('kpi-visible');
            kpiObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
      kpiCards.forEach((el) => kpiObserver.observe(el));
    }
  }

  // ── FAQ Accordion ──────────────────────────────────────────────
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const btn    = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!btn || !answer) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Close all others
      faqItems.forEach((other) => {
        if (other !== item) {
          other.classList.remove('open');
          other.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  // ── Work Portfolio Filter ──────────────────────────────────────
  const filterChips = document.querySelectorAll('.filter-chip');
  const workTiles   = document.querySelectorAll('.work-tile');

  filterChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      filterChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');

      const filter = chip.dataset.filter;
      workTiles.forEach((tile) => {
        const match = filter === 'all' || tile.dataset.category === filter;
        tile.style.display = match ? '' : 'none';
      });
    });
  });

  // ── Work Lightbox ──────────────────────────────────────────────
  const lightbox         = document.getElementById('lightbox');
  const lightboxClose    = document.getElementById('lightboxClose');
  const lightboxImg      = document.getElementById('lightboxImg');
  const lightboxCategory = document.getElementById('lightboxCategory');
  const lightboxTitle    = document.getElementById('lightboxTitle');
  const lightboxMeta     = document.getElementById('lightboxMeta');
  const lightboxDesc     = document.getElementById('lightboxDesc');

  if (lightbox && workTiles.length) {
    workTiles.forEach((tile) => {
      tile.setAttribute('tabindex', '0');
      tile.setAttribute('role', 'button');

      tile.addEventListener('click', () => {
        if (lightboxImg)      lightboxImg.src              = tile.dataset.img    || '';
        if (lightboxImg)      lightboxImg.alt              = tile.dataset.title  || '';
        if (lightboxCategory) lightboxCategory.textContent = tile.dataset.service || '';
        if (lightboxTitle)    lightboxTitle.textContent    = tile.dataset.title  || '';
        if (lightboxMeta)     lightboxMeta.textContent     = `Client: ${tile.dataset.client || '—'}`;
        if (lightboxDesc)     lightboxDesc.textContent     = tile.dataset.desc   || '';
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
        if (lightboxClose) lightboxClose.focus();
      });

      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tile.click(); }
      });
    });

    function closeLightbox() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
        closeMobileNav();
      }
    });
  } else {
    // Escape closes mobile nav even when no lightbox
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileNav();
    });
  }

  // ── Smooth Scroll for Anchor Links ────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const id     = anchor.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        const offset = 88;
        const top    = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    });
  });

  // ── Contact Form: URL param package prefill ────────────────────
  const urlParams = new URLSearchParams(window.location.search);
  const pkgParam  = urlParams.get('package');
  if (pkgParam) {
    const select = document.getElementById('package');
    if (select) {
      const option = select.querySelector(`option[value="${pkgParam}"]`);
      if (option) option.selected = true;
    }
  }

  // ── Contact Form: mailto submit ────────────────────────────────
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name    = document.getElementById('name')?.value.trim()    || '';
      const email   = document.getElementById('email')?.value.trim()   || '';
      const phone   = document.getElementById('phone')?.value.trim()   || '';
      const company = document.getElementById('company')?.value.trim() || '';
      const pkg     = document.getElementById('package')?.value        || '';
      const message = document.getElementById('message')?.value.trim() || '';

      if (!name || !email || !phone || !message) {
        alert('Please fill in all required fields.');
        return;
      }

      const body = [
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        company ? `Company: ${company}` : '',
        pkg     ? `Package: ${pkg}`     : '',
        `\nMessage:\n${message}`,
      ].filter(Boolean).join('\n');

      const subject = encodeURIComponent(`DotMov Enquiry — ${name}`);
      const bodyEnc = encodeURIComponent(body);
      window.location.href = `mailto:raswanthjagan@gmail.com?subject=${subject}&body=${bodyEnc}`;
    });
  }

})();

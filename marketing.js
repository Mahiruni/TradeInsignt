(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toast = $('#toast');
  let toastTimer = null;

  const notify = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  };

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  const navWrap = $('.nav-wrap');
  const navLinks = $('#nav-links');
  const navToggle = $('#mobile-nav-toggle');

  const syncNav = () => navWrap?.classList.toggle('scrolled', window.scrollY > 18);
  syncNav();
  window.addEventListener('scroll', syncNav, { passive: true });

  const closeMobileNav = () => {
    navLinks?.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  };

  navToggle?.addEventListener('click', () => {
    const open = !navLinks?.classList.contains('open');
    navLinks?.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-open', open);
  });

  $$('#nav-links a').forEach((link) => link.addEventListener('click', closeMobileNav));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMobileNav();
  });

  const revealElements = $$('.reveal');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('visible'));
  }

  const countups = $$('.countup');
  const animateCount = (element) => {
    if (element.dataset.counted === 'true') return;
    element.dataset.counted = 'true';
    const target = Number(element.dataset.count || 0);
    if (reduceMotion) {
      element.textContent = String(target);
      return;
    }
    const start = performance.now();
    const duration = 900 + Math.min(target * 5, 700);
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.45 });
    countups.forEach((element) => countObserver.observe(element));
  } else {
    countups.forEach(animateCount);
  }

  const analyticsTabs = $$('[data-analytics-tab]');
  const analyticsPanels = $$('[data-analytics-panel]');
  analyticsTabs.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.analyticsTab;
      analyticsTabs.forEach((item) => item.classList.toggle('active', item === button));
      analyticsPanels.forEach((panel) => panel.classList.toggle('active', panel.dataset.analyticsPanel === target));
    });
  });

  const billingButtons = $$('[data-billing]');
  const priceValues = $$('[data-price-monthly]');
  const periodLabels = $$('[data-period]');

  const setBilling = (mode) => {
    billingButtons.forEach((button) => button.classList.toggle('active', button.dataset.billing === mode));
    priceValues.forEach((price) => {
      price.textContent = mode === 'annual' ? price.dataset.priceAnnual : price.dataset.priceMonthly;
    });
    periodLabels.forEach((label) => {
      label.textContent = mode === 'annual' ? '/ month, billed yearly' : '/ month';
    });
  };

  billingButtons.forEach((button) => button.addEventListener('click', () => setBilling(button.dataset.billing)));

  if (!reduceMotion && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    $$('[data-tilt]').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        const rotateY = x * 3.2;
        const rotateX = y * -3.2;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  $$('[data-demo-toast]').forEach((control) => {
    control.addEventListener('click', (event) => {
      if (control.getAttribute('href') === '#') event.preventDefault();
      notify(control.dataset.demoToast || 'Available inside TradeInsight.');
    });
  });

  const canvas = $('#particle-canvas');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d', { alpha: true });
    let particles = [];
    let rafId = null;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      width = window.innerWidth;
      height = Math.min(980, Math.max(650, window.innerHeight));
      dpr = Math.min(window.devicePixelRatio || 1, 1.7);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = width < 560 ? 24 : width < 900 ? 38 : 58;
      particles = Array.from({ length: targetCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.35 + 0.35,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.14,
        a: Math.random() * 0.36 + 0.08
      }));
    };

    const frame = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(120, 205, 255, ${p.a})`;
        ctx.fill();
      }

      const connectionDistance = width < 700 ? 82 : 105;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > connectionDistance) continue;
          const alpha = (1 - dist / connectionDistance) * 0.055;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(101, 217, 255, ${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }

      rafId = requestAnimationFrame(frame);
    };

    resize();
    frame();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      } else if (!document.hidden && !rafId) {
        frame();
      }
    });
  }

  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (event) => {
      const id = anchor.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      closeMobileNav();
    });
  });
})();
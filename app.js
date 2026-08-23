(() => {
  'use strict';

  const initMobileShell = () => {
    const header = document.querySelector('.site-header');
    const bottomNav = document.querySelector('.mobile-bottom-nav');
    if (!header || !bottomNav) return;

    const links = [...bottomNav.querySelectorAll('a[href^="#"]')];
    const linkById = new Map(
      links.map((link) => [link.getAttribute('href').slice(1), link])
    );

    const setActive = (id) => {
      const active = linkById.get(id);
      if (!active) return;
      links.forEach((link) => {
        const selected = link === active;
        link.classList.toggle('is-active', selected);
        if (selected) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    };

    links.forEach((link) => {
      link.addEventListener('click', () => {
        setActive(link.getAttribute('href').slice(1));
      });
    });

    setActive(location.hash.slice(1) || 'dashboard');

    const watchedSections = [...linkById.keys()]
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if ('IntersectionObserver' in window && watchedSections.length) {
      const observer = new IntersectionObserver((entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      }, {
        root: null,
        rootMargin: '-18% 0px -68% 0px',
        threshold: [0, .01, .15, .35]
      });
      watchedSections.forEach((section) => observer.observe(section));
    }

    const syncHeader = () => header.classList.toggle('scrolled', window.scrollY > 8);
    syncHeader();
    window.addEventListener('scroll', syncHeader, { passive: true });

    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    document.documentElement.classList.toggle('standalone-app', Boolean(standalone));
  };

  const addMobileMeta = () => {
    const values = [
      ['mobile-web-app-capable', 'yes'],
      ['apple-mobile-web-app-capable', 'yes'],
      ['apple-mobile-web-app-status-bar-style', 'black-translucent']
    ];
    values.forEach(([name, content]) => {
      if (document.head.querySelector(`meta[name="${name}"]`)) return;
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
    });
  };

  addMobileMeta();
  initMobileShell();

  // Preserve the complete existing TradeInsight application logic.
  const core = document.createElement('script');
  core.src = './app-base.js';
  core.async = false;
  core.addEventListener('error', () => {
    console.error('TradeInsight core failed to load.');
  });
  document.head.appendChild(core);
})();

(() => {
  'use strict';

  const MOBILE_QUERY = '(max-width: 760px)';
  const mobileMedia = window.matchMedia(MOBILE_QUERY);

  const loadMobilePageStyles = () => {
    if (document.head.querySelector('link[data-mobile-pages]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './mobile-pages.css?v=20260823-2';
    link.media = MOBILE_QUERY;
    link.dataset.mobilePages = 'true';
    document.head.appendChild(link);
  };

  const initMobileShell = () => {
    const header = document.querySelector('.site-header');
    const bottomNav = document.querySelector('.mobile-bottom-nav');
    const main = document.querySelector('main');
    if (!header || !bottomNav || !main) return;

    const pages = [...main.querySelectorAll(':scope > section[id]')];
    const pagesById = new Map(pages.map((page) => [page.id, page]));
    const bottomLinks = [...bottomNav.querySelectorAll('a[href^="#"]')];

    const tabGroup = {
      dashboard: 'dashboard',
      'daily-check': 'dashboard',
      diagnostic: 'dashboard',
      protocol: 'dashboard',
      'session-mode': 'dashboard',
      playbook: 'playbook',
      candles: 'playbook',
      sources: 'playbook',
      mind: 'mind',
      gate: 'mind',
      mistakes: 'mind',
      journal: 'journal',
      saved: 'saved'
    };

    const normalizeRoute = (raw) => {
      const id = String(raw || '').replace(/^#/, '');
      if (!id || id === 'top') return 'dashboard';
      return pagesById.has(id) ? id : 'dashboard';
    };

    const setActiveTab = (pageId) => {
      const activeTabId = tabGroup[pageId] || pageId;
      bottomLinks.forEach((link) => {
        const linkId = normalizeRoute(link.getAttribute('href'));
        const selected = linkId === activeTabId;
        link.classList.toggle('is-active', selected);
        if (selected) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
    };

    const closeDrawer = () => {
      const menu = document.querySelector('.mobile-menu');
      const toggle = document.querySelector('#menu-toggle');
      if (menu) {
        menu.classList.remove('open');
        menu.setAttribute('aria-hidden', 'true');
      }
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    };

    const showPage = (rawId, options = {}) => {
      if (!mobileMedia.matches) return;
      const pageId = normalizeRoute(rawId);
      const page = pagesById.get(pageId);
      if (!page) return;

      pages.forEach((candidate) => {
        const active = candidate === page;
        candidate.classList.toggle('is-page-active', active);
        candidate.toggleAttribute('aria-hidden', !active);
        if (active) candidate.removeAttribute('inert');
        else candidate.setAttribute('inert', '');
      });

      document.documentElement.classList.add('mobile-page-router');
      document.documentElement.dataset.mobilePage = pageId;
      setActiveTab(pageId);
      closeDrawer();

      if (options.resetScroll) page.scrollTop = 0;

      const nextHash = `#${pageId}`;
      if (options.replace) {
        history.replaceState({ mobilePage: pageId }, '', nextHash);
      } else if (options.push && location.hash !== nextHash) {
        history.pushState({ mobilePage: pageId }, '', nextHash);
      }
    };

    const disablePageMode = () => {
      document.documentElement.classList.remove('mobile-page-router');
      delete document.documentElement.dataset.mobilePage;
      pages.forEach((page) => {
        page.classList.remove('is-page-active');
        page.removeAttribute('aria-hidden');
        page.removeAttribute('inert');
      });
      bottomLinks.forEach((link) => {
        link.classList.remove('is-active');
        link.removeAttribute('aria-current');
      });
    };

    const syncMode = () => {
      if (mobileMedia.matches) {
        showPage(location.hash, { replace: !location.hash || location.hash === '#top' });
      } else {
        disablePageMode();
      }
    };

    /* Route all internal section links as app-screen changes instead of document scrolling. */
    document.addEventListener('click', (event) => {
      if (!mobileMedia.matches) return;

      const anchor = event.target.closest('a[href^="#"]');
      if (anchor) {
        const raw = anchor.getAttribute('href');
        const targetId = normalizeRoute(raw);
        if (pagesById.has(targetId)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          showPage(targetId, { push: true, resetScroll: false });
          return;
        }
      }

      const scrollControl = event.target.closest('[data-scroll]');
      if (scrollControl) {
        const selector = scrollControl.getAttribute('data-scroll');
        if (selector && selector.startsWith('#')) {
          const targetId = normalizeRoute(selector);
          if (pagesById.has(targetId)) {
            event.preventDefault();
            event.stopImmediatePropagation();
            showPage(targetId, { push: true, resetScroll: false });
          }
        }
      }
    }, true);

    window.addEventListener('popstate', () => {
      if (mobileMedia.matches) showPage(location.hash, { replace: false });
    });

    window.addEventListener('hashchange', () => {
      if (mobileMedia.matches) showPage(location.hash, { replace: false });
    });

    const syncHeader = () => {
      if (!mobileMedia.matches) return;
      const activePage = main.querySelector(':scope > section.is-page-active');
      header.classList.toggle('scrolled', Boolean(activePage && activePage.scrollTop > 8));
    };

    pages.forEach((page) => page.addEventListener('scroll', syncHeader, { passive: true }));

    const onMediaChange = () => {
      syncMode();
      syncHeader();
    };

    if (typeof mobileMedia.addEventListener === 'function') {
      mobileMedia.addEventListener('change', onMediaChange);
    } else if (typeof mobileMedia.addListener === 'function') {
      mobileMedia.addListener(onMediaChange);
    }

    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    document.documentElement.classList.toggle('standalone-app', Boolean(standalone));

    syncMode();
    syncHeader();
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

  loadMobilePageStyles();
  addMobileMeta();
  initMobileShell();

  /* Preserve the complete existing TradeInsight product logic. */
  const core = document.createElement('script');
  core.src = './app-base.js';
  core.async = false;
  core.addEventListener('error', () => {
    console.error('TradeInsight core failed to load.');
  });
  document.head.appendChild(core);
})();

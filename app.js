(() => {
  'use strict';

  const MOBILE_QUERY = '(max-width: 760px)';
  const mobileMedia = window.matchMedia(MOBILE_QUERY);
  let routerApi = null;

  const loadMobilePageStyles = () => {
    if (document.head.querySelector('link[data-mobile-pages]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './mobile-pages.css?v=20260823-3';
    link.media = MOBILE_QUERY;
    link.dataset.mobilePages = 'true';
    document.head.appendChild(link);
  };

  const safeJson = {
    get(key, fallback) {
      try {
        const value = JSON.parse(localStorage.getItem(key));
        return value ?? fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }
  };

  const closeDialogIfOpen = (dialog) => {
    if (dialog && dialog.open && typeof dialog.close === 'function') dialog.close();
  };

  const initMobileShell = () => {
    const header = document.querySelector('.site-header');
    const bottomNav = document.querySelector('.mobile-bottom-nav');
    const main = document.querySelector('main');
    if (!header || !bottomNav || !main) return;

    const pages = [...main.querySelectorAll(':scope > section[id]')];
    const pagesById = new Map(pages.map((page) => [page.id, page]));
    const bottomLinks = [...bottomNav.querySelectorAll('a[href^="#"]')];

    const aliases = {
      top: 'dashboard',
      home: 'dashboard',
      gate: 'trade-gate',
      learn: 'playbook'
    };

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
      'trade-gate': 'mind',
      mistakes: 'mind',
      journal: 'journal',
      saved: 'saved'
    };

    const normalizeRoute = (raw) => {
      let id = String(raw || '').trim().replace(/^#/, '');
      if (!id) id = 'dashboard';
      id = aliases[id] || id;
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
      if (!mobileMedia.matches) return false;
      const pageId = normalizeRoute(rawId);
      const page = pagesById.get(pageId);
      if (!page) return false;

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
      header.classList.toggle('scrolled', page.scrollTop > 8);

      const nextHash = `#${pageId}`;
      if (options.replace) {
        history.replaceState({ mobilePage: pageId }, '', nextHash);
      } else if (options.push && location.hash !== nextHash) {
        history.pushState({ mobilePage: pageId }, '', nextHash);
      }

      return true;
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

    const syncHeader = () => {
      if (!mobileMedia.matches) return;
      const activePage = main.querySelector(':scope > section.is-page-active');
      header.classList.toggle('scrolled', Boolean(activePage && activePage.scrollTop > 8));
    };

    pages.forEach((page) => page.addEventListener('scroll', syncHeader, { passive: true }));

    /*
      Mobile route bridge. It catches every navigation-style control, including
      dynamically generated global-search result buttons. This prevents old
      scrollIntoView handlers from trying to scroll to hidden app screens.
    */
    document.addEventListener('click', (event) => {
      if (!mobileMedia.matches) return;

      const anchor = event.target.closest('a[href^="#"]');
      if (anchor) {
        const raw = anchor.getAttribute('href');
        const id = normalizeRoute(raw);
        if (pagesById.has(id)) {
          event.preventDefault();
          showPage(id, { push: true, resetScroll: false });
          return;
        }
      }

      const routeControl = event.target.closest('[data-scroll], [data-target]');
      if (!routeControl) return;

      const raw = routeControl.getAttribute('data-scroll') || routeControl.getAttribute('data-target');
      if (!raw || !String(raw).startsWith('#')) return;
      const id = normalizeRoute(raw);
      if (!pagesById.has(id)) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      closeDialogIfOpen(document.querySelector('#search-modal'));
      showPage(id, { push: true, resetScroll: false });
    }, true);

    window.addEventListener('popstate', () => {
      if (mobileMedia.matches) showPage(location.hash, { replace: false });
    });

    window.addEventListener('hashchange', () => {
      if (mobileMedia.matches) showPage(location.hash, { replace: false });
    });

    const onMediaChange = () => {
      syncMode();
      syncHeader();
    };

    if (typeof mobileMedia.addEventListener === 'function') {
      mobileMedia.addEventListener('change', onMediaChange);
    } else if (typeof mobileMedia.addListener === 'function') {
      mobileMedia.addListener(onMediaChange);
    }

    routerApi = {
      navigate: (id, options = {}) => showPage(id, { push: options.push !== false, resetScroll: !!options.resetScroll }),
      current: () => document.documentElement.dataset.mobilePage || normalizeRoute(location.hash),
      refresh: syncMode,
      closeDrawer,
      normalizeRoute
    };
    window.TradeInsightRouter = routerApi;

    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    document.documentElement.classList.toggle('standalone-app', Boolean(standalone));

    syncMode();
    syncHeader();
  };

  /* Persist the checkboxes inside Session Mode. The original app rebuilt these
     controls when switching tabs, which made their state disappear. */
  const getSessionMode = () => document.querySelector('.session-tabs button.active')?.dataset.session || 'pre';

  const restoreSessionChecklist = () => {
    const container = document.querySelector('#session-content');
    if (!container) return;
    const stored = safeJson.get('ti-session-checklists', {});
    const values = stored[getSessionMode()] || [];
    [...container.querySelectorAll('.session-items input[type="checkbox"]')].forEach((box, index) => {
      box.checked = !!values[index];
    });
  };

  const saveSessionChecklist = () => {
    const container = document.querySelector('#session-content');
    if (!container) return;
    const stored = safeJson.get('ti-session-checklists', {});
    stored[getSessionMode()] = [...container.querySelectorAll('.session-items input[type="checkbox"]')].map((box) => box.checked);
    safeJson.set('ti-session-checklists', stored);
  };

  document.addEventListener('change', (event) => {
    if (event.target.matches('#session-content .session-items input[type="checkbox"]')) {
      saveSessionChecklist();
    }
  });

  /* Keep toggle/button state exposed to assistive technology and restore
     dynamic controls after the core script updates their DOM. */
  const syncPressedStates = () => {
    const selectors = [
      '.filter', '.state-tab', '.mistake-chip',
      '#diagnostic-options button', '#protocol-grid button', '.session-tabs button',
      '#mood-grid button'
    ];
    document.querySelectorAll(selectors.join(',')).forEach((button) => {
      const on = button.classList.contains('active') || button.classList.contains('done');
      button.setAttribute('aria-pressed', String(on));
    });
  };

  document.addEventListener('click', (event) => {
    const sessionTab = event.target.closest('.session-tabs button');
    if (sessionTab) {
      requestAnimationFrame(() => {
        restoreSessionChecklist();
        syncPressedStates();
      });
      return;
    }

    if (event.target.closest('.filter, .state-tab, .mistake-chip, #diagnostic-options button, #protocol-grid button, #mood-grid button')) {
      requestAnimationFrame(syncPressedStates);
    }
  });

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

  /* Preserve all original Trader OS interactions, then apply the mobile bridge
     after the core listeners exist. */
  const core = document.createElement('script');
  core.src = './app-base.js?v=20260823-3';
  core.async = false;
  core.addEventListener('load', () => {
    restoreSessionChecklist();
    syncPressedStates();
    if (routerApi && mobileMedia.matches) routerApi.refresh();
  });
  core.addEventListener('error', () => {
    console.error('TradeInsight core failed to load.');
  });
  document.head.appendChild(core);
})();

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  const menuToggle = $('.menu-toggle');
  const siteNav = $('.site-nav');
  const closeMenu = () => {
    if (!menuToggle || !siteNav) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    siteNav.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };
  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const opening = menuToggle.getAttribute('aria-expanded') !== 'true';
      menuToggle.setAttribute('aria-expanded', String(opening));
      menuToggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
      siteNav.classList.toggle('is-open', opening);
      document.body.classList.toggle('menu-open', opening);
    });
    $$('.site-nav a').forEach(link => link.addEventListener('click', closeMenu));
  }

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px' });
    $$('.reveal').forEach(element => revealObserver.observe(element));
  } else {
    $$('.reveal').forEach(element => element.classList.add('is-visible'));
  }

  const filterButtons = $$('[data-filter]');
  const principles = $$('.principle[data-category]');
  filterButtons.forEach(button => button.addEventListener('click', () => {
    filterButtons.forEach(item => item.classList.remove('is-active'));
    button.classList.add('is-active');
    const filter = button.dataset.filter;
    principles.forEach(card => {
      const categories = card.dataset.category.split(' ');
      card.classList.toggle('is-hidden', filter !== 'all' && !categories.includes(filter));
    });
  }));

  const states = {
    fear: {
      kicker: 'STATE 01 · THREAT RESPONSE',
      title: 'Fear makes certainty feel more important than process.',
      description: 'The mind tries to remove uncertainty by moving stops, closing early, skipping valid entries or refusing a planned loss.',
      voice: '“Maybe I should wait for one more confirmation.”',
      rule: 'If the setup is valid and risk is accepted, execute without adding conditions.',
      symbol: '↓'
    },
    greed: {
      kicker: 'STATE 02 · REWARD CAPTURE',
      title: 'Greed makes the next opportunity feel like the last one.',
      description: 'Attention narrows around possible reward. Position size grows, invalidation becomes negotiable and patience disappears.',
      voice: '“This one looks too good to miss. I should size up.”',
      rule: 'Use the same risk model regardless of how attractive the setup feels.',
      symbol: '↑'
    },
    revenge: {
      kicker: 'STATE 03 · IDENTITY REPAIR',
      title: 'Revenge trading is an attempt to repair identity with money.',
      description: 'After a loss, the mind tries to restore control quickly. The next trade becomes emotional compensation rather than a planned decision.',
      voice: '“I only need one good trade to get it back.”',
      rule: 'After a rule-breaking loss, leave the screen and complete a written review before returning.',
      symbol: '↯'
    },
    euphoria: {
      kicker: 'STATE 04 · CONTROL ILLUSION',
      title: 'A large win can make risk feel smaller than it is.',
      description: 'Dopamine and confidence rise together. The trader confuses a favourable outcome with increased control over probability.',
      voice: '“I am seeing the market perfectly today.”',
      rule: 'After a large win, return to baseline risk or end the session.',
      symbol: '✦'
    }
  };

  const stateTabs = $$('[data-state]');
  stateTabs.forEach(tab => tab.addEventListener('click', () => {
    const data = states[tab.dataset.state];
    if (!data) return;
    stateTabs.forEach(item => {
      item.classList.remove('is-active');
      item.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('is-active');
    tab.setAttribute('aria-selected', 'true');
    $('#state-kicker').textContent = data.kicker;
    $('#state-title').textContent = data.title;
    $('#state-description').textContent = data.description;
    $('#state-voice').textContent = data.voice;
    $('#state-rule').textContent = data.rule;
    $('#state-symbol').textContent = data.symbol;
    const panel = $('#state-panel');
    panel.animate?.([{ opacity: .65, transform: 'translateY(7px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'ease-out' });
  }));

  const safeParse = (value, fallback) => {
    try { return JSON.parse(value) ?? fallback; } catch { return fallback; }
  };
  const storage = {
    get(key) { try { return window.localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { window.localStorage.setItem(key, value); } catch {} },
    remove(key) { try { window.localStorage.removeItem(key); } catch {} }
  };

  const dayInputs = $$('[data-day]');
  const savedDays = new Set(safeParse(storage.get('tradeinsight-days'), []));
  const syncProtocol = () => {
    dayInputs.forEach(input => { input.checked = savedDays.has(input.dataset.day); });
    const count = savedDays.size;
    const countEl = $('#protocol-count');
    const progressEl = $('#protocol-progress');
    if (countEl) countEl.textContent = String(count);
    if (progressEl) progressEl.style.width = `${(count / 7) * 100}%`;
  };
  dayInputs.forEach(input => input.addEventListener('change', () => {
    input.checked ? savedDays.add(input.dataset.day) : savedDays.delete(input.dataset.day);
    storage.set('tradeinsight-days', JSON.stringify([...savedDays]));
    syncProtocol();
  }));
  $('#protocol-reset')?.addEventListener('click', () => {
    savedDays.clear();
    storage.remove('tradeinsight-days');
    syncProtocol();
  });
  syncProtocol();

  const resetInputs = $$('[data-reset]');
  const updateReset = () => {
    const complete = resetInputs.filter(input => input.checked).length;
    const score = $('#reset-score');
    const progress = $('#reset-progress');
    const message = $('#reset-message');
    if (score) score.textContent = String(complete);
    if (progress) progress.style.width = `${(complete / Math.max(resetInputs.length, 1)) * 100}%`;
    if (message) {
      if (complete === resetInputs.length && complete > 0) {
        message.textContent = 'State checked. Execute only if the setup meets your written rules.';
        message.classList.add('ready');
      } else {
        message.textContent = 'Complete all four checks before execution.';
        message.classList.remove('ready');
      }
    }
  };
  resetInputs.forEach(input => input.addEventListener('change', updateReset));
  $('#reset-clear')?.addEventListener('click', () => {
    resetInputs.forEach(input => { input.checked = false; });
    updateReset();
  });
  updateReset();

  const playerModal = $('#player-modal');
  const playerFrame = $('#player-frame');
  const openPlayer = videoId => {
    if (!playerModal || !playerFrame || !videoId) return;
    playerFrame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0&modestbranding=1" title="TradeInsight source conversation" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    if (typeof playerModal.showModal === 'function') playerModal.showModal();
    else playerModal.setAttribute('open', '');
  };
  const closePlayer = () => {
    if (!playerModal || !playerFrame) return;
    playerFrame.innerHTML = '';
    if (typeof playerModal.close === 'function') playerModal.close();
    else playerModal.removeAttribute('open');
  };
  $$('[data-open-player]').forEach(button => button.addEventListener('click', () => openPlayer(button.dataset.openPlayer)));
  $('#close-player')?.addEventListener('click', closePlayer);
  playerModal?.addEventListener('click', event => {
    const rect = playerModal.getBoundingClientRect();
    const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
    if (outside) closePlayer();
  });
  playerModal?.addEventListener('cancel', event => { event.preventDefault(); closePlayer(); });

  const breathOverlay = $('#breath-overlay');
  const phaseEl = $('#breath-phase');
  const countEl = $('#breath-count');
  let breathTimers = [];
  const clearBreathTimers = () => { breathTimers.forEach(clearTimeout); breathTimers = []; };
  const closeBreath = () => {
    clearBreathTimers();
    breathOverlay?.classList.remove('is-open', 'is-inhaling', 'is-exhaling');
    breathOverlay?.setAttribute('aria-hidden', 'true');
  };
  const runPhase = (phase, seconds, className, next) => {
    if (!breathOverlay || !phaseEl || !countEl) return;
    breathOverlay.classList.remove('is-inhaling', 'is-exhaling');
    if (className) breathOverlay.classList.add(className);
    phaseEl.textContent = phase;
    let left = seconds;
    countEl.textContent = String(left);
    const tick = () => {
      left -= 1;
      countEl.textContent = String(Math.max(left, 0));
      if (left > 0) breathTimers.push(setTimeout(tick, 1000));
      else breathTimers.push(setTimeout(next, 350));
    };
    breathTimers.push(setTimeout(tick, 1000));
  };
  const startCycle = () => runPhase('Inhale', 4, 'is-inhaling', () => runPhase('Hold', 2, '', () => runPhase('Exhale', 6, 'is-exhaling', startCycle)));
  $$('[data-breathe]').forEach(button => button.addEventListener('click', () => {
    clearBreathTimers();
    breathOverlay?.classList.add('is-open');
    breathOverlay?.setAttribute('aria-hidden', 'false');
    startCycle();
  }));
  $('#close-breath')?.addEventListener('click', closeBreath);

  window.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    closeMenu();
    closeBreath();
    if (playerModal?.open) closePlayer();
  });
})();

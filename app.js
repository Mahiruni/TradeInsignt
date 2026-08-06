(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  $('#year').textContent = new Date().getFullYear();

  const menuToggle = $('.menu-toggle');
  const siteNav = $('.site-nav');
  const closeMenu = () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    siteNav.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };
  menuToggle.addEventListener('click', () => {
    const opening = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(opening));
    menuToggle.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
    siteNav.classList.toggle('is-open', opening);
    document.body.classList.toggle('menu-open', opening);
  });
  $$('.site-nav a').forEach(link => link.addEventListener('click', closeMenu));

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  $$('.reveal').forEach(element => revealObserver.observe(element));

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

  const stateData = {
    fear: {
      kicker: 'STATE 01 · THREAT RESPONSE',
      title: 'Fear makes certainty feel more important than process.',
      description: 'The mind tries to remove uncertainty by moving stops, closing early, skipping valid entries or refusing a planned loss.',
      voice: '“Maybe I should wait for one more confirmation.”',
      rule: 'If the setup is valid and risk is accepted, execute without adding conditions.',
      symbol: '↓',
      pattern: [38, 67, 93, 54, 70, 86, 76]
    },
    greed: {
      kicker: 'STATE 02 · REWARD BLINDNESS',
      title: 'Greed makes potential reward louder than existing risk.',
      description: 'Attention narrows around what can be won. Position size grows, entries multiply and invalidation starts to feel inconvenient.',
      voice: '“This looks too good to risk only one percent.”',
      rule: 'Position size is decided before opportunity feels exciting—and never changed afterward.',
      symbol: '↑',
      pattern: [36, 52, 70, 91, 83, 97, 61]
    },
    revenge: {
      kicker: 'STATE 03 · IDENTITY REPAIR',
      title: 'Revenge trading tries to repair the self through the market.',
      description: 'A loss becomes personal. The next trade is recruited to erase pain, restore status and prove that the previous outcome was wrong.',
      voice: '“I just need one clean trade to get it back.”',
      rule: 'After a rule-breaking loss, leave the platform. Review first; the next trade is not treatment.',
      symbol: '↯',
      pattern: [84, 61, 39, 91, 48, 88, 34]
    },
    euphoria: {
      kicker: 'STATE 04 · CONTROL ILLUSION',
      title: 'Euphoria confuses a winning streak with mastery over outcome.',
      description: 'Success releases energy and certainty. The trader begins to feel exceptional, increases frequency or abandons the risk model.',
      voice: '“I am seeing the market perfectly today.”',
      rule: 'After a large win, return to baseline before another order. Winning does not change the plan.',
      symbol: '✦',
      pattern: [33, 46, 57, 72, 89, 96, 65]
    }
  };

  const renderState = key => {
    const state = stateData[key];
    $('#state-kicker').textContent = state.kicker;
    $('#state-title').textContent = state.title;
    $('#state-description').textContent = state.description;
    $('#state-voice').textContent = state.voice;
    $('#state-rule').textContent = state.rule;
    $('#state-symbol').textContent = state.symbol;
    $$('#state-candles i').forEach((candle, index) => {
      candle.style.height = `${state.pattern[index]}%`;
      candle.style.background = index < 3 ? 'var(--red)' : 'var(--green)';
    });
  };
  $$('.state-tabs button').forEach(button => button.addEventListener('click', () => {
    $$('.state-tabs button').forEach(item => {
      item.classList.remove('is-active');
      item.setAttribute('aria-selected', 'false');
    });
    button.classList.add('is-active');
    button.setAttribute('aria-selected', 'true');
    renderState(button.dataset.state);
  }));

  const playerModal = $('#player-modal');
  const playerFrame = $('#player-frame');
  const closePlayer = () => {
    playerFrame.innerHTML = '';
    playerModal.close();
  };
  $$('[data-open-player]').forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.openPlayer;
    playerFrame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1" title="Embedded source conversation" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    playerModal.showModal();
  }));
  $('#close-player').addEventListener('click', closePlayer);
  playerModal.addEventListener('click', event => {
    if (event.target === playerModal) closePlayer();
  });

  const breathOverlay = $('#breath-overlay');
  const breathOrb = $('.breath-orb');
  const breathPhase = $('#breath-phase');
  const breathCount = $('#breath-count');
  let breathTimer;
  let phaseTimer;
  const phases = [
    { name: 'Inhale', seconds: 4, className: 'inhale' },
    { name: 'Hold', seconds: 2, className: 'inhale' },
    { name: 'Exhale', seconds: 6, className: 'exhale' }
  ];
  const stopBreathing = () => {
    clearInterval(breathTimer);
    clearTimeout(phaseTimer);
    breathOverlay.classList.remove('is-open');
    breathOverlay.setAttribute('aria-hidden', 'true');
    breathOrb.className = 'breath-orb';
  };
  const startBreathing = () => {
    breathOverlay.classList.add('is-open');
    breathOverlay.setAttribute('aria-hidden', 'false');
    let elapsed = 0;
    let phaseIndex = 0;
    const runPhase = () => {
      const phase = phases[phaseIndex];
      breathPhase.textContent = phase.name;
      breathOrb.className = `breath-orb ${phase.className}`;
      let remaining = phase.seconds;
      breathCount.textContent = remaining;
      clearInterval(breathTimer);
      breathTimer = setInterval(() => {
        remaining -= 1;
        breathCount.textContent = Math.max(remaining, 0);
      }, 1000);
      phaseTimer = setTimeout(() => {
        elapsed += phase.seconds;
        if (elapsed >= 60) {
          breathPhase.textContent = 'Complete';
          breathCount.textContent = '✓';
          breathOrb.className = 'breath-orb';
          clearInterval(breathTimer);
          return;
        }
        phaseIndex = (phaseIndex + 1) % phases.length;
        runPhase();
      }, phase.seconds * 1000);
    };
    runPhase();
  };
  $('[data-breathe]').addEventListener('click', startBreathing);
  $('#close-breath').addEventListener('click', stopBreathing);

  const protocolInputs = $$('[data-day]');
  const updateProtocol = () => {
    const complete = protocolInputs.filter(input => input.checked).length;
    $('#protocol-count').textContent = complete;
    $('#protocol-progress').style.width = `${(complete / protocolInputs.length) * 100}%`;
    localStorage.setItem('tradeinsight-protocol', JSON.stringify(protocolInputs.map(input => input.checked)));
  };
  const savedProtocol = JSON.parse(localStorage.getItem('tradeinsight-protocol') || '[]');
  protocolInputs.forEach((input, index) => {
    input.checked = Boolean(savedProtocol[index]);
    input.addEventListener('change', updateProtocol);
  });
  $('#protocol-reset').addEventListener('click', () => {
    protocolInputs.forEach(input => { input.checked = false; });
    updateProtocol();
  });
  updateProtocol();

  const resetInputs = $$('[data-reset]');
  const updateReset = () => {
    const complete = resetInputs.filter(input => input.checked).length;
    $('#reset-score').textContent = complete;
    $('#reset-progress').style.width = `${(complete / resetInputs.length) * 100}%`;
    const message = $('#reset-message');
    message.textContent = complete === resetInputs.length
      ? 'State checked. Execute only if the setup also satisfies your written rules.'
      : 'Complete all four checks before execution.';
    message.classList.toggle('ready', complete === resetInputs.length);
  };
  resetInputs.forEach(input => input.addEventListener('change', updateReset));
  $('#reset-clear').addEventListener('click', () => {
    resetInputs.forEach(input => { input.checked = false; });
    updateReset();
  });
  updateReset();

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMenu();
      if (breathOverlay.classList.contains('is-open')) stopBreathing();
    }
  });
})();

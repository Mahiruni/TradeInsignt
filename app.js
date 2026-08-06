(() => {
  const body = document.body;
  const menuButton = document.querySelector('.menu-button');
  const nav = document.querySelector('.main-nav');
  const toast = document.getElementById('toast');
  const year = document.getElementById('year');
  year.textContent = new Date().getFullYear();

  const closeMenu = () => {
    nav.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
    body.classList.remove('menu-open');
  };

  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!open));
    menuButton.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
    nav.classList.toggle('is-open', !open);
    body.classList.toggle('menu-open', !open);
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));

  const filterButtons = document.querySelectorAll('[data-filter]');
  const libraryCards = document.querySelectorAll('[data-category]');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(item => item.classList.remove('is-active'));
      button.classList.add('is-active');
      const filter = button.dataset.filter;
      libraryCards.forEach(card => {
        const categories = card.dataset.category.split(' ');
        card.classList.toggle('is-hidden', filter !== 'all' && !categories.includes(filter));
      });
    });
  });

  const showToast = message => {
    toast.querySelector('p').textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  };

  const saved = new Set(JSON.parse(localStorage.getItem('tradeconcept-saved') || '[]'));
  const saveButtons = document.querySelectorAll('[data-save]');
  const syncSaveButtons = () => {
    saveButtons.forEach(button => {
      const isSaved = saved.has(button.dataset.save);
      button.classList.toggle('is-saved', isSaved);
      const label = button.querySelector('span');
      if (label) label.textContent = isSaved ? 'Saved' : 'Save';
      button.setAttribute('aria-label', isSaved ? 'Remove saved episode' : 'Save episode');
    });
  };
  saveButtons.forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.save;
      if (saved.has(id)) {
        saved.delete(id);
        showToast('Removed from your library');
      } else {
        saved.add(id);
        showToast('Saved to your library');
      }
      localStorage.setItem('tradeconcept-saved', JSON.stringify([...saved]));
      syncSaveButtons();
    });
  });
  syncSaveButtons();

  const resetInputs = [...document.querySelectorAll('[data-reset]')];
  const score = document.getElementById('score');
  const progress = document.getElementById('reset-progress');
  const resetButton = document.getElementById('reset-button');
  const resetMessage = document.getElementById('reset-message');
  const updateReset = () => {
    const complete = resetInputs.filter(input => input.checked).length;
    score.textContent = String(complete);
    progress.style.width = `${(complete / resetInputs.length) * 100}%`;
    if (complete === resetInputs.length) {
      resetMessage.textContent = 'State checked. Execute only if the setup also meets your rules.';
      resetMessage.classList.add('ready');
    } else {
      resetMessage.textContent = 'Complete the four checks before execution.';
      resetMessage.classList.remove('ready');
    }
  };
  resetInputs.forEach(input => input.addEventListener('change', updateReset));
  resetButton.addEventListener('click', () => {
    resetInputs.forEach(input => { input.checked = false; });
    updateReset();
  });
  updateReset();
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
})();

/* Manual light / dark theme toggle — preference saved in localStorage. */
(function () {
  var STORAGE_KEY = 'bca-color-theme';
  var DEFAULT_THEME = 'dark';

  function getTheme() {
    var current = document.documentElement.getAttribute('data-theme');
    if (current === 'light' || current === 'dark') return current;
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch (e) {}
    return DEFAULT_THEME;
  }

  function syncToggleButtons(theme) {
    var isDark = theme === 'dark';
    var label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

    document.querySelectorAll('[data-color-theme-toggle], .color-theme-toggle').forEach(function (btn) {
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');

      var icon = btn.querySelector('i');
      if (icon) {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
      }
    });
  }

  function applyTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') theme = DEFAULT_THEME;
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
    syncToggleButtons(theme);
  }

  function toggleTheme() {
    applyTheme(getTheme() === 'dark' ? 'light' : 'dark');
  }

  function bindToggles() {
    document.querySelectorAll('[data-color-theme-toggle], .color-theme-toggle').forEach(function (btn) {
      if (btn.dataset.themeBound === '1') return;
      btn.dataset.themeBound = '1';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggleTheme();
      });
    });
  }

  function init() {
    applyTheme(getTheme());
    bindToggles();
  }

  document.addEventListener('navbar:loaded', init);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

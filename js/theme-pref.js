/* Apply saved color theme before first paint (default: dark). */
(function () {
  var STORAGE_KEY = 'bca-color-theme';
  var DEFAULT_THEME = 'dark';

  function getStoredTheme() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch (e) {}
    return DEFAULT_THEME;
  }

  document.documentElement.setAttribute('data-theme', getStoredTheme());
})();

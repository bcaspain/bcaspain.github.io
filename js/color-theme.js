/* Keep data-theme in sync with local day/night (no manual toggle). */
(function () {
  var DAY_START = 7;
  var DAY_END = 19;

  function themeFromLocalTime() {
    var hour = new Date().getHours();
    return hour >= DAY_START && hour < DAY_END ? 'light' : 'dark';
  }

  function applyTheme() {
    var next = themeFromLocalTime();
    if (document.documentElement.getAttribute('data-theme') !== next) {
      document.documentElement.setAttribute('data-theme', next);
    }
  }

  function msUntilNextBoundary() {
    var now = new Date();
    var next = new Date(now.getTime());
    var hour = now.getHours();
    if (hour < DAY_START) {
      next.setHours(DAY_START, 0, 0, 0);
    } else if (hour < DAY_END) {
      next.setHours(DAY_END, 0, 0, 0);
    } else {
      next.setDate(next.getDate() + 1);
      next.setHours(DAY_START, 0, 0, 0);
    }
    return Math.max(1000, next.getTime() - now.getTime());
  }

  function scheduleNext() {
    setTimeout(function () {
      applyTheme();
      scheduleNext();
    }, msUntilNextBoundary());
  }

  function removeToggle() {
    document.querySelectorAll('[data-color-theme-toggle], .color-theme-toggle').forEach(function (el) {
      el.remove();
    });
  }

  applyTheme();
  scheduleNext();
  document.addEventListener('navbar:loaded', removeToggle);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeToggle);
  } else {
    removeToggle();
  }
})();

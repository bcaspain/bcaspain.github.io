/* Apply day/night color theme from the visitor's local clock before first paint. */
(function () {
  var DAY_START = 7;  // 07:00 local — light
  var DAY_END = 19;   // 19:00 local — dark from here

  function themeFromLocalTime() {
    var hour = new Date().getHours();
    return hour >= DAY_START && hour < DAY_END ? 'light' : 'dark';
  }

  document.documentElement.setAttribute('data-theme', themeFromLocalTime());
  // Clear any leftover manual preference from the old toggle.
  try { localStorage.removeItem('bca-color-theme'); } catch (e) {}
})();

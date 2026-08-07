// Live seat counter for Rabindra Jayanti pages.
// Set window.RJ_GAS_URL to your deployed Google Apps Script web-app URL
// before this script loads, e.g.:
//   window.RJ_GAS_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

window.RJ_GAS_URL = window.RJ_GAS_URL || '__RJ_GAS_URL__';

(function () {
  var gasUrl = (window.RJ_GAS_URL || '').replace(/\/$/, '');
  if (!gasUrl || gasUrl === '__RJ_GAS_URL__') return;

  var targets = Array.from(document.querySelectorAll('[data-rj-seats]'));
  if (!targets.length) return;

  function applyBadge(left, capacity) {
    var soldOut = left === 0;
    var label   = soldOut
      ? '\uD83D\uDEAB SOLD OUT'
      : left + '\u00A0/\u00A0' + capacity + ' seats left';

    targets.forEach(function (el) {
      el.textContent = label;
      if (soldOut) {
        el.style.background    = 'rgba(211, 47, 47, 0.10)';
        el.style.borderColor   = 'rgba(211, 47, 47, 0.35)';
        el.style.color         = '#b71c1c';
        el.style.fontWeight    = '900';
      } else {
        el.style.background    = 'rgba(245, 124, 0, 0.10)';
        el.style.borderColor   = 'rgba(245, 124, 0, 0.25)';
        el.style.color         = '#8a4b00';
        el.style.fontWeight    = '800';
      }
    });

    // Notify the registration form if it's on the same page
    if (soldOut && typeof window.rjShowSoldOut === 'function') {
      window.rjShowSoldOut();
    }
  }

  fetch(gasUrl + '?action=status')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data || data.ok !== true) return;
      var left     = typeof data.left     === 'number' ? data.left     : null;
      var capacity = typeof data.capacity === 'number' ? data.capacity : null;
      if (left === null || capacity === null) return;

      // Expose for register.js to read without a second API call
      window.rjSeatsLeft     = left;
      window.rjSeatsCapacity = capacity;

      applyBadge(left, capacity);
    })
    .catch(function () {
      targets.forEach(function (el) { el.style.display = 'none'; });
    });
})();

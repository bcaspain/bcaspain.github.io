document.addEventListener('DOMContentLoaded', function () {
  // URL is set via window.RJ_GAS_URL in the HTML before this script loads.
  var gasUrl = (
    window.RJ_GAS_URL && window.RJ_GAS_URL !== '__RJ_GAS_URL__'
      ? window.RJ_GAS_URL
      : ''
  ).replace(/\/$/, '');

  var GAS_READY = !!gasUrl;

  // ── Poster overlay ─────────────────────────────────────────────────────────
  (function initPosterOverlay() {
    var modal    = document.getElementById('rabindraRegisterPosterModal');
    var openBtn  = document.querySelector('#rabindra-register .rabindra-poster-trigger');
    var closeBtn = document.getElementById('rabindraRegisterPosterClose');
    if (!modal || !openBtn || !closeBtn) return;

    function open() {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }
    function close() {
      modal.style.display = 'none';
      document.body.style.overflow = '';
      openBtn.focus();
    }

    openBtn.addEventListener('click', function (e) { e.preventDefault(); open(); });
    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    document.addEventListener('keydown', function (e) {
      if (modal.style.display === 'block' && e.key === 'Escape') close();
    });
  })();

  // ── Sold-out state ─────────────────────────────────────────────────────────
  var form       = document.getElementById('rabindraRegistrationForm');
  var soldOutEl  = document.getElementById('rj-sold-out');
  var submitBtn  = document.getElementById('rj-submit');
  var successEl  = document.getElementById('rj-success');
  var errorEl    = document.getElementById('rj-error');
  var errorText  = document.getElementById('rj-error-text');

  window.rjShowSoldOut = function () {
    if (soldOutEl)  soldOutEl.style.display  = 'block';
    if (form)       form.style.display       = 'none';
  };

  // Check if seats.js already resolved the count before this script ran
  if (typeof window.rjSeatsLeft === 'number' && window.rjSeatsLeft === 0) {
    window.rjShowSoldOut();
    return;
  }

  if (!form || !submitBtn) return;

  // ── Inline error helpers ───────────────────────────────────────────────────
  function showError(msg, fieldEl) {
    if (errorText) errorText.textContent = msg;
    if (errorEl)   errorEl.style.display = 'block';
    if (fieldEl) {
      fieldEl.style.borderColor = '#b71c1c';
      fieldEl.focus();
    }
    if (errorEl) errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function clearError(fieldEl) {
    if (errorEl)  errorEl.style.display = 'none';
    if (errorText) errorText.textContent = '';
    if (fieldEl)  fieldEl.style.borderColor = '';
  }

  function clearFieldError(fieldEl) {
    if (fieldEl) fieldEl.style.borderColor = '';
  }

  // Clear banner + field highlight as the user edits
  [
    { id: 'rj-name' },
    { id: 'rj-email' },
    { id: 'rj-email-confirm' },
    { id: 'rj-contact' },
  ].forEach(function (item) {
    var el = document.getElementById(item.id);
    if (el) {
      el.addEventListener('input', function () { clearFieldError(el); });
    }
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  function sanitize(str, maxLen) {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>"'&]/g, '').trim().slice(0, maxLen);
  }

  function setDisabled(state) {
    submitBtn.disabled      = state;
    submitBtn.style.opacity = state ? '0.75' : '1';
  }

  function updateSeatsAfterReg(left, capacity) {
    window.rjSeatsLeft     = left;
    window.rjSeatsCapacity = capacity;

    var badges = Array.from(document.querySelectorAll('[data-rj-seats]'));
    if (!badges.length) return;

    var soldOut = left === 0;
    var label   = soldOut
      ? '\uD83D\uDEAB SOLD OUT'
      : left + '\u00A0/\u00A0' + capacity + ' seats left';

    badges.forEach(function (el) {
      el.textContent = label;
      if (soldOut) {
        el.style.background  = 'rgba(211, 47, 47, 0.10)';
        el.style.borderColor = 'rgba(211, 47, 47, 0.35)';
        el.style.color       = '#b71c1c';
        el.style.fontWeight  = '900';
      } else {
        el.style.background  = 'rgba(245, 124, 0, 0.10)';
        el.style.borderColor = 'rgba(245, 124, 0, 0.25)';
        el.style.color       = '#8a4b00';
        el.style.fontWeight  = '800';
      }
    });
  }

  // ── Form submission ────────────────────────────────────────────────────────
  var nameEl         = document.getElementById('rj-name');
  var emailEl        = document.getElementById('rj-email');
  var emailConfirmEl = document.getElementById('rj-email-confirm');
  var contactEl      = document.getElementById('rj-contact');
  var countryCodeEl  = document.getElementById('rj-country-code');
  var attendeesEl    = document.getElementById('rj-attendees');
  var couponEl       = document.getElementById('rj-coupon');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearError();
    if (successEl) successEl.style.display = 'none';

    // Guard: check live seat count
    if (typeof window.rjSeatsLeft === 'number' && window.rjSeatsLeft === 0) {
      window.rjShowSoldOut();
      return;
    }

    if (!GAS_READY) {
      showError('Registration is not yet available. Please contact the organizers.');
      return;
    }

    var name         = sanitize(nameEl        ? nameEl.value        : '', 100);
    var email        = sanitize(emailEl       ? emailEl.value       : '', 254).toLowerCase();
    var emailConfirm = sanitize(emailConfirmEl ? emailConfirmEl.value : '', 254).toLowerCase();
    var contact      = (contactEl ? contactEl.value : '').replace(/[^0-9]/g, '').slice(0, 15);
    var countryCode  = sanitize(countryCodeEl ? countryCodeEl.value : '+34', 6);
    var attendees    = Math.max(1, Math.min(4, parseInt((attendeesEl ? attendeesEl.value : '1'), 10) || 1));
    var coupon       = sanitize((couponEl ? couponEl.value : '').toUpperCase(), 50);

    if (!name || name.length < 2)      { showError('Please enter a valid name (at least 2 characters).', nameEl);         return; }
    if (!email || !email.includes('@')) { showError('Please enter a valid email address.', emailEl);                       return; }
    if (email !== emailConfirm)         { showError('Email addresses do not match. Please check and try again.', emailConfirmEl); return; }
    if (!contact || contact.length < 9) { showError('Please enter a valid phone number (at least 9 digits).', contactEl); return; }

    var params = new URLSearchParams({
      action:    'register',
      name:      name,
      email:     email,
      contact:   countryCode + contact,
      attendees: String(attendees),
      coupon:    coupon,
    });

    var originalHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin" aria-hidden="true"></i> Submitting\u2026';
    setDisabled(true);

    fetch(gasUrl + '?' + params.toString())
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data || data.ok !== true) {
          var msg = (data && data.error) ? data.error : 'Registration failed. Please try again.';

          if (data && (data.left === 0 || /fully booked/i.test(data.error || ''))) {
            updateSeatsAfterReg(0, window.rjSeatsCapacity || 110);
            window.rjShowSoldOut();
          } else if (data && /already registered/i.test(data.error || '')) {
            showError('This email address is already registered. If you need help, please contact the organizers.', emailEl);
          } else {
            showError(msg);
          }
          return;
        }

        form.reset();
        clearError();

        if (typeof data.left === 'number') {
          updateSeatsAfterReg(data.left, data.capacity || 110);
          if (data.left === 0) window.rjShowSoldOut();
        }

        if (successEl) {
          successEl.textContent   = 'Registration confirmed! A confirmation email has been sent. Thank you!';
          successEl.style.display = 'block';
          successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      })
      .catch(function () {
        showError('Could not reach the server. Please check your connection or contact the organizers.');
      })
      .finally(function () {
        submitBtn.innerHTML = originalHTML;
        setDisabled(false);
      });
  });
});

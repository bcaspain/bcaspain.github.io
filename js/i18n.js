/* BCA Spain — client-side i18n engine.
   Loaded synchronously (not defer) right after theme-pref.js so that
   document.documentElement.lang is correct before any deferred script
   (e.g. klaro-config.js) reads it, and before first paint. Requires
   js/i18n/strings.en.js, strings.es.js, strings.ca.js to be loaded first
   (each sets window.BCA_I18N.<lang>). */
(function () {
  'use strict';

  var SUPPORTED = ['en', 'es', 'ca'];
  var DEFAULT_LANG = 'en';
  var STORAGE_KEY = 'bca_lang';

  var LANG_NAMES = {
    en: 'English',
    es: 'Español',
    ca: 'Català'
  };

  function detectLang() {
    try {
      var saved = window.localStorage && localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.indexOf(saved) !== -1) return saved;
    } catch (e) { /* localStorage unavailable (private mode etc.) */ }

    var candidates = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || navigator.userLanguage || DEFAULT_LANG];

    for (var i = 0; i < candidates.length; i++) {
      var code = String(candidates[i] || '').slice(0, 2).toLowerCase();
      if (SUPPORTED.indexOf(code) !== -1) return code;
    }
    return DEFAULT_LANG;
  }

  var currentLang = detectLang();
  document.documentElement.lang = currentLang;

  function dictFor(lang) {
    return (window.BCA_I18N && window.BCA_I18N[lang]) || {};
  }

  function lookup(key, lang) {
    var parts = key.split('.');
    var obj = dictFor(lang);
    for (var i = 0; i < parts.length; i++) {
      if (obj == null || typeof obj !== 'object') return undefined;
      obj = obj[parts[i]];
    }
    return typeof obj === 'string' ? obj : undefined;
  }

  function interpolate(str, vars) {
    if (!vars) return str;
    return str.replace(/\{(\w+)\}/g, function (match, name) {
      return Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : match;
    });
  }

  function t(key, vars) {
    var val = lookup(key, currentLang);
    if (val === undefined && currentLang !== DEFAULT_LANG) val = lookup(key, DEFAULT_LANG);
    if (val === undefined) {
      if (window.console && console.warn) console.warn('[i18n] missing key:', key);
      return key;
    }
    return interpolate(val, vars);
  }

  function applyTo(root) {
    root = root || document;
    if (!root.querySelectorAll) return;

    function parseVars(el) {
      var spec = el.getAttribute('data-i18n-vars');
      if (!spec) return undefined;
      var vars = {};
      spec.split(';').forEach(function (pair) {
        var idx = pair.indexOf(':');
        if (idx === -1) return;
        var k = pair.slice(0, idx).trim();
        var v = pair.slice(idx + 1).trim();
        if (k) vars[k] = v;
      });
      return vars;
    }

    var textNodes = root.querySelectorAll('[data-i18n]');
    for (var i = 0; i < textNodes.length; i++) {
      var el = textNodes[i];
      el.textContent = t(el.getAttribute('data-i18n'), parseVars(el));
    }

    var htmlNodes = root.querySelectorAll('[data-i18n-html]');
    for (var j = 0; j < htmlNodes.length; j++) {
      var elh = htmlNodes[j];
      elh.innerHTML = t(elh.getAttribute('data-i18n-html'), parseVars(elh));
    }

    var attrNodes = root.querySelectorAll('[data-i18n-attr]');
    for (var k = 0; k < attrNodes.length; k++) {
      var ela = attrNodes[k];
      var elaVars = parseVars(ela);
      var spec = ela.getAttribute('data-i18n-attr') || '';
      spec.split(';').forEach(function (pair) {
        var idx = pair.indexOf(':');
        if (idx === -1) return;
        var attrName = pair.slice(0, idx).trim();
        var key = pair.slice(idx + 1).trim();
        if (!attrName || !key) return;
        ela.setAttribute(attrName, t(key, elaVars));
      });
    }

    if (root === document && document.title && document.body) {
      var titleKey = document.documentElement.getAttribute('data-i18n-title');
      if (titleKey) document.title = t(titleKey);
    }
  }

  function renderLangSwitcher() {
    var menu = document.getElementById('nav-menu');
    if (!menu || document.getElementById('lang-switcher')) return;

    var details = document.createElement('details');
    details.className = 'nav-dropdown';
    details.id = 'lang-switcher';

    var summary = document.createElement('summary');
    summary.className = 'nav-link nav-dropdown-toggle';
    summary.setAttribute('aria-label', t('common.language.changeLanguage'));
    summary.innerHTML =
      '<i class="fas fa-globe" aria-hidden="true"></i> ' +
      '<span data-lang-current></span> ' +
      '<i class="fas fa-chevron-down nav-dropdown-icon" aria-hidden="true"></i>';
    details.appendChild(summary);

    var submenu = document.createElement('div');
    submenu.id = 'lang-switcher-menu';
    submenu.className = 'nav-dropdown-menu';
    submenu.setAttribute('role', 'menu');
    submenu.setAttribute('aria-label', 'Language');

    SUPPORTED.forEach(function (code) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-link nav-dropdown-item lang-option';
      btn.setAttribute('role', 'menuitem');
      btn.setAttribute('data-lang-option', code);
      btn.textContent = LANG_NAMES[code];
      btn.addEventListener('click', function () {
        setLang(code);
        details.removeAttribute('open');
      });
      submenu.appendChild(btn);
    });

    details.appendChild(submenu);
    menu.appendChild(details);

    document.addEventListener('click', function (evt) {
      if (details.hasAttribute('open') && !details.contains(evt.target) && !submenu.contains(evt.target)) {
        details.removeAttribute('open');
      }
    });

    // The 769–1024px tablet tier clips absolutely (and even fixed-)
    // positioned dropdowns via overflow:hidden on .navbar/.nav-container/
    // .nav-menu (pre-existing, affects the "Attractions" dropdown too — an
    // ancestor's overflow:hidden clips fixed-position descendants in this
    // engine even though their containing block is the viewport). Portalling
    // the panel to <body> while open sidesteps that clipping at every
    // desktop/tablet width, without touching that shared, pre-existing
    // ancestor CSS. Mobile keeps the untouched in-flow accordion behavior.
    function isMobileMenuMode() {
      var toggle = document.getElementById('nav-toggle');
      return !!toggle && window.getComputedStyle(toggle).display !== 'none';
    }

    function positionSubmenu() {
      if (isMobileMenuMode()) {
        if (submenu.parentElement !== details) details.appendChild(submenu);
        submenu.style.position = '';
        submenu.style.top = '';
        submenu.style.left = '';
        submenu.style.right = '';
        submenu.style.display = 'flex';
        return;
      }
      if (submenu.parentElement !== document.body) document.body.appendChild(submenu);
      var rect = summary.getBoundingClientRect();
      submenu.style.position = 'fixed';
      submenu.style.top = (rect.bottom + 12) + 'px';
      submenu.style.left = 'auto';
      submenu.style.right = (window.innerWidth - rect.right) + 'px';
      submenu.style.display = 'flex';
    }

    function hideSubmenu() {
      submenu.style.display = 'none';
    }

    details.addEventListener('toggle', function () {
      if (details.open) positionSubmenu(); else hideSubmenu();
    });
    window.addEventListener('resize', function () {
      if (details.open) positionSubmenu();
    });

    updateSwitcherUI();
  }

  function updateSwitcherUI() {
    var toggle = document.querySelector('#lang-switcher .nav-dropdown-toggle');
    if (toggle) toggle.setAttribute('aria-label', t('common.language.changeLanguage'));

    var current = document.querySelector('#lang-switcher [data-lang-current]');
    if (current) current.textContent = currentLang.toUpperCase();

    var options = document.querySelectorAll('#lang-switcher [data-lang-option]');
    options.forEach(function (opt) {
      var isActive = opt.getAttribute('data-lang-option') === currentLang;
      opt.classList.toggle('lang-active', isActive);
      if (isActive) opt.setAttribute('aria-current', 'true');
      else opt.removeAttribute('aria-current');
    });
  }

  function setLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1 || lang === currentLang) {
      if (lang === currentLang) return;
    }
    currentLang = lang;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
    document.documentElement.lang = lang;
    applyTo(document);
    updateSwitcherUI();
    document.dispatchEvent(new CustomEvent('bca:langchange', { detail: { lang: lang } }));
  }

  function boot() {
    applyTo(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('navbar:loaded', function () {
    applyTo(document.getElementById('navbar-placeholder'));
    renderLangSwitcher();
  });

  window.i18n = {
    t: t,
    setLang: setLang,
    getLang: function () { return currentLang; },
    applyTo: applyTo,
    SUPPORTED: SUPPORTED
  };
})();

/**
 * Hero background — local MP4 progressive play (faststart).
 * Browser buffers and plays while downloading; no full file required upfront.
 * Full-quality with sound stays on Vimeo (modal). See video/encode-hero.sh.
 */
(function () {
  var video = document.getElementById('heroBgVideo');
  if (!video) return;

  var POSTER = 'video/welcome-image.webp';
  var SOURCES = {
    mobile: 'video/hero-bg-mobile.mp4',
    tablet: 'video/hero-bg-tablet.mp4',
    desktop: 'video/hero-bg-desktop.mp4'
  };

  var activeTier = null;
  var fadeBound = false;
  var loopBound = false;
  var restartLock = false;
  var watchdogId = null;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function prefersSaveData() {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!conn) return false;
    if (conn.saveData) return true;
    return conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g';
  }

  function pickTier() {
    var w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1200) return 'tablet';
    return 'desktop';
  }

  function ensureLoopAttrs() {
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('loop', '');
    video.setAttribute('autoplay', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
  }

  function shouldKeepPlaying() {
    return !video.classList.contains('is-poster-only');
  }

  function restartLoop() {
    if (!shouldKeepPlaying() || restartLock) return;

    restartLock = true;
    window.setTimeout(function () {
      restartLock = false;
    }, 120);

    try {
      if (video.ended || (video.duration && video.currentTime >= video.duration - 0.05)) {
        video.currentTime = 0;
      }
    } catch (e) {
      video.currentTime = 0;
    }

    var playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(function () {});
    }
  }

  function resumeIfNeeded() {
    if (!shouldKeepPlaying()) return;
    if (video.paused || video.ended) {
      restartLoop();
    }
  }

  function bindLoopKeeper() {
    if (loopBound) return;
    loopBound = true;

    video.addEventListener('ended', restartLoop);
    video.addEventListener('pause', function () {
      if (!document.hidden && shouldKeepPlaying()) {
        window.setTimeout(resumeIfNeeded, 50);
      }
    });
    video.addEventListener('waiting', resumeIfNeeded);
    video.addEventListener('stalled', resumeIfNeeded);

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) resumeIfNeeded();
    });

    window.addEventListener('pageshow', function (event) {
      if (event.persisted) resumeIfNeeded();
    });

    if (watchdogId !== null) window.clearInterval(watchdogId);
    watchdogId = window.setInterval(resumeIfNeeded, 400);
  }

  function bindFadeIn() {
    if (fadeBound) return;
    fadeBound = true;

    function reveal() {
      video.classList.remove('is-loading');
      video.classList.add('is-ready');
    }

    video.addEventListener('playing', reveal, { once: true });

    video.addEventListener('canplay', function () {
      if (!video.classList.contains('is-ready') && !video.paused) reveal();
    }, { once: true });
  }

  function setPosterOnly() {
    if (watchdogId !== null) {
      window.clearInterval(watchdogId);
      watchdogId = null;
    }
    video.pause();
    video.removeAttribute('src');
    video.innerHTML = '';
    video.poster = POSTER;
    video.classList.remove('is-ready');
    video.classList.add('is-poster-only');
    activeTier = null;
  }

  function tierFromMarkup() {
    var sources = video.querySelectorAll('source[src]');
    if (!sources.length) return null;
    var picked = sources[0].getAttribute('src') || '';
    if (picked.indexOf('hero-bg-mobile') !== -1) return 'mobile';
    if (picked.indexOf('hero-bg-tablet') !== -1) return 'tablet';
    if (picked.indexOf('hero-bg-desktop') !== -1) return 'desktop';
    return null;
  }

  function currentSrcForTier(tier) {
    var src = video.currentSrc || video.getAttribute('src') || '';
    if (src.indexOf(SOURCES[tier]) !== -1) return true;
    return tierFromMarkup() === tier && !video.getAttribute('src');
  }

  function loadTier(tier, force) {
    if (!force && activeTier === tier && currentSrcForTier(tier)) return;

    var file = SOURCES[tier] || SOURCES.desktop;
    activeTier = tier;

    video.poster = POSTER;
    ensureLoopAttrs();
    /* auto: buffer progressively while page loads (MP4 faststart plays before full download) */
    video.preload = 'auto';
    video.classList.remove('is-ready', 'is-poster-only');
    video.classList.add('is-loading');

    video.innerHTML = '';
    video.src = file;

    bindFadeIn();
    bindLoopKeeper();
    video.load();

    var playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(function () {
        video.classList.remove('is-loading');
      });
    }
  }

  function init() {
    video.poster = POSTER;
    bindLoopKeeper();

    if (prefersReducedMotion() || prefersSaveData()) {
      setPosterOnly();
      return;
    }

    ensureLoopAttrs();

    var tier = pickTier();
    loadTier(tier, true);

    video.addEventListener('error', function onError() {
      video.removeEventListener('error', onError);
      setPosterOnly();
    }, { once: true });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (prefersReducedMotion() || prefersSaveData() || video.classList.contains('is-poster-only')) return;
        var next = pickTier();
        if (next !== activeTier) loadTier(next, true);
      }, 250);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

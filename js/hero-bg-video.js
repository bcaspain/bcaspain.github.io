/**
 * Hero background video — local compressed loops, device-aware.
 * Full-quality playback stays on Vimeo (modal). See video/encode-hero.sh.
 */
(function () {
  var video = document.getElementById('heroBgVideo');
  if (!video) return;

  var POSTER = 'idol.webp';
  var SOURCES = {
    mobile: {
      webm: 'video/hero-bg-mobile.webm',
      mp4: 'video/hero-bg-mobile.mp4'
    },
    tablet: {
      webm: 'video/hero-bg-tablet.webm',
      mp4: 'video/hero-bg-tablet.mp4'
    },
    desktop: {
      webm: 'video/hero-bg-desktop.webm',
      mp4: 'video/hero-bg-desktop.mp4'
    }
  };

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

  function setPosterOnly() {
    video.removeAttribute('src');
    video.innerHTML = '';
    video.poster = POSTER;
    video.classList.add('is-poster-only');
  }

  function loadTier(tier) {
    var files = SOURCES[tier] || SOURCES.desktop;
    video.poster = POSTER;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.preload = tier === 'mobile' ? 'metadata' : 'auto';

    video.innerHTML = '';
    var webm = document.createElement('source');
    webm.src = files.webm;
    webm.type = 'video/webm';
    video.appendChild(webm);

    var mp4 = document.createElement('source');
    mp4.src = files.mp4;
    mp4.type = 'video/mp4';
    video.appendChild(mp4);

    video.load();

    var playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(function () {
        /* Autoplay blocked — poster remains visible */
      });
    }
  }

  function init() {
    if (prefersReducedMotion() || prefersSaveData()) {
      setPosterOnly();
      return;
    }

    var tier = pickTier();
    loadTier(tier);

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
        if (next !== tier) {
          tier = next;
          loadTier(tier);
        }
      }, 250);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
